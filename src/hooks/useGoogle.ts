import * as WebBrowser from 'expo-web-browser'
import { makeRedirectUri } from 'expo-auth-session'
import { supabase } from '../lib/supabase'

WebBrowser.maybeCompleteAuthSession()

export function useGoogleAuth() {
  const redirectTo = makeRedirectUri({ scheme: 'propertypulse' })

  const handleGoogleAuth = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    })

    if (error || !data.url) return

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo)

    if (result.type === 'success') {
      const url = new URL(result.url)
      const code = url.searchParams.get('code')

      if (code) {
        const { data: sessionData, error: sessionError } = 
          await supabase.auth.exchangeCodeForSession(code)
        
        // Supabase tells you if it was a new signup
        if (sessionData.user?.created_at === sessionData.user?.last_sign_in_at) {
          console.log('New user signed up!')
          // redirect to onboarding if needed
        } else {
          console.log('Existing user signed in!')
          // redirect to home
        }
      }
    }
  }

  return { handleGoogleAuth }
}
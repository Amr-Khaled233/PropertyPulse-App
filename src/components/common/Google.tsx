import * as WebBrowser from 'expo-web-browser'
import { makeRedirectUri } from 'expo-auth-session'
import { supabase } from '../../lib/supabase';
WebBrowser.maybeCompleteAuthSession()

export function useGoogleSignIn() {
  const redirectTo = makeRedirectUri({ scheme: 'propertypulse' })

  const signInWithGoogle = async () => {
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
        await supabase.auth.exchangeCodeForSession(code)
      }
    }
  }

  return { signInWithGoogle }
}
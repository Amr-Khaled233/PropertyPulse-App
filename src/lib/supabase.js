import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

const SUPABASE_URL = 'https://lbnjmwflyzlwvhkatvfy.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxibmptd2ZseXpsd3Zoa2F0dmZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4MzIzMTUsImV4cCI6MjA5NjQwODMxNX0.zdjvy_9emguDcXxAelhGgQKwUZPQcZHtPZ0HLXfSITU'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

// Test connection
supabase.from('properties').select('count(*)').then(
  () => console.log('✓ Supabase connected'),
  (err) => console.error('✗ Supabase connection failed:', err.message)
).catch(err => console.error('Supabase error:', err.message))
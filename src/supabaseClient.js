// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://honszchugexjhyfkodon.supabase.co'
const supabaseKey = 'sb_publishable_XDYyVwskEWyKMtIW34efWA_Q5Swzzcb'

export const supabase = createClient(supabaseUrl, supabaseKey)
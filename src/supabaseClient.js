import { createClient } from '@supabase/supabase-js'

// 1. Your Main HR/POS Database
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY
export const supabase = createClient(supabaseUrl, supabaseKey)

// 2. Your Sales Tracking Database
//const supabaseSalesUrl = import.meta.env.VITE_SUPABASE_SALES_URL
//const supabaseSalesKey = import.meta.env.VITE_SUPABASE_SALES_KEY
//export const supabaseSales = createClient(supabaseSalesUrl, supabaseSalesKey)
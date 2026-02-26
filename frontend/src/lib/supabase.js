import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://hkurtoonrpxnrspmuzgt.supabase.co'
const SUPABASE_KEY = 'sb_publishable_G3X4bzQpmaQ-GRjMRvQhhw_ft3Feab9'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// Получить пользователя по telegram_id
export async function getUser(telegramId) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('telegram_id', telegramId)
    .single()
  if (error && error.code !== 'PGRST116') console.error(error)
  return data
}

// Создать нового пользователя
export async function createUser(userData) {
  const { data, error } = await supabase
    .from('users')
    .insert([userData])
    .select()
    .single()
  if (error) console.error(error)
  return data
}

// Обновить данные пользователя
export async function updateUser(telegramId, updates) {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('telegram_id', telegramId)
    .select()
    .single()
  if (error) console.error(error)
  return data
}

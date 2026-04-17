import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
const env = fs.readFileSync('.env', 'utf8');
const url = env.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();
const supabase = createClient(url, key);
async function check() {
  const { data, error } = await supabase.from('notifications').select('*').limit(1);
  console.log('notifications:', error ? error.message : 'exists');
  const { data: d2, error: e2 } = await supabase.from('push_notifications').select('*').limit(1);
  console.log('push_notifications:', e2 ? e2.message : 'exists');
}
check();

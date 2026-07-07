import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});

const supabase = createClient(env.SIGA_SUPABASE_URL, env.SIGA_SUPABASE_ANON_KEY);

async function checkBanners() {
  const { data, error } = await supabase
    .from('banners')
    .select('*')
    .limit(5);

  if (error) {
    console.log('Error querying banners:', error);
  } else {
    console.log('Success querying banners:', data);
  }
}

checkBanners();

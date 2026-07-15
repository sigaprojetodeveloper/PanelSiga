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

async function checkRLS() {
  const { data, error } = await supabase.from('ad_pricing').insert({
    ad_type: 'contract',
    scope: 'global',
    price_per_day: 200
  }).select();
  if (error) {
    console.log('Insert contract failed:', error.message);
  } else {
    console.log('Insert contract succeeded:', data);
    // Cleanup if succeeded
    await supabase.from('ad_pricing').delete().eq('ad_type', 'contract');
  }
}

checkRLS();


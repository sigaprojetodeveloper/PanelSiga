const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envContent = fs.readFileSync('.env', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});

const supabase = createClient(env.SIGA_SUPABASE_URL, env.SIGA_SUPABASE_ANON_KEY);

async function main() {
  const { data, error } = await supabase
    .from('story_items')
    .select(`
      *,
      story_channels!inner (
        id,
        name,
        avatar_url,
        user_id,
        scope,
        country,
        state,
        city,
        users (
          name,
          email
        )
      )
    `);
  console.log('Stories:', JSON.stringify(data, null, 2));
}
main();

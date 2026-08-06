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

async function normalizeUnpaidStories() {
  const nowIso = new Date().toISOString();
  console.log(`[NORMALIZATION] Checking unpaid story items past payment_limit_date (${nowIso})...\n`);

  const { data: unpaidItems, error: fetchErr } = await supabase
    .from('story_items')
    .select('id, channel_id, status, paid, payment_limit_date')
    .eq('status', 'awaiting_payment')
    .eq('paid', false)
    .lt('payment_limit_date', nowIso);

  if (fetchErr) {
    console.error('Error fetching unpaid story items:', fetchErr);
    return;
  }

  console.log(`Found ${unpaidItems?.length || 0} story items in 'awaiting_payment' past payment limit date.`);

  if (unpaidItems && unpaidItems.length > 0) {
    console.table(unpaidItems);
    const idsToDeactivate = unpaidItems.map(i => i.id);

    const { data: updated, error: updateErr } = await supabase
      .from('story_items')
      .update({ status: 'deactivated' })
      .in('id', idsToDeactivate)
      .select('id, channel_id, status');

    if (updateErr) {
      console.error('Error deactivating unpaid story items:', updateErr);
    } else {
      console.log(`Successfully updated ${updated?.length || 0} unpaid story items to status = 'deactivated'.`);
    }
  }
}

normalizeUnpaidStories();

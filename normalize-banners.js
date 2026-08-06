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

async function normalizeExpiredBannersAndStories() {
  const today = new Date().toISOString().split('T')[0];
  console.log(`[NORMALIZATION] Running check for today's date: ${today}...\n`);

  // 1. Fetch active banners that are expired
  const { data: expiredBanners, error: fetchBannersErr } = await supabase
    .from('banners')
    .select('id, title, status, expiration_date, initialization_date, scope, state')
    .eq('status', 'active')
    .lt('expiration_date', today);

  if (fetchBannersErr) {
    console.error('Error fetching expired banners:', fetchBannersErr);
    return;
  }

  console.log(`Found ${expiredBanners?.length || 0} active banners with expiration_date < ${today}.`);

  if (expiredBanners && expiredBanners.length > 0) {
    console.table(expiredBanners);
    const expiredIds = expiredBanners.map(b => b.id);

    // Update status to 'expired'
    const { data: updatedBanners, error: updateBannersErr } = await supabase
      .from('banners')
      .update({ status: 'expired' })
      .in('id', expiredIds)
      .select('id, title, status, expiration_date');

    if (updateBannersErr) {
      console.error('Error updating banners:', updateBannersErr);
    } else {
      console.log(`\nSuccessfully updated ${updatedBanners?.length || 0} banners to status = 'expired'.`);
    }
  }

  // 2. Fetch active story items that are expired
  const { data: expiredStoryItems, error: fetchStoriesErr } = await supabase
    .from('story_items')
    .select('id, channel_id, status, expiration_date')
    .eq('status', 'active')
    .lt('expiration_date', today);

  if (fetchStoriesErr) {
    console.error('Error fetching expired story items:', fetchStoriesErr);
    return;
  }

  console.log(`\nFound ${expiredStoryItems?.length || 0} active story items with expiration_date < ${today}.`);

  if (expiredStoryItems && expiredStoryItems.length > 0) {
    console.table(expiredStoryItems);
    const expiredStoryIds = expiredStoryItems.map(s => s.id);

    const { data: updatedStories, error: updateStoriesErr } = await supabase
      .from('story_items')
      .update({ status: 'expired' })
      .in('id', expiredStoryIds)
      .select('id, status, expiration_date');

    if (updateStoriesErr) {
      console.error('Error updating story items:', updateStoriesErr);
    } else {
      console.log(`Successfully updated ${updatedStories?.length || 0} story items to status = 'expired'.`);
    }
  }

  console.log('\n[NORMALIZATION COMPLETED]');
}

normalizeExpiredBannersAndStories();

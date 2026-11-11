import { supabase } from '../lib/supabase';
import type { Database } from '../types/database.types';

type Channel = Database['public']['Tables']['story_channels']['Row'];
type StoryItem = Database['public']['Tables']['story_items']['Row'];

const INACTIVE_CHANNEL_STATUSES = ['deactivated', 'deleted', 'rejected', 'pending', 'awaiting_payment', 'expired'];
const BLOCKED_AUTO_ACTIVATE_STATUSES = ['deleted', 'rejected', 'awaiting_payment'];

const getTodayStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Checks whether a story item is active and has not expired relative to today's date.
 */
function isActiveNonExpiredStory(story: Pick<StoryItem, 'status' | 'expiration_date'>): boolean {
  if (story.status !== 'active') return false;
  const expDateStr = String(story.expiration_date || '').slice(0, 10);
  return expDateStr >= getTodayStr();
}

/**
 * Activates an eligible inactive story channel when a new active story is created for it.
 * Preserves moderation/payment/deletion locks on user-owned or blocked channels.
 */
async function activateChannelOnNewStory(channelId: string): Promise<void> {
  const { data: channel, error: channelError } = await (supabase
    .from('story_channels') as any)
    .select('is_active, status, user_id')
    .eq('id', channelId)
    .single();

  if (channelError) throw channelError;
  if (!channel) return;

  const isPendingUserChannel = channel.status === 'pending' && Boolean(channel.user_id);
  if (BLOCKED_AUTO_ACTIVATE_STATUSES.includes(channel.status) || isPendingUserChannel) {
    return;
  }

  const needsActivation = !channel.is_active || INACTIVE_CHANNEL_STATUSES.includes(channel.status);
  if (!needsActivation) return;

  const { error: updateError } = await (supabase.from('story_channels') as any)
    .update({ status: 'active', is_active: true })
    .eq('id', channelId);

  if (updateError) throw updateError;
}

export const storiesService = {
  // === Sincronização de Canais ===
  async syncChannelStatus(channelId: string) {
    const todayStr = getTodayStr();
    
    const { data: activeStories, error: storiesError } = await supabase
      .from('story_items')
      .select('id')
      .eq('channel_id', channelId)
      .eq('status', 'active')
      .gte('expiration_date', todayStr);
      
    if (storiesError) throw storiesError;
    
    const { data: channel, error: channelError } = await supabase
      .from('story_channels')
      .select('is_active, status')
      .eq('id', channelId)
      .single() as any;
      
    if (channelError) throw channelError;
    
    let shouldBeActive = activeStories && activeStories.length > 0;
    if (INACTIVE_CHANNEL_STATUSES.includes(channel?.status)) {
      shouldBeActive = false;
    }
    
    if (channel?.is_active !== shouldBeActive) {
      const { error: updateError } = await (supabase.from('story_channels') as any)
        .update({ is_active: shouldBeActive })
        .eq('id', channelId);
      if (updateError) throw updateError;
    }
  },
 
  async syncAllChannelsStatus() {
    const todayStr = getTodayStr();
    
    const { data: channels, error: channelsError } = await supabase
      .from('story_channels')
      .select('id, is_active, status') as any;
      
    if (channelsError) throw channelsError;
    if (!channels || channels.length === 0) return;
    
    const { data: activeStories, error: storiesError } = await supabase
      .from('story_items')
      .select('channel_id')
      .eq('status', 'active')
      .gte('expiration_date', todayStr) as any;
      
    if (storiesError) throw storiesError;
    
    const activeChannelIds = new Set(activeStories?.map((item: any) => item.channel_id) || []);
    
    for (const channel of (channels as any[])) {
      let shouldBeActive = activeChannelIds.has(channel.id);
      if (INACTIVE_CHANNEL_STATUSES.includes(channel.status)) {
        shouldBeActive = false;
      }
      if (channel.is_active !== shouldBeActive) {
        await (supabase.from('story_channels') as any)
          .update({ is_active: shouldBeActive })
          .eq('id', channel.id);
      }
    }
  },

  // === Story Channels ===
  async getStoryChannels(params: {
    page: number;
    pageSize: number;
    filter: 'all' | 'active' | 'inactive';
    sort: 'newest' | 'oldest';
    scope?: string;
    country?: string;
    state?: string;
    city?: string;
  }) {
    try {
      await this.syncAllChannelsStatus();
    } catch (syncErr) {
      console.error('Error syncing channels status:', syncErr);
    }

    const { page, pageSize, filter, sort, scope, country, state, city } = params;
    const startRange = (page - 1) * pageSize;
    const endRange = startRange + pageSize - 1;

    let query = supabase
      .from('story_channels')
      .select('*, story_items(*)', { count: 'exact' });

    query = applyChannelFilters(query, filter, scope, country, state, city);
    query = applyChannelSorting(query, sort);

    // Order story_items inside the relation query
    query = query.order('created_at', { foreignTable: 'story_items', ascending: false });
    query = query.range(startRange, endRange);

    const { data, error, count } = await query;
    if (error) throw error;
    return { data: data || [], totalCount: count || 0 };
  },

  async createStoryChannel(channel: Omit<Channel, 'id' | 'created_at'>) {
    const { data, error } = await (supabase.from('story_channels') as any)
      .insert(channel)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateStoryChannel(id: string, updates: Partial<Omit<Channel, 'id' | 'created_at'>>) {
    const { data, error } = await (supabase.from('story_channels') as any)
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteStoryChannel(id: string) {
    const { error } = await (supabase.from('story_channels') as any)
      .update({ status: 'deleted', is_active: false })
      .eq('id', id);

    if (error) throw error;
  },

  // === Story Items ===
  async getStoryItems(channelId?: string) {
    let query = supabase
      .from('story_items')
      .select('*, story_channels(name)');

    if (channelId) {
      query = query.eq('channel_id', channelId);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async createStoryItem(item: Omit<StoryItem, 'id' | 'created_at'>) {
    const { data, error } = await (supabase.from('story_items') as any)
      .insert(item)
      .select()
      .single();

    if (error) throw error;
    try {
      if (isActiveNonExpiredStory(data)) {
        await activateChannelOnNewStory(item.channel_id);
      }
      await this.syncChannelStatus(item.channel_id);
    } catch (syncErr) {
      console.error('Error syncing channel status after insert:', syncErr);
    }
    return data;
  },

  async updateStoryItem(id: string, updates: Partial<Omit<StoryItem, 'id' | 'created_at'>>) {
    const { data, error } = await (supabase.from('story_items') as any)
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    try {
      await this.syncChannelStatus(data.channel_id);
    } catch (syncErr) {
      console.error('Error syncing channel status after update:', syncErr);
    }
    return data;
  },

  async deleteStoryItem(id: string) {
    const { data: itemData, error: fetchError } = await supabase
      .from('story_items')
      .select('channel_id')
      .eq('id', id)
      .single() as any;

    const { error } = await supabase
      .from('story_items')
      .delete()
      .eq('id', id);

    if (error) throw error;

    if (!fetchError && itemData) {
      try {
        await this.syncChannelStatus(itemData.channel_id);
      } catch (syncErr) {
        console.error('Error syncing channel status after delete:', syncErr);
      }
    }
  }
};

function applyChannelFilters(query: any, filter: string, scope?: string, country?: string, state?: string, city?: string) {
  let q = query.neq('status', 'deleted');
  if (filter === 'active') {
    q = q.eq('is_active', true);
  } else if (filter === 'inactive') {
    q = q.eq('is_active', false);
  }

  if (scope && scope !== 'all') {
    q = q.eq('scope', scope);
  }
  if (country && country !== 'all') {
    q = q.eq('country', country);
  }
  if (state && state !== 'all') {
    q = q.eq('state', state);
  }
  if (city) {
    q = q.ilike('city', `%${city}%`);
  }
  return q;
}

function applyChannelSorting(query: any, sort: string) {
  if (sort === 'newest') {
    return query.order('created_at', { ascending: false });
  } else if (sort === 'oldest') {
    return query.order('created_at', { ascending: true });
  }
  return query;
}

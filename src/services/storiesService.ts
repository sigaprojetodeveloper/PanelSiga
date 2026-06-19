import { supabase } from '../lib/supabase';
import type { Database } from '../types/database.types';

type Channel = Database['public']['Tables']['story_channels']['Row'];
type StoryItem = Database['public']['Tables']['story_items']['Row'];

export const storiesService = {
  // === Sincronização de Canais ===
  async syncChannelStatus(channelId: string) {
    const todayStr = new Date().toISOString().split('T')[0];
    
    const { data: activeStories, error: storiesError } = await supabase
      .from('story_items')
      .select('id')
      .eq('channel_id', channelId)
      .eq('status', 'active')
      .gte('data_expiracao', todayStr);
      
    if (storiesError) throw storiesError;
    
    const hasActiveStories = activeStories && activeStories.length > 0;
    
    const { data: channel, error: channelError } = await supabase
      .from('story_channels')
      .select('is_active')
      .eq('id', channelId)
      .single() as any;
      
    if (channelError) throw channelError;
    
    if (channel?.is_active !== hasActiveStories) {
      const { error: updateError } = await (supabase.from('story_channels') as any)
        .update({ is_active: hasActiveStories })
        .eq('id', channelId);
      if (updateError) throw updateError;
    }
  },

  async syncAllChannelsStatus() {
    const todayStr = new Date().toISOString().split('T')[0];
    
    const { data: channels, error: channelsError } = await supabase
      .from('story_channels')
      .select('id, is_active') as any;
      
    if (channelsError) throw channelsError;
    if (!channels || channels.length === 0) return;
    
    const { data: activeStories, error: storiesError } = await supabase
      .from('story_items')
      .select('channel_id')
      .eq('status', 'active')
      .gte('data_expiracao', todayStr) as any;
      
    if (storiesError) throw storiesError;
    
    const activeChannelIds = new Set(activeStories?.map((item: any) => item.channel_id) || []);
    
    for (const channel of (channels as any[])) {
      const shouldBeActive = activeChannelIds.has(channel.id);
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
    state?: string;
    city?: string;
  }) {
    try {
      await this.syncAllChannelsStatus();
    } catch (syncErr) {
      console.error('Error syncing channels status:', syncErr);
    }

    const { page, pageSize, filter, sort, state, city } = params;
    const startRange = (page - 1) * pageSize;
    const endRange = startRange + pageSize - 1;

    let query = supabase
      .from('story_channels')
      .select('*, story_items(*)', { count: 'exact' });

    if (filter === 'active') {
      query = query.eq('is_active', true);
    } else if (filter === 'inactive') {
      query = query.eq('is_active', false);
    }

    if (state === 'national') {
      query = query.is('state', null);
    } else if (state && state !== 'all') {
      query = query.eq('state', state);
    }

    if (city) {
      query = query.ilike('city', `%${city}%`);
    }

    if (sort === 'newest') {
      query = query.order('created_at', { ascending: false });
    } else if (sort === 'oldest') {
      query = query.order('created_at', { ascending: true });
    }

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
    const { error } = await supabase
      .from('story_channels')
      .delete()
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

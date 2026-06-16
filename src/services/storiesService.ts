import { supabase } from '../lib/supabase';
import type { Database } from '../types/database.types';

type Channel = Database['public']['Tables']['story_channels']['Row'];
type StoryItem = Database['public']['Tables']['story_items']['Row'];

export const storiesService = {
  // === Story Channels ===
  async getStoryChannels() {
    const { data, error } = await supabase
      .from('story_channels')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
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
    return data;
  },

  async updateStoryItem(id: string, updates: Partial<Omit<StoryItem, 'id' | 'created_at'>>) {
    const { data, error } = await (supabase.from('story_items') as any)
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteStoryItem(id: string) {
    const { error } = await supabase
      .from('story_items')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};

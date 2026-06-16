import { useState, useEffect, useCallback } from 'react';
import { storiesService } from '../services/storiesService';
import type { Database } from '../types/database.types';

type Channel = Database['public']['Tables']['story_channels']['Row'];
type StoryItem = Database['public']['Tables']['story_items']['Row'];

export function useStories() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchChannelsAndItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const channelData = await storiesService.getStoryChannels();
      setChannels(channelData);

      const itemsData = await storiesService.getStoryItems(selectedChannelId);
      setItems(itemsData);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [selectedChannelId]);

  useEffect(() => {
    fetchChannelsAndItems();
  }, [fetchChannelsAndItems]);

  const createChannel = async (channel: Omit<Channel, 'id' | 'created_at'>) => {
    try {
      const newChannel = await storiesService.createStoryChannel(channel);
      setChannels((prev) => [newChannel, ...prev]);
      return newChannel;
    } catch (err: any) {
      alert('Falha ao criar canal: ' + err.message);
      throw err;
    }
  };

  const updateChannel = async (id: string, updates: Partial<Omit<Channel, 'id' | 'created_at'>>) => {
    try {
      const updated = await storiesService.updateStoryChannel(id, updates);
      setChannels((prev) => prev.map((c) => (c.id === id ? updated : c)));
      return updated;
    } catch (err: any) {
      alert('Falha ao atualizar canal: ' + err.message);
      throw err;
    }
  };

  const deleteChannel = async (id: string) => {
    if (!confirm('Deseja realmente excluir este canal? Todos os stories vinculados serão deletados.')) return;
    try {
      await storiesService.deleteStoryChannel(id);
      setChannels((prev) => prev.filter((c) => c.id !== id));
      if (selectedChannelId === id) {
        setSelectedChannelId(undefined);
      } else {
        setItems((prev) => prev.filter((item) => item.channel_id !== id));
      }
    } catch (err: any) {
      alert('Falha ao deletar canal: ' + err.message);
    }
  };

  const createItem = async (item: Omit<StoryItem, 'id' | 'created_at'>) => {
    try {
      const newItem = await storiesService.createStoryItem(item);
      // reload items to make sure relation names are loaded
      const itemsData = await storiesService.getStoryItems(selectedChannelId);
      setItems(itemsData);
      return newItem;
    } catch (err: any) {
      alert('Falha ao criar story: ' + err.message);
      throw err;
    }
  };

  const updateItemStatus = async (id: string, status: StoryItem['status']) => {
    try {
      await storiesService.updateStoryItem(id, { status });
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
    } catch (err: any) {
      alert('Falha ao atualizar status do story: ' + err.message);
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm('Deseja realmente excluir este story?')) return;
    try {
      await storiesService.deleteStoryItem(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err: any) {
      alert('Falha ao deletar story: ' + err.message);
    }
  };

  return {
    channels,
    items,
    selectedChannelId,
    setSelectedChannelId,
    loading,
    error,
    createChannel,
    updateChannel,
    deleteChannel,
    createItem,
    updateItemStatus,
    deleteItem,
    refetch: fetchChannelsAndItems,
  };
}

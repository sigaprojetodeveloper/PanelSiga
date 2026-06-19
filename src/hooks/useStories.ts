import { useState, useEffect, useCallback } from 'react';
import { storiesService } from '../services/storiesService';
import type { Database } from '../types/database.types';

type Channel = Database['public']['Tables']['story_channels']['Row'];
type StoryItem = Database['public']['Tables']['story_items']['Row'];

export function useStories() {
  const [channels, setChannels] = useState<any[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest');
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchChannelsAndItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, totalCount: count } = await storiesService.getStoryChannels({
        page,
        pageSize,
        filter,
        sort,
        state: stateFilter,
        city: cityFilter,
      });
      setChannels(data);
      setTotalCount(count);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filter, sort, stateFilter, cityFilter]);

  useEffect(() => {
    fetchChannelsAndItems();
  }, [fetchChannelsAndItems]);

  // Derived state: items of the selected channel
  const selectedChannel = channels.find((c) => c.id === selectedChannelId);
  const items = selectedChannel?.story_items || [];

  // Automatically reset selection if the selected channel is no longer present in the list
  useEffect(() => {
    if (selectedChannelId && !channels.some((c) => c.id === selectedChannelId)) {
      setSelectedChannelId(undefined);
    }
  }, [channels, selectedChannelId]);

  const createChannel = async (channel: Omit<Channel, 'id' | 'created_at'>) => {
    try {
      const newChannel = await storiesService.createStoryChannel(channel);
      await fetchChannelsAndItems();
      return newChannel;
    } catch (err: any) {
      alert('Falha ao criar canal: ' + err.message);
      throw err;
    }
  };

  const updateChannel = async (id: string, updates: Partial<Omit<Channel, 'id' | 'created_at'>>) => {
    try {
      const updated = await storiesService.updateStoryChannel(id, updates);
      await fetchChannelsAndItems();
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
      if (selectedChannelId === id) {
        setSelectedChannelId(undefined);
      }
      await fetchChannelsAndItems();
    } catch (err: any) {
      alert('Falha ao deletar canal: ' + err.message);
    }
  };

  const createItem = async (item: Omit<StoryItem, 'id' | 'created_at'>) => {
    try {
      const newItem = await storiesService.createStoryItem(item);
      await fetchChannelsAndItems();
      return newItem;
    } catch (err: any) {
      alert('Falha ao criar story: ' + err.message);
      throw err;
    }
  };

  const updateItemStatus = async (id: string, status: StoryItem['status']) => {
    try {
      await storiesService.updateStoryItem(id, { status });
      await fetchChannelsAndItems();
    } catch (err: any) {
      alert('Falha ao atualizar status do story: ' + err.message);
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm('Deseja realmente excluir este story?')) return;
    try {
      await storiesService.deleteStoryItem(id);
      await fetchChannelsAndItems();
    } catch (err: any) {
      alert('Falha ao deletar story: ' + err.message);
    }
  };

  return {
    channels,
    items,
    selectedChannelId,
    setSelectedChannelId,
    page,
    setPage,
    pageSize,
    totalCount,
    filter,
    setFilter,
    sort,
    setSort,
    stateFilter,
    setStateFilter,
    cityFilter,
    setCityFilter,
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

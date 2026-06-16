import { useState, useEffect, useCallback } from 'react';
import { usersService } from '../services/usersService';
import type { Database } from '../types/database.types';

type User = Database['public']['Tables']['users']['Row'];

export function useUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<User['status'] | undefined>(undefined);
  const [roleFilter, setRoleFilter] = useState<'cliente' | 'profissional' | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Detail view state
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, totalCount } = await usersService.getUsers({
        page,
        pageSize,
        search,
        status: statusFilter,
        role: roleFilter,
      });
      setUsers(data || []);
      setTotalCount(totalCount);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, statusFilter, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const loadUserDetails = async (userId: string) => {
    setDetailsLoading(true);
    try {
      const details = await usersService.getUserDetails(userId);
      setSelectedUser(details);
      return details;
    } catch (err: any) {
      alert('Falha ao carregar detalhes: ' + err.message);
    } finally {
      setDetailsLoading(false);
    }
  };

  const updateUserStatus = async (userId: string, status: User['status']) => {
    try {
      await usersService.updateUserStatus(userId, status);
      // update local list
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status } : u))
      );
      // update detail if currently viewed
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser((prev: any) => prev ? { ...prev, status } : null);
      }
    } catch (err: any) {
      alert('Falha ao atualizar status do usuário: ' + err.message);
    }
  };

  const editUserProfile = async (userId: string, updates: any) => {
    try {
      await usersService.updateUserProfile(userId, updates);
      fetchUsers();
      if (selectedUser && selectedUser.id === userId) {
        loadUserDetails(userId);
      }
    } catch (err: any) {
      alert('Falha ao atualizar perfil: ' + err.message);
    }
  };

  return {
    users,
    totalCount,
    loading,
    error,
    page,
    setPage,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    roleFilter,
    setRoleFilter,
    selectedUser,
    setSelectedUser,
    detailsLoading,
    loadUserDetails,
    updateUserStatus,
    editUserProfile,
    refetch: fetchUsers,
  };
}

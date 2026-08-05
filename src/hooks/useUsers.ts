import { useState, useEffect, useCallback } from 'react';
import { usersService } from '../services/usersService';
import type { Database, VerificationLevelEnum } from '../types/database.types';
import { useToast } from './useToast';

type User = Database['public']['Tables']['users']['Row'];

export function useUsers() {
  const { success, error } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<User['status'] | undefined>(undefined);
  const [roleFilter, setRoleFilter] = useState<'cliente' | 'profissional' | undefined>(undefined);
  const [verificationLevelFilter, setVerificationLevelFilter] = useState<VerificationLevelEnum | undefined>(undefined);
  const [isSuspendedFilter, setIsSuspendedFilter] = useState<boolean | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorState, setErrorState] = useState<Error | null>(null);

  // Detail view state
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setErrorState(null);
    try {
      const { data, totalCount } = await usersService.getUsers({
        page,
        pageSize,
        search,
        status: statusFilter,
        role: roleFilter,
        verificationLevel: verificationLevelFilter,
        isSuspended: isSuspendedFilter,
      });
      setUsers(data || []);
      setTotalCount(totalCount);
    } catch (err: any) {
      setErrorState(err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, statusFilter, roleFilter, verificationLevelFilter, isSuspendedFilter]);

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
      error('Falha ao carregar detalhes: ' + err.message);
    } finally {
      setDetailsLoading(false);
    }
  };

  const updateUserStatus = async (userId: string, status: User['status'], blockReason?: string | null) => {
    try {
      await usersService.updateUserStatus(userId, status, blockReason);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status, block_reason: status === 'blocked' ? blockReason : null } : u))
      );
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser((prev: any) => prev ? { ...prev, status, block_reason: status === 'blocked' ? blockReason : null } : null);
      }
      success('Status do usuário atualizado!');
    } catch (err: any) {
      error('Falha ao atualizar status do usuário: ' + err.message);
    }
  };

  const updateVerificationLevel = async (userId: string, level: VerificationLevelEnum) => {
    try {
      await usersService.updateUserVerification(userId, level, undefined);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, verification_level: level, verification_updated_at: new Date().toISOString() } : u))
      );
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser((prev: any) =>
          prev ? { ...prev, verification_level: level, verification_updated_at: new Date().toISOString() } : null
        );
      }
      success(`Nível de verificação atualizado para ${level.toUpperCase()}!`);
    } catch (err: any) {
      error('Falha ao atualizar nível de verificação: ' + err.message);
    }
  };

  const toggleSuspension = async (userId: string, isSuspended: boolean) => {
    try {
      await usersService.updateUserVerification(userId, undefined, isSuspended);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_suspended: isSuspended, verification_updated_at: new Date().toISOString() } : u))
      );
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser((prev: any) =>
          prev ? { ...prev, is_suspended: isSuspended, verification_updated_at: new Date().toISOString() } : null
        );
      }
      success(isSuspended ? 'Usuário suspenso! Selo ocultado na plataforma.' : 'Suspensão removida!');
    } catch (err: any) {
      error('Falha ao alterar status de suspensão: ' + err.message);
    }
  };

  const editUserProfile = async (userId: string, updates: any) => {
    try {
      await usersService.updateUserProfile(userId, updates);
      fetchUsers();
      if (selectedUser && selectedUser.id === userId) {
        loadUserDetails(userId);
      }
      success('Perfil atualizado com sucesso!');
    } catch (err: any) {
      error('Falha ao atualizar perfil: ' + err.message);
    }
  };

  return {
    users,
    totalCount,
    loading,
    error: errorState,
    page,
    setPage,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    roleFilter,
    setRoleFilter,
    verificationLevelFilter,
    setVerificationLevelFilter,
    isSuspendedFilter,
    setIsSuspendedFilter,
    selectedUser,
    setSelectedUser,
    detailsLoading,
    loadUserDetails,
    updateUserStatus,
    updateVerificationLevel,
    toggleSuspension,
    editUserProfile,
    refetch: fetchUsers,
  };
}


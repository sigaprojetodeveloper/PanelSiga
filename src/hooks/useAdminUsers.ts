import { useState, useEffect, useCallback } from 'react';
import { adminUsersService } from '../services/adminUsersService';
import { useToast } from './useToast';
import type { Database } from '../types/database.types';

type AdminUser = Database['public']['Tables']['admin_users']['Row'];

export function useAdminUsers() {
  const { success, error } = useToast();
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorState, setErrorState] = useState<Error | null>(null);

  const fetchAdminUsers = useCallback(async () => {
    setLoading(true);
    setErrorState(null);
    try {
      const { data, totalCount } = await adminUsersService.getAdminUsers({
        page,
        pageSize,
        search,
      });
      setAdminUsers(data);
      setTotalCount(totalCount);
    } catch (err: any) {
      setErrorState(err);
      error('Erro ao carregar administradores: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, error]);

  useEffect(() => {
    fetchAdminUsers();
  }, [fetchAdminUsers]);

  const createAdmin = async (payload: Omit<AdminUser, 'id' | 'created_at'>) => {
    try {
      await adminUsersService.createAdminUser(payload);
      success('Administrador cadastrado com sucesso!');
      fetchAdminUsers();
      return true;
    } catch (err: any) {
      error('Erro ao criar administrador: ' + err.message);
      return false;
    }
  };

  const changePassword = async (id: string, password: string) => {
    try {
      await adminUsersService.updateAdminUserPassword(id, password);
      success('Senha atualizada com sucesso!');
      fetchAdminUsers();
      return true;
    } catch (err: any) {
      error('Erro ao atualizar senha: ' + err.message);
      return false;
    }
  };

  const deleteAdmin = async (id: string) => {
    try {
      await adminUsersService.deleteAdminUser(id);
      success('Administrador removido com sucesso!');
      fetchAdminUsers();
      return true;
    } catch (err: any) {
      error('Erro ao remover administrador: ' + err.message);
      return false;
    }
  };

  return {
    adminUsers,
    totalCount,
    loading,
    error: errorState,
    page,
    setPage,
    search,
    setSearch,
    createAdmin,
    changePassword,
    deleteAdmin,
    refetch: fetchAdminUsers,
  };
}

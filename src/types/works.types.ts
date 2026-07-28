export type WorkStatus = 'aberta' | 'em_andamento' | 'concluida' | 'cancelled' | 'bloqueada';

export interface Creator {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  bio?: string | null;
  whatsapp_phone?: string | null;
  role_flags?: string[];
}

export interface ContractSigner {
  id: string;
  user_id: string;
  name: string;
  role: 'cliente' | 'profissional' | 'testemunha';
  signed_flag: boolean;
  signed_at: string | null;
}

export interface Contract {
  id: string;
  work_id: string;
  status: 'draft' | 'pending_signatures' | 'signed' | 'cancelled';
  is_signed: boolean;
  signers: ContractSigner[];
  pdf_url: string | null;
  created_at: string;
}

export interface WorkAddress {
  street?: string;
  number?: string;
  district?: string;
  city: string;
  state: string;
  complement?: string;
  formatted_address?: string;
}

export interface Work {
  id: string;
  client_id: string | null;
  title: string;
  description: string | null;
  status: WorkStatus;
  city: string;
  state: string;
  address?: WorkAddress;
  media_urls: string[] | null;
  created_at: string;
  updated_at?: string;
  rejection_reason?: string | null;
  creator?: Creator;
  contract?: Contract | null;
}

export interface WorkFilterParams {
  status: WorkStatus | 'all';
  page: number;
  limit: number;
  searchQuery?: string;
  sortOrder?: 'desc' | 'asc';
}

export interface PaginatedWorksResult {
  data: Work[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

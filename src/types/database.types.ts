export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string | null;
          name: string | null;
          phone: string | null;
          role_flags: string[]; // ['cliente', 'profissional']
          document_type: 'cpf' | 'cnpj' | null;
          document_hash: string | null;
          nationality: string | null;
          marital_status: string | null;
          status: 'active' | 'blocked' | 'deleted';
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      user_profiles: {
        Row: {
          user_id: string;
          avatar_url: string | null;
          bio: string | null;
          instagram: string | null;
          facebook: string | null;
          whatsapp_phone: string | null;
          whatsapp_phone_2: string | null;
          telegram: string | null;
          email_contact: string | null;
          website: string | null;
          rating_avg: number;
          rating_count: number;
          is_available: boolean;
        };
        Insert: Partial<Database['public']['Tables']['user_profiles']['Row']>;
        Update: Partial<Database['public']['Tables']['user_profiles']['Row']>;
      };
      reports: {
        Row: {
          id: string;
          reporter_id: string;
          target_type: 'user' | 'work' | 'proposal' | 'budget' | 'content';
          target_id: string;
          reason: string;
          description: string | null;
          attachment_urls: string[] | null;
          allow_contact: boolean;
          status: 'new' | 'in_review' | 'resolved' | 'ignored';
          notes: string | null; // internal admin notes
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['reports']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['reports']['Insert']>;
      };
      story_channels: {
        Row: {
          id: string;
          name: string;
          avatar_url: string | null;
          is_destaque: boolean;
          is_active: boolean;
          scope: 'global' | 'national' | 'state' | 'city';
          country: string | null;
          state: string | null;
          city: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['story_channels']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['story_channels']['Insert']>;
      };
      story_items: {
        Row: {
          id: string;
          channel_id: string;
          media_url: string;
          media_type: 'image' | 'video';
          link_url: string | null;
          link_label: string | null;
          status: 'active' | 'expired';
          data_expiracao: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['story_items']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['story_items']['Insert']>;
      };
      works: {
        Row: {
          id: string;
          client_id: string | null;
          title: string;
          description: string | null;
          status: 'aberta' | 'em_andamento' | 'concluida' | 'cancelled';
          city: string;
          state: string;
          media_urls: string[] | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['works']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['works']['Insert']>;
      };
      proposals: {
        Row: {
          id: string;
          work_id: string;
          professional_id: string | null;
          status: 'pendente' | 'aceita' | 'recusada' | 'cancelled';
          budget_id: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['proposals']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['proposals']['Insert']>;
      };
      budgets: {
        Row: {
          id: string;
          professional_id: string | null;
          client_name_manual: string;
          valid_until: string;
          items: any; // jsonb structure
          discount: number;
          total_value: number;
          pdf_url: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['budgets']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['budgets']['Insert']>;
      };
      addresses: {
        Row: {
          id: string;
          user_id: string;
          type: 'base' | 'work';
          country: string;
          state: string;
          city: string;
          district: string | null;
          street: string;
          number: string | null;
          complement: string | null;
        };
        Insert: Omit<Database['public']['Tables']['addresses']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['addresses']['Insert']>;
      };
      admin_users: {
        Row: {
          id: string;
          username: string;
          password: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['admin_users']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['admin_users']['Insert']>;
      };
      banners: {
        Row: {
          id: string;
          image_url: string;
          title: string | null;
          subtitle: string | null;
          link_url: string | null;
          link_label: string | null;
          status: 'active' | 'expired';
          data_expiracao: string;
          scope: 'global' | 'national' | 'state' | 'city';
          country: string | null;
          state: string | null;
          city: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['banners']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['banners']['Insert']>;
      };
    };
  };
}

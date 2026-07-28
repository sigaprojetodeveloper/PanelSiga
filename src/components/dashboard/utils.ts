export const getTodayStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const decodeBase64 = (str: string): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let decoded = '';
  let buffer = 0;
  let bits = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (char === '=') break;
    const value = chars.indexOf(char);
    if (value === -1) continue;
    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      decoded += String.fromCharCode((buffer >> bits) & 0xff);
    }
  }
  return decoded;
};

export const decodeDocumentHash = (docHash: string | null | undefined): string => {
  if (!docHash) return '';
  const parts = docHash.split(':');
  if (parts.length < 3) return '';
  try {
    const unmasked = decodeBase64(parts[2]);
    if (unmasked.length === 11) {
      return unmasked.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else if (unmasked.length === 14) {
      return unmasked.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    return unmasked;
  } catch {
    return '';
  }
};

export const ESTADOS_BRASIL = [
  { value: 'AC', label: 'Acre' },
  { value: 'AL', label: 'Alagoas' },
  { value: 'AP', label: 'Amapá' },
  { value: 'AM', label: 'Amazonas' },
  { value: 'BA', label: 'Bahia' },
  { value: 'CE', label: 'Ceará' },
  { value: 'DF', label: 'Distrito Federal' },
  { value: 'ES', label: 'Espírito Santo' },
  { value: 'GO', label: 'Goiás' },
  { value: 'MA', label: 'Maranhão' },
  { value: 'MT', label: 'Mato Grosso' },
  { value: 'MS', label: 'Mato Grosso do Sul' },
  { value: 'MG', label: 'Minas Gerais' },
  { value: 'PA', label: 'Pará' },
  { value: 'PB', label: 'Paraíba' },
  { value: 'PR', label: 'Paraná' },
  { value: 'PE', label: 'Pernambuco' },
  { value: 'PI', label: 'Piauí' },
  { value: 'RJ', label: 'Rio de Janeiro' },
  { value: 'RN', label: 'Rio Grande do Norte' },
  { value: 'RS', label: 'Rio Grande do Sul' },
  { value: 'RO', label: 'Rondônia' },
  { value: 'RR', label: 'Roraima' },
  { value: 'SC', label: 'Santa Catarina' },
  { value: 'SP', label: 'São Paulo' },
  { value: 'SE', label: 'Sergipe' },
  { value: 'TO', label: 'Tocantins' }
];

export const formatWhatsAppNumber = (val: string) => {
  const digits = val.replace(/\D/g, '');
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
};

export const calculateDaysDifference = (startStr?: string, endStr?: string) => {
  if (!startStr || !endStr) return 0;
  try {
    const start = new Date(startStr);
    const end = new Date(endStr);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays || 1;
  } catch {
    return 0;
  }
};

export const getAdDates = (item: any, type: 'banner' | 'story') => {
  if (type === 'banner') {
    return {
      start: item.initialization_date,
      end: item.expiration_date
    };
  } else {
    return {
      start: item.initialization_date || item.data_inicializacao,
      end: item.expiration_date || item.data_expiracao
    };
  }
};

export interface ParsedLink {
  type: 'none' | 'whatsapp' | 'external' | 'internal';
  rawValue: string;
  customRoute: string;
}

export const parseLinkUrl = (url: string | null): ParsedLink => {
  if (!url) {
    return { type: 'none', rawValue: '', customRoute: '' };
  }
  if (url.startsWith('https://wa.me/')) {
    const digits = url.replace('https://wa.me/55', '').replace('https://wa.me/', '');
    return { type: 'whatsapp', rawValue: formatWhatsAppNumber(digits), customRoute: '' };
  }
  if (url.startsWith('/public-profile?id=')) {
    const userId = url.split('=')[1] || '';
    return { type: 'internal', rawValue: userId, customRoute: '' };
  }
  if (url.startsWith('/works/')) {
    const workId = url.split('/works/')[1] || '';
    return { type: 'internal', rawValue: 'work', customRoute: workId };
  }
  if (url.startsWith('/')) {
    return { type: 'internal', rawValue: 'custom', customRoute: url };
  }
  return { type: 'external', rawValue: url, customRoute: '' };
};

export const assembleLinkUrl = (
  type: 'none' | 'whatsapp' | 'external' | 'internal',
  rawValue: string,
  customRoute: string
): string | null => {
  if (type === 'none') return null;
  if (type === 'whatsapp') {
    const digits = rawValue.replace(/\D/g, '');
    return `https://wa.me/55${digits}`;
  }
  if (type === 'internal') {
    if (rawValue === 'custom') return customRoute;
    if (rawValue === 'work') return `/works/${customRoute}`;
    return `/public-profile?id=${rawValue}`;
  }
  return rawValue;
};

export const translateTargetType = (targetType?: string): string => {
  if (!targetType) return 'Nenhum';
  const type = targetType.toLowerCase();
  switch (type) {
    case 'user':
      return 'Usuário';
    case 'work':
    case 'construction':
      return 'Obra';
    case 'proposal':
      return 'Proposta';
    case 'budget':
      return 'Orçamento';
    case 'media':
    case 'content':
      return 'Conteúdo';
    default:
      return targetType;
  }
};


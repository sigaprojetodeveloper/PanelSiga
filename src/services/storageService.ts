import { supabase } from '../lib/supabase';

const STORAGE_ENV = process.env.NEXT_PUBLIC_STORAGE_ENV || process.env.VITE_STORAGE_ENV || 'develop';

export interface UploadResponse {
    publicUrl: string;
    key: string;
}

/**
 * Realiza o upload de um arquivo para o Cloudflare R2 por meio da Edge Function do Supabase.
 */
export async function uploadToR2(
    file: File | Blob,
    filename: string,
    contentType: string,
    folder?: string
): Promise<UploadResponse> {
    try {
        // 1. Solicita a URL pré-assinada de upload à Edge Function 'r2-storage' do Supabase
        const { data, error: funcError } = await supabase.functions.invoke('r2-storage', {
            body: {
                filename,
                contentType,
                environment: STORAGE_ENV,
                folder
            }
        });

        if (funcError || !data?.uploadUrl) {
            throw new Error(funcError?.message || 'Falha ao obter URL de upload');
        }

        const { uploadUrl, publicUrl, key } = data;

        // 2. Realiza o PUT direto para o bucket do Cloudflare R2 usando a URL gerada
        const uploadResponse = await fetch(uploadUrl, {
            method: 'PUT',
            body: file,
            headers: {
                'Content-Type': contentType,
            },
        });

        if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            throw new Error(`Upload falhou com status ${uploadResponse.status}: ${errorText}`);
        }

        return { publicUrl, key };
    } catch (error) {
        console.error('Erro no uploadToR2:', error);
        throw error;
    }
}

/**
 * Função utilitária para identificar o Content-Type correto com base na extensão
 */
export function getContentType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
        case 'jpg':
        case 'jpeg':
            return 'image/jpeg';
        case 'png':
            return 'image/png';
        case 'pdf':
            return 'application/pdf';
        case 'mp4':
            return 'video/mp4';
        default:
            return 'application/octet-stream';
    }
}

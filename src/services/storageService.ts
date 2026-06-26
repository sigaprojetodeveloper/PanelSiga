import { supabase } from '../lib/supabase';

const STORAGE_ENV = process.env.NEXT_PUBLIC_STORAGE_ENV || 'develop';

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
        // Validação de tamanho máximo de arquivo (50MB) no frontend
        const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;
        if (file.size > MAX_FILE_SIZE_BYTES) {
            throw new Error('O arquivo excede o limite máximo permitido de 50MB.');
        }

        // 1. Solicita a URL pré-assinada de upload à Edge Function 'r2-storage' do Supabase
        let signedUrlData;
        try {
            const { data, error: funcError } = await supabase.functions.invoke('r2-storage', {
                body: {
                    filename,
                    contentType,
                    environment: STORAGE_ENV,
                    folder
                }
            });

            if (funcError) {
                throw new Error(funcError.message);
            }
            if (!data?.uploadUrl) {
                throw new Error('A Edge Function não retornou a URL de upload.');
            }
            signedUrlData = data;
        } catch (err: any) {
            console.error('Erro na Edge Function r2-storage:', err);
            throw new Error(`Não foi possível obter a URL de upload: ${err.message}`);
        }

        const { uploadUrl, publicUrl, key } = signedUrlData;

        // 2. Realiza o PUT direto para o bucket do Cloudflare R2 usando a URL gerada
        try {
            const uploadResponse = await fetch(uploadUrl, {
                method: 'PUT',
                body: file,
                headers: {
                    'Content-Type': contentType,
                },
            });

            if (!uploadResponse.ok) {
                const errorText = await uploadResponse.text();
                throw new Error(`Status ${uploadResponse.status}: ${errorText}`);
            }
        } catch (err: any) {
            console.error('Erro no PUT para o Cloudflare R2:', err);
            throw new Error(`Falha ao enviar arquivo para o Cloudflare R2: ${err.message}`);
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

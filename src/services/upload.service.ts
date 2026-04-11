import { apiClientFormData } from '@/lib/api-client';

export interface PendingUploadData {
  url: string;
  filename: string;
}

type PendingUploadResponse = {
  success: boolean;
  data: PendingUploadData;
  message?: string;
};

/**
 * Uploads a profile image to `POST /api/upload` (field name `file`).
 * Returns the public URL to store on the person record.
 */
export async function uploadProfilePhoto(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  const json = await apiClientFormData<PendingUploadResponse>('/api/upload', formData);
  return json.data.url;
}

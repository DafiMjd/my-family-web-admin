'use client';

import { useCallback, useRef, useState } from 'react';
import { uploadProfilePhoto } from '@/services/upload.service';
import { ApiError } from '@/lib/api-client';

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT =
  'image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,.heic,.heif';

function isAllowedImage(file: File): boolean {
  const t = file.type.toLowerCase();
  if (
    t === 'image/jpeg' ||
    t === 'image/png' ||
    t === 'image/webp' ||
    t === 'image/gif' ||
    t === 'image/heic' ||
    t === 'image/heif'
  ) {
    return true;
  }
  const name = file.name.toLowerCase();
  return name.endsWith('.heic') || name.endsWith('.heif');
}

interface ProfilePhotoDropzoneProps {
  value: string | null;
  onChange: (url: string | null) => void;
  disabled?: boolean;
}

export function ProfilePhotoDropzone({ value, onChange, disabled = false }: ProfilePhotoDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFile = useCallback(
    async (file: File | undefined) => {
      if (!file || disabled) {
        return;
      }
      setError(null);
      if (file.size > MAX_BYTES) {
        setError('Ukuran file maksimal 5 MB.');
        return;
      }
      if (!isAllowedImage(file)) {
        setError('Format: JPEG, PNG, WebP, GIF, atau HEIC.');
        return;
      }
      setUploading(true);
      try {
        const url = await uploadProfilePhoto(file);
        onChange(url);
      } catch (e) {
        const msg =
          e instanceof ApiError
            ? e.message
            : e instanceof Error
              ? e.message
              : 'Gagal mengunggah foto.';
        setError(msg);
      } finally {
        setUploading(false);
      }
    },
    [disabled, onChange],
  );

  const onPickFiles = (files: FileList | null) => {
    const file = files?.[0];
    void processFile(file);
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-[#242424]">Foto profil (opsional)</span>

      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(false);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(false);
          if (disabled) return;
          onPickFiles(e.dataTransfer.files);
        }}
        onClick={() => !disabled && !uploading && inputRef.current?.click()}
        className={`relative flex min-h-30 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-5 text-center transition-colors ${
          disabled
            ? 'cursor-not-allowed border-[#E0E0E0] bg-[#F7F7F7] opacity-60'
            : isDragging
              ? 'border-[#65587a] bg-[#f4f2f8]'
              : 'border-[#D9D9D9] bg-[#FAFAFA] hover:border-[#65587a]/60'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="sr-only"
          disabled={disabled || uploading}
          onChange={(e) => {
            onPickFiles(e.target.files);
            e.target.value = '';
          }}
        />

        {value ? (
          <img src={value} alt="" className="max-h-24 max-w-full rounded-lg object-contain" />
        ) : (
          <p className="text-sm text-[#606060]">
            {uploading ? 'Mengunggah…' : 'Seret & lepas gambar di sini, atau pilih file'}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              inputRef.current?.click();
            }}
            disabled={disabled || uploading}
            className="rounded-lg bg-[#65587a] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
          >
            Pilih file
          </button>
          {value ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
                setError(null);
              }}
              disabled={disabled || uploading}
              className="rounded-lg border border-[#D9D9D9] bg-white px-3 py-1.5 text-xs font-semibold text-[#242424] disabled:opacity-50"
            >
              Hapus foto
            </button>
          ) : null}
        </div>
      </div>

      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

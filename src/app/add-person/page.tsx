'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { PersonFormFields, type PersonDraft } from '@/app/components/PersonFormFields';
import { personService } from '@/services/person.service';

export default function AddPersonPage() {
  const router = useRouter();
  const [form, setForm] = useState<PersonDraft>({
    parent: null,
    name: '',
    gender: 'MAN',
    birthDate: '',
    deathDate: '',
    profilePictureUrl: null,
  });
  const [submitError, setSubmitError] = useState<string | null>(null);

  const createPersonMutation = useMutation({
    mutationFn: () =>
      personService.createPerson({
        parent: form.parent ?? null,
        name: form.name.trim(),
        gender: form.gender,
        birthDate: form.birthDate,
        deathDate: form.deathDate || null,
        ...(form.profilePictureUrl ? { profilePictureUrl: form.profilePictureUrl } : {}),
      }),
    onSuccess: () => {
      sessionStorage.setItem('dashboard_toast', 'person-added');
      router.push('/dashboard');
    },
    onError: () => {
      setSubmitError('Gagal menambahkan data orang. Silakan coba lagi.');
    },
  });

  const isFormValid = form.name.trim().length > 0 && form.birthDate.length > 0;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isFormValid || createPersonMutation.isPending) {
      return;
    }

    setSubmitError(null);
    createPersonMutation.mutate();
  }

  return (
    <main className="min-h-dvh flex items-center justify-center bg-[#F5F5F5] p-4">
      {submitError ? (
        <div className="fixed top-4 right-4 z-50 rounded-lg bg-[#D14343] px-4 py-2 text-sm font-semibold text-white shadow-md">
          {submitError}
        </div>
      ) : null}

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-xl rounded-2xl bg-white border border-[#E0E0E0] p-5 md:p-6 flex flex-col gap-4"
      >
        <h1 className="text-lg font-semibold text-[#242424]">Tambah Orang</h1>
        <PersonFormFields
          value={form}
          onChange={setForm}
          queryScope="add-person"
          parentEnabled
          parentNote="Jika orang tua kosong, maka orang ini akan menjadi generasi pertama (tampil paling awal di pohon keluarga)."
        />

        <div className="mt-2 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 rounded-lg bg-[#F0F0F0] text-[#242424] text-sm font-semibold active:scale-95 transition-transform"
          >
            Batalkan
          </button>
          <button
            type="submit"
            disabled={!isFormValid || createPersonMutation.isPending}
            className="px-4 py-2 rounded-lg bg-[#65587a] text-white text-sm font-semibold disabled:opacity-50 active:scale-95 transition-transform"
          >
            {createPersonMutation.isPending ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </form>
    </main>
  );
}

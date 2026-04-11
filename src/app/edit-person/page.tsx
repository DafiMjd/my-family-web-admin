'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PersonFormFields, type PersonDraft } from '@/app/components/PersonFormFields';
import { personService } from '@/services/person.service';

function EditPersonPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const personId = searchParams.get('id') ?? '';

  const [form, setForm] = useState<PersonDraft>({
    parent: null,
    name: '',
    gender: 'MAN',
    birthDate: '',
    deathDate: '',
    profilePictureUrl: null,
  });
  const [submitError, setSubmitError] = useState<string | null>(null);

  const personQuery = useQuery({
    queryKey: ['person', 'detail', personId],
    queryFn: () => personService.getPersonById(personId),
    enabled: personId.length > 0,
  });

  useEffect(() => {
    const person = personQuery.data?.data;
    if (!person) {
      return;
    }

    setForm({
      parent: null,
      name: person.name,
      gender: person.gender,
      birthDate: person.birthDate ? person.birthDate.slice(0, 10) : '',
      deathDate: person.deathDate ? person.deathDate.slice(0, 10) : '',
      profilePictureUrl: person.profilePictureUrl ?? null,
    });
  }, [personQuery.data]);

  const updatePersonMutation = useMutation({
    mutationFn: () =>
      personService.updatePerson(personId, {
        name: form.name.trim(),
        gender: form.gender,
        birthDate: form.birthDate,
        deathDate: form.deathDate ? form.deathDate : null,
        profilePictureUrl: form.profilePictureUrl,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['person', 'detail', personId] });
      queryClient.invalidateQueries({ queryKey: ['person', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['family-tree', 'roots'] });
      sessionStorage.setItem('people_toast', 'person-updated');
      router.push('/people');
    },
    onError: () => {
      setSubmitError('Gagal memperbarui data orang. Silakan coba lagi.');
    },
  });

  const isFormValid = useMemo(
    () => personId.length > 0 && form.name.trim().length > 0 && form.birthDate.length > 0,
    [form.birthDate, form.name, personId.length],
  );

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isFormValid || updatePersonMutation.isPending) {
      return;
    }

    setSubmitError(null);
    updatePersonMutation.mutate();
  }

  if (!personId) {
    return (
      <main className="min-h-dvh flex items-center justify-center bg-[#F5F5F5] p-4">
        <div className="rounded-xl bg-white border border-[#E0E0E0] p-5 text-sm text-red-500">
          ID orang tidak ditemukan.
        </div>
      </main>
    );
  }

  if (personQuery.isLoading) {
    return (
      <main className="min-h-dvh flex items-center justify-center bg-[#F5F5F5] p-4">
        <div className="rounded-xl bg-white border border-[#E0E0E0] p-5 text-sm text-[#606060]">
          Memuat data orang...
        </div>
      </main>
    );
  }

  if (personQuery.isError || !personQuery.data?.data) {
    return (
      <main className="min-h-dvh flex items-center justify-center bg-[#F5F5F5] p-4">
        <div className="rounded-xl bg-white border border-[#E0E0E0] p-5 text-sm text-red-500">
          Gagal memuat detail orang.
        </div>
      </main>
    );
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
        <h1 className="text-lg font-semibold text-[#242424]">Edit Orang</h1>
        <PersonFormFields value={form} onChange={setForm} queryScope={`edit-person-${personId}`} parentEnabled={false} />

        <div className="mt-2 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => router.push('/people')}
            className="px-4 py-2 rounded-lg bg-[#F0F0F0] text-[#242424] text-sm font-semibold active:scale-95 transition-transform"
          >
            Batalkan
          </button>
          <button
            type="submit"
            disabled={!isFormValid || updatePersonMutation.isPending}
            className="px-4 py-2 rounded-lg bg-[#65587a] text-white text-sm font-semibold disabled:opacity-50 active:scale-95 transition-transform"
          >
            {updatePersonMutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </form>
    </main>
  );
}

export default function EditPersonPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-dvh flex items-center justify-center bg-[#F5F5F5] p-4">
          <div className="rounded-xl bg-white border border-[#E0E0E0] p-5 text-sm text-[#606060]">Memuat...</div>
        </main>
      }
    >
      <EditPersonPageContent />
    </Suspense>
  );
}

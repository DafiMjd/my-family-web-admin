'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import {
  AddChildModal,
  createEmptyPerson,
  type ChildListEntry,
} from '@/app/components/AddChildModal';
import { PersonFormFields, type PersonDraft } from '@/app/components/PersonFormFields';
import { personService } from '@/services/person.service';

export default function AddFamilyPage() {
  const router = useRouter();
  const [father, setFather] = useState<PersonDraft>(createEmptyPerson('MAN'));
  const [mother, setMother] = useState<PersonDraft>(createEmptyPerson('WOMAN'));
  const [children, setChildren] = useState<ChildListEntry[]>([]);
  const [editingChildIndex, setEditingChildIndex] = useState<number | null>(null);
  const [isChildModalOpen, setIsChildModalOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const createFamilyMutation = useMutation({
    mutationFn: () =>
      personService.createFamily({
        father: {
          parent: father.parent ?? null,
          name: father.name.trim(),
          gender: 'MAN',
          birthDate: father.birthDate,
          deathDate: father.deathDate || null,
          ...(father.profilePictureUrl ? { profilePictureUrl: father.profilePictureUrl } : {}),
        },
        mother: {
          parent: mother.parent ?? null,
          name: mother.name.trim(),
          gender: 'WOMAN',
          birthDate: mother.birthDate,
          deathDate: mother.deathDate || null,
          ...(mother.profilePictureUrl ? { profilePictureUrl: mother.profilePictureUrl } : {}),
        },
        children: children.map((entry) =>
          entry.kind === 'existing'
            ? { personId: entry.person.id }
            : {
                newPerson: {
                  name: entry.draft.name.trim(),
                  gender: entry.draft.gender,
                  birthDate: entry.draft.birthDate,
                  deathDate: entry.draft.deathDate || null,
                  ...(entry.draft.profilePictureUrl
                    ? { profilePictureUrl: entry.draft.profilePictureUrl }
                    : {}),
                },
              },
        ),
      }),
    onSuccess: () => {
      sessionStorage.setItem('dashboard_toast', 'family-added');
      router.push('/dashboard');
    },
    onError: () => {
      setSubmitError('Gagal menambahkan data keluarga. Silakan coba lagi.');
    },
  });

  const isFatherValid = father.name.trim().length > 0 && father.birthDate.length > 0;
  const isMotherValid = mother.name.trim().length > 0 && mother.birthDate.length > 0;
  const isFamilyValid = isFatherValid && isMotherValid;

  const excludedChildPersonIds = useMemo(() => {
    const ids: string[] = [];
    for (let i = 0; i < children.length; i++) {
      const entry = children[i];
      if (entry.kind !== 'existing') {
        continue;
      }
      if (editingChildIndex !== null && i === editingChildIndex) {
        continue;
      }
      ids.push(entry.person.id);
    }
    return ids;
  }, [children, editingChildIndex]);

  function handleOpenAddChild() {
    setEditingChildIndex(null);
    setIsChildModalOpen(true);
  }

  function handleOpenEditChild(index: number) {
    setEditingChildIndex(index);
    setIsChildModalOpen(true);
  }

  function handleSaveChild(entry: ChildListEntry) {
    if (editingChildIndex === null) {
      setChildren((prev) => [...prev, entry]);
    } else {
      setChildren((prev) =>
        prev.map((child, index) => (index === editingChildIndex ? entry : child)),
      );
    }

    setIsChildModalOpen(false);
    setEditingChildIndex(null);
  }

  function handleDeleteChild(index: number) {
    setChildren((prev) => prev.filter((_, childIndex) => childIndex !== index));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isFamilyValid || createFamilyMutation.isPending) {
      return;
    }

    setSubmitError(null);
    createFamilyMutation.mutate();
  }

  return (
    <main className="min-h-dvh bg-[#F5F5F5] p-4 md:p-6">
      {submitError ? (
        <div className="fixed top-4 right-4 z-50 rounded-lg bg-[#D14343] px-4 py-2 text-sm font-semibold text-white shadow-md">
          {submitError}
        </div>
      ) : null}

      <form
        onSubmit={handleSubmit}
        className="mx-auto w-full max-w-5xl rounded-2xl bg-white border border-[#E0E0E0] p-5 md:p-6 flex flex-col gap-5"
      >
        <div className="flex flex-col gap-1">
          <h1 className="text-lg font-semibold text-[#242424]">Tambah Keluarga</h1>
          <p className="text-xs text-[#8A8A8A]">
            Jika tidak ada data kakek/nenek (orang tua dari ayah/ibu) yang diisi, maka keluarga ini akan menjadi generasi
            pertama (tampil pertama pada pohon keluarga).
          </p>
        </div>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-[#EAEAEA] p-4">
            <h2 className="text-base font-semibold text-[#242424] mb-3">Suami</h2>
            <PersonFormFields
              value={father}
              onChange={(next) => setFather({ ...next, gender: 'MAN' })}
              genderDisabled
              parentEnabled
              queryScope="add-family-father"
            />
          </div>

          <div className="rounded-xl border border-[#EAEAEA] p-4">
            <h2 className="text-base font-semibold text-[#242424] mb-3">Istri</h2>
            <PersonFormFields
              value={mother}
              onChange={(next) => setMother({ ...next, gender: 'WOMAN' })}
              genderDisabled
              parentEnabled
              queryScope="add-family-mother"
            />
          </div>
        </section>

        <section className="rounded-xl border border-[#EAEAEA] p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-[#242424]">Children</h2>
            <button
              type="button"
              onClick={handleOpenAddChild}
              className="px-3 py-2 rounded-lg bg-[#65587a] text-white text-sm font-semibold active:scale-95 transition-transform"
            >
              Add Person
            </button>
          </div>

          {children.length === 0 ? (
            <p className="text-sm text-[#8A8A8A]">Belum ada data anak.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {children.map((entry, index) => {
                const label =
                  entry.kind === 'existing' ? entry.person.name : entry.draft.name;
                const gender = entry.kind === 'existing' ? entry.person.gender : entry.draft.gender;
                const birthDate =
                  entry.kind === 'existing' ? entry.person.birthDate.slice(0, 10) : entry.draft.birthDate;
                const sub =
                  entry.kind === 'existing'
                    ? 'Orang terdaftar'
                    : 'Data baru';
                return (
                <article
                  key={entry.kind === 'existing' ? entry.person.id : `${label}-${index}`}
                  className="rounded-lg border border-[#E0E0E0] bg-white px-3 py-2 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#242424] truncate">{label}</p>
                    <p className="text-xs text-[#8A8A8A]">
                      {sub} · {gender === 'MAN' ? 'Laki-Laki' : 'Perempuan'} - {birthDate}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenEditChild(index)}
                      className="px-2 py-1 rounded-md bg-[#F0F0F0] text-xs font-semibold text-[#242424]"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteChild(index)}
                      className="px-2 py-1 rounded-md bg-[#FBEAEA] text-xs font-semibold text-[#D14343]"
                    >
                      Delete
                    </button>
                  </div>
                </article>
              );
              })}
            </div>
          )}
        </section>

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 rounded-lg bg-[#F0F0F0] text-[#242424] text-sm font-semibold active:scale-95 transition-transform"
          >
            Batalkan
          </button>
          <button
            type="submit"
            disabled={!isFamilyValid || createFamilyMutation.isPending}
            className="px-4 py-2 rounded-lg bg-[#65587a] text-white text-sm font-semibold disabled:opacity-50 active:scale-95 transition-transform"
          >
            {createFamilyMutation.isPending ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </form>

      <AddChildModal
        open={isChildModalOpen}
        queryKeyScope="add-family"
        title={editingChildIndex === null ? 'Tambah Anak' : 'Edit Anak'}
        editingEntry={editingChildIndex === null ? null : (children[editingChildIndex] ?? null)}
        excludePersonIds={excludedChildPersonIds}
        onClose={() => {
          setIsChildModalOpen(false);
          setEditingChildIndex(null);
        }}
        onSave={handleSaveChild}
      />
    </main>
  );
}

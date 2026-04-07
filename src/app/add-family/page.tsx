'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { PersonFormFields, type PersonDraft } from '@/app/components/PersonFormFields';
import { personService } from '@/services/person.service';

function createEmptyPerson(gender: 'MAN' | 'WOMAN'): PersonDraft {
  return {
    parentId: undefined,
    name: '',
    gender,
    birthDate: '',
    deathDate: '',
  };
}

export default function AddFamilyPage() {
  const router = useRouter();
  const [father, setFather] = useState<PersonDraft>(createEmptyPerson('MAN'));
  const [mother, setMother] = useState<PersonDraft>(createEmptyPerson('WOMAN'));
  const [children, setChildren] = useState<PersonDraft[]>([]);
  const [childForm, setChildForm] = useState<PersonDraft>(createEmptyPerson('MAN'));
  const [editingChildIndex, setEditingChildIndex] = useState<number | null>(null);
  const [isChildModalOpen, setIsChildModalOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const createFamilyMutation = useMutation({
    mutationFn: () =>
      personService.createFamily({
        father: {
          parentId: father.parentId,
          name: father.name.trim(),
          gender: 'MAN',
          birthDate: father.birthDate,
          deathDate: father.deathDate || null,
        },
        mother: {
          parentId: mother.parentId,
          name: mother.name.trim(),
          gender: 'WOMAN',
          birthDate: mother.birthDate,
          deathDate: mother.deathDate || null,
        },
        children: children.map((child) => ({
          name: child.name.trim(),
          gender: child.gender,
          birthDate: child.birthDate,
          deathDate: child.deathDate || null,
        })),
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
  const isChildFormValid = childForm.name.trim().length > 0 && childForm.birthDate.length > 0;

  function handleOpenAddChild() {
    setEditingChildIndex(null);
    setChildForm(createEmptyPerson('MAN'));
    setIsChildModalOpen(true);
  }

  function handleOpenEditChild(index: number) {
    setEditingChildIndex(index);
    setChildForm(children[index]);
    setIsChildModalOpen(true);
  }

  function handleSaveChild() {
    if (!isChildFormValid) {
      return;
    }

    if (editingChildIndex === null) {
      setChildren((prev) => [...prev, childForm]);
    } else {
      setChildren((prev) => prev.map((child, index) => (index === editingChildIndex ? childForm : child)));
    }

    setIsChildModalOpen(false);
    setEditingChildIndex(null);
    setChildForm(createEmptyPerson('MAN'));
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
              {children.map((child, index) => (
                <article
                  key={`${child.name}-${index}`}
                  className="rounded-lg border border-[#E0E0E0] bg-white px-3 py-2 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#242424] truncate">{child.name}</p>
                    <p className="text-xs text-[#8A8A8A]">
                      {child.gender === 'MAN' ? 'Laki-Laki' : 'Perempuan'} - {child.birthDate}
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
              ))}
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

      {isChildModalOpen ? (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => setIsChildModalOpen(false)}
        >
          <div
            className="w-full max-w-xl rounded-2xl bg-white p-4 md:p-5 flex flex-col gap-4"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-[#242424]">
              {editingChildIndex === null ? 'Tambah Anak' : 'Edit Anak'}
            </h3>

            <PersonFormFields
              value={childForm}
              onChange={setChildForm}
              parentEnabled={false}
              queryScope="add-family-child"
            />

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsChildModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-[#F0F0F0] text-[#242424] text-sm font-semibold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveChild}
                disabled={!isChildFormValid}
                className="px-4 py-2 rounded-lg bg-[#65587a] text-white text-sm font-semibold disabled:opacity-50"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

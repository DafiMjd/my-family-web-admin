'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { PersonFormFields, type PersonDraft } from '@/app/components/PersonFormFields';
import { personService } from '@/services/person.service';
import { familyTreeService } from '@/services/family-tree.service';
import type { Person } from '@/types/family-tree';

function createEmptyPerson(gender: 'MAN' | 'WOMAN'): PersonDraft {
  return {
    parentId: undefined,
    name: '',
    gender,
    birthDate: '',
    deathDate: '',
  };
}

export default function AddFamilyChildrenPage() {
  const router = useRouter();
  const [parentId, setParentId] = useState('');
  const [parentKeyword, setParentKeyword] = useState('');
  const [isParentDropdownOpen, setIsParentDropdownOpen] = useState(false);
  const [children, setChildren] = useState<PersonDraft[]>([]);
  const [childForm, setChildForm] = useState<PersonDraft>(createEmptyPerson('MAN'));
  const [editingChildIndex, setEditingChildIndex] = useState<number | null>(null);
  const [isChildModalOpen, setIsChildModalOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const parentDropdownRef = useRef<HTMLDivElement | null>(null);

  const marriedPeopleQuery = useQuery({
    queryKey: ['person-list', 'married-parent', 10, 0],
    queryFn: () =>
      personService.getPersonList({
        limit: 10,
        offset: 0,
        status: 'MARRIED',
      }),
  });

  const parentOptions = useMemo(() => marriedPeopleQuery.data?.data ?? [], [marriedPeopleQuery.data]);
  const selectedParent = useMemo(
    () => parentOptions.find((person) => person.id === parentId) ?? null,
    [parentId, parentOptions],
  );
  const filteredParentOptions = useMemo(() => {
    const keyword = parentKeyword.trim().toLowerCase();
    if (!keyword) {
      return parentOptions;
    }
    return parentOptions.filter((person) => person.name.toLowerCase().includes(keyword));
  }, [parentKeyword, parentOptions]);

  useEffect(() => {
    if (!isParentDropdownOpen) {
      return;
    }

    function handleClickOutside(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }
      if (!parentDropdownRef.current?.contains(target)) {
        setIsParentDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isParentDropdownOpen]);

  const addChildrenMutation = useMutation({
    mutationFn: () =>
      familyTreeService.addChildren({
        parentId,
        children: children.map((child) => ({
          name: child.name.trim(),
          gender: child.gender,
          birthDate: child.birthDate,
          ...(child.deathDate ? { deathDate: child.deathDate } : {}),
        })),
      }),
    onSuccess: () => {
      sessionStorage.setItem('dashboard_toast', 'children-added');
      router.push('/dashboard');
    },
    onError: () => {
      setSubmitError('Gagal menambahkan data anak. Silakan coba lagi.');
    },
  });

  const isChildFormValid = childForm.name.trim().length > 0 && childForm.birthDate.length > 0;
  const isFormValid = parentId.length > 0 && children.length > 0;

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
    if (!isFormValid || addChildrenMutation.isPending) {
      return;
    }

    setSubmitError(null);
    addChildrenMutation.mutate();
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
          <h1 className="text-lg font-semibold text-[#242424]">Tambah Anak-Anak</h1>
          <p className="text-xs text-[#8A8A8A]">Pilih orang tua (status menikah), lalu tambahkan data anak-anak.</p>
        </div>

        <section className="rounded-xl border border-[#EAEAEA] p-4 flex flex-col gap-2">
          <h2 className="text-base font-semibold text-[#242424]">Orang Tua</h2>
          <div className="relative" ref={parentDropdownRef}>
            <input
              value={selectedParent ? selectedParent.name : parentKeyword}
              onFocus={() => setIsParentDropdownOpen(true)}
              onChange={(event) => {
                setParentId('');
                setParentKeyword(event.target.value);
                setIsParentDropdownOpen(true);
              }}
              disabled={marriedPeopleQuery.isLoading || marriedPeopleQuery.isError}
              placeholder="Cari orang tua (menikah)"
              className="h-10 w-full rounded-lg border border-[#D9D9D9] px-3 text-sm outline-none focus:border-[#65587a] disabled:bg-[#F2F2F2]"
            />

            {isParentDropdownOpen ? (
              <div className="absolute z-20 mt-1 max-h-52 w-full overflow-auto rounded-lg border border-[#E0E0E0] bg-white shadow-sm">
                {filteredParentOptions.map((person: Person) => (
                  <button
                    type="button"
                    key={person.id}
                    onClick={() => {
                      setParentId(person.id);
                      setParentKeyword(person.name);
                      setIsParentDropdownOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-[#242424] hover:bg-[#F7F7F7]"
                  >
                    {person.name}
                  </button>
                ))}
                {!marriedPeopleQuery.isLoading && filteredParentOptions.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-[#8A8A8A]">Data tidak ditemukan.</p>
                ) : null}
              </div>
            ) : null}
          </div>
          {marriedPeopleQuery.isLoading ? (
            <p className="text-xs text-[#8A8A8A]">Memuat daftar orang tua...</p>
          ) : null}
          {marriedPeopleQuery.isError ? (
            <p className="text-xs text-red-500">Gagal memuat data orang tua.</p>
          ) : null}
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
            disabled={!isFormValid || addChildrenMutation.isPending}
            className="px-4 py-2 rounded-lg bg-[#65587a] text-white text-sm font-semibold disabled:opacity-50 active:scale-95 transition-transform"
          >
            {addChildrenMutation.isPending ? 'Menyimpan...' : 'Simpan'}
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
              queryScope="add-family-children-child"
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

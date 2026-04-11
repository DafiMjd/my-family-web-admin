'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  AddChildModal,
  type ChildListEntry,
} from '@/app/components/AddChildModal';
import { familyTreeService } from '@/services/family-tree.service';
import type { ParentPair } from '@/types/family-tree';

export default function AddFamilyChildrenPage() {
  const router = useRouter();
  const [parent, setParent] = useState<ParentPair | null>(null);
  const [parentKeyword, setParentKeyword] = useState('');
  const [isParentDropdownOpen, setIsParentDropdownOpen] = useState(false);
  const [children, setChildren] = useState<ChildListEntry[]>([]);
  const [editingChildIndex, setEditingChildIndex] = useState<number | null>(null);
  const [isChildModalOpen, setIsChildModalOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const parentDropdownRef = useRef<HTMLDivElement | null>(null);

  const marriedCouplesQuery = useQuery({
    queryKey: ['family-tree', 'married-couples', 'add-family-children-parent'],
    queryFn: familyTreeService.getMarriedCouples,
  });

  const parentOptions = useMemo(
    () =>
      (marriedCouplesQuery.data?.data ?? []).map((couple) => ({
        label: `${couple.father.name} & ${couple.mother.name}`,
        parent: {
          fatherId: couple.father.id,
          motherId: couple.mother.id,
        } satisfies ParentPair,
      })),
    [marriedCouplesQuery.data],
  );
  const selectedParent = useMemo(
    () =>
      parentOptions.find(
        (option) =>
          option.parent.fatherId === parent?.fatherId &&
          option.parent.motherId === parent?.motherId,
      ) ?? null,
    [parent, parentOptions],
  );
  const filteredParentOptions = useMemo(() => {
    const keyword = parentKeyword.trim().toLowerCase();
    if (!keyword) {
      return parentOptions;
    }
    return parentOptions.filter((option) => option.label.toLowerCase().includes(keyword));
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
        parent: parent!,
        children: children.map((entry) =>
          entry.kind === 'existing'
            ? { personId: entry.person.id }
            : {
                newPerson: {
                  name: entry.draft.name.trim(),
                  gender: entry.draft.gender,
                  birthDate: entry.draft.birthDate,
                  ...(entry.draft.deathDate ? { deathDate: entry.draft.deathDate } : {}),
                  ...(entry.draft.profilePictureUrl
                    ? { profilePictureUrl: entry.draft.profilePictureUrl }
                    : {}),
                },
              },
        ),
      }),
    onSuccess: () => {
      sessionStorage.setItem('dashboard_toast', 'children-added');
      router.push('/dashboard');
    },
    onError: () => {
      setSubmitError('Gagal menambahkan data anak. Silakan coba lagi.');
    },
  });

  const isFormValid = Boolean(parent) && children.length > 0;

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
              value={selectedParent ? selectedParent.label : parentKeyword}
              onFocus={() => setIsParentDropdownOpen(true)}
              onChange={(event) => {
                setParent(null);
                setParentKeyword(event.target.value);
                setIsParentDropdownOpen(true);
              }}
              disabled={marriedCouplesQuery.isLoading || marriedCouplesQuery.isError}
              placeholder="Cari orang tua (menikah)"
              className="h-10 w-full rounded-lg border border-[#D9D9D9] px-3 text-sm outline-none focus:border-[#65587a] disabled:bg-[#F2F2F2]"
            />

            {isParentDropdownOpen ? (
              <div className="absolute z-20 mt-1 max-h-52 w-full overflow-auto rounded-lg border border-[#E0E0E0] bg-white shadow-sm">
                {filteredParentOptions.map((option) => (
                  <button
                    type="button"
                    key={`${option.parent.fatherId}-${option.parent.motherId}`}
                    onClick={() => {
                      setParent(option.parent);
                      setParentKeyword(option.label);
                      setIsParentDropdownOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-[#242424] hover:bg-[#F7F7F7]"
                  >
                    {option.label}
                  </button>
                ))}
                {!marriedCouplesQuery.isLoading && filteredParentOptions.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-[#8A8A8A]">Data tidak ditemukan.</p>
                ) : null}
              </div>
            ) : null}
          </div>
          {marriedCouplesQuery.isLoading ? (
            <p className="text-xs text-[#8A8A8A]">Memuat daftar orang tua...</p>
          ) : null}
          {marriedCouplesQuery.isError ? (
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
              {children.map((entry, index) => {
                const label =
                  entry.kind === 'existing' ? entry.person.name : entry.draft.name;
                const gender = entry.kind === 'existing' ? entry.person.gender : entry.draft.gender;
                const birthDate =
                  entry.kind === 'existing' ? entry.person.birthDate.slice(0, 10) : entry.draft.birthDate;
                const sub = entry.kind === 'existing' ? 'Orang terdaftar' : 'Data baru';
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
            disabled={!isFormValid || addChildrenMutation.isPending}
            className="px-4 py-2 rounded-lg bg-[#65587a] text-white text-sm font-semibold disabled:opacity-50 active:scale-95 transition-transform"
          >
            {addChildrenMutation.isPending ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </form>

      <AddChildModal
        open={isChildModalOpen}
        queryKeyScope="add-family-children"
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

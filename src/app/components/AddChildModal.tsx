'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PersonFormFields, type PersonDraft } from '@/app/components/PersonFormFields';
import { familyTreeService } from '@/services/family-tree.service';
import type { Person } from '@/types/family-tree';

export type ChildListEntry =
  | { kind: 'existing'; person: Person }
  | { kind: 'new'; draft: PersonDraft };

function createEmptyPerson(gender: 'MAN' | 'WOMAN'): PersonDraft {
  return {
    parent: null,
    name: '',
    gender,
    birthDate: '',
    deathDate: '',
  };
}

interface AddChildModalProps {
  open: boolean;
  queryKeyScope: string;
  title: string;
  editingEntry: ChildListEntry | null;
  /** Person IDs already chosen as children (allows re-selecting the one being edited). */
  excludePersonIds?: string[];
  onClose: () => void;
  onSave: (entry: ChildListEntry) => void;
}

export function AddChildModal({
  open,
  queryKeyScope,
  title,
  editingEntry,
  excludePersonIds = [],
  onClose,
  onSave,
}: AddChildModalProps) {
  const [useExistingPerson, setUseExistingPerson] = useState(true);
  const [pickKeyword, setPickKeyword] = useState('');
  const [isPickOpen, setIsPickOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [childForm, setChildForm] = useState<PersonDraft>(createEmptyPerson('MAN'));
  const pickRef = useRef<HTMLDivElement | null>(null);

  const candidatesQuery = useQuery({
    queryKey: ['family-tree', 'children-candidate', queryKeyScope],
    queryFn: () => familyTreeService.getChildrenCandidates(100, 0),
    enabled: open,
  });

  const candidatePeople = candidatesQuery.data?.data ?? [];

  const filteredCandidates = useMemo(() => {
    const excluded = new Set(excludePersonIds);
    const bySearch = (list: Person[]) => {
      const keyword = pickKeyword.trim().toLowerCase();
      if (!keyword) {
        return list;
      }
      return list.filter((person) => person.name.toLowerCase().includes(keyword));
    };
    return bySearch(candidatePeople.filter((person) => !excluded.has(person.id)));
  }, [candidatePeople, pickKeyword, excludePersonIds]);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (editingEntry?.kind === 'existing') {
      setUseExistingPerson(true);
      setSelectedPerson(editingEntry.person);
      setPickKeyword(editingEntry.person.name);
      setChildForm(createEmptyPerson(editingEntry.person.gender));
      return;
    }

    if (editingEntry?.kind === 'new') {
      setUseExistingPerson(false);
      setSelectedPerson(null);
      setPickKeyword('');
      setChildForm(editingEntry.draft);
      return;
    }

    setUseExistingPerson(true);
    setSelectedPerson(null);
    setPickKeyword('');
    setChildForm(createEmptyPerson('MAN'));
  }, [open, editingEntry]);

  useEffect(() => {
    if (!isPickOpen) {
      return;
    }

    function handleClickOutside(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }
      if (!pickRef.current?.contains(target)) {
        setIsPickOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isPickOpen]);

  const isNewFormValid =
    childForm.name.trim().length > 0 && childForm.birthDate.trim().length > 0;
  const canSave = useExistingPerson ? Boolean(selectedPerson) : isNewFormValid;

  function handleSave() {
    if (!canSave) {
      return;
    }
    if (useExistingPerson && selectedPerson) {
      onSave({ kind: 'existing', person: selectedPerson });
      return;
    }
    if (!useExistingPerson) {
      onSave({ kind: 'new', draft: childForm });
    }
  }

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl min-h-[min(28rem,60dvh)] rounded-2xl bg-white p-4 md:p-5 flex flex-col gap-4 max-h-[90dvh] overflow-y-auto"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 className="text-base font-semibold text-[#242424]">{title}</h3>

        <div className="flex rounded-lg border border-[#E0E0E0] p-0.5 bg-[#F5F5F5]">
          <button
            type="button"
            onClick={() => {
              setUseExistingPerson(true);
              setIsPickOpen(false);
            }}
            className={`flex-1 rounded-md py-2 text-sm font-semibold transition-colors ${useExistingPerson ? 'bg-white text-[#242424] shadow-sm' : 'text-[#8A8A8A]'
              }`}
          >
            Orang terdaftar
          </button>
          <button
            type="button"
            onClick={() => {
              setUseExistingPerson(false);
              setIsPickOpen(false);
            }}
            className={`flex-1 rounded-md py-2 text-sm font-semibold transition-colors ${!useExistingPerson ? 'bg-white text-[#242424] shadow-sm' : 'text-[#8A8A8A]'
              }`}
          >
            Data baru
          </button>
        </div>

        {useExistingPerson ? (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-[#8A8A8A]">
              Hanya orang tanpa orang tua di pohon (sama dengan daftar kandidat anak di API).
            </p>
            <div className="relative" ref={pickRef}>
              <input
                value={selectedPerson ? selectedPerson.name : pickKeyword}
                onFocus={() => setIsPickOpen(true)}
                onChange={(event) => {
                  setSelectedPerson(null);
                  setPickKeyword(event.target.value);
                  setIsPickOpen(true);
                }}
                disabled={candidatesQuery.isLoading || candidatesQuery.isError}
                placeholder="Cari nama…"
                className="h-10 w-full rounded-lg border border-[#D9D9D9] px-3 text-sm outline-none focus:border-[#65587a] disabled:bg-[#F2F2F2]"
              />

              {isPickOpen ? (
                <div className="absolute z-20 mt-1 max-h-52 w-full overflow-auto rounded-lg border border-[#E0E0E0] bg-white shadow-sm">
                  {filteredCandidates.map((person) => (
                    <button
                      type="button"
                      key={person.id}
                      onClick={() => {
                        setSelectedPerson(person);
                        setPickKeyword(person.name);
                        setIsPickOpen(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-[#242424] hover:bg-[#F7F7F7]"
                    >
                      {person.name}
                    </button>
                  ))}
                  {!candidatesQuery.isLoading && filteredCandidates.length === 0 ? (
                    <p className="px-3 py-2 text-xs text-[#8A8A8A]">Data tidak ditemukan.</p>
                  ) : null}
                </div>
              ) : null}
            </div>
            {candidatesQuery.isLoading ? (
              <p className="text-xs text-[#8A8A8A]">Memuat daftar…</p>
            ) : null}
            {candidatesQuery.isError ? (
              <p className="text-xs text-red-500">Gagal memuat daftar orang.</p>
            ) : null}
          </div>
        ) : (
          <PersonFormFields
            value={childForm}
            onChange={setChildForm}
            parentEnabled={false}
            queryScope={`${queryKeyScope}-new-child`}
          />
        )}

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#F0F0F0] text-[#242424] text-sm font-semibold"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className="px-4 py-2 rounded-lg bg-[#65587a] text-white text-sm font-semibold disabled:opacity-50"
          >
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
}

export { createEmptyPerson };

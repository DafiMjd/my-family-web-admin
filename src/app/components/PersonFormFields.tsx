'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { familyTreeService } from '@/services/family-tree.service';
import type { Gender, ParentPair } from '@/types/family-tree';
import { ProfilePhotoDropzone } from '@/app/components/ProfilePhotoDropzone';

export interface PersonDraft {
  parent?: ParentPair | null;
  name: string;
  gender: Gender;
  birthDate: string;
  deathDate: string;
  /** Pending or permanent profile image URL from upload API; null = none */
  profilePictureUrl: string | null;
}

export function createEmptyPerson(gender: Gender): PersonDraft {
  return {
    parent: null,
    name: '',
    gender,
    birthDate: '',
    deathDate: '',
    profilePictureUrl: null,
  };
}

interface PersonFormFieldsProps {
  value: PersonDraft;
  onChange: (next: PersonDraft) => void;
  genderDisabled?: boolean;
  parentEnabled?: boolean;
  parentNote?: string;
  queryScope: string;
  /** When false, hides profile photo upload (default true). */
  profilePhotoEnabled?: boolean;
}

export function PersonFormFields({
  value,
  onChange,
  genderDisabled = false,
  parentEnabled = true,
  parentNote,
  queryScope,
  profilePhotoEnabled = true,
}: PersonFormFieldsProps) {
  const [parentKeyword, setParentKeyword] = useState('');
  const [debouncedParentKeyword, setDebouncedParentKeyword] = useState('');
  const [selectedParentLabel, setSelectedParentLabel] = useState<string | null>(null);
  const [isParentDropdownOpen, setIsParentDropdownOpen] = useState(false);
  const parentDropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedParentKeyword(parentKeyword);
    }, 500);

    return () => clearTimeout(timeout);
  }, [parentKeyword]);

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

  const parentQuery = useQuery({
    queryKey: ['family-tree', 'married-couples', queryScope],
    queryFn: familyTreeService.getMarriedCouples,
    enabled: parentEnabled,
  });

  const parentOptions = useMemo(
    () =>
      (parentQuery.data?.data ?? []).map((couple) => ({
        label: `${couple.father.name} & ${couple.mother.name}`,
        parent: {
          fatherId: couple.father.id,
          motherId: couple.mother.id,
        } satisfies ParentPair,
      })),
    [parentQuery.data],
  );

  useEffect(() => {
    if (!value.parent) {
      setSelectedParentLabel(null);
      return;
    }

    const selected = parentOptions.find(
      (option) =>
        option.parent.fatherId === value.parent?.fatherId &&
        option.parent.motherId === value.parent?.motherId,
    );
    setSelectedParentLabel(selected?.label ?? null);
  }, [parentOptions, value.parent]);

  const filteredParentOptions = useMemo(() => {
    const keyword = debouncedParentKeyword.trim().toLowerCase();
    if (!keyword) {
      return parentOptions;
    }

    return parentOptions.filter((option) => option.label.toLowerCase().includes(keyword));
  }, [debouncedParentKeyword, parentOptions]);

  return (
    <div className="flex flex-col gap-3">

      {parentEnabled ? (
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-[#242424]">Orang tua</span>
          <div className="relative" ref={parentDropdownRef}>
            <input
              value={selectedParentLabel ?? parentKeyword}
              onFocus={() => setIsParentDropdownOpen(true)}
              onChange={(event) => {
                setSelectedParentLabel(null);
                setParentKeyword(event.target.value);
                setIsParentDropdownOpen(true);
                onChange({ ...value, parent: null });
              }}
              className="h-10 w-full rounded-lg border border-[#D9D9D9] px-3 text-sm outline-none focus:border-[#65587a]"
              placeholder="Cari orang tua"
            />

            {isParentDropdownOpen ? (
              <div
                className="absolute z-20 mt-1 max-h-52 w-full overflow-auto rounded-lg border border-[#E0E0E0] bg-white shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => {
                    setSelectedParentLabel(null);
                    setParentKeyword('');
                    setIsParentDropdownOpen(false);
                    onChange({ ...value, parent: null });
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-[#606060] hover:bg-[#F7F7F7]"
                >
                  Tanpa orang tua
                </button>
                {filteredParentOptions.map((option) => (
                  <button
                    type="button"
                    key={`${option.parent.fatherId}-${option.parent.motherId}`}
                    onClick={() => {
                      setSelectedParentLabel(option.label);
                      setParentKeyword(option.label);
                      setIsParentDropdownOpen(false);
                      onChange({ ...value, parent: option.parent });
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-[#242424] hover:bg-[#F7F7F7]"
                  >
                    {option.label}
                  </button>
                ))}
                {!parentQuery.isLoading && filteredParentOptions.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-[#8A8A8A]">Data tidak ditemukan.</p>
                ) : null}
              </div>
            ) : null}
          </div>
          {parentNote ? <p className="text-xs text-[#8A8A8A]">{parentNote}</p> : null}
        </div>
      ) : null}

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-[#242424]">Name</span>
        <input
          value={value.name}
          onChange={(event) => onChange({ ...value, name: event.target.value })}
          className="h-10 rounded-lg border border-[#D9D9D9] px-3 text-sm outline-none focus:border-[#65587a]"
          placeholder="Masukkan nama"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-[#242424]">Jenis Kelamin</span>
        <select
          value={value.gender}
          disabled={genderDisabled}
          onChange={(event) => onChange({ ...value, gender: event.target.value as Gender })}
          className="h-10 rounded-lg border border-[#D9D9D9] px-3 text-sm outline-none focus:border-[#65587a] disabled:bg-[#F2F2F2]"
        >
          <option value="MAN">Laki-Laki</option>
          <option value="WOMAN">Perempuan</option>
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-[#242424]">Tanggal Lahir</span>
        <input
          type="date"
          value={value.birthDate}
          onChange={(event) => onChange({ ...value, birthDate: event.target.value })}
          className="h-10 rounded-lg border border-[#D9D9D9] px-3 text-sm outline-none focus:border-[#65587a]"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-[#242424]">Tanggal Meninggal</span>
        <input
          type="date"
          value={value.deathDate}
          onChange={(event) => onChange({ ...value, deathDate: event.target.value })}
          className="h-10 rounded-lg border border-[#D9D9D9] px-3 text-sm outline-none focus:border-[#65587a]"
        />
        <button
          type="button"
          onClick={() => onChange({ ...value, deathDate: '' })}
          className="self-start text-xs font-medium text-[#65587a] hover:underline"
        >
          Hapus tanggal meninggal
        </button>
      </label>


      {profilePhotoEnabled ? (
        <ProfilePhotoDropzone
          value={value.profilePictureUrl}
          onChange={(url) => onChange({ ...value, profilePictureUrl: url })}
        />
      ) : null}
    </div>
  );
}

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { personService } from '@/services/person.service';
import type { Gender, Person } from '@/types/family-tree';

const PAGE_SIZE = 10;

export interface PersonDraft {
  parentId?: string;
  name: string;
  gender: Gender;
  birthDate: string;
  deathDate: string;
}

interface PersonFormFieldsProps {
  value: PersonDraft;
  onChange: (next: PersonDraft) => void;
  genderDisabled?: boolean;
  parentEnabled?: boolean;
  parentNote?: string;
  queryScope: string;
}

export function PersonFormFields({
  value,
  onChange,
  genderDisabled = false,
  parentEnabled = true,
  parentNote,
  queryScope,
}: PersonFormFieldsProps) {
  const [parentKeyword, setParentKeyword] = useState('');
  const [debouncedParentKeyword, setDebouncedParentKeyword] = useState('');
  const [selectedParent, setSelectedParent] = useState<Person | null>(null);
  const [isParentDropdownOpen, setIsParentDropdownOpen] = useState(false);
  const parentDropdownRef = useRef<HTMLDivElement | null>(null);
  const parentListRef = useRef<HTMLDivElement | null>(null);

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

  const parentQuery = useInfiniteQuery({
    queryKey: ['person-list', 'dropdown', queryScope, debouncedParentKeyword],
    queryFn: ({ pageParam = 0 }) =>
      personService.getPersonList({
        limit: PAGE_SIZE,
        offset: pageParam,
        name: debouncedParentKeyword,
      }),
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.data.length < PAGE_SIZE) {
        return undefined;
      }
      return allPages.length * PAGE_SIZE;
    },
    initialPageParam: 0,
    enabled: parentEnabled,
  });

  const parentOptions = useMemo(() => {
    const merged = parentQuery.data?.pages.flatMap((page) => page.data) ?? [];
    const seen = new Set<string>();
    return merged.filter((person) => {
      if (seen.has(person.id)) {
        return false;
      }
      seen.add(person.id);
      return true;
    });
  }, [parentQuery.data]);

  return (
    <div className="flex flex-col gap-3">

      {parentEnabled ? (
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-[#242424]">Orang tua</span>
          <div className="relative" ref={parentDropdownRef}>
            <input
              value={selectedParent ? selectedParent.name : parentKeyword}
              onFocus={() => setIsParentDropdownOpen(true)}
              onChange={(event) => {
                setSelectedParent(null);
                setParentKeyword(event.target.value);
                setIsParentDropdownOpen(true);
                onChange({ ...value, parentId: undefined });
              }}
              className="h-10 w-full rounded-lg border border-[#D9D9D9] px-3 text-sm outline-none focus:border-[#65587a]"
              placeholder="Cari orang tua"
            />

            {isParentDropdownOpen ? (
              <div
                className="absolute z-20 mt-1 max-h-52 w-full overflow-auto rounded-lg border border-[#E0E0E0] bg-white shadow-sm"
                onScroll={(event) => {
                  const target = event.currentTarget;
                  const reachedBottom =
                    target.scrollHeight - target.scrollTop - target.clientHeight < 12;

                  if (reachedBottom && parentQuery.hasNextPage && !parentQuery.isFetchingNextPage) {
                    parentQuery.fetchNextPage();
                  }
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setSelectedParent(null);
                    setParentKeyword('');
                    setIsParentDropdownOpen(false);
                    onChange({ ...value, parentId: undefined });
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-[#606060] hover:bg-[#F7F7F7]"
                >
                  Tanpa orang tua
                </button>
                {parentOptions.map((person) => (
                  <button
                    type="button"
                    key={person.id}
                    onClick={() => {
                      setSelectedParent(person);
                      setParentKeyword(person.name);
                      setIsParentDropdownOpen(false);
                      onChange({ ...value, parentId: person.id });
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-[#242424] hover:bg-[#F7F7F7]"
                  >
                    {person.name}
                  </button>
                ))}
                {parentQuery.isFetchingNextPage ? (
                  <p className="px-3 py-2 text-xs text-[#8A8A8A]">Loading more...</p>
                ) : null}
                {!parentQuery.isLoading && parentOptions.length === 0 ? (
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
    </div>
  );
}

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useInfiniteQuery, useMutation } from '@tanstack/react-query';
import { PersonFormFields, type PersonDraft } from '@/app/components/PersonFormFields';
import { personService } from '@/services/person.service';
import type { Person } from '@/types/family-tree';

const PAGE_SIZE = 10;

function createEmptyPerson(gender: 'MAN' | 'WOMAN'): PersonDraft {
  return {
    parentId: undefined,
    name: '',
    gender,
    birthDate: '',
    deathDate: '',
  };
}

function PersonSearchSelect({
  gender,
  selected,
  onSelect,
}: {
  gender: 'MAN' | 'WOMAN';
  selected: Person | null;
  onSelect: (person: Person | null) => void;
}) {
  const [keyword, setKeyword] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const query = useInfiniteQuery({
    queryKey: ['person-list', 'marriage', gender, keyword],
    queryFn: ({ pageParam = 0 }) =>
      personService.getPersonList({
        gender,
        status: 'SINGLE',
        limit: PAGE_SIZE,
        offset: pageParam,
        name: keyword,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.data.length < PAGE_SIZE) {
        return undefined;
      }
      return allPages.length * PAGE_SIZE;
    },
  });

  const options = useMemo(() => {
    const merged = query.data?.pages.flatMap((page) => page.data) ?? [];
    const seen = new Set<string>();
    return merged.filter((item) => {
      if (seen.has(item.id)) {
        return false;
      }
      seen.add(item.id);
      return true;
    });
  }, [query.data]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleClickOutside(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }

      if (!dropdownRef.current?.contains(target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="flex flex-col gap-2">
      <div className="relative" ref={dropdownRef}>
        <input
          value={selected ? selected.name : keyword}
          onFocus={() => setIsOpen(true)}
          onChange={(event) => {
            onSelect(null);
            setKeyword(event.target.value);
            setIsOpen(true);
          }}
          className="h-10 w-full rounded-lg border border-[#D9D9D9] px-3 text-sm outline-none focus:border-[#65587a]"
          placeholder={gender === 'MAN' ? 'Cari suami' : 'Cari istri'}
        />

        {isOpen ? (
          <div
            className="absolute z-20 mt-1 max-h-52 w-full overflow-auto rounded-lg border border-[#E0E0E0] bg-white shadow-sm"
            onScroll={(event) => {
              const target = event.currentTarget;
              const reachedBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 12;
              if (reachedBottom && query.hasNextPage && !query.isFetchingNextPage) {
                query.fetchNextPage();
              }
            }}
          >
            {options.map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => {
                  onSelect(item);
                  setKeyword(item.name);
                  setIsOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-sm text-[#242424] hover:bg-[#F7F7F7]"
              >
                {item.name}
              </button>
            ))}
            {!query.isLoading && options.length === 0 ? (
              <p className="px-3 py-2 text-xs text-[#8A8A8A]">Data tidak ditemukan.</p>
            ) : null}
          </div>
        ) : null}
      </div>

      {selected ? (
        <div className="rounded-lg border border-[#E0E0E0] bg-[#FAFAFA] p-3">
          <p className="text-sm font-semibold text-[#242424]">{selected.name}</p>
          <p className="text-xs text-[#8A8A8A]">
            {selected.gender === 'MAN' ? 'Laki-Laki' : 'Perempuan'} - {selected.birthDate.slice(0, 10)}
          </p>
        </div>
      ) : null}
    </div>
  );
}

export default function MarriagePage() {
  const router = useRouter();
  const [startDate, setStartDate] = useState('');
  const [isNewHusband, setIsNewHusband] = useState(false);
  const [isNewWife, setIsNewWife] = useState(false);
  const [selectedHusband, setSelectedHusband] = useState<Person | null>(null);
  const [selectedWife, setSelectedWife] = useState<Person | null>(null);
  const [newHusband, setNewHusband] = useState<PersonDraft>(createEmptyPerson('MAN'));
  const [newWife, setNewWife] = useState<PersonDraft>(createEmptyPerson('WOMAN'));
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isHusbandValid = isNewHusband
    ? newHusband.name.trim().length > 0 && newHusband.birthDate.length > 0
    : Boolean(selectedHusband);
  const isWifeValid = isNewWife
    ? newWife.name.trim().length > 0 && newWife.birthDate.length > 0
    : Boolean(selectedWife);
  const isFormValid = isHusbandValid && isWifeValid;

  const createMarriageMutation = useMutation({
    mutationFn: () =>
      personService.createMarriage({
        person1: isNewHusband
          ? {
              newPerson: {
                parentId: newHusband.parentId,
                name: newHusband.name.trim(),
                gender: 'MAN',
                birthDate: newHusband.birthDate,
                deathDate: newHusband.deathDate || null,
              },
            }
          : { personId: selectedHusband?.id },
        person2: isNewWife
          ? {
              newPerson: {
                parentId: newWife.parentId,
                name: newWife.name.trim(),
                gender: 'WOMAN',
                birthDate: newWife.birthDate,
                deathDate: newWife.deathDate || null,
              },
            }
          : { personId: selectedWife?.id },
        ...(startDate ? { startDate } : {}),
      }),
    onSuccess: () => {
      sessionStorage.setItem('dashboard_toast', 'marriage-added');
      router.push('/dashboard');
    },
    onError: () => {
      setSubmitError('Gagal menambahkan data pernikahan. Silakan coba lagi.');
    },
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isFormValid || createMarriageMutation.isPending) {
      return;
    }

    setSubmitError(null);
    createMarriageMutation.mutate();
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
        <h1 className="text-lg font-semibold text-[#242424]">Tambah Pernikahan</h1>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-[#EAEAEA] p-4 flex flex-col gap-3">
            <h2 className="text-base font-semibold text-[#242424]">Suami</h2>
            {!isNewHusband ? (
              <PersonSearchSelect gender="MAN" selected={selectedHusband} onSelect={setSelectedHusband} />
            ) : (
              <PersonFormFields
                value={newHusband}
                onChange={(next) => setNewHusband({ ...next, gender: 'MAN' })}
                genderDisabled
                parentEnabled
                queryScope="marriage-new-husband"
              />
            )}
            <label className="flex items-center gap-2 text-sm text-[#242424]">
              <input
                type="checkbox"
                checked={isNewHusband}
                onChange={(event) => {
                  setIsNewHusband(event.target.checked);
                  setSelectedHusband(null);
                }}
              />
              Atau, Tambah orang baru
            </label>
          </div>

          <div className="rounded-xl border border-[#EAEAEA] p-4 flex flex-col gap-3">
            <h2 className="text-base font-semibold text-[#242424]">Istri</h2>
            {!isNewWife ? (
              <PersonSearchSelect gender="WOMAN" selected={selectedWife} onSelect={setSelectedWife} />
            ) : (
              <PersonFormFields
                value={newWife}
                onChange={(next) => setNewWife({ ...next, gender: 'WOMAN' })}
                genderDisabled
                parentEnabled
                queryScope="marriage-new-wife"
              />
            )}
            <label className="flex items-center gap-2 text-sm text-[#242424]">
              <input
                type="checkbox"
                checked={isNewWife}
                onChange={(event) => {
                  setIsNewWife(event.target.checked);
                  setSelectedWife(null);
                }}
              />
              Atau, Tambah orang baru
            </label>
          </div>
        </section>

        <label className="flex flex-col gap-1 max-w-sm">
          <span className="text-sm font-medium text-[#242424]">Tanggal Pernikahan (opsional)</span>
          <input
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            className="h-10 rounded-lg border border-[#D9D9D9] px-3 text-sm outline-none focus:border-[#65587a]"
          />
        </label>

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
            disabled={!isFormValid || createMarriageMutation.isPending}
            className="px-4 py-2 rounded-lg bg-[#65587a] text-white text-sm font-semibold disabled:opacity-50 active:scale-95 transition-transform"
          >
            {createMarriageMutation.isPending ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </form>
    </main>
  );
}

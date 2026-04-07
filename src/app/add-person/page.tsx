'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useInfiniteQuery, useMutation } from '@tanstack/react-query';
import { personService } from '@/services/person.service';
import type { Person } from '@/types/family-tree';

const PAGE_SIZE = 10;

export default function AddPersonPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'MAN' | 'WOMAN'>('MAN');
  const [birthDate, setBirthDate] = useState('');
  const [deathDate, setDeathDate] = useState('');
  const [parentKeyword, setParentKeyword] = useState('');
  const [selectedParent, setSelectedParent] = useState<Person | null>(null);
  const [isParentDropdownOpen, setIsParentDropdownOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const parentQuery = useInfiniteQuery({
    queryKey: ['person-list', 'dropdown', parentKeyword],
    queryFn: ({ pageParam = 0 }) =>
      personService.getPersonList({
        limit: PAGE_SIZE,
        offset: pageParam,
        name: parentKeyword,
      }),
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.data.length < PAGE_SIZE) {
        return undefined;
      }
      return allPages.length * PAGE_SIZE;
    },
    initialPageParam: 0,
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

  const createPersonMutation = useMutation({
    mutationFn: () =>
      personService.createPerson({
        parentId: selectedParent?.id,
        name: name.trim(),
        gender,
        birthDate,
        deathDate: deathDate || null,
      }),
    onSuccess: () => {
      sessionStorage.setItem('dashboard_toast', 'person-added');
      router.push('/dashboard');
    },
    onError: () => {
      setSubmitError('Gagal menambahkan data orang. Silakan coba lagi.');
    },
  });

  const isFormValid = name.trim().length > 0 && birthDate.length > 0;

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

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-[#242424]">Name</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="h-10 rounded-lg border border-[#D9D9D9] px-3 text-sm outline-none focus:border-[#65587a]"
            placeholder="Masukkan nama"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-[#242424]">Jenis Kelamin</span>
          <select
            value={gender}
            onChange={(event) => setGender(event.target.value as 'MAN' | 'WOMAN')}
            className="h-10 rounded-lg border border-[#D9D9D9] px-3 text-sm outline-none focus:border-[#65587a]"
          >
            <option value="MAN">Laki-Laki</option>
            <option value="WOMAN">Perempuan</option>
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-[#242424]">Tanggal Lahir</span>
          <input
            type="date"
            value={birthDate}
            onChange={(event) => setBirthDate(event.target.value)}
            className="h-10 rounded-lg border border-[#D9D9D9] px-3 text-sm outline-none focus:border-[#65587a]"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-[#242424]">Tanggal Meninggal</span>
          <input
            type="date"
            value={deathDate}
            onChange={(event) => setDeathDate(event.target.value)}
            className="h-10 rounded-lg border border-[#D9D9D9] px-3 text-sm outline-none focus:border-[#65587a]"
          />
        </label>

        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-[#242424]">Orang tua</span>
          <div className="relative">
            <input
              value={selectedParent ? selectedParent.name : parentKeyword}
              onFocus={() => setIsParentDropdownOpen(true)}
              onChange={(event) => {
                setSelectedParent(null);
                setParentKeyword(event.target.value);
                setIsParentDropdownOpen(true);
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
          <p className="text-xs text-[#8A8A8A]">
            Jika orang tua kosong, maka orang ini akan menjadi generasi pertama (tampil paling awal
            di pohon keluarga).
          </p>
        </div>

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

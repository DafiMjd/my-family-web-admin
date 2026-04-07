'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { clearTokens, hasToken } from '@/lib/auth-storage';
import { LogoutConfirmModal } from '@/app/components/LogoutConfirmModal';
import { MainHeaderActions } from '@/app/components/MainHeaderActions';
import { PageHeader } from '@/app/components/PageHeader';
import { usePersonList } from '@/hooks/use-person-list';
import { useFamilyRoots } from '@/hooks/use-family-roots';
import type { Person } from '@/types/family-tree';
import { Avatar } from '@/app/components/Avatar';
import { personService } from '@/services/person.service';

const PAGE_SIZE_OPTIONS = [10, 30, 50, 100] as const;

const PEOPLE_FILTERS_STORAGE_KEY = 'people_list_filters';

interface PeopleFiltersSnapshot {
  name: string;
  debouncedName: string;
  gender: '' | 'MAN' | 'WOMAN';
  status: '' | 'SINGLE' | 'MARRIED';
  firstGenOnly: boolean;
  limit: (typeof PAGE_SIZE_OPTIONS)[number];
  page: number;
}

function parsePeopleFiltersFromSessionStorage(): PeopleFiltersSnapshot | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = sessionStorage.getItem(PEOPLE_FILTERS_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<PeopleFiltersSnapshot>;

    const limitRaw = Number(parsed.limit);
    const limit = PAGE_SIZE_OPTIONS.includes(limitRaw as (typeof PAGE_SIZE_OPTIONS)[number])
      ? (limitRaw as (typeof PAGE_SIZE_OPTIONS)[number])
      : 10;

    const gender =
      parsed.gender === 'MAN' || parsed.gender === 'WOMAN' ? parsed.gender : '';
    const status =
      parsed.status === 'SINGLE' || parsed.status === 'MARRIED' ? parsed.status : '';

    const name = typeof parsed.name === 'string' ? parsed.name : '';
    const debouncedName =
      typeof parsed.debouncedName === 'string' ? parsed.debouncedName : name;

    return {
      name,
      debouncedName,
      gender,
      status,
      firstGenOnly: Boolean(parsed.firstGenOnly),
      limit,
      page: typeof parsed.page === 'number' && parsed.page >= 1 ? Math.floor(parsed.page) : 1,
    };
  } catch {
    return null;
  }
}

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 21h4.5L19 9.5 14.5 5 3 16.5V21Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M13.5 6 18 10.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 7h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path
        d="M10 3h4M6 7l1 13h10l1-13"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function GenderBadge({ gender }: { gender: 'MAN' | 'WOMAN' }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${gender === 'MAN'
        ? 'bg-blue-100 text-blue-700'
        : 'bg-pink-100 text-pink-700'
        }`}
    >
      {gender === 'MAN' ? 'Laki-laki' : 'Perempuan'}
    </span>
  );
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function flattenRootsToPeople(roots: { father: Person | null; mother: Person | null }[]): Person[] {
  const seen = new Set<string>();
  const people: Person[] = [];
  for (const root of roots) {
    for (const person of [root.father, root.mother]) {
      if (person && !seen.has(person.id)) {
        seen.add(person.id);
        people.push(person);
      }
    }
  }
  return people;
}

export default function PeoplePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const initialFiltersRef = useRef<PeopleFiltersSnapshot | null | undefined>(undefined);
  if (initialFiltersRef.current === undefined) {
    initialFiltersRef.current = parsePeopleFiltersFromSessionStorage();
  }
  const initialFilters = initialFiltersRef.current;

  const [limit, setLimit] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>(
    () => initialFilters?.limit ?? 10,
  );
  const [page, setPage] = useState(() => initialFilters?.page ?? 1);
  const [name, setName] = useState(() => initialFilters?.name ?? '');
  const [debouncedName, setDebouncedName] = useState(
    () => initialFilters?.debouncedName ?? initialFilters?.name ?? '',
  );
  const [gender, setGender] = useState<'MAN' | 'WOMAN' | ''>(() => initialFilters?.gender ?? '');
  const [status, setStatus] = useState<'SINGLE' | 'MARRIED' | ''>(() => initialFilters?.status ?? '');
  const [firstGenOnly, setFirstGenOnly] = useState(() => initialFilters?.firstGenOnly ?? false);
  const skipPageResetOnNextNameDebounceRef = useRef(Boolean(initialFilters));
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDeletePerson, setSelectedDeletePerson] = useState<Person | null>(null);
  const [deleteSpouse, setDeleteSpouse] = useState(false);
  const [deleteChildren, setDeleteChildren] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    if (!sessionStorage.getItem(PEOPLE_FILTERS_STORAGE_KEY)) {
      return;
    }
    sessionStorage.removeItem(PEOPLE_FILTERS_STORAGE_KEY);
  }, []);

  const offset = (page - 1) * limit;

  useEffect(() => {
    if (!hasToken()) {
      router.replace('/login');
    }
  }, [router]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedName(name);
      if (skipPageResetOnNextNameDebounceRef.current) {
        skipPageResetOnNextNameDebounceRef.current = false;
      } else {
        setPage(1);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [name]);

  useEffect(() => {
    const toast = sessionStorage.getItem('people_toast');
    if (!toast) {
      return;
    }

    if (toast === 'person-updated') {
      setToastMessage('Data orang berhasil diperbarui.');
      queryClient.invalidateQueries({ queryKey: ['person', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['family-tree', 'roots'] });
    }
    if (toast === 'person-deleted') {
      setToastMessage('Data orang berhasil dihapus.');
      queryClient.invalidateQueries({ queryKey: ['person', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['family-tree', 'roots'] });
    }

    setShowSuccessToast(true);
    const timeout = setTimeout(() => {
      setShowSuccessToast(false);
      sessionStorage.removeItem('people_toast');
    }, 1200);

    return () => clearTimeout(timeout);
  }, [queryClient]);

  const personList = usePersonList({
    limit,
    offset,
    name: debouncedName || undefined,
    gender: gender || undefined,
    status: status || undefined,
  });

  const rootsQuery = useFamilyRoots();

  const deletePersonMutation = useMutation({
    mutationFn: () => {
      if (!selectedDeletePerson) {
        throw new Error('No selected person');
      }
      return personService.deletePerson({
        id: selectedDeletePerson.id,
        deleteSpouse,
        deleteChildren,
      });
    },
    onSuccess: () => {
      setIsDeleteModalOpen(false);
      setSelectedDeletePerson(null);
      setDeleteSpouse(false);
      setDeleteChildren(false);
      sessionStorage.setItem('people_toast', 'person-deleted');
      queryClient.invalidateQueries({ queryKey: ['person', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['family-tree', 'roots'] });
      setToastMessage('Data orang berhasil dihapus.');
      setShowSuccessToast(true);
      setTimeout(() => {
        setShowSuccessToast(false);
        sessionStorage.removeItem('people_toast');
      }, 1200);
    },
  });

  const isLoading = firstGenOnly ? rootsQuery.isLoading : personList.isLoading;
  const isError = firstGenOnly ? rootsQuery.isError : personList.isError;

  const people: Person[] = firstGenOnly
    ? flattenRootsToPeople(rootsQuery.data?.data ?? [])
    : (personList.data?.data ?? []);

  const total = firstGenOnly ? people.length : (personList.data?.total ?? 0);
  const totalPages = firstGenOnly ? 1 : Math.max(1, Math.ceil(total / limit));

  function handleLimitChange(newLimit: (typeof PAGE_SIZE_OPTIONS)[number]) {
    setLimit(newLimit);
    setPage(1);
  }

  function handleGenderChange(value: 'MAN' | 'WOMAN' | '') {
    setGender(value);
    setPage(1);
  }

  function handleStatusChange(value: 'SINGLE' | 'MARRIED' | '') {
    setStatus(value);
    setPage(1);
  }

  function handleFirstGenToggle() {
    setFirstGenOnly((prev) => !prev);
    setPage(1);
  }

  function handleLogout() {
    setIsLogoutModalOpen(true);
  }

  function handleConfirmLogout() {
    clearTokens();
    router.replace('/login');
  }

  function handleOpenAddRoute(path: '/add-person' | '/add-family' | '/marriage' | '/add-family-children') {
    router.push(path);
  }

  function handleOpenEditPerson(personId: string) {
    const snapshot: PeopleFiltersSnapshot = {
      name,
      debouncedName,
      gender,
      status,
      firstGenOnly,
      limit,
      page,
    };
    sessionStorage.setItem(PEOPLE_FILTERS_STORAGE_KEY, JSON.stringify(snapshot));
    router.push(`/edit-person?id=${encodeURIComponent(personId)}`);
  }

  function handleOpenDeleteModal(person: Person) {
    setSelectedDeletePerson(person);
    setDeleteSpouse(false);
    setDeleteChildren(false);
    setIsDeleteModalOpen(true);
  }

  function handleCloseDeleteModal() {
    if (deletePersonMutation.isPending) {
      return;
    }
    setIsDeleteModalOpen(false);
    setSelectedDeletePerson(null);
    setDeleteSpouse(false);
    setDeleteChildren(false);
  }

  function handleConfirmDelete() {
    if (deletePersonMutation.isPending || !selectedDeletePerson) {
      return;
    }
    deletePersonMutation.mutate();
  }

  const startEntry = total === 0 ? 0 : offset + 1;
  const endEntry = firstGenOnly ? people.length : Math.min(offset + limit, total);

  return (
    <div className="flex flex-col flex-1">
      {showSuccessToast ? (
        <div className="fixed top-4 right-4 z-50 rounded-lg bg-[#2E7D32] px-4 py-2 text-sm font-semibold text-white shadow-md">
          {toastMessage}
        </div>
      ) : null}

      <PageHeader
        title="List Orang"
        rightContent={<MainHeaderActions onOpenAddRoute={handleOpenAddRoute} onLogout={handleLogout} />}
      />

      <main className="flex-1 px-6 py-6 flex flex-col gap-4">
        {/* Filters */}
        <div className="bg-white rounded-xl border border-[#E0E0E0] p-4 flex flex-wrap items-end gap-3">
          {/* Name search */}
          <div className="flex flex-col gap-1 min-w-[180px]">
            <label className="text-xs font-medium text-[#606060]">Cari Nama</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={firstGenOnly}
              placeholder="Ketik nama..."
              className="h-9 px-3 rounded-lg border border-[#E0E0E0] text-sm text-[#242424] placeholder:text-[#BDBDBD] bg-white focus:outline-none focus:ring-2 focus:ring-[#65587a]/30 focus:border-[#65587a] disabled:opacity-40 disabled:cursor-not-allowed transition"
            />
          </div>

          {/* Gender filter */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-[#606060]">Jenis Kelamin</label>
            <select
              value={gender}
              onChange={(e) => handleGenderChange(e.target.value as 'MAN' | 'WOMAN' | '')}
              disabled={firstGenOnly}
              className="h-9 px-3 rounded-lg border border-[#E0E0E0] text-sm text-[#242424] bg-white focus:outline-none focus:ring-2 focus:ring-[#65587a]/30 focus:border-[#65587a] disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <option value="">Semua</option>
              <option value="MAN">Laki-laki</option>
              <option value="WOMAN">Perempuan</option>
            </select>
          </div>

          {/* Status filter */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-[#606060]">Status</label>
            <select
              value={status}
              onChange={(e) => handleStatusChange(e.target.value as 'SINGLE' | 'MARRIED' | '')}
              disabled={firstGenOnly}
              className="h-9 px-3 rounded-lg border border-[#E0E0E0] text-sm text-[#242424] bg-white focus:outline-none focus:ring-2 focus:ring-[#65587a]/30 focus:border-[#65587a] disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <option value="">Semua</option>
              <option value="SINGLE">Belum Menikah</option>
              <option value="MARRIED">Menikah</option>
            </select>
          </div>

          {/* First generation toggle */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-[#606060]">Generasi Pertama</label>
            <button
              type="button"
              onClick={handleFirstGenToggle}
              className={`h-9 px-4 rounded-lg border text-sm font-medium transition-colors ${firstGenOnly
                ? 'bg-[#65587a] text-white border-[#65587a]'
                : 'bg-white text-[#606060] border-[#E0E0E0] hover:bg-[#F5F5F5]'
                }`}
            >
              {firstGenOnly ? 'Aktif' : 'Nonaktif'}
            </button>
          </div>

          {/* Page size */}
          <div className="flex flex-col gap-1 ml-auto">
            <label className="text-xs font-medium text-[#606060]">Data per halaman</label>
            <select
              value={limit}
              onChange={(e) =>
                handleLimitChange(Number(e.target.value) as (typeof PAGE_SIZE_OPTIONS)[number])
              }
              disabled={firstGenOnly}
              className="h-9 px-3 rounded-lg border border-[#E0E0E0] text-sm text-[#242424] bg-white focus:outline-none focus:ring-2 focus:ring-[#65587a]/30 focus:border-[#65587a] disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-[#E0E0E0] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E0E0E0] bg-[#FAFAFA]">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#909090] w-12">#</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#909090]">Foto</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#909090]">Nama</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#909090]">
                    Jenis Kelamin
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#909090]">
                    Tanggal Lahir
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#909090]">
                    Tanggal Wafat
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#909090]">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-[#909090]">
                      Memuat data...
                    </td>
                  </tr>
                ) : isError ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-red-500">
                      Gagal memuat data. Silakan coba lagi.
                    </td>
                  </tr>
                ) : people.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-[#909090]">
                      Tidak ada data ditemukan.
                    </td>
                  </tr>
                ) : (
                  people.map((person, index) => (
                    <tr
                      key={person.id}
                      className="border-b border-[#F0F0F0] last:border-0 hover:bg-[#FAFAFA] transition-colors"
                    >
                      <td className="px-4 py-3 text-[#909090]">
                        {firstGenOnly ? index + 1 : offset + index + 1}
                      </td>
                      <td className="px-4 py-3">
                        <Avatar member={person} size={12} />
                      </td>
                      <td className="px-4 py-3 font-medium text-[#242424]">{person.name}</td>
                      <td className="px-4 py-3">
                        <GenderBadge gender={person.gender} />
                      </td>
                      <td className="px-4 py-3 text-[#606060]">{formatDate(person.birthDate)}</td>
                      <td className="px-4 py-3 text-[#606060]">{formatDate(person.deathDate)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {/* <button
                            type="button"
                            title="Lihat detail"
                            aria-label="Lihat detail"
                            className="h-8 w-8 rounded-lg border border-[#E0E0E0] text-[#606060] hover:bg-[#F5F5F5] transition inline-flex items-center justify-center"
                          >
                            <EyeIcon />
                          </button> */}
                          <button
                            type="button"
                            title="Edit data"
                            onClick={() => handleOpenEditPerson(person.id)}
                            aria-label="Edit data"
                            className="h-8 w-8 rounded-lg border border-[#E0E0E0] text-[#65587a] hover:bg-[#F5F5F5] transition inline-flex items-center justify-center"
                          >
                            <PencilIcon />
                          </button>
                          <button
                            type="button"
                            title="Hapus data"
                            aria-label="Hapus data"
                            onClick={() => handleOpenDeleteModal(person)}
                            className="h-8 w-8 rounded-lg border border-[#E0E0E0] text-[#D14343] hover:bg-[#F5F5F5] transition inline-flex items-center justify-center"
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {!firstGenOnly && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#909090]">
              {total === 0
                ? 'Tidak ada data'
                : `Menampilkan ${startEntry}–${endEntry} dari ${total} data`}
            </p>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || isLoading}
                className="h-8 w-8 flex items-center justify-center rounded-lg border border-[#E0E0E0] text-[#606060] hover:bg-[#F5F5F5] disabled:opacity-40 disabled:cursor-not-allowed transition text-sm"
              >
                ‹
              </button>

              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 7) {
                  pageNum = i + 1;
                } else if (page <= 4) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 3) {
                  pageNum = totalPages - 6 + i;
                } else {
                  pageNum = page - 3 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    disabled={isLoading}
                    className={`h-8 w-8 flex items-center justify-center rounded-lg text-sm transition ${page === pageNum
                      ? 'bg-[#65587a] text-white font-semibold'
                      : 'border border-[#E0E0E0] text-[#606060] hover:bg-[#F5F5F5]'
                      } disabled:cursor-not-allowed`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || isLoading}
                className="h-8 w-8 flex items-center justify-center rounded-lg border border-[#E0E0E0] text-[#606060] hover:bg-[#F5F5F5] disabled:opacity-40 disabled:cursor-not-allowed transition text-sm"
              >
                ›
              </button>
            </div>
          </div>
        )}
      </main>

      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleConfirmLogout}
      />

      {isDeleteModalOpen ? (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={handleCloseDeleteModal}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-4 flex flex-col gap-4"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="text-base font-semibold text-[#242424]">
              Apakah anda yakin akan menghapus data orang ini?
            </h2>

            <label className="flex items-start gap-2 text-sm text-[#606060]">
              <input
                type="checkbox"
                checked={deleteSpouse}
                onChange={(event) => setDeleteSpouse(event.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-[#D9D9D9]"
                disabled={deletePersonMutation.isPending}
              />
              <span>hapus juga pasangan orang ini</span>
            </label>

            <label className="flex items-start gap-2 text-sm text-[#606060]">
              <input
                type="checkbox"
                checked={deleteChildren}
                onChange={(event) => setDeleteChildren(event.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-[#D9D9D9]"
                disabled={deletePersonMutation.isPending}
              />
              <span>hapus juga anak-anak orang ini</span>
            </label>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={handleConfirmDelete}
                disabled={deletePersonMutation.isPending}
                className="px-4 py-2 rounded-lg bg-[#D14343] text-white text-sm font-semibold active:scale-95 transition-transform disabled:opacity-50"
              >
                {deletePersonMutation.isPending ? 'Menghapus...' : 'Hapus'}
              </button>
              <button
                onClick={handleCloseDeleteModal}
                disabled={deletePersonMutation.isPending}
                className="px-4 py-2 rounded-lg bg-[#F0F0F0] text-[#242424] text-sm font-semibold active:scale-95 transition-transform disabled:opacity-50"
              >
                Batalkan
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

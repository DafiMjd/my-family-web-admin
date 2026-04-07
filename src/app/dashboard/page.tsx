'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { clearTokens, hasToken } from '@/lib/auth-storage';
import { FamilyRootCard } from '@/app/components/FamilyRootCard';
import { useFamilyChildren } from '@/hooks/use-family-children';
import { useFamilyRoots } from '@/hooks/use-family-roots';
import type { Person, PersonWithSpouse } from '@/types/family-tree';

function toCardPeople(child: PersonWithSpouse): Person[] {
  return child.spouse ? [child, child.spouse] : [child];
}

function FamilyBranch({
  personId,
  depth = 1,
}: {
  personId: string;
  depth?: number;
}) {
  const [openedChildren, setOpenedChildren] = useState<Record<string, boolean>>({});
  const { data, isLoading, isError } = useFamilyChildren(personId, true);
  const children = data?.data ?? [];

  const visibleChildren = useMemo(
    () => children.filter((child) => toCardPeople(child).length > 0),
    [children],
  );

  if (isLoading) {
    return <p className="text-sm text-[#909090] font-sora">Loading children...</p>;
  }

  if (isError) {
    return <p className="text-sm text-red-500 font-sora">Failed to load children.</p>;
  }

  if (visibleChildren.length === 0) {
    return null;
  }

  function handleTapChild(person: Person, people: Person[]) {
    if (people.length > 1) {
      const father = people.find((item) => item.gender === 'MAN');
      if (!father) {
        return;
      }

      setOpenedChildren((prev) => ({
        ...prev,
        [father.id]: !prev[father.id],
      }));
      return;
    }

    setOpenedChildren((prev) => ({
      ...prev,
      [person.id]: !prev[person.id],
    }));
  }

  return (
    <div className="flex flex-col">
      {visibleChildren.map((child, index) => {
        const people = toCardPeople(child);
        const father = people.find((item) => item.gender === 'MAN');
        const mother = people.find((item) => item.gender === 'WOMAN');
        const nodeId = father?.id ?? father?.id ?? people[0]?.id ?? child.id;
        const isOpen = Boolean(openedChildren[nodeId]);
        const isFirst = index === 0;
        const isLast = index === visibleChildren.length - 1;

        return (
          <div key={`${child.id}-${depth}`} className="relative">
            <div className="flex items-stretch gap-4">
              <div className="relative self-stretch pl-4 pt-2">
                {index === 0 ? (
                  <div className="absolute left-[-16px] top-8 h-px w-4 bg-[#D8D8D8]" />
                ) : null}
                {visibleChildren.length > 1 ? (
                  <div
                    className={`absolute left-0 w-px bg-[#D8D8D8] ${isFirst ? 'top-8 bottom-0' : isLast ? 'top-0 h-8' : 'top-0 bottom-0'
                      }`}
                  />
                ) : null}

                <div className="absolute left-0 top-8 h-px w-4 bg-[#D8D8D8]" />
                <FamilyRootCard people={people} isTappable onTap={handleTapChild} />
              </div>

              {isOpen ? (
                <div className="pt-2">
                  <FamilyBranch personId={nodeId} depth={depth + 1} />
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { data, isLoading, isError } = useFamilyRoots();
  const [openedRoots, setOpenedRoots] = useState<Record<string, boolean>>({});
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);

  useEffect(() => {
    if (!hasToken()) {
      router.replace('/login');
    }
  }, [router]);

  function handleLogout() {
    setIsLogoutModalOpen(true);
  }

  function handleConfirmLogout() {
    clearTokens();
    router.replace('/login');
  }

  function handleTapRoot(person: Person, people: Person[]) {
    if (people.length > 1) {
      const father = people.find((item) => item.gender === 'MAN');
      if (!father) {
        return;
      }

      setOpenedRoots((prev) => ({
        ...prev,
        [father.id]: !prev[father.id],
      }));
      return;
    }

    setOpenedRoots((prev) => ({
      ...prev,
      [person.id]: !prev[person.id],
    }));
  }

  function handleOpenAddRoute(path: '/add-person' | '/add-family' | '/marriage') {
    setIsAddMenuOpen(false);
    router.push(path);
  }

  return (
    <div className="min-h-dvh flex flex-col bg-[#F5F5F5]">
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-[#E0E0E0] shadow-sm">
        <span className="text-base font-semibold text-[#242424]">Family Tree Admin</span>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setIsAddMenuOpen((prev) => !prev)}
              className="px-4 py-2 rounded-lg bg-[#65587a] text-white text-sm font-semibold active:scale-95 transition-transform"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">Tambah Data</span>
                <Image src="/ic_plus.svg" alt="" width={16} height={16} />
              </div>
            </button>

            {isAddMenuOpen ? (
              <div className="absolute right-0 mt-2 w-48 rounded-lg border border-[#E0E0E0] bg-white shadow-md overflow-hidden z-10">
                <button
                  onClick={() => handleOpenAddRoute('/add-person')}
                  className="w-full px-3 py-2 text-left text-sm text-[#242424] hover:bg-[#F5F5F5]"
                >
                  Tambah Orang
                </button>
                <button
                  onClick={() => handleOpenAddRoute('/add-family')}
                  className="w-full px-3 py-2 text-left text-sm text-[#242424] hover:bg-[#F5F5F5]"
                >
                  Tambah Keluarga
                </button>
                <button
                  onClick={() => handleOpenAddRoute('/marriage')}
                  className="w-full px-3 py-2 text-left text-sm text-[#242424] hover:bg-[#F5F5F5]"
                >
                  Tambah Pernikahan
                </button>
              </div>
            ) : null}
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-lg bg-[#242424] text-white text-sm font-semibold active:scale-95 transition-transform"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="flex flex-1 items-start justify-start overflow-auto">
        <section className="w-full px-6 pt-6 pb-6">
          <h1 className="text-lg font-semibold text-[#242424]">Family Tree</h1>

          <div className="mt-4 flex flex-col gap-3 min-w-max">
            {isLoading ? (
              <p className="text-sm text-[#909090] font-sora">Loading first generation...</p>
            ) : null}

            {isError ? (
              <p className="text-sm text-red-500 font-sora">Failed to load first generation.</p>
            ) : null}

            {!isLoading && !isError && data?.data.length === 0 ? (
              <p className="text-sm text-[#909090] font-sora">No first generation data found.</p>
            ) : null}

            {!isLoading && !isError
              ? data?.data.map((root, index) => {
                const people = [root.father, root.mother].filter(
                  (person): person is Person => person !== null,
                );
                const father = people.find((person) => person.gender === 'MAN');
                const rootId = father?.id ?? people[0]?.id ?? `${index}`;
                const isOpen = Boolean(openedRoots[rootId]);

                return (
                  <div
                    key={`${root.father?.id ?? 'no-father'}-${root.mother?.id ?? 'no-mother'}-${index}`}
                    className="relative"
                  >
                    <div className="flex items-start">
                      <FamilyRootCard people={people} isTappable onTap={handleTapRoot} />

                      {isOpen ? (
                        <div className="relative pl-4 pt-2">
                          <FamilyBranch personId={rootId} />
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })
              : null}
          </div>
        </section>
      </main>

      {isLogoutModalOpen ? (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => setIsLogoutModalOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-4 flex flex-col gap-4"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="text-base font-semibold text-[#242424]">Konfirmasi Logout</h2>
            <p className="text-sm text-[#606060]">Apakah kamu yakin ingin logout?</p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setIsLogoutModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-[#F0F0F0] text-[#242424] text-sm font-semibold active:scale-95 transition-transform"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmLogout}
                className="px-4 py-2 rounded-lg bg-[#242424] text-white text-sm font-semibold active:scale-95 transition-transform"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

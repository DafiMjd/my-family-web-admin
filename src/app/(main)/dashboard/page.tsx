'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { clearTokens, hasToken } from '@/lib/auth-storage';
import { FamilyRootCard } from '@/app/components/FamilyRootCard';
import { LogoutConfirmModal } from '@/app/components/LogoutConfirmModal';
import { MainHeaderActions } from '@/app/components/MainHeaderActions';
import { PageHeader } from '@/app/components/PageHeader';
import { useFamilyChildren } from '@/hooks/use-family-children';
import { useFamilyRoots } from '@/hooks/use-family-roots';
import type { Person, PersonWithSpouse } from '@/types/family-tree';

function toCardPeople(child: PersonWithSpouse): Person[] {
  return child.spouse ? [child, child.spouse] : [child];
}

function FamilyBranch({
  fatherId,
  motherId,
  depth = 1,
}: {
  fatherId?: string | null;
  motherId?: string | null;
  depth?: number;
}) {
  const [openedChildren, setOpenedChildren] = useState<Record<string, boolean>>({});
  const parentQuery = useMemo(() => {
    const q: { fatherId?: string; motherId?: string } = {};
    if (fatherId) q.fatherId = fatherId;
    if (motherId) q.motherId = motherId;
    return q;
  }, [fatherId, motherId]);
  const { data, isLoading, isError } = useFamilyChildren(parentQuery, true);
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

  return (
    <div className="flex flex-col">
      {visibleChildren.map((child, index) => {
        const people = toCardPeople(child);
        const father = people.find((item) => item.gender === 'MAN');
        const mother = people.find((item) => item.gender === 'WOMAN');
        const branchKey = `${child.id}-${child.spouse?.id ?? 'no-spouse'}-${depth}`;
        const isOpen = Boolean(openedChildren[branchKey]);
        const isFirst = index === 0;
        const isLast = index === visibleChildren.length - 1;

        return (
          <div key={branchKey} className="relative">
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
                <FamilyRootCard
                  people={people}
                  endMarriageDate={child.endMarriageDate}
                  isTappable
                  onTap={(_person, _people) => {
                    setOpenedChildren((prev) => ({
                      ...prev,
                      [branchKey]: !prev[branchKey],
                    }));
                  }}
                />
              </div>

              {isOpen ? (
                <div className="pt-2">
                  {father || mother ? (
                    <FamilyBranch fatherId={father?.id ?? null} motherId={mother?.id ?? null} depth={depth + 1} />
                  ) : null}
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
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    if (!hasToken()) {
      router.replace('/login');
    }
  }, [router]);

  useEffect(() => {
    const toast = sessionStorage.getItem('dashboard_toast');
    if (!toast) {
      return;
    }

    if (toast === 'person-added') {
      setToastMessage('Data orang berhasil ditambah.');
    }

    if (toast === 'family-added') {
      setToastMessage('Data keluarga berhasil ditambah.');
    }

    if (toast === 'marriage-added') {
      setToastMessage('Data pernikahan berhasil ditambah.');
    }

    if (toast === 'children-added') {
      setToastMessage('Data anak-anak berhasil ditambah.');
    }

    setShowSuccessToast(true);
    const timeout = setTimeout(() => {
      setShowSuccessToast(false);
      sessionStorage.removeItem('dashboard_toast');
    }, 1000);

    return () => clearTimeout(timeout);
  }, []);

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

  function handleOpenAddRoute(path: '/add-person' | '/add-family' | '/marriage' | '/add-family-children') {
    router.push(path);
  }

  return (
    <div className="flex flex-col flex-1">
      {showSuccessToast ? (
        <div className="fixed top-4 right-4 z-50 rounded-lg bg-[#2E7D32] px-4 py-2 text-sm font-semibold text-white shadow-md">
          {toastMessage}
        </div>
      ) : null}

      <PageHeader
        title="Dashboard"
        rightContent={<MainHeaderActions onOpenAddRoute={handleOpenAddRoute} onLogout={handleLogout} />}
      />

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
                      <FamilyRootCard
                        people={people}
                        endMarriageDate={root.endMarriageDate}
                        isTappable
                        onTap={handleTapRoot}
                      />

                      {isOpen ? (
                        <div className="relative pl-4 pt-2">
                          {root.father || root.mother ? (
                            <FamilyBranch fatherId={root.father?.id ?? null} motherId={root.mother?.id ?? null} />
                          ) : null}
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

      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleConfirmLogout}
      />
    </div>
  );
}

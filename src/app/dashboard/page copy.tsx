'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { clearTokens, hasToken } from '@/lib/auth-storage';
import { Avatar } from '@/app/components/Avatar';
import Birthdate from '@/app/components/Birthdate';
import { FamilyDetailModal } from '@/app/components/FamilyDetailModal';
import { PersonDetailModal } from '@/app/components/PersonDetailModal';
import { useLatestPeople } from '@/hooks/use-latest-people';
import { familyTreeService } from '@/services/family-tree.service';
import { Gender, type FamilyListItem, type Person } from '@/types/family-tree';

export default function DashboardPage() {
  const router = useRouter();
  const { data, isLoading, isError } = useLatestPeople(5, 0);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [selectedFamily, setSelectedFamily] = useState<FamilyListItem | null>(null);
  const [showFamilyModal, setShowFamilyModal] = useState(false);
  const [showPersonModal, setShowPersonModal] = useState(false);
  const [familySearchError, setFamilySearchError] = useState<string | null>(null);

  const familyListMutation = useMutation({
    mutationFn: (person: Person) => {
      const isMan = person.gender === Gender.MAN;

      return familyTreeService.getFamilyList({
        childrenId: person.id,
        fatherId: isMan ? person.id : undefined,
        motherId: !isMan ? person.id : undefined,
        limit: 10,
        offset: 0,
      });
    },
    onSuccess: (response, person) => {
      setFamilySearchError(null);
      const families = response.data ?? [];

      if (families.length === 0) {
        setSelectedFamily(null);
        setShowFamilyModal(false);
        setShowPersonModal(true);
        return;
      }

      if (families.length === 1) {
        setSelectedFamily(families[0]);
        setShowFamilyModal(true);
        setShowPersonModal(false);
        return;
      }

      const preferredFamily = families.find((family) =>
        person.gender === Gender.MAN
          ? family.father?.id === person.id
          : family.mother?.id === person.id,
      );

      setSelectedFamily(preferredFamily ?? families[0]);
      setShowFamilyModal(true);
      setShowPersonModal(false);
    },
    onError: () => {
      setShowFamilyModal(false);
      setShowPersonModal(false);
      setSelectedFamily(null);
      setFamilySearchError('Gagal memuat data keluarga. Silakan coba lagi.');
    },
  });

  useEffect(() => {
    if (!hasToken()) {
      router.replace('/login');
    }
  }, [router]);

  function handleLogout() {
    clearTokens();
    router.replace('/login');
  }

  function handleTapLatestPerson(person: Person) {
    setSelectedPerson(person);
    setShowFamilyModal(false);
    setShowPersonModal(false);
    setSelectedFamily(null);
    setFamilySearchError(null);
    familyListMutation.mutate(person);
  }

  function handleCloseFamilyModal() {
    setShowFamilyModal(false);
  }

  function handleClosePersonModal() {
    setShowPersonModal(false);
  }

  return (
    <div className="min-h-dvh flex flex-col bg-[#F5F5F5]">
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-[#E0E0E0] shadow-sm">
        <span className="text-base font-semibold text-[#242424]">Family Tree Admin</span>
        <button
          onClick={handleLogout}
          className="px-4 py-2 rounded-lg bg-[#242424] text-white text-sm font-semibold active:scale-95 transition-transform"
        >
          Logout
        </button>
      </header>

      <main className="flex flex-1 items-start justify-center">
        <section className="w-full max-w-xl px-6 pt-6">
          <h1 className="text-lg font-semibold text-[#242424]">Orang Terbaru</h1>

          <div className="mt-4 flex flex-col gap-2">
            {isLoading && (
              <span className="text-sm text-[#7A7A7A]">Memuat orang terbaru...</span>
            )}

            {isError && !isLoading && (
              <span className="text-sm text-[#D14343]">
                Gagal memuat orang terbaru. Silakan coba lagi.
              </span>
            )}

            {familySearchError && (
              <span className="text-sm text-[#D14343]">{familySearchError}</span>
            )}

            {familyListMutation.isPending && (
              <span className="text-sm text-[#7A7A7A]">Mencari data keluarga...</span>
            )}

            {!isLoading && !isError && data?.data.length === 0 && (
              <span className="text-sm text-[#7A7A7A]">Tidak ada orang terbaru.</span>
            )}

            {!isLoading &&
              !isError &&
              data?.data.map((person) => (
                <article
                  key={person.id}
                  className="flex items-center gap-3 bg-white border border-[#E0E0E0] rounded-lg p-2 cursor-pointer active:scale-[0.99] transition-transform"
                  role="button"
                  tabIndex={0}
                  onClick={() => handleTapLatestPerson(person)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      handleTapLatestPerson(person);
                    }
                  }}
                >
                  <Avatar member={person} size={11} />
                  <div className="min-w-0">
                    <p
                      className="max-w-[220px] text-sm font-semibold text-[#242424] overflow-hidden"
                      style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {person.name}
                    </p>
                    <div className="mt-1">
                      <Birthdate birthDate={person.birthDate} />
                    </div>
                  </div>
                </article>
              ))}
          </div>
        </section>
      </main>

      <FamilyDetailModal
        family={selectedFamily}
        isOpen={showFamilyModal}
        onClose={handleCloseFamilyModal}
      />
      <PersonDetailModal
        person={selectedPerson}
        isOpen={showPersonModal}
        onClose={handleClosePersonModal}
      />
    </div>
  );
}

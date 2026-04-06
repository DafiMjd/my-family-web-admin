'use client';

import { Avatar } from '@/app/components/Avatar';
import type { Person } from '@/types/family-tree';
import Birthdate from './Birthdate';
import { useClosestRelatedPeople } from '@/hooks/use-closest-related-people';

interface PersonDetailModalProps {
  person: Person | null;
  isOpen: boolean;
  onClose: () => void;
}

function RelatedPerson({ person, label }: { person: Person; label: string }) {
  return (
    <div className="flex max-w-25 items-center flex-col gap-0">
      <Avatar member={person} size={12} />
      <div className="flex items-center justify-center flex-col">
        <span className="text-[12px] text-center text-[#909090] font-sora">{label}</span>
        <span className="text-[14px] text-center line-clamp-2 font-semibold text-[#242424] font-sora">{person.name}</span>
      </div>
    </div>
  );
}

export function PersonDetailModal({ person, isOpen, onClose }: PersonDetailModalProps) {
  const personId = person?.id ?? '';
  const { data, isLoading, isError } = useClosestRelatedPeople(personId, isOpen);

  if (!isOpen || !person) {
    return null;
  }

  const spouse = data?.data.spouse ?? null;
  const children = data?.data.children ?? [];
  const parents = data?.data.parents ?? [];

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl bg-white p-4 flex flex-col gap-3"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-semibold text-[#242424] font-sora">Person Detail</h2>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-[#F0F0F0] text-[#242424] text-sm font-semibold"
            aria-label="Close person detail"
          >
            x
          </button>
        </div>
        <div className="flex items-center justify-center flex-col gap-2">
          <Avatar member={person} size={24} />
          <span className="text-[16px] font-semibold text-[#242424] font-sora">{person.name}</span>
          <Birthdate birthDate={person.birthDate} />
        </div>

        {isLoading ? <p className="text-sm text-[#909090] font-sora">Loading related people...</p> : null}
        {isError ? <p className="text-sm text-red-500 font-sora">Failed to load related people.</p> : null}

        {!isLoading && !isError ? (
          <div className="flex flex-col gap-2">
            <h2 className="text-[14px] font-semibold text-[#909090] font-sora">Closest Related People</h2>
            <div className="flex overflow-x-auto gap-4">
              {spouse ? <RelatedPerson person={spouse} label="Spouse" /> : null}
              {children.map((child) => (
                <RelatedPerson key={child.id} person={child} label="Child" />
              ))}
              {parents.map((parent) => (
                <RelatedPerson key={parent.id} person={parent} label="Parent" />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

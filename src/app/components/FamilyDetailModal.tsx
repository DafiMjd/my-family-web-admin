'use client';

import Image from 'next/image';
import { Avatar } from '@/app/components/Avatar';
import Birthdate from '@/app/components/Birthdate';
import type { FamilyListItem, Person, PersonWithSpouse } from '@/types/family-tree';

interface FamilyDetailModalProps {
  family: FamilyListItem | null;
  isOpen: boolean;
  onClose: () => void;
}

function PersonCard({ person, className }: { person: Person; className?: string }) {
  return (
    <div className={`flex items-center justify-center flex-col gap-2 ${className ?? ''}`}>
      <Avatar member={person} size={20} />
      <div className="flex flex-col items-center">
        <h3 className="text-[14px] font-semibold text-[#242424] font-sora text-center line-clamp-2">
          {person.name}
        </h3>
        <Birthdate birthDate={person.birthDate} />
      </div>
    </div>
  );
}

function ParentRow({ mother, father }: { mother: Person; father: Person }) {
  return (
    <div className="flex items-center justify-center flex-row gap-6">
      <PersonCard person={father} className="w-2/5" />
      <Image src="/ic_love.svg" alt="" width={24} height={24} className="w-6 h-6" />
      <PersonCard person={mother} className="w-2/5" />
    </div>
  );
}

function ChildRow({ child }: { child: PersonWithSpouse }) {
  return (
    <div className="rounded-lg border border-[#EAEAEA] p-2 bg-white">
      <div className="flex items-center gap-3">
        <Avatar member={child} size={11} />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#242424] font-sora line-clamp-2">{child.name}</p>
          <Birthdate birthDate={child.birthDate} />
        </div>
      </div>
    </div>
  );
}

export function FamilyDetailModal({ family, isOpen, onClose }: FamilyDetailModalProps) {
  if (!isOpen || !family) {
    return null;
  }

  const father = family.father;
  const mother = family.mother;
  const children = family.children ?? [];

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-2xl rounded-2xl bg-white p-4 md:p-5 flex flex-col gap-4 max-h-[85vh]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-semibold text-[#242424] font-sora">Family Detail</h2>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-[#F0F0F0] text-[#242424] text-sm font-semibold"
            aria-label="Close family detail"
          >
            x
          </button>
        </div>

        {father && mother ? (
          <section className="flex flex-col gap-3">
            <p className="text-[13px] font-normal text-[#242424] font-sora">Parents</p>
            <ParentRow mother={mother} father={father} />
          </section>
        ) : (
          <p className="text-sm text-[#909090] font-sora">Parent data not complete.</p>
        )}

        <section className="flex flex-col gap-2 min-h-0">
          <p className="text-[13px] font-normal text-[#242424] font-sora">Children</p>
          {children.length === 0 ? (
            <p className="text-sm text-[#909090] font-sora">No children found.</p>
          ) : (
            <div className="flex flex-col gap-2 overflow-y-auto pr-1">
              {children.map((child) => (
                <ChildRow key={child.id} child={child} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

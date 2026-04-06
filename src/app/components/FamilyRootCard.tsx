'use client';

import Image from 'next/image';
import type { Person, FamilyRoot } from '@/types/family-tree';
import { Gender } from '@/types/family-tree';
import { Avatar } from '@/app/components/Avatar';
import Birthdate from './Birthdate';

// ─── Types ────────────────────────────────────────────────────────────────────

type Align = 'left' | 'right';

export interface FamilyRootCardProps {
  people: Person[];
  align?: Align;
  isTappable?: boolean;
  onTap?: (person: Person, people: Person[]) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPersonRole(person: Person): string {
  if (person.gender === Gender.MAN) return 'Husband';
  return 'Wife';
}

function formatDate(iso: string): string {
  return iso.slice(0, 10);
}

// ─── Person Row ───────────────────────────────────────────────────────────────

interface PersonRowProps {
  member: Person;
  role?: string;
  align: Align;
}

function PersonRow({ member, role, align }: PersonRowProps) {
  const isLeft = align === 'left';

  return (
    <div className={`flex items-center gap-[7px] ${isLeft ? 'flex-row' : 'flex-row-reverse'}`}>
      <Avatar member={member} />
      <div className={`flex flex-col ${isLeft ? 'items-start' : 'items-end'}`}>
        {role && (
          <span className="text-[12px] font-normal text-[#A2A2A2] font-sora leading-[1.2]">
            {role}
          </span>
        )}
        <span className="text-[16px] font-semibold text-[#242424] font-sora leading-normal">
          {member.name}
        </span>
        {member.birthDate && (
          <Birthdate birthDate={member.birthDate} align={align} />
        )}
      </div>
    </div>
  );
}

// ─── Card Header ──────────────────────────────────────────────────────────────

function CardHeader({ align }: { align: Align }) {
  const isLeft = align === 'left';

  return (
    <div className={`flex items-center ${isLeft ? 'justify-between' : 'justify-end gap-1'}`}>
      {isLeft ? (
        <>
          <div className="flex items-center gap-1">
            <Image src="/ic_love.svg" alt="" width={16} height={16} />
            <span className="text-[12px] font-semibold text-[#909090] font-sora">
              Married Couple
            </span>
          </div>
          <Image src="/ic_forward.svg" alt="lihat detail" width={24} height={24} />
        </>
      ) : (
        <>
          <span className="text-[12px] font-semibold text-[#909090] font-sora">
            Married Couple
          </span>
          <Image src="/ic_love.svg" alt="" width={16} height={16} />
        </>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function FamilyRootCard({
  people,
  align = 'left',
  isTappable = false,
  onTap,
}: FamilyRootCardProps) {
  const isMarried = people.length > 1;

  if (people.length === 0) {
    return null;
  }

  // const canTap = isTappable && isMarried && Boolean(onTap);
  // use this when user detail is ready
  const canTap = isTappable && Boolean(onTap);
  const primaryPerson = people[0];

  function handleTap() {
    if (!canTap || !primaryPerson || !onTap) {
      return;
    }
    onTap(primaryPerson, people);
  }

  return (
    <div
      className={`bg-white rounded-lg p-2 flex flex-col gap-2 shadow-sm ${canTap ? 'cursor-pointer active:scale-[0.99] transition-transform' : ''
        }`}
      onClick={handleTap}
      role={canTap ? 'button' : undefined}
      tabIndex={canTap ? 0 : undefined}
      onKeyDown={(event) => {
        if (!canTap) {
          return;
        }
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleTap();
        }
      }}
    >
      {isMarried && <CardHeader align={align} />}

      {people.map((person, index) => (
        <div key={person.id} className="flex flex-col gap-2">
          <PersonRow
            member={person}
            role={isMarried ? getPersonRole(person) : undefined}
            align={align}
          />
          {index < people.length - 1 && <div className="h-px w-full bg-[#EDEDED]" />}
        </div>
      ))}
    </div>
  );
}

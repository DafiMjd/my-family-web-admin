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
  endMarriageDate: string | null;
  align?: Align;
  isTappable?: boolean;
  onTap?: (person: Person, people: Person[]) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPersonRole(person: Person): string {
  if (person.gender === Gender.MAN) return 'Suami';
  return 'Istri';
}

function getDisplayName(member: Person): string {
  if (member.deathDate) {
    return `Alm. ${member.name}`;
  }

  return member.name;
}

function hasEndedMarriageDate(endMarriageDate: string | null): boolean {
  if (!endMarriageDate) {
    return false;
  }

  return typeof endMarriageDate === 'string' && endMarriageDate.length > 0;
}

function getPersonRowBackgroundColor(member: Person, divorcedCouple: boolean): string | undefined {
  if (member.deathDate) {
    return '#cce6ea';
  }
  if (divorcedCouple) {
    return '#f1dfdf';
  }
  return undefined;
}

// ─── Person Row ───────────────────────────────────────────────────────────────

interface PersonRowProps {
  member: Person;
  role?: string;
  align: Align;
  divorcedCouple: boolean;
}

function PersonContactLines({ member, align }: { member: Person; align: Align }) {
  const phone = member.phoneNumber?.trim();
  const address = member.address?.trim();
  if (!phone && !address) {
    return null;
  }

  const textAlign = align === 'right' ? 'text-right' : 'text-left';

  return (
    <div className={`mt-0.5 flex w-full max-w-full flex-col gap-0.5 ${textAlign}`}>
      {phone ? (
        <span className="max-w-full truncate text-[11px] font-normal text-[#A2A2A2] font-sora">
          {phone}
        </span>
      ) : null}
      {address ? (
        <span
          className={`max-w-full text-[11px] font-normal text-[#A2A2A2] font-sora line-clamp-3 whitespace-pre-wrap wrap-break-word ${textAlign}`}
        >
          {address}
        </span>
      ) : null}
    </div>
  );
}

function PersonRow({ member, role, align, divorcedCouple }: PersonRowProps) {
  const isLeft = align === 'left';
  const rowBg = getPersonRowBackgroundColor(member, divorcedCouple);

  return (
    <div
      className={`flex items-center gap-[7px] p-2 ${isLeft ? 'flex-row' : 'flex-row-reverse'}`}
      style={rowBg ? { backgroundColor: rowBg } : undefined}
    >
      <Avatar member={member} />
      <div className={`min-w-0 flex flex-1 flex-col ${isLeft ? 'items-start' : 'items-end'}`}>
        {role && (
          <span className="max-w-full truncate text-[12px] font-normal text-[#A2A2A2] font-sora leading-[1.2]">
            {role}
          </span>
        )}
        <span className="max-w-full truncate text-[16px] font-semibold text-[#242424] font-sora leading-normal">
          {getDisplayName(member)}
        </span>
        {member.birthDate && (
          <Birthdate birthDate={member.birthDate} deathDate={member.deathDate} align={align} />
        )}
        <PersonContactLines member={member} align={align} />
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
              Pasangan
            </span>
          </div>
        </>
      ) : (
        <>
          <span className="text-[12px] font-semibold text-[#909090] font-sora">
            Pasangan
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
  endMarriageDate,
  onTap,
}: FamilyRootCardProps) {
  const isMarried = people.length > 1;
  const isEndedMarriage = hasEndedMarriageDate(endMarriageDate);
  const divorcedCouple = isMarried && isEndedMarriage;

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
      className={`rounded-lg w-80 flex flex-col shadow-sm ${canTap ? 'cursor-pointer active:scale-[0.99] transition-transform' : ''
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
      {isMarried && <div className="m-2"><CardHeader align={align} /></div>}

      {people.map((person, index) => (
        <div key={person.id} className="flex flex-col">
          <PersonRow
            member={person}
            role={isMarried ? getPersonRole(person) : undefined}
            align={align}
            divorcedCouple={divorcedCouple}
          />
          {index < people.length - 1 && <div className="h-px w-full bg-[#EDEDED]" />}
        </div>
      ))}
      {divorcedCouple && <div className="flex flex-col m-2">
        <span className="text-[11px] font-normal text-[#A2A2A2] font-sora">
          Sudah tidak bersama
        </span>
      </div>}
    </div>
  );
}

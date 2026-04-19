'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import type { Person } from '@/types/family-tree';
import { Gender } from '@/types/family-tree';

const SIZE = 16;

export type PersonDropdownThumbFields = Pick<Person, 'gender' | 'profilePictureUrl'>;

function fallbackForGender(gender: Person['gender']): string {
  return gender === Gender.MAN ? '/avatar_man.png' : '/avatar_woman.png';
}

/** Small fixed 16×16 avatar for search dropdown rows (remote URLs use unoptimized). */
export function PersonDropdownThumbnail({ person }: { person: PersonDropdownThumbFields }) {
  const [src, setSrc] = useState(
    () => person.profilePictureUrl || fallbackForGender(person.gender),
  );

  useEffect(() => {
    setSrc(person.profilePictureUrl || fallbackForGender(person.gender));
  }, [person.profilePictureUrl, person.gender]);

  const isRemote = /^https?:\/\//i.test(src);

  return (
    <Image
      src={src}
      alt=""
      width={SIZE}
      height={SIZE}
      unoptimized={isRemote}
      className="h-4 w-4 shrink-0 rounded-full object-cover bg-[#EAEAEA]"
      onError={() => setSrc(fallbackForGender(person.gender))}
    />
  );
}

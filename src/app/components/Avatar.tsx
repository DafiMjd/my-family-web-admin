import Image from 'next/image';
import { useState } from 'react';
import type { Person } from '@/types/family-tree';
import { Gender } from '@/types/family-tree';

// ─── Avatar ───────────────────────────────────────────────────────────────────

export function Avatar({ member, size, className }: { member: Person, size?: number, className?: string }) {
    const fallbackPath = member.gender === Gender.MAN ? '/avatar_man.png' : '/avatar_woman.png';
    const [src, setSrc] = useState(member.profilePictureUrl || fallbackPath);
    const imageSize = size || 12;
    const width = imageSize * 5;

    if (member.profilePictureUrl) {
        return (
            <Image
                src={src}
                alt={member.name}
                width={width}
                height={width}
                className={`w-${imageSize} h-${imageSize} rounded-full object-cover shrink-0 ${className}`}
                onError={() => setSrc(fallbackPath)}
            />
        );
    }

    return (
        <Image
            src={fallbackPath}
            alt={member.name}
            width={width}
            height={width}
            className={`w-${imageSize} h-${imageSize} rounded-full object-cover shrink-0`}
        />
    );
}
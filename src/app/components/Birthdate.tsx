import Image from 'next/image';

function formatDate(iso: string): string {
    return iso.slice(0, 10);
}

export default function Birthdate({ birthDate, align }: { birthDate: string, align?: 'left' | 'right' }) {
    const usedAlign = align || 'left';
    const flexAlign = usedAlign === 'left' ? 'flex-row' : 'flex-row-reverse';
    return (
        <div className={`flex items-center gap-1 ${flexAlign}`}>
            <Image src="/ic_date.svg" alt="" width={12} height={12} />
            <span className="text-[11px] font-normal text-[#A2A2A2] font-sora">
                {formatDate(birthDate)}
            </span>
        </div>
    )
}
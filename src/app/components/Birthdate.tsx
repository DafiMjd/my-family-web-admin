import Image from 'next/image';

function formatDate(iso: string): string {
    return iso.slice(0, 10);
}

function dateToAge(date: string): string {
    const now = new Date();
    const birthDate = new Date(date);
    const age = now.getFullYear() - birthDate.getFullYear();

    if (age > 0) {
        return `${age} tahun`;
    }
    const months = now.getMonth() - birthDate.getMonth();
    if (months > 0) {
        return `${months} bulan`;
    }
    const days = now.getDate() - birthDate.getDate();
    if (days > 0) {
        return `${days} hari`;
    }
    return '0 tahun';
}

export default function Birthdate({ birthDate, align }: { birthDate: string, align?: 'left' | 'right' }) {
    const usedAlign = align || 'left';
    const flexAlign = usedAlign === 'left' ? 'flex-row' : 'flex-row-reverse';
    return (
        <div className={`flex items-center gap-1 ${flexAlign}`}>
            <Image src="/ic_date.svg" alt="" width={12} height={12} />
            <span className="max-w-full truncate line-clamp-1 text-[11px]  font-normal text-[#A2A2A2] font-sora">
                {formatDate(birthDate)} ({dateToAge(birthDate)})
            </span>
        </div>
    )
}
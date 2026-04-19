import Image from 'next/image';

function formatDate(iso: string): string {
  return iso.slice(0, 10);
}

function parseYmd(iso: string): { y: number; m: number; d: number } {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return { y, m, d };
}

function todayYmd(): string {
  const t = new Date();
  const y = t.getFullYear();
  const m = String(t.getMonth() + 1).padStart(2, '0');
  const d = String(t.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function ymdToUtcTime(iso: string): number {
  const { y, m, d } = parseYmd(iso);
  return Date.UTC(y, m - 1, d);
}

/** Age label from birth through reference (calendar years, then months, then days). */
function formatAgeBetween(birthIso: string, refIso: string): string {
  const diffDays = Math.floor((ymdToUtcTime(refIso) - ymdToUtcTime(birthIso)) / 86_400_000);
  if (diffDays <= 0) {
    return '0 tahun';
  }

  const b = parseYmd(birthIso);
  const r = parseYmd(refIso);
  let years = r.y - b.y;
  if (r.m < b.m || (r.m === b.m && r.d < b.d)) {
    years -= 1;
  }
  if (years > 0) {
    return `${years} tahun`;
  }

  const totalMonths = r.y * 12 + r.m - (b.y * 12 + b.m);
  const months = totalMonths - (r.d < b.d ? 1 : 0);
  if (months > 0) {
    return `${months} bulan`;
  }

  return `${diffDays} hari`;
}

export default function Birthdate({
  birthDate,
  deathDate,
  align,
}: {
  birthDate: string | null;
  deathDate?: string | null;
  align?: 'left' | 'right';
}) {
  if (!birthDate) {
    return null;
  }
  const usedAlign = align || 'left';
  const flexAlign = usedAlign === 'left' ? 'flex-row' : 'flex-row-reverse';
  const refIso =
    deathDate && typeof deathDate === 'string' && deathDate.length > 0
      ? deathDate.slice(0, 10)
      : todayYmd();
  const ageLabel = formatAgeBetween(birthDate, refIso);

  return (
    <div className={`flex items-center gap-1 ${flexAlign}`}>
      <Image src="/ic_date.svg" alt="" width={12} height={12} />
      <span className="max-w-full truncate line-clamp-1 text-[11px]  font-normal text-[#A2A2A2] font-sora">
        {formatDate(birthDate)} ({ageLabel})
      </span>
    </div>
  );
}

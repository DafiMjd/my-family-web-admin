'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

function DashboardIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="6" height="6" rx="1" fill="currentColor" />
      <rect x="9" y="1" width="6" height="6" rx="1" fill="currentColor" />
      <rect x="1" y="9" width="6" height="6" rx="1" fill="currentColor" />
      <rect x="9" y="9" width="6" height="6" rx="1" fill="currentColor" />
    </svg>
  );
}

function PeopleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="6" cy="4.5" r="2.5" fill="currentColor" />
      <path
        d="M1 13c0-2.761 2.239-5 5-5s5 2.239 5 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="12" cy="5" r="2" fill="currentColor" fillOpacity="0.6" />
      <path
        d="M10.5 13c0-1.93.97-3.632 2.45-4.648"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeOpacity="0.6"
      />
    </svg>
  );
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: <DashboardIcon /> },
  { label: 'List Orang', href: '/people', icon: <PeopleIcon /> },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 min-h-dvh flex flex-col bg-white border-r border-[#E0E0E0] shrink-0">
      <div className="px-4 py-5 border-b border-[#E0E0E0]">
        <span className="text-sm font-bold text-[#242424] tracking-wide">Family Tree Admin</span>
      </div>

      <nav className="flex flex-col gap-1 p-3 flex-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-[#65587a] text-white'
                  : 'text-[#606060] hover:bg-[#F5F5F5] hover:text-[#242424]'
              }`}
            >
              <span className={isActive ? 'text-white' : 'text-[#909090]'}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

'use client';

import Image from 'next/image';
import { useState } from 'react';

interface MainHeaderActionsProps {
  onOpenAddRoute: (path: '/add-person' | '/add-family' | '/marriage' | '/add-family-children') => void;
  onLogout: () => void;
}

export function MainHeaderActions({ onOpenAddRoute, onLogout }: MainHeaderActionsProps) {
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);

  function handleOpenAddRoute(path: '/add-person' | '/add-family' | '/marriage' | '/add-family-children') {
    setIsAddMenuOpen(false);
    onOpenAddRoute(path);
  }

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setIsAddMenuOpen((prev) => !prev)}
          className="px-4 py-2 rounded-lg bg-[#65587a] text-white text-sm font-semibold active:scale-95 transition-transform"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">Tambah Data</span>
            <Image src="/ic_plus.svg" alt="" width={16} height={16} />
          </div>
        </button>

        {isAddMenuOpen ? (
          <div className="absolute right-0 mt-2 w-48 rounded-lg border border-[#E0E0E0] bg-white shadow-md overflow-hidden z-10">
            <button
              onClick={() => handleOpenAddRoute('/add-person')}
              className="w-full px-3 py-2 text-left text-sm text-[#242424] hover:bg-[#F5F5F5]"
            >
              Tambah Orang
            </button>
            <button
              onClick={() => handleOpenAddRoute('/add-family')}
              className="w-full px-3 py-2 text-left text-sm text-[#242424] hover:bg-[#F5F5F5]"
            >
              Tambah Keluarga
            </button>
            <button
              onClick={() => handleOpenAddRoute('/marriage')}
              className="w-full px-3 py-2 text-left text-sm text-[#242424] hover:bg-[#F5F5F5]"
            >
              Tambah Pernikahan
            </button>
            <button
              onClick={() => handleOpenAddRoute('/add-family-children')}
              className="w-full px-3 py-2 text-left text-sm text-[#242424] hover:bg-[#F5F5F5]"
            >
              Tambah Anak-Anak
            </button>
          </div>
        ) : null}
      </div>

      <button
        onClick={onLogout}
        className="px-4 py-2 rounded-lg bg-[#242424] text-white text-sm font-semibold active:scale-95 transition-transform"
      >
        Logout
      </button>
    </>
  );
}

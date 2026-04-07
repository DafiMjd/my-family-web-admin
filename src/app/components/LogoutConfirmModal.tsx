interface LogoutConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function LogoutConfirmModal({ isOpen, onClose, onConfirm }: LogoutConfirmModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-4 flex flex-col gap-4"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="text-base font-semibold text-[#242424]">Konfirmasi Logout</h2>
        <p className="text-sm text-[#606060]">Apakah kamu yakin ingin logout?</p>
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#F0F0F0] text-[#242424] text-sm font-semibold active:scale-95 transition-transform"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-[#242424] text-white text-sm font-semibold active:scale-95 transition-transform"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

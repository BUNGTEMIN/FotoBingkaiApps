import React from 'react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Hapus Kreasi?",
  message = "Apakah Anda yakin ingin menghapus karya ini? Tindakan ini tidak dapat dibatalkan.",
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-white/10 p-6 rounded-xl max-w-sm w-full">
        <h3 className="text-white font-bold mb-4 font-mono">{title}</h3>
        <p className="text-zinc-400 text-sm mb-6 font-mono">{message}</p>
        <div className="flex gap-4">
          <button 
            onClick={onClose} 
            className="flex-1 py-2 text-sm bg-zinc-800 text-white rounded font-mono hover:bg-zinc-700"
          >
            Batal
          </button>
          <button 
            onClick={() => { onConfirm(); onClose(); }} 
            className="flex-1 py-2 text-sm bg-red-600 text-white rounded font-mono hover:bg-red-700"
          >
            Ya, Hapus
          </button>
        </div>
      </div>
    </div>
  );
};

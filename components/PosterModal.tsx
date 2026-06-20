'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { X } from 'lucide-react';

interface PosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  title: string;
}

export default function PosterModal({ isOpen, onClose, imageUrl, title }: PosterModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // ESC keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 transition-all duration-300 animate-fade-in"
      onClick={onClose}
    >
      {/* Container */}
      <div
        className="relative max-w-lg w-full flex flex-col items-center bg-zinc-950/80 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/60 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          aria-label="Close poster view"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Poster Image */}
        <div className="relative aspect-[2/3] w-full max-h-[80vh] min-h-[400px]">
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-contain"
            sizes="(max-width: 640px) 100vw, 500px"
            priority
          />
        </div>

        {/* Modal Info Footer */}
        <div className="w-full bg-zinc-950/90 border-t border-white/5 py-4 px-6 text-center text-sm font-semibold text-zinc-200">
          {title}
        </div>
      </div>
    </div>,
    document.body
  );
}

'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationBarProps {
  page: number;
  totalPages: number;
  onPage: (p: number) => void;
  windowSize?: number;
  className?: string;
}

export function PaginationBar({
  page,
  totalPages,
  onPage,
  windowSize = 7,
  className = '',
}: PaginationBarProps) {
  if (totalPages <= 1) return null;

  const visible = Math.min(totalPages, windowSize);
  const start =
    totalPages <= windowSize
      ? 0
      : Math.max(0, Math.min(page - Math.floor(windowSize / 2), totalPages - windowSize));

  return (
    <nav
      aria-label="Phân trang"
      className={`mt-10 flex items-center justify-center gap-2 ${className}`}
    >
      <button
        type="button"
        onClick={() => onPage(page - 1)}
        disabled={page === 0}
        className="grid place-items-center w-10 h-10 rounded-full bg-surface-card text-ink hover:bg-secondary-bg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        aria-label="Trang trước"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {Array.from({ length: visible }, (_, i) => {
        const pageNum = start + i;
        const isActive = pageNum === page;
        return (
          <button
            key={pageNum}
            type="button"
            onClick={() => onPage(pageNum)}
            aria-current={isActive ? 'page' : undefined}
            className={`grid place-items-center w-10 h-10 rounded-full text-sm font-bold transition-colors ${
              isActive
                ? 'bg-ink text-on-dark'
                : 'bg-surface-card text-ink hover:bg-secondary-bg'
            }`}
          >
            {pageNum + 1}
          </button>
        );
      })}

      <button
        type="button"
        onClick={() => onPage(page + 1)}
        disabled={page >= totalPages - 1}
        className="grid place-items-center w-10 h-10 rounded-full bg-surface-card text-ink hover:bg-secondary-bg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        aria-label="Trang sau"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </nav>
  );
}

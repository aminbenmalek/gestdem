
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  
  // Logic to show only a few pages if there are many
  const visiblePages = pages.filter(p => 
    p === 1 || 
    p === totalPages || 
    (p >= currentPage - 1 && p <= currentPage + 1)
  );

  const renderPages = () => {
    const result = [];
    let lastPage = 0;

    for (const p of visiblePages) {
      if (lastPage !== 0 && p - lastPage > 1) {
        result.push(<span key={`ellipsis-${p}`} className="px-2 text-slate-400">...</span>);
      }
      result.push(
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={`w-10 h-10 rounded-xl font-bold transition-all ${
            currentPage === p 
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100'
          }`}
        >
          {p}
        </button>
      );
      lastPage = p;
    }
    return result;
  };

  return (
    <div className="flex items-center justify-center gap-2 mt-8 py-4">
      <button
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="p-2.5 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-slate-50 disabled:opacity-50 disabled:hover:text-slate-400 transition-all"
      >
        <ChevronLeft size={20} />
      </button>
      
      <div className="flex items-center gap-2">
        {renderPages()}
      </div>

      <button
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="p-2.5 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-slate-50 disabled:opacity-50 disabled:hover:text-slate-400 transition-all"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
};

export default Pagination;

import React from 'react';
import { twMerge } from 'tailwind-merge';

export const Card = ({ children, className = '', hoverable = false, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={twMerge(
        'bg-white rounded-xl border border-slate-200/80 shadow-xs p-6 transition-all duration-200',
        hoverable && 'hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5 cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  );
};

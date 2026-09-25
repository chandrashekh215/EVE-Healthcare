import React from 'react';
import { twMerge } from 'tailwind-merge';

export const Badge = ({ children, variant = 'default', className = '' }) => {
  const variants = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    pending: 'bg-amber-50 text-amber-700 border-amber-200/80',
    confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    failed: 'bg-rose-50 text-rose-700 border-rose-200/80',
    cancelled: 'bg-slate-100 text-slate-600 border-slate-200',
    brand: 'bg-brand-50 text-brand-700 border-brand-200',
  };

  return (
    <span
      className={twMerge(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border shadow-xs tracking-wide uppercase',
        variants[variant.toLowerCase()] || variants.default,
        className
      )}
    >
      {children}
    </span>
  );
};

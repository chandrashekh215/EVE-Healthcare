import React from 'react';
import { twMerge } from 'tailwind-merge';

export const Skeleton = ({ className = '' }) => {
  return (
    <div className={twMerge('animate-pulse bg-slate-200/80 rounded-lg', className)} />
  );
};

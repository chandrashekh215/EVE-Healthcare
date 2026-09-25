import React from 'react';
import { Navbar } from './Navbar';
import { DevToolsPanel } from '../ui/DevToolsPanel';

export const Layout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <footer className="bg-white border-t border-slate-200 mt-auto py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 EVE Healthcare Systems Inc. All rights reserved.</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Diagnostic Booking Engine</span>
            <span>•</span>
            <span>Simulated Payments v1.0</span>
          </div>
        </div>
      </footer>
      <DevToolsPanel />
    </div>
  );
};

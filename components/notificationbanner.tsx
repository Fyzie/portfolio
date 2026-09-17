"use client";

import { useState, useEffect } from 'react';

export default function NotificationBanner() {
  const [showBanner, setShowBanner] = useState(true);

  // Automatically dismiss the banner after 10 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowBanner(false);
    }, 10000); // 10000ms = 10 seconds

    return () => clearTimeout(timer);
  }, []);

  if (!showBanner) return null;

  return (
    <div className="bg-slate-900 text-slate-100 px-4 py-2 text-xs sm:text-sm font-medium flex items-center justify-between sticky top-0 z-[100] transition-all shadow-md">
      <div className="flex-1 text-center truncate px-6">
        🖥️ <span className="font-semibold">Notice:</span> For the best experience, viewing on a <span className="underline decoration-orange-400">desktop site mode</span> is strongly recommended.
      </div>
      <button 
        onClick={() => setShowBanner(false)}
        className="text-slate-400 hover:text-white p-1 rounded-md transition-colors shrink-0"
        title="Dismiss notice"
      >
        ✕
      </button>
    </div>
  );
}
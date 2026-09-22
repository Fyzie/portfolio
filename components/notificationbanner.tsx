"use client";

import { useState, useEffect } from 'react';

export default function NotificationBanner() {
  const [showBanner, setShowBanner] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowBanner(false);
    }, 90000); // 90 seconds

    return () => clearTimeout(timer);
  }, []);

  if (!showBanner) return null;

  return (
    <div className="bg-slate-900 text-slate-100 px-4 py-2.5 text-xs sm:text-sm font-medium flex items-center justify-between sticky top-0 z-[100] transition-all shadow-md">
      {/* Added flex-col/text-center for mobile, sm:flex-row/sm:text-left for desktop */}
      <div className="flex-1 flex flex-col sm:flex-row items-center justify-center sm:justify-start text-center sm:text-left gap-1 sm:gap-2 px-2">
        <span>🖥️ <span className="font-semibold">Notice:</span></span>
        {/* <span>For the best interactive sandbox experience, viewing on a <span className="underline decoration-orange-400">desktop site mode</span> is strongly recommended.</span> */}
        <span>The backend server will start within 2 minutes.</span>
      </div>
      <button 
        onClick={() => setShowBanner(false)}
        className="text-slate-400 hover:text-white p-1 rounded-md transition-colors shrink-0 self-start sm:self-center"
        title="Dismiss notice"
      >
        ✕
      </button>
    </div>
  );
}
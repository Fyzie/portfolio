"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Gamepad2, Sparkles, ArrowLeft } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const isPlayground = pathname === "/playground";

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#FDFBF7]/85 border-b border-[#EBDED2] transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-8 h-14 flex items-center justify-between">
        
        {/* Left: Branding & Back Button */}
        <div className="flex items-center gap-3">
          {isPlayground ? (
            <Link 
              href="/" 
              className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#563727] hover:text-[#DE9E48] transition-colors"
            >
              <ArrowLeft size={16} />
              <span>Back to Portfolio</span>
            </Link>
          ) : (
            <Link href="/" className="flex items-center gap-2.5 group">
              <Image
                src="/logo.png"
                alt="HM Logo"
                width={32}
                height={32}
                className="w-8 h-8 rounded-full object-cover shadow-xs border border-[#EBDED2] group-hover:border-[#DE9E48] transition-all"
                priority
              />
              <span className="font-bold text-sm sm:text-base tracking-tight text-[#372C2E] group-hover:text-[#DE9E48] transition-colors">
                Hafizi Malik
              </span>
            </Link>
          )}
        </div>

        {/* Right: Quick Links / Status / Playground CTA */}
        <div className="flex items-center gap-2 sm:gap-3">

          {/* Playground Shortcut Button */}
          {!isPlayground ? (
            <Link
              href="/playground"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#372C2E] text-white hover:bg-[#DE9E48] hover:text-[#372C2E] text-xs font-semibold shadow-xs transition-all duration-200 group"
            >
              <Gamepad2 size={14} className="group-hover:rotate-12 transition-transform" />
              <span>Playground</span>
            </Link>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#FDF6E9] border border-[#DE9E48]/50 text-xs font-semibold text-[#7A431D]">
              <Sparkles size={13} className="text-[#DE9E48]" />
              <span>Interactive Mode</span>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}

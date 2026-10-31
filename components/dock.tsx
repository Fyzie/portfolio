"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  Briefcase, 
  Code2, 
  FolderGit2, 
  Trophy, 
  Gamepad2, 
  Mail,
  Sparkles
} from "lucide-react";

export default function Dock() {
  const pathname = usePathname();
  const isPlayground = pathname === "/playground";

  const navItems = [
    { label: "Home", href: isPlayground ? "/" : "#hero", icon: Home },
    { label: "Experience", href: isPlayground ? "/#experience" : "#experience", icon: Briefcase },
    { label: "Toolbox", href: isPlayground ? "/#skills" : "#skills", icon: Code2 },
    { label: "Projects", href: isPlayground ? "/#projects" : "#projects", icon: FolderGit2 },
    { label: "Awards", href: isPlayground ? "/#awards" : "#awards", icon: Trophy },
  ];

  return (
    <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-50">
      <nav 
        aria-label="Floating Navigation Dock"
        className="flex items-center gap-1 sm:gap-1.5 px-3 py-2 rounded-full bg-white/90 backdrop-blur-md border border-[#EBDED2] shadow-xl shadow-[#372C2E]/6 transition-all"
      >
        {/* Navigation Section Anchors */}
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className="group relative p-2 sm:p-2.5 rounded-full text-[#6E5A52] hover:text-[#372C2E] hover:bg-[#F5EFEB] transition-all duration-200 flex items-center justify-center"
              aria-label={item.label}
            >
              <Icon size={18} className="transition-transform group-hover:scale-110" />
              {/* Tooltip */}
              <span className="absolute -top-9 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#372C2E] text-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none whitespace-nowrap">
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* Highlighted Playground Link */}
        <Link
          href="/playground"
          className={`group relative p-2 sm:p-2.5 rounded-full transition-all duration-200 flex items-center justify-center ${
            isPlayground 
              ? "bg-[#DE9E48] text-[#372C2E] font-bold shadow-xs" 
              : "text-[#DE9E48] hover:bg-[#FDF6E9]"
          }`}
          aria-label="Playground Sandbox"
        >
          <Gamepad2 size={19} className="transition-transform group-hover:scale-115" />
          {/* Subtle pulse badge when on other pages */}
          {!isPlayground && (
            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#DE9E48] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#DE9E48]"></span>
            </span>
          )}
          {/* Tooltip */}
          <span className="absolute -top-9 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-[#7A431D] text-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none whitespace-nowrap flex items-center gap-1">
            <Sparkles size={11} className="text-[#DE9E48]" /> AI Playground
          </span>
        </Link>

        {/* Separator Divider */}
        <div className="h-5 w-[1px] bg-[#EBDED2] mx-1" />

        {/* GitHub Social */}
        <a
          href="https://github.com/Fyzie"
          target="_blank"
          rel="noopener noreferrer"
          className="group relative p-2 sm:p-2.5 rounded-full text-[#6E5A52] hover:text-[#372C2E] hover:bg-[#F5EFEB] transition-all duration-200 flex items-center justify-center"
          aria-label="GitHub Profile"
        >
          <svg className="w-[18px] h-[18px] fill-current transition-transform group-hover:scale-110" viewBox="0 0 24 24">
            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
          </svg>
          <span className="absolute -top-9 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#372C2E] text-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none whitespace-nowrap">
            GitHub
          </span>
        </a>

        {/* LinkedIn Social */}
        <a
          href="https://www.linkedin.com/in/hafizi-malik/"
          target="_blank"
          rel="noopener noreferrer"
          className="group relative p-2 sm:p-2.5 rounded-full text-[#6E5A52] hover:text-[#372C2E] hover:bg-[#F5EFEB] transition-all duration-200 flex items-center justify-center"
          aria-label="LinkedIn Profile"
        >
          <svg className="w-[18px] h-[18px] fill-current transition-transform group-hover:scale-110" viewBox="0 0 24 24">
            <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
          </svg>
          <span className="absolute -top-9 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#372C2E] text-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none whitespace-nowrap">
            LinkedIn
          </span>
        </a>

        {/* Contact / Email */}
        <Link
          href={isPlayground ? "/#contact" : "#contact"}
          className="group relative p-2 sm:p-2.5 rounded-full text-[#6E5A52] hover:text-[#372C2E] hover:bg-[#F5EFEB] transition-all duration-200 flex items-center justify-center"
          aria-label="Contact Section"
        >
          <Mail size={18} className="transition-transform group-hover:scale-110" />
          <span className="absolute -top-9 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#372C2E] text-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none whitespace-nowrap">
            Contact
          </span>
        </Link>
      </nav>
    </div>
  );
}

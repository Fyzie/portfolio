"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="w-full bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
        
        {/* Logo and Name Container */}
        <div className="flex items-center gap-3">
          <img 
            src="/logo.png" 
            alt="Logo" 
            className="h-10 w-10 sm:h-12 sm:w-12 object-contain" 
          />
          <div className="text-slate-900 font-bold text-lg sm:text-2xl tracking-tight">Hafizi Malik</div>
        </div>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex gap-6 font-medium text-sm text-slate-600">
          <Link href="/" className="hover:text-blue-600 transition-colors">About Me</Link>
          <Link href="/projects" className="hover:text-blue-600 transition-colors">Projects</Link>
          <Link href="/awards" className="hover:text-blue-600 transition-colors">Awards</Link>
          <Link href="/playground" className="hover:text-blue-600 transition-colors">Playground</Link>
          <Link href="/contact" className="hover:text-blue-600 transition-colors">Contact Me</Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden p-2 text-slate-700 hover:text-blue-600 transition-colors focus:outline-none"
          aria-label="Toggle Menu"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-6 py-4 flex flex-col gap-4 shadow-lg animate-in slide-in-from-top duration-200">
          <Link 
            href="/" 
            onClick={() => setIsOpen(false)}
            className="font-medium text-slate-700 hover:text-blue-600 transition-colors py-1"
          >
            About Me
          </Link>
          <Link 
            href="/projects" 
            onClick={() => setIsOpen(false)}
            className="font-medium text-slate-700 hover:text-blue-600 transition-colors py-1"
          >
            Projects
          </Link>
          <Link 
            href="/awards" 
            onClick={() => setIsOpen(false)}
            className="font-medium text-slate-700 hover:text-blue-600 transition-colors py-1"
          >
            Awards
          </Link>
          <Link 
            href="/playground" 
            onClick={() => setIsOpen(false)}
            className="font-medium text-slate-700 hover:text-blue-600 transition-colors py-1"
          >
            Playground
          </Link>
          <Link 
            href="/contact" 
            onClick={() => setIsOpen(false)}
            className="font-medium text-slate-700 hover:text-blue-600 transition-colors py-1"
          >
            Contact Me
          </Link>
        </div>
      )}
    </nav>
  );
}
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Link from 'next/link';
import ChatWidget from '@/components/chatwidget';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Hafizi Malik',
  description: 'My portfolio',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-50 text-slate-900`}>
        
        {/* HORIZONTAL NAVIGATION BAR */}
        <nav className="w-full bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-8 h-16 flex items-center justify-between">
            
            {/* Logo and Name Container */}
            <div className="flex items-center gap-3">
              <img 
                src="/logo.png" 
                alt="Logo" 
                className="h-12 w-12 object-contain" 
              />
              <div className="text-slate-900 font-bold text-2xl tracking-tight">Hafizi Malik</div>
            </div>

            <div className="flex gap-6 font-medium text-sm text-slate-600">
              <Link href="/" className="hover:text-blue-600 transition-colors">About Me</Link>
              <Link href="/projects" className="hover:text-blue-600 transition-colors">Projects</Link>
              <Link href="/awards" className="hover:text-blue-600 transition-colors">Awards</Link>
              {/* <Link href="/blog" className="hover:text-blue-600 transition-colors">Blog</Link>? */}
              <Link href="/playground" className="hover:text-blue-600 transition-colors">Playground</Link>
              <Link href="/contact" className="hover:text-blue-600 transition-colors">Contact Me</Link>
            </div>
          </div>
        </nav>

        {/* PAGE CONTENT GOES HERE */}
        <main>
          {children}
        </main>

        <ChatWidget />

      </body>
    </html>
  );
}
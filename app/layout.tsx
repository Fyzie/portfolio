import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import ChatWidget from '@/components/chatwidget';
import NotificationBanner from '@/components/notificationbanner';
import Navbar from '@/components/navbar';
import Dock from '@/components/dock';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Hafizi Malik | AI & Mechatronics Engineer',
  description: 'Portfolio of Hafizi Malik — Artificial Intelligence Engineer & Mechatronics Specialist focusing on industrial machine vision, edge AI deployment, and automated systems.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} min-h-screen bg-[#FDFBF7] text-[#372C2E] antialiased selection:bg-[#FDF6E9] selection:text-[#7A431D]`}>
        
        {/* RESPONSIVE NAVIGATION BAR */}
        <Navbar />

        {/* PAGE CONTENT */}
        <main className="pb-24 sm:pb-32">
          {children}
        </main>

        {/* FLOATING NAVIGATION DOCK */}
        <Dock />

        {/* AI CHAT WIDGET */}
        <ChatWidget />

      </body>
    </html>
  );
}
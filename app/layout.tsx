import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import ChatWidget from '@/components/chatwidget';
import NotificationBanner from '@/components/notificationbanner';
import Navbar from '@/components/navbar';

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
        
        {/* CLIENT BANNER COMPONENT */}
        <NotificationBanner />

        {/* RESPONSIVE NAVIGATION BAR */}
        <Navbar />

        {/* PAGE CONTENT */}
        <main>
          {children}
        </main>

        <ChatWidget />

      </body>
    </html>
  );
}
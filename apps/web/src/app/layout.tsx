import type { Metadata } from 'next';
import { DM_Sans, Manrope, Geist_Mono } from 'next/font/google';
import './globals.css';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: { default: 'Executive Match', template: '%s | Executive Match' },
  description: 'A clearer, evidence-driven way to connect talent and opportunity.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${manrope.variable} ${geistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}


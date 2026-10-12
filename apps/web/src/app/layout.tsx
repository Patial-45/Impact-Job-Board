import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Inter, Geist_Mono } from 'next/font/google';
import './globals.css';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: { default: 'Executive Match', template: '%s | Executive Match' },
  description: 'Next-generation executive talent acquisition, AI semantic matching & hiring intelligence.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} ${inter.variable} ${geistMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}


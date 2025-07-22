import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Fin Studio - AI-Powered Investment Research & Analysis',
  description: 'Advanced investment analysis platform powered by AI agents using A2A protocol',
  keywords: ['fintech', 'investment', 'AI', 'analysis', 'A2A protocol'],
  authors: [{ name: 'Fin Studio Team' }],
  openGraph: {
    title: 'Fin Studio - AI-Powered Investment Research & Analysis',
    description: 'Advanced investment analysis platform powered by AI agents',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-900">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
} 
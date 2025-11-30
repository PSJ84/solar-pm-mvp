// apps/web/app/layout.tsx
import type { Metadata } from 'next';
import { Providers } from '@/lib/providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'Solar PM - 태양광 프로젝트 관리',
  description: '태양광 발전소 인허가 및 시공 프로젝트 관리 시스템',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-slate-50">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

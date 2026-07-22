import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'نظام إدارة إيجارات العمارات',
  description: 'نظام متكامل لإدارة العمارات والوحدات والمستأجرين',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen bg-background">
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PostCare — 您的全旅程AI守护者',
  description: '覆盖诊前准备、诊后理解、回家管理、复查追踪、复诊准备的完整就医旅程AI助手',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className="h-full">
      <body className="min-h-full bg-background text-text antialiased">
        {children}
      </body>
    </html>
  );
}

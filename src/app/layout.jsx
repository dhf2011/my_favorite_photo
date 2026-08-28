import './globals.css';
import { BackendStatusProvider } from '@/components/providers/BackendStatusProvider';

export const metadata = {
  title: '최애의 포토',
  description: '개인용 디지털 사진첩 생성 플랫폼',
  icons: {
    icon: [{ url: '/assets/logos/logo.svg', type: 'image/svg+xml' }],
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body className="bg-neutral-950 text-white">
        <BackendStatusProvider>{children}</BackendStatusProvider>
      </body>
    </html>
  );
}

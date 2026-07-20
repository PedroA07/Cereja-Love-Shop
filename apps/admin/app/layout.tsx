import type { Metadata } from 'next';
// Fonte self-hosted (@fontsource) — build sem dependência de rede
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'Cereja — Admin',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-offwhite text-ink antialiased">{children}</body>
    </html>
  );
}

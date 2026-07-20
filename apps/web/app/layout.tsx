import type { Metadata, Viewport } from 'next';
// Fontes self-hosted (@fontsource) — build sem dependência de rede
import '@fontsource/cormorant-garamond/500.css';
import '@fontsource/cormorant-garamond/600.css';
import '@fontsource/cormorant-garamond/700.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import './globals.css';

export const metadata: Metadata = {
  // Título neutro por discrição (§1.2) — sem termos explícitos em abas/histórico
  title: 'Cereja Love Shop',
  description: 'Bem-estar, autoestima e liberdade. Entrega discreta em todo o Brasil.',
};

export const viewport: Viewport = {
  themeColor: '#fcfcfc',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-offwhite text-ink antialiased">{children}</body>
    </html>
  );
}

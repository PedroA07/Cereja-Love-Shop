import type { Metadata, Viewport } from 'next';
// Fontes self-hosted (@fontsource) — build sem dependência de rede
// Títulos: Playfair Display · Texto: Mulish
import '@fontsource/playfair-display/500.css';
import '@fontsource/playfair-display/600.css';
import '@fontsource/playfair-display/700.css';
import '@fontsource/playfair-display/500-italic.css';
import '@fontsource/mulish/400.css';
import '@fontsource/mulish/500.css';
import '@fontsource/mulish/600.css';
import '@fontsource/mulish/700.css';
import './globals.css';
import { AuthProvider } from '@/features/auth/auth-context';

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
      <body className="min-h-screen bg-offwhite text-ink antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

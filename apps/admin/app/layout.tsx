import type { Metadata } from 'next';
// Fonte self-hosted (@fontsource) — build sem dependência de rede
import '@fontsource/mulish/400.css';
import '@fontsource/mulish/500.css';
import '@fontsource/mulish/600.css';
import '@fontsource/mulish/700.css';
import './globals.css';
import { StaffAuthProvider } from '@/features/auth/staff-auth-context';
import { AdminShell } from '@/components/admin-shell';

export const metadata: Metadata = {
  title: 'Cereja — Admin',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-creme/20 text-ink antialiased">
        <StaffAuthProvider>
          <AdminShell>{children}</AdminShell>
        </StaffAuthProvider>
      </body>
    </html>
  );
}

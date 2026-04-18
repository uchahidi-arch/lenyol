import type { Metadata } from 'next';
import { AppStateProvider } from '@/hooks/useAppState';
import { AuthProvider } from '@/hooks/useAuth';
import './globals.css';

export const metadata: Metadata = {
  title: 'Lenyol — Généalogie Sénégalaise',
  description: 'Plateforme de mémoire généalogique sénégalaise',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <AppStateProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </AppStateProvider>
      </body>
    </html>
  );
}

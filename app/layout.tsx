import type { Metadata } from 'next';
import { AppStateProvider } from '@/hooks/useAppState';
import { AuthProvider } from '@/hooks/useAuth';
import './globals.css';

export const metadata: Metadata = {
  title: 'Aswilia',
  description: 'Plateforme de mémoire généalogique comorienne',
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

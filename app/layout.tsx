import type { Metadata } from 'next';
import { AppStateProvider } from '@/hooks/useAppState';
import { AuthProvider } from '@/hooks/useAuth';
import { ThemeProvider } from '@/hooks/useTheme';
import './globals.css';

export const metadata: Metadata = {
  title: 'Lenyol — Généalogie Comorienne',
  description: 'Plateforme de mémoire généalogique comorienne',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body>
<ThemeProvider>
          <AppStateProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </AppStateProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

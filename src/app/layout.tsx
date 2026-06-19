import '../index.css';
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

export const metadata = {
  title: 'Siga - Painel Administrativo',
  description: 'Painel de Moderação e Controle da Plataforma Siga',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body>
        <div id="root">
          {children}
        </div>
      </body>
    </html>
  );
}

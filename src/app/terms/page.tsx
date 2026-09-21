import type { Metadata } from 'next';
import TermsClient from './TermsClient';

export const metadata: Metadata = {
  title: 'Termos de Uso e Política de Privacidade | Siga',
  description: 'Conheça os Termos de Uso e a Política de Privacidade da Plataforma Siga. Transparência, direitos e deveres em conformidade com a LGPD.',
  keywords: ['Termos de Uso', 'Política de Privacidade', 'Siga', 'LGPD', 'Regulamento', 'Segurança'],
  openGraph: {
    title: 'Termos de Uso e Política de Privacidade | Siga',
    description: 'Políticas de uso e privacidade da plataforma Siga.',
    type: 'website',
  },
};

export default function TermsPage() {
  return <TermsClient />;
}

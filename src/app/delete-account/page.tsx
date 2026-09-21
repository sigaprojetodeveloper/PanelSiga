import type { Metadata } from 'next';
import DeleteAccountClient from './DeleteAccountClient';

export const metadata: Metadata = {
  title: 'Exclusão de Conta e Dados Pessoais | Siga',
  description: 'Solicite a exclusão definitiva da sua conta e dados pessoais do ecossistema Siga, conforme as diretrizes da LGPD e Google Play Store.',
  keywords: ['Exclusão de Conta', 'Deletar Conta', 'LGPD', 'Siga', 'Direito ao Esquecimento'],
  robots: 'index, follow',
};

export default function DeleteAccountPage() {
  return <DeleteAccountClient />;
}

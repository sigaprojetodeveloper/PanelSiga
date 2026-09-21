"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  FileText, 
  Lock, 
  Scale, 
  Users, 
  AlertCircle, 
  ChevronRight, 
  ArrowLeft, 
  Printer, 
  Sparkles,
  Search,
  CheckCircle2,
  Mail,
  Building2
} from 'lucide-react';
import logoImg from '../../assets/logo.png';

export default function TermsClient() {
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>('terms');
  const [searchQuery, setSearchQuery] = useState('');

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      backgroundColor: 'var(--bg-app)',
      color: 'var(--text-main)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Top Header Bar */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-light)',
        padding: '14px 24px'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link 
              href="/login" 
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-light)',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-main)',
                textDecoration: 'none',
                fontSize: '13px',
                fontWeight: 600,
                transition: 'var(--transition-smooth)'
              }}
            >
              <ArrowLeft size={16} />
              <span>Voltar</span>
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoImg.src} alt="Siga Logo" style={{ height: '36px', objectFit: 'contain' }} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ 
                  fontWeight: 800, 
                  fontSize: '18px', 
                  fontFamily: 'var(--font-title)',
                  lineHeight: '1.1',
                  background: 'linear-gradient(135deg, var(--primary), hsl(0, 75%, 35%))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  SIGA
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>
                  Portal de Transparência & Legalidade
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={handlePrint}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-light)',
                color: 'var(--text-main)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
              title="Imprimir ou Salvar como PDF"
            >
              <Printer size={15} />
              <span className="hide-mobile">Imprimir / PDF</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(180deg, #ffffff 0%, var(--bg-app) 100%)',
        padding: '50px 24px 30px',
        borderBottom: '1px solid var(--border-light)'
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            backgroundColor: 'var(--primary-light)',
            borderRadius: 'var(--radius-full)',
            color: 'var(--primary)',
            fontSize: '12px',
            fontWeight: 700,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            marginBottom: '16px'
          }}>
            <Sparkles size={14} />
            Termos Oficiais & Conformidade LGPD
          </div>

          <h1 style={{
            fontSize: 'clamp(28px, 4vw, 42px)',
            fontWeight: 800,
            fontFamily: 'var(--font-title)',
            color: 'var(--text-main)',
            lineHeight: '1.2',
            marginBottom: '16px'
          }}>
            Termos de Uso e Políticas de Privacidade
          </h1>

          <p style={{
            fontSize: '16px',
            color: 'var(--text-muted)',
            maxWidth: '680px',
            margin: '0 auto 28px',
            lineHeight: '1.6'
          }}>
            Conheça as regras, diretrizes, direitos e deveres para utilização dos aplicativos e serviços da plataforma Siga. Nosso compromisso é com a transparência e a segurança dos seus dados.
          </p>

          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '16px',
            fontSize: '13px',
            color: 'var(--text-muted)',
            flexWrap: 'wrap'
          }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={16} color="var(--success)" />
              Versão 2.4 (Válida para 2026)
            </span>
            <span>•</span>
            <span>Última atualização: 20 de Março de 2026</span>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main style={{
        maxWidth: '1200px',
        width: '100%',
        margin: '0 auto',
        padding: '36px 24px 80px',
        flex: 1
      }}>
        {/* Navigation Tabs */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '32px'
        }}>
          <div style={{
            display: 'inline-flex',
            backgroundColor: 'var(--bg-card)',
            padding: '6px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-light)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <button
              onClick={() => setActiveTab('terms')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 24px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                backgroundColor: activeTab === 'terms' ? 'var(--primary)' : 'transparent',
                color: activeTab === 'terms' ? '#fff' : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'var(--transition-smooth)'
              }}
            >
              <FileText size={18} />
              Termos de Uso
            </button>
            <button
              onClick={() => setActiveTab('privacy')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 24px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                backgroundColor: activeTab === 'privacy' ? 'var(--primary)' : 'transparent',
                color: activeTab === 'privacy' ? '#fff' : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'var(--transition-smooth)'
              }}
            >
              <Lock size={18} />
              Política de Privacidade (LGPD)
            </button>
          </div>
        </div>

        {/* Dynamic Section: Terms or Privacy */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 300px',
          gap: '32px',
          alignItems: 'start'
        }} className="terms-grid-layout">
          {/* Main Document Content */}
          <div style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-light)',
            padding: '40px',
            boxShadow: 'var(--shadow-sm)',
            lineHeight: '1.7',
            fontSize: '15px'
          }}>
            {activeTab === 'terms' ? (
              <div className="policy-content">
                <div style={{
                  paddingBottom: '24px',
                  borderBottom: '1px solid var(--border-light)',
                  marginBottom: '32px'
                }}>
                  <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
                    Termos e Condições Gerais de Uso
                  </h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                    Estes termos regem o uso do aplicativo móvel, serviços do ecossistema SIGA e painéis administrativos para cidadãos, clientes, parceiros comerciais e prestadores.
                  </p>
                </div>

                <section id="aceite" style={{ marginBottom: '32px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Scale size={18} /> 1. Aceitação dos Termos
                  </h3>
                  <p style={{ marginBottom: '12px' }}>
                    Ao criar uma conta ou utilizar qualquer produto ou serviço da <strong>Plataforma SIGA</strong> (incluindo autenticação com Google, e-mail ou telefone), você confirma que leu, compreendeu e concorda integralmente com todos os termos e diretrizes aqui dispostos.
                  </p>
                  <p>
                    Caso não concorde com qualquer disposição destes Termos de Uso, solicitamos que interrompa imediatamente o uso de nossos serviços e cancele eventuais solicitações de cadastro.
                  </p>
                </section>

                <section id="elegibilidade" style={{ marginBottom: '32px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Users size={18} /> 2. Elegibilidade e Cadastro
                  </h3>
                  <p style={{ marginBottom: '12px' }}>
                    Para utilizar as funcionalidades interativas, cadastrar comércios, solicitar orçamentos ou publicar conteúdos, o usuário deve:
                  </p>
                  <ul style={{ paddingLeft: '24px', marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <li>Ter no mínimo 18 (dezoito) anos de idade ou ser emancipado legalmente conforme as leis da República Federativa do Brasil;</li>
                    <li>Fornecer informações cadastrais autênticas, completas e mantê-las atualizadas;</li>
                    <li>Zelar pela confidencialidade e segurança de suas credenciais de acesso, sendo o único responsável por todas as atividades efetuadas sob sua conta;</li>
                    <li>Não utilizar nomes de terceiros, identidades falsas ou marcas não autorizadas.</li>
                  </ul>
                </section>

                <section id="comercios" style={{ marginBottom: '32px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Building2 size={18} /> 3. Cadastro de Estabelecimentos e Prestadores
                  </h3>
                  <p style={{ marginBottom: '12px' }}>
                    Os lojistas, comércios locais e prestadores de serviços parceiros reconhecem que:
                  </p>
                  <ul style={{ paddingLeft: '24px', marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <li>Possuem total responsabilidade jurídica e tributária sobre a qualidade, garantia, preço e entrega das mercadorias e serviços ofertados na plataforma;</li>
                    <li>A Plataforma SIGA atua primariamente como um canal de descoberta, ponte de comunicação e vitrine regional, não constituindo sociedade ou vínculo empregatício;</li>
                    <li>Informações enganosas, imagens abusivas ou cobranças indevidas ensejarão a imediata suspensão ou banimento da loja ou anúncio.</li>
                  </ul>
                </section>

                <section id="regras-conduta" style={{ marginBottom: '32px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertCircle size={18} /> 4. Condutas Vedadas e Diretrizes da Comunidade
                  </h3>
                  <p style={{ marginBottom: '12px' }}>É terminantemente proibido:</p>
                  <ul style={{ paddingLeft: '24px', marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <li>Publicar conteúdo com teor calunioso, difamatório, discriminatório, pornográfico ou que incite a violência;</li>
                    <li>Tentar violar a segurança, interceptar tráfego, executar engenharia reversa ou sobrecarregar a infraestrutura de servidores da plataforma;</li>
                    <li>Fazer uso de robôs (bots), raspadores de dados (scrapers) ou métodos automáticos de extração sem prévia e expressa autorização;</li>
                    <li>Fraudar avaliações, feedbacks de clientes ou metricas de audiência e stories.</li>
                  </ul>
                </section>

                <section id="moderacao" style={{ marginBottom: '32px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldCheck size={18} /> 5. Moderação Administrativa e Suspensão
                  </h3>
                  <p style={{ marginBottom: '12px' }}>
                    A equipe de Moderação do SIGA reserva-se o direito soberano de remover conteúdos, suspender perfis temporariamente ou bloquear estabelecimentos e contas de forma definitiva caso haja indício substancial ou denúncia comprovada de infração aos Termos de Uso ou legislação vigente.
                  </p>
                </section>

                <section id="propriedade" style={{ marginBottom: '32px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Scale size={18} /> 6. Propriedade Intelectual
                  </h3>
                  <p>
                    A marca <strong>SIGA</strong>, logotipos, arquitetura de software, design de interface e códigos-fonte são de propriedade exclusiva de seus desenvolvedores e detentores legais, protegidos pela Lei de Propriedade Industrial (Lei nº 9.279/96) e Lei de Software (Lei nº 9.609/98).
                  </p>
                </section>

                <section id="foro">
                  <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Scale size={18} /> 7. Legislação Aplicável e Foro
                  </h3>
                  <p>
                    Estes Termos são regidos integralmente pelas Leis da República Federativa do Brasil. Para a resolução de eventuais litígios que não possam ser solucionados consensualmente, fica eleito o Foro da Comarca competente do domicílio do consumidor ou sede de operação.
                  </p>
                </section>
              </div>
            ) : (
              <div className="policy-content">
                <div style={{
                  paddingBottom: '24px',
                  borderBottom: '1px solid var(--border-light)',
                  marginBottom: '32px'
                }}>
                  <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
                    Política de Privacidade e Proteção de Dados (LGPD)
                  </h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                    Em conformidade estrita com a Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018 - LGPD).
                  </p>
                </div>

                <section id="dados-coletados" style={{ marginBottom: '32px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Lock size={18} /> 1. Dados que Coletamos
                  </h3>
                  <p style={{ marginBottom: '12px' }}>
                    Para fornecer uma experiência segura e personalizada no ecossistema SIGA, podemos coletar:
                  </p>
                  <ul style={{ paddingLeft: '24px', marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <li><strong>Dados de Identificação:</strong> Nome completo, endereço de e-mail, foto de perfil (quando fornecida via Google Auth) e número de telefone celular;</li>
                    <li><strong>Dados de Estabelecimentos:</strong> Razão social, nome fantasia, CNPJ/CPF, categoria de atuação, endereço comercial e catálogo de produtos/serviços;</li>
                    <li><strong>Dados de Navegação e Dispositivo:</strong> Endereço IP aproximado, registros de data/hora de acesso, tipo de navegador e identificadores únicos de sessão;</li>
                    <li><strong>Geolocalização:</strong> Utilizada somente quando expressamente autorizada pelo usuário no dispositivo móvel para exibição de estabelecimentos nas proximidades.</li>
                  </ul>
                </section>

                <section id="finalidade" style={{ marginBottom: '32px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={18} /> 2. Finalidade e Base Legal do Tratamento
                  </h3>
                  <p style={{ marginBottom: '12px' }}>
                    O tratamento de seus dados apoia-se nas bases legais do artigo 7º da LGPD:
                  </p>
                  <ul style={{ paddingLeft: '24px', marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <li><strong>Execução de Contrato:</strong> Viabilizar login, autenticação segura, gestão de comércios e entrega das funcionalidades solicitadas;</li>
                    <li><strong>Cumprimento de Obrigação Legal:</strong> Guarda obrigatória de registros de conexão conforme exigido pelo Marco Civil da Internet (Lei nº 12.965/2014);</li>
                    <li><strong>Legítimo Interesse:</strong> Prevenção a fraudes, moderação contra abusos no sistema e aprimoramento contínuo de usabilidade.</li>
                  </ul>
                </section>

                <section id="seguranca-armazenamento" style={{ marginBottom: '32px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldCheck size={18} /> 3. Armazenamento e Segurança da Informação
                  </h3>
                  <p style={{ marginBottom: '12px' }}>
                    Seus dados são armazenados em infraestrutura de nuvem segura com criptografia em trânsito (HTTPS / TLS 1.3) e em repouso (AES-256).
                  </p>
                  <p>
                    Adotamos políticas rígidas de segurança com Row-Level Security (RLS) no banco de dados Postgres/Supabase, garantindo que nenhum usuário tenha acesso desautorizado aos dados restritos de outros.
                  </p>
                </section>

                <section id="compartilhamento" style={{ marginBottom: '32px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Users size={18} /> 4. Compartilhamento de Dados com Terceiros
                  </h3>
                  <p style={{ marginBottom: '12px' }}>
                    <strong>Não vendemos nem comercializamos dados pessoais de usuários.</strong>
                  </p>
                  <p>
                    O compartilhamento ocorre exclusivamente com fornecedores de infraestrutura técnica (serviços de hospedagem em nuvem, provedor de autenticação e envio de notificações) necessários para a operação do aplicativo, bem como para cumprimento de ordens judiciais expedidas por autoridades competentes.
                  </p>
                </section>

                <section id="direitos-titular" style={{ marginBottom: '32px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Scale size={18} /> 5. Direitos do Titular de Dados
                  </h3>
                  <p style={{ marginBottom: '12px' }}>
                    Em conformidade com o art. 18 da LGPD, você tem direito a qualquer momento de:
                  </p>
                  <ul style={{ paddingLeft: '24px', marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <li>Confirmar a existência de tratamento e solicitar acesso aos seus dados;</li>
                    <li>Requerer a correção de dados incompletos, inexatos ou desatualizados;</li>
                    <li>Solicitar a anonimização, bloqueio ou eliminação de dados desnecessários;</li>
                    <li>Revogar o consentimento ou pedir exclusão definitiva de sua conta.</li>
                  </ul>
                </section>

                <section id="dpo-contato">
                  <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Mail size={18} /> 6. Contato com o Encarregado de Dados (DPO)
                  </h3>
                  <p style={{ marginBottom: '12px' }}>
                    Para exercer seus direitos como titular ou esclarecer qualquer dúvida referente à proteção de seus dados pessoais, entre em contato com nosso canal de privacidade:
                  </p>
                  <div style={{
                    padding: '16px 20px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-app)',
                    border: '1px solid var(--border-light)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <Mail size={20} color="var(--primary)" />
                    <div>
                      <div style={{ fontWeight: 600 }}>Encarregado de Proteção de Dados (DPO) / Suporte</div>
                      <a href="mailto:comunicacao@softsiga.com.br" style={{ fontSize: '14px', color: 'var(--primary)', textDecoration: 'underline' }}>
                        comunicacao@softsiga.com.br
                      </a>
                    </div>
                  </div>
                </section>
              </div>
            )}
          </div>

          {/* Sidebar Quick Navigation & Highlights */}
          <aside style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Quick summary card */}
            <div style={{
              backgroundColor: 'var(--bg-card)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
              padding: '24px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <h4 style={{
                fontSize: '15px',
                fontWeight: 700,
                marginBottom: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--text-main)'
              }}>
                <ShieldCheck size={18} color="var(--primary)" />
                Sumário Rápido
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px', color: 'var(--text-muted)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <CheckCircle2 size={16} color="var(--success)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span><strong>Transparência total</strong> no armazenamento e no tratamento de perfis e lojas.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <CheckCircle2 size={16} color="var(--success)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span><strong>Zero venda de dados</strong> para fins publicitários externos não consentidos.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <CheckCircle2 size={16} color="var(--success)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span><strong>Direito de exclusão:</strong> elimine sua conta e dados a qualquer instante.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <CheckCircle2 size={16} color="var(--success)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span><strong>Auditoria contínua:</strong> equipe de moderação ativa contra fraudes e abusos.</span>
                </div>
              </div>
            </div>

            {/* Need help card */}
            <div style={{
              backgroundColor: 'var(--bg-card)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
              padding: '24px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <h4 style={{
                fontSize: '15px',
                fontWeight: 700,
                marginBottom: '10px',
                color: 'var(--text-main)'
              }}>
                Precisa de auxílio legal?
              </h4>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: '1.5' }}>
                Tem dúvidas sobre como os termos se aplicam ao seu negócio ou perfil de usuário?
              </p>
              <a
                href="mailto:comunicacao@softsiga.com.br?subject=D%C3%BAvida%20sobre%20Termos%20e%20Pol%C3%ADticas%20-%20Siga"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '10px 16px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg-app)',
                  border: '1px solid var(--border-light)',
                  color: 'var(--text-main)',
                  textDecoration: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                  transition: 'var(--transition-smooth)'
                }}
              >
                <Mail size={15} />
                <span>Falar com Suporte</span>
              </a>
            </div>
          </aside>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        backgroundColor: '#ffffff',
        borderTop: '1px solid var(--border-light)',
        padding: '32px 24px',
        marginTop: 'auto'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          fontSize: '13px',
          color: 'var(--text-muted)'
        }}>
          <div>
            © {new Date().getFullYear()} Plataforma SIGA. Todos os direitos reservados.
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <button 
              onClick={() => { setActiveTab('terms'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '13px' }}
            >
              Termos de Uso
            </button>
            <button 
              onClick={() => { setActiveTab('privacy'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '13px' }}
            >
              Política de Privacidade
            </button>
            <Link href="/login" style={{ color: 'inherit', textDecoration: 'none' }}>
              Acesso Administrativo
            </Link>
          </div>
        </div>
      </footer>

      {/* Media Queries & Responsive styling */}
      <style jsx global>{`
        @media (max-width: 900px) {
          .terms-grid-layout {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 600px) {
          .hide-mobile {
            display: none !important;
          }
        }
        @media print {
          header, footer, aside, button {
            display: none !important;
          }
          main {
            padding: 0 !important;
          }
          .terms-grid-layout {
            display: block !important;
          }
          body, html {
            background-color: #fff !important;
            color: #000 !important;
          }
        }
      `}</style>
    </div>
  );
}

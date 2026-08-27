#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const targetEnv = process.argv[2]?.toLowerCase();

const ENV_FILES = {
  dev: '.env.development',
  development: '.env.development',
  prod: '.env.production',
  production: '.env.production',
};

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';

function getEnvSummary(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const urlLine = lines.find((l) => l.startsWith('SIGA_SUPABASE_URL='));
  const envLine = lines.find((l) => l.startsWith('SIGA_STORAGE_ENV='));

  return {
    url: urlLine ? urlLine.split('=')[1]?.trim() : 'N/A',
    storageEnv: envLine ? envLine.split('=')[1]?.trim() : 'N/A',
  };
}

function showStatus() {
  const localPath = path.join(rootDir, '.env.local');
  const devPath = path.join(rootDir, '.env.development');
  const prodPath = path.join(rootDir, '.env.production');

  console.log(`\n${BOLD}${CYAN}=== SIGA PANEL ADMIN - STATUS DE AMBIENTE ===${RESET}`);

  if (!fs.existsSync(localPath)) {
    console.log(`${YELLOW}⚠️  Nenhum .env.local configurado.${RESET}`);
    console.log(`   O Next.js utilizará o padrão nativo (${CYAN}.env.development${RESET} em dev ou ${CYAN}.env.production${RESET} em build).\n`);
  } else {
    const localSummary = getEnvSummary(localPath);
    const devSummary = getEnvSummary(devPath);
    const prodSummary = getEnvSummary(prodPath);

    let detected = 'Personalizado / Desconhecido';
    if (localSummary && devSummary && localSummary.url === devSummary.url) {
      detected = `${GREEN}DESENVOLVIMENTO (develop)${RESET}`;
    } else if (localSummary && prodSummary && localSummary.url === prodSummary.url) {
      detected = `${RED}${BOLD}PRODUÇÃO (production)${RESET}`;
    }

    console.log(`Ambiente Ativo (.env.local): ${detected}`);
    console.log(`- Supabase URL : ${CYAN}${localSummary?.url}${RESET}`);
    console.log(`- Storage Env  : ${CYAN}${localSummary?.storageEnv}${RESET}\n`);
  }
}

if (!targetEnv || targetEnv === 'status') {
  showStatus();
  process.exit(0);
}

const sourceFileName = ENV_FILES[targetEnv];

if (!sourceFileName) {
  console.error(`\n${RED}❌ Ambiente inválido: "${targetEnv}"${RESET}`);
  console.log(`Opções válidas: ${GREEN}dev${RESET} (development) | ${RED}prod${RESET} (production) | ${CYAN}status${RESET}\n`);
  process.exit(1);
}

const sourcePath = path.join(rootDir, sourceFileName);
const destPath = path.join(rootDir, '.env.local');

if (!fs.existsSync(sourcePath)) {
  console.error(`\n${RED}❌ Arquivo de origem não encontrado: ${sourceFileName}${RESET}\n`);
  process.exit(1);
}

try {
  fs.copyFileSync(sourcePath, destPath);
  const summary = getEnvSummary(destPath);

  const isProd = targetEnv === 'prod' || targetEnv === 'production';

  console.log('\n======================================================');
  if (isProd) {
    console.log(`${RED}${BOLD}🚨 ATENÇÃO: AMBIENTE ALTERADO PARA PRODUÇÃO! 🚨${RESET}`);
    console.log(`${YELLOW}Qualquer alteração afetará dados reais de usuários e empresas.${RESET}`);
  } else {
    console.log(`${GREEN}${BOLD}✅ AMBIENTE ALTERADO COM SUCESSO! ✅${RESET}`);
  }
  console.log('======================================================');
  console.log(`Arquivo Ativo  : ${BOLD}.env.local${RESET} (copiado de ${CYAN}${sourceFileName}${RESET})`);
  console.log(`Supabase URL   : ${CYAN}${summary?.url}${RESET}`);
  console.log(`Storage Env    : ${CYAN}${summary?.storageEnv}${RESET}`);
  console.log('======================================================\n');
} catch (err) {
  console.error(`\n${RED}❌ Erro ao trocar ambiente:${RESET}`, err.message);
  process.exit(1);
}

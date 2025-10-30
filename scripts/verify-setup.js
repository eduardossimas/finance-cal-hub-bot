#!/usr/bin/env node

/**
 * Script de verificação de setup do Finance Cal Hub Bot
 * Verifica se todas as dependências e configurações estão corretas
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando setup do Finance Cal Hub Bot...\n');

let errors = 0;
let warnings = 0;

// 1. Verificar .env
console.log('1️⃣ Verificando arquivo .env...');
const envPath = path.join(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
  console.log('   ❌ Arquivo .env não encontrado!');
  console.log('   💡 Execute: cp .env.example .env');
  errors++;
} else {
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  const requiredVars = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'GEMINI_API_KEY'
  ];
  
  for (const varName of requiredVars) {
    if (!envContent.includes(`${varName}=`) || envContent.includes(`${varName}=sua-`)) {
      console.log(`   ⚠️ ${varName} não está configurada`);
      warnings++;
    } else {
      console.log(`   ✅ ${varName} configurada`);
    }
  }
}

// 2. Verificar node_modules
console.log('\n2️⃣ Verificando dependências...');
const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  console.log('   ❌ node_modules não encontrado!');
  console.log('   💡 Execute: npm install');
  errors++;
} else {
  const criticalDeps = [
    '@whiskeysockets/baileys',
    '@google/generative-ai',
    '@supabase/supabase-js'
  ];
  
  for (const dep of criticalDeps) {
    const depPath = path.join(nodeModulesPath, dep);
    if (fs.existsSync(depPath)) {
      console.log(`   ✅ ${dep}`);
    } else {
      console.log(`   ❌ ${dep} não instalado`);
      errors++;
    }
  }
}

// 3. Verificar estrutura de pastas
console.log('\n3️⃣ Verificando estrutura do projeto...');
const requiredDirs = [
  'src',
  'src/bot',
  'src/config',
  'src/services',
  'src/scheduler',
  'src/types'
];

for (const dir of requiredDirs) {
  const dirPath = path.join(__dirname, '..', dir);
  if (fs.existsSync(dirPath)) {
    console.log(`   ✅ ${dir}/`);
  } else {
    console.log(`   ❌ ${dir}/ não encontrado`);
    errors++;
  }
}

// 4. Verificar arquivos principais
console.log('\n4️⃣ Verificando arquivos principais...');
const requiredFiles = [
  'src/index.ts',
  'src/bot/whatsapp.ts',
  'src/bot/handlers.ts',
  'src/services/gemini.ts',
  'src/services/activities.ts',
  'src/config/supabase.ts'
];

for (const file of requiredFiles) {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    console.log(`   ✅ ${file}`);
  } else {
    console.log(`   ❌ ${file} não encontrado`);
    errors++;
  }
}

// Resultado final
console.log('\n' + '='.repeat(50));
if (errors === 0 && warnings === 0) {
  console.log('✅ Tudo pronto! Execute: npm run dev');
} else if (errors === 0) {
  console.log(`⚠️ ${warnings} aviso(s) encontrado(s)`);
  console.log('💡 Configure as variáveis de ambiente no .env');
} else {
  console.log(`❌ ${errors} erro(s) e ${warnings} aviso(s) encontrado(s)`);
  console.log('💡 Corrija os problemas acima antes de continuar');
}
console.log('='.repeat(50) + '\n');

process.exit(errors > 0 ? 1 : 0);

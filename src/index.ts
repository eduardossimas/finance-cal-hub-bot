import dotenv from 'dotenv';
import { startWhatsAppBot } from './bot/whatsapp';
import { setupDailyScheduler } from './scheduler/daily';

// Carregar variáveis de ambiente
dotenv.config();

console.log('🚀 Iniciando Finance Cal Hub WhatsApp Bot...\n');

async function main() {
  try {
    // Verificar variáveis obrigatórias
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      throw new Error('❌ SUPABASE_URL e SUPABASE_ANON_KEY são obrigatórias no arquivo .env');
    }

    if (!process.env.GEMINI_API_KEY) {
      throw new Error('❌ GEMINI_API_KEY é obrigatória no arquivo .env');
    }

    console.log('✅ Variáveis de ambiente carregadas');
    console.log('✅ Conectando ao WhatsApp...\n');

    // Iniciar bot WhatsApp
    const sock = await startWhatsAppBot();

    // Configurar scheduler de resumos diários
    setupDailyScheduler(sock);

    console.log('\n✅ Bot iniciado com sucesso!');
    console.log('📱 Envie uma mensagem via WhatsApp para começar');
    console.log('💡 Comandos: hoje, pendentes, fazendo, resumo, ajuda\n');

    // Manter processo rodando
    process.on('SIGINT', () => {
      console.log('\n\n👋 Encerrando bot...');
      process.exit(0);
    });
  } catch (error: any) {
    console.error('❌ Erro fatal:', error.message);
    process.exit(1);
  }
}

main();

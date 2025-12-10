import dotenv from 'dotenv';
import { getUserIdByPhone } from '../src/services/activities';
import { processMessage } from '../src/bot/handlers';

dotenv.config();

async function testNewCommands() {
  console.log('🧪 Testando novos comandos e variações\n');
  
  const whatsappJid = '553291473412@s.whatsapp.net';
  const phone = whatsappJid.split('@')[0];
  const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;
  
  const userId = await getUserIdByPhone(formattedPhone);
  
  if (!userId) {
    console.log('❌ Usuário não encontrado!');
    return;
  }
  
  const testCases = [
    { category: 'HOJE - Variações', messages: [
      'hoje',
      'quais minhas atividades de hoje',
      'me mostra as tarefas de hoje',
      'o que tenho hoje',
    ]},
    { category: 'AMANHÃ - Variações', messages: [
      'amanhã',
      'quais minhas atividades de amanhã',
      'me mostra as tarefas de amanha',
      'o que tenho amanhã',
    ]},
    { category: 'PENDENTES - Variações', messages: [
      'pendentes',
      'quais minhas tarefas pendentes',
      'me mostra as atividades em aberto',
    ]},
    { category: 'CONCLUIR - Por Número', messages: [
      'concluir 2',
      'finalizar tarefa 1',
      'completar 2',
      'feito 1',
      'ok 2',
      'marcar como concluída 1',
    ]},
  ];
  
  for (const testCase of testCases) {
    console.log('\n' + '='.repeat(80));
    console.log(`📂 ${testCase.category}`);
    console.log('='.repeat(80));
    
    for (const msg of testCase.messages) {
      console.log(`\n📨 "${msg}"`);
      
      const response = await processMessage(userId, msg);
      
      // Mostrar apenas as primeiras 3 linhas da resposta
      const lines = response.split('\n');
      const preview = lines.slice(0, 3).join('\n');
      console.log(`📤 ${preview}${lines.length > 3 ? '...' : ''}`);
    }
  }
}

testNewCommands()
  .then(() => {
    console.log('\n\n✅ Testes concluídos!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro:', error);
    process.exit(1);
  });

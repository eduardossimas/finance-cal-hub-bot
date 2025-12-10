import dotenv from 'dotenv';
import { getUserIdByPhone } from '../src/services/activities';
import { processMessage } from '../src/bot/handlers';

dotenv.config();

async function testMessages() {
  console.log('🧪 Testando diferentes mensagens para ver atividades de hoje\n');
  
  const whatsappJid = '553291473412@s.whatsapp.net';
  const phone = whatsappJid.split('@')[0];
  const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;
  
  const userId = await getUserIdByPhone(formattedPhone);
  
  if (!userId) {
    console.log('❌ Usuário não encontrado!');
    return;
  }
  
  const testMessages = [
    'hoje',
    'Quais sao minhas atividade de hoje',
    'minhas atividades de hoje',
    'o que tenho hoje',
    'atividades',
    'me mostra as tarefas de hoje',
  ];
  
  for (const msg of testMessages) {
    console.log('\n' + '='.repeat(80));
    console.log(`📨 Mensagem: "${msg}"`);
    console.log('='.repeat(80));
    
    const response = await processMessage(userId, msg);
    
    console.log('\n📤 Resposta:');
    console.log(response);
    console.log('\n');
  }
}

testMessages()
  .then(() => {
    console.log('\n✅ Testes concluídos!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro:', error);
    process.exit(1);
  });

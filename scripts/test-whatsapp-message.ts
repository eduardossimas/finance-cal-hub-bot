import dotenv from 'dotenv';
import { getUserIdByPhone } from '../src/services/activities';
import { handleTodayCommand } from '../src/bot/handlers';

dotenv.config();

async function testWhatsAppMessage() {
  console.log('📱 Testando mensagem do WhatsApp\n');
  console.log('='.repeat(60));
  
  const whatsappJid = '553291473412@s.whatsapp.net';
  const phone = whatsappJid.split('@')[0];
  const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;
  
  const userId = await getUserIdByPhone(formattedPhone);
  
  if (!userId) {
    console.log('❌ Usuário não encontrado!');
    return;
  }
  
  console.log('\nMensagem que seria enviada no WhatsApp:\n');
  console.log('='.repeat(60));
  
  const message = await handleTodayCommand(userId);
  
  console.log(message);
  console.log('\n' + '='.repeat(60));
}

testWhatsAppMessage()
  .then(() => {
    console.log('\n✅ Teste concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro:', error);
    process.exit(1);
  });

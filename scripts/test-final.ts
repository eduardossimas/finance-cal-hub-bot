import dotenv from 'dotenv';
import { getUserIdByPhone, getActivitiesToday } from '../src/services/activities';

dotenv.config();

async function testFinalFlow() {
  console.log('✅ TESTE FINAL - Identificação de Usuário e Atividades\n');
  console.log('='.repeat(60));
  
  // Simular número do WhatsApp de Eduardo
  const whatsappJid = '553291473412@s.whatsapp.net';
  const phone = whatsappJid.split('@')[0];
  const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;
  
  console.log(`\n1️⃣ Número do WhatsApp: ${whatsappJid}`);
  console.log(`   Formatado: ${formattedPhone}`);
  
  console.log(`\n2️⃣ Buscando usuário...`);
  const userId = await getUserIdByPhone(formattedPhone);
  
  if (!userId) {
    console.log('   ❌ FALHOU - Usuário não encontrado!');
    return;
  }
  
  console.log(`\n3️⃣ Buscando atividades de hoje...`);
  const activities = await getActivitiesToday(userId);
  
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 RESULTADO:');
  console.log(`   Total de atividades: ${activities.length}`);
  
  if (activities.length > 0) {
    console.log('\n   Atividades encontradas:');
    activities.forEach((act, idx) => {
      console.log(`\n   ${idx + 1}. ${act.title}`);
      console.log(`      Status: ${act.status}`);
      console.log(`      Cliente: ${act.client_name || 'N/A'}`);
    });
    console.log('\n✅ SUCESSO - Sistema funcionando corretamente!');
  } else {
    console.log('\n   ⚠️ Nenhuma atividade para hoje');
    console.log('   (Isso pode ser normal se não houver atividades agendadas)');
  }
  
  console.log('\n' + '='.repeat(60));
}

testFinalFlow()
  .then(() => {
    console.log('\n✅ Teste concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro no teste:', error);
    process.exit(1);
  });

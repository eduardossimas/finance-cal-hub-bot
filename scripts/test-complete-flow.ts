import dotenv from 'dotenv';
import { supabase } from '../src/config/supabase';

dotenv.config();

async function testCompleteFlow() {
  console.log('🧪 Testando fluxo completo de identificação de usuário\n');

  // Simular um número vindo do WhatsApp (Eduardo)
  const whatsappJid = '553291473412@s.whatsapp.net';
  
  // 1. Extrair número
  const phone = whatsappJid.split('@')[0];
  console.log(`1️⃣ Número extraído do WhatsApp: ${phone}`);
  
  // 2. Formatar com +
  const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;
  console.log(`2️⃣ Número formatado: ${formattedPhone}`);
  
  // 3. Buscar usuário
  console.log(`\n3️⃣ Buscando usuário no banco...`);
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, name, phone, company_id')
    .eq('phone', formattedPhone)
    .single();

  if (userError) {
    if (userError.code === 'PGRST116') {
      console.log(`   ❌ Usuário não encontrado`);
    } else {
      console.log(`   ❌ Erro:`, userError);
    }
    return;
  }

  console.log(`   ✅ Usuário: ${user.name}`);
  console.log(`   ✅ ID: ${user.id}`);
  console.log(`   ✅ Company ID: ${user.company_id}`);

  // 4. Buscar atividades
  const today = new Date().toISOString().split('T')[0];
  console.log(`\n4️⃣ Buscando atividades de hoje (${today})...`);
  
  const { data: activities, error: activitiesError } = await supabase
    .from('activities')
    .select('*, client:clients!activities_client_id_fkey (id, name)')
    .eq('date', today)
    .contains('assigned_users', [user.id])
    .order('created_at', { ascending: true });

  if (activitiesError) {
    console.log(`   ❌ Erro ao buscar atividades:`, activitiesError);
    return;
  }

  console.log(`   ✅ ${activities?.length || 0} atividades encontradas`);
  
  if (activities && activities.length > 0) {
    console.log(`\n   Detalhes das atividades:`);
    activities.forEach((act, idx) => {
      console.log(`\n   ${idx + 1}. ${act.title}`);
      console.log(`      Status: ${act.status}`);
      console.log(`      Cliente: ${act.client?.name || 'N/A'}`);
      console.log(`      Assigned Users: ${JSON.stringify(act.assigned_users)}`);
    });
  }

  // 5. Testar query alternativa (usando assigned_to ao invés de assigned_users)
  console.log(`\n5️⃣ Testando query alternativa (assigned_to)...`);
  const { data: activitiesAlt, error: activitiesAltError } = await supabase
    .from('activities')
    .select('*, client:clients!activities_client_id_fkey (id, name)')
    .eq('date', today)
    .eq('assigned_to', user.id)
    .order('created_at', { ascending: true });

  if (activitiesAltError) {
    console.log(`   ❌ Erro:`, activitiesAltError);
  } else {
    console.log(`   ✅ ${activitiesAlt?.length || 0} atividades encontradas com assigned_to`);
  }

  // 6. Buscar TODAS as atividades do usuário (qualquer data)
  console.log(`\n6️⃣ Buscando TODAS as atividades do usuário...`);
  const { data: allActivities, error: allActivitiesError } = await supabase
    .from('activities')
    .select('*, client:clients!activities_client_id_fkey (id, name)')
    .contains('assigned_users', [user.id])
    .order('date', { ascending: false })
    .limit(10);

  if (allActivitiesError) {
    console.log(`   ❌ Erro:`, allActivitiesError);
  } else {
    console.log(`   ✅ ${allActivities?.length || 0} atividades totais (últimas 10)`);
    
    if (allActivities && allActivities.length > 0) {
      console.log(`\n   Últimas atividades:`);
      allActivities.forEach((act, idx) => {
        console.log(`   ${idx + 1}. ${act.title} - ${act.date} (${act.status})`);
      });
    }
  }
}

testCompleteFlow()
  .then(() => {
    console.log('\n\n✅ Teste completo concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro no teste:', error);
    process.exit(1);
  });

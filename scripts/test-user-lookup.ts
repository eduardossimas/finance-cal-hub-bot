import dotenv from 'dotenv';
import { supabase } from '../src/config/supabase';

dotenv.config();

async function testUserLookup() {
  console.log('🔍 Testando busca de usuário...\n');

  // Teste 1: Listar todos os usuários
  console.log('1️⃣ Listando todos os usuários cadastrados:');
  const { data: allUsers, error: allUsersError } = await supabase
    .from('users')
    .select('id, name, phone, company_id');

  if (allUsersError) {
    console.error('❌ Erro ao buscar usuários:', allUsersError);
  } else {
    console.log(`✅ ${allUsers?.length || 0} usuários encontrados:`);
    allUsers?.forEach((user) => {
      console.log(`   - ID: ${user.id}`);
      console.log(`     Nome: ${user.name}`);
      console.log(`     Telefone: ${user.phone || 'não cadastrado'}`);
      console.log(`     Company ID: ${user.company_id || 'não definido'}`);
      console.log('');
    });
  }

  // Teste 2: Simular busca com número do WhatsApp
  console.log('\n2️⃣ Simulando busca com número do WhatsApp:');
  const testPhones = [
    '+5511999999999', // Exemplo genérico
    '5511999999999',  // Sem +
    '+553299712684',  // Outro formato possível
    '553299712684',   // Sem +
  ];

  for (const testPhone of testPhones) {
    console.log(`\n   Testando: ${testPhone}`);
    const { data, error } = await supabase
      .from('users')
      .select('id, name, phone')
      .eq('phone', testPhone)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log(`   ⚠️ Não encontrado`);
      } else {
        console.log(`   ❌ Erro:`, error.message);
      }
    } else {
      console.log(`   ✅ Encontrado: ${data.name} (ID: ${data.id})`);
    }
  }

  // Teste 3: Verificar atividades de cada usuário
  console.log('\n\n3️⃣ Verificando atividades por usuário:');
  const today = new Date().toISOString().split('T')[0];
  
  if (allUsers && allUsers.length > 0) {
    for (const user of allUsers) {
      const { data: activities, error: activitiesError } = await supabase
        .from('activities')
        .select('id, title, date, assigned_users')
        .contains('assigned_users', [user.id]);

      if (activitiesError) {
        console.log(`\n   ❌ Erro ao buscar atividades de ${user.name}:`, activitiesError.message);
      } else {
        console.log(`\n   👤 ${user.name} (${user.phone || 'sem telefone'}):`);
        console.log(`      Total de atividades: ${activities?.length || 0}`);
        
        const todayActivities = activities?.filter(a => a.date === today);
        console.log(`      Atividades de hoje: ${todayActivities?.length || 0}`);
      }
    }
  }
}

testUserLookup()
  .then(() => {
    console.log('\n✅ Teste concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro no teste:', error);
    process.exit(1);
  });

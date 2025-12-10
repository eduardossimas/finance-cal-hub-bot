import dotenv from 'dotenv';
import { supabase } from '../src/config/supabase';

dotenv.config();

async function checkActivityStructure() {
  console.log('🔍 Analisando estrutura das atividades\n');

  const userId = '13e6a6b4-c9de-4693-8046-53ff49bdb26c'; // Eduardo
  const today = '2025-12-10';

  // Buscar atividades de hoje de todas as formas possíveis
  console.log('1️⃣ Atividades com assigned_to:');
  const { data: withAssignedTo } = await supabase
    .from('activities')
    .select('id, title, date, assigned_to, assigned_users')
    .eq('date', today)
    .eq('assigned_to', userId);
  
  console.log(`   Encontradas: ${withAssignedTo?.length || 0}`);
  withAssignedTo?.forEach(act => {
    console.log(`   - ${act.title}`);
    console.log(`     assigned_to: ${act.assigned_to}`);
    console.log(`     assigned_users: ${JSON.stringify(act.assigned_users)}`);
  });

  console.log('\n2️⃣ Atividades com assigned_users:');
  const { data: withAssignedUsers } = await supabase
    .from('activities')
    .select('id, title, date, assigned_to, assigned_users')
    .eq('date', today)
    .contains('assigned_users', [userId]);
  
  console.log(`   Encontradas: ${withAssignedUsers?.length || 0}`);
  withAssignedUsers?.forEach(act => {
    console.log(`   - ${act.title}`);
    console.log(`     assigned_to: ${act.assigned_to}`);
    console.log(`     assigned_users: ${JSON.stringify(act.assigned_users)}`);
  });

  console.log('\n3️⃣ TODAS as atividades de hoje (sem filtro de usuário):');
  const { data: allToday } = await supabase
    .from('activities')
    .select('id, title, date, assigned_to, assigned_users')
    .eq('date', today);
  
  console.log(`   Total: ${allToday?.length || 0}`);
  allToday?.forEach(act => {
    console.log(`   - ${act.title}`);
    console.log(`     assigned_to: ${act.assigned_to}`);
    console.log(`     assigned_users: ${JSON.stringify(act.assigned_users)}`);
  });

  console.log('\n4️⃣ Analisando distribuição:');
  const { data: allActivities } = await supabase
    .from('activities')
    .select('assigned_to, assigned_users')
    .limit(100);

  let withBoth = 0;
  let onlyAssignedTo = 0;
  let onlyAssignedUsers = 0;
  let neither = 0;

  allActivities?.forEach(act => {
    const hasAssignedTo = act.assigned_to !== null;
    const hasAssignedUsers = act.assigned_users && act.assigned_users.length > 0;

    if (hasAssignedTo && hasAssignedUsers) withBoth++;
    else if (hasAssignedTo) onlyAssignedTo++;
    else if (hasAssignedUsers) onlyAssignedUsers++;
    else neither++;
  });

  console.log(`   Total analisado: ${allActivities?.length || 0}`);
  console.log(`   Com ambos (assigned_to E assigned_users): ${withBoth}`);
  console.log(`   Apenas assigned_to: ${onlyAssignedTo}`);
  console.log(`   Apenas assigned_users: ${onlyAssignedUsers}`);
  console.log(`   Nenhum: ${neither}`);
}

checkActivityStructure()
  .then(() => {
    console.log('\n✅ Análise concluída!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro:', error);
    process.exit(1);
  });

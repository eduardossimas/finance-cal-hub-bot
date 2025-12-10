import dotenv from 'dotenv';
import { supabase } from '../src/config/supabase';

dotenv.config();

async function testRecurring() {
  console.log('🔄 Testando Atividades Recorrentes\n');
  
  const userId = '13e6a6b4-c9de-4693-8046-53ff49bdb26c'; // Eduardo
  const today = '2025-12-10';
  
  console.log('1️⃣ Atividades recorrentes do usuário:');
  const { data: recurring } = await supabase
    .from('activities')
    .select('id, title, date, status, is_recurring, recurrence_type, completed_at')
    .or(`assigned_to.eq.${userId},assigned_users.cs.{${userId}}`)
    .eq('is_recurring', true)
    .order('date', { ascending: false })
    .limit(10);
  
  console.log(`   Total: ${recurring?.length || 0}\n`);
  recurring?.forEach(act => {
    console.log(`   - ${act.title}`);
    console.log(`     Data: ${act.date}`);
    console.log(`     Tipo: ${act.recurrence_type}`);
    console.log(`     Status: ${act.status}`);
    console.log(`     Completed at: ${act.completed_at || 'não'}`);
    console.log('');
  });
  
  console.log('\n2️⃣ Todas atividades de hoje (incluindo completed):');
  const { data: allToday } = await supabase
    .from('activities')
    .select('id, title, date, status, is_recurring, recurrence_type, completed_at')
    .eq('date', today)
    .or(`assigned_to.eq.${userId},assigned_users.cs.{${userId}}`)
    .order('created_at', { ascending: true });
  
  console.log(`   Total: ${allToday?.length || 0}\n`);
  allToday?.forEach(act => {
    console.log(`   - ${act.title}`);
    console.log(`     Status: ${act.status}`);
    console.log(`     Recorrente: ${act.is_recurring ? 'sim' : 'não'}`);
    console.log(`     Completed at: ${act.completed_at || 'não'}`);
    console.log('');
  });
}

testRecurring()
  .then(() => {
    console.log('✅ Teste concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro:', error);
    process.exit(1);
  });

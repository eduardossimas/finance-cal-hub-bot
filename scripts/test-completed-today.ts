import dotenv from 'dotenv';
import { supabase } from '../src/config/supabase';

dotenv.config();

async function testCompletedToday() {
  console.log('📊 Buscando TODAS as atividades de hoje (incluindo completadas)\n');
  
  const userId = '13e6a6b4-c9de-4693-8046-53ff49bdb26c'; // Eduardo
  const today = '2025-12-10';
  
  // Buscar TODAS sem filtro de status
  const { data: all } = await supabase
    .from('activities')
    .select('*, client:clients!activities_client_id_fkey (id, name)')
    .eq('date', today)
    .or(`assigned_to.eq.${userId},assigned_users.cs.{${userId}}`)
    .order('status', { ascending: true });
  
  console.log(`Total de atividades para ${today}: ${all?.length || 0}\n`);
  
  if (all && all.length > 0) {
    all.forEach((act, idx) => {
      console.log(`${idx + 1}. ${act.title}`);
      console.log(`   Status: ${act.status}`);
      console.log(`   Recorrente: ${act.is_recurring ? `Sim (${act.recurrence_type})` : 'Não'}`);
      console.log(`   Cliente: ${act.client?.name || 'N/A'}`);
      console.log(`   Completed at: ${act.completed_at || 'não completado'}`);
      console.log('');
    });
  }
  
  // Buscar atividades recorrentes diárias
  console.log('\n🔄 Atividades recorrentes DIÁRIAS (qualquer data):');
  const { data: daily } = await supabase
    .from('activities')
    .select('id, title, date, status, completed_at')
    .or(`assigned_to.eq.${userId},assigned_users.cs.{${userId}}`)
    .eq('is_recurring', true)
    .eq('recurrence_type', 'daily')
    .order('date', { ascending: false })
    .limit(5);
  
  console.log(`Total: ${daily?.length || 0}\n`);
  daily?.forEach(act => {
    console.log(`- ${act.title}`);
    console.log(`  Data: ${act.date}, Status: ${act.status}`);
    console.log(`  Completed: ${act.completed_at || 'não'}`);
    console.log('');
  });
}

testCompletedToday()
  .then(() => {
    console.log('✅ Teste concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro:', error);
    process.exit(1);
  });

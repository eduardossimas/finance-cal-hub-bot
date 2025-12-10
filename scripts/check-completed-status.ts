import dotenv from 'dotenv';
import { supabase } from '../src/config/supabase';

dotenv.config();

async function checkCompletedStatus() {
  console.log('🔍 Verificando status de "Lançar pedidos no Suas Vendas"\n');
  
  const userId = '13e6a6b4-c9de-4693-8046-53ff49bdb26c'; // Eduardo
  
  // Buscar essa atividade específica
  const { data: activities } = await supabase
    .from('activities')
    .select('*')
    .or(`assigned_to.eq.${userId},assigned_users.cs.{${userId}}`)
    .ilike('title', '%Lançar pedidos%')
    .order('date', { ascending: false })
    .limit(5);
  
  console.log(`Encontradas ${activities?.length || 0} atividades:\n`);
  
  activities?.forEach((act, idx) => {
    console.log(`${idx + 1}. ${act.title}`);
    console.log(`   ID: ${act.id}`);
    console.log(`   Data: ${act.date}`);
    console.log(`   Status: ${act.status}`);
    console.log(`   Recorrente: ${act.is_recurring ? `Sim (${act.recurrence_type})` : 'Não'}`);
    console.log(`   Completed at: ${act.completed_at || 'NULL'}`);
    console.log(`   Started at: ${act.started_at || 'NULL'}`);
    console.log('');
  });
  
  // Verificar se existe registro de conclusão de hoje
  const today = '2025-12-10';
  console.log(`\n📅 Verificando se existe registro de conclusão para ${today}:\n`);
  
  const { data: todayCompleted } = await supabase
    .from('activities')
    .select('*')
    .or(`assigned_to.eq.${userId},assigned_users.cs.{${userId}}`)
    .ilike('title', '%Lançar pedidos%')
    .gte('completed_at', `${today}T00:00:00`)
    .lte('completed_at', `${today}T23:59:59`);
  
  console.log(`Completadas hoje: ${todayCompleted?.length || 0}`);
  todayCompleted?.forEach(act => {
    console.log(`- ${act.title} (${act.status}) - Completed: ${act.completed_at}`);
  });
}

checkCompletedStatus()
  .then(() => {
    console.log('\n✅ Verificação concluída!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro:', error);
    process.exit(1);
  });

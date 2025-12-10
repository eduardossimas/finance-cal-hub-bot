import dotenv from 'dotenv';
import { supabase } from '../src/config/supabase';

dotenv.config();

async function checkTables() {
  console.log('🔍 Verificando estrutura do banco de dados\n');
  
  // Tentar buscar de várias tabelas possíveis
  const possibleTables = [
    'activity_completions',
    'activity_history', 
    'completions',
    'task_completions',
    'recurring_completions'
  ];
  
  for (const table of possibleTables) {
    console.log(`\nTentando acessar tabela: ${table}`);
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(1);
    
    if (error) {
      console.log(`  ❌ ${error.message}`);
    } else {
      console.log(`  ✅ Existe! Registros encontrados: ${data?.length || 0}`);
      if (data && data.length > 0) {
        console.log('  Campos:', Object.keys(data[0]).join(', '));
      }
    }
  }
  
  // Verificar se a atividade tem algum campo de data de conclusão de hoje
  console.log('\n\n📊 Analisando estrutura da atividade recorrente:');
  const { data: act } = await supabase
    .from('activities')
    .select('*')
    .eq('id', '988bebba-f178-4945-96af-5eb1c5902d44')
    .single();
  
  if (act) {
    console.log('\nCampos da atividade:');
    Object.entries(act).forEach(([key, value]) => {
      if (value !== null) {
        console.log(`  ${key}: ${value}`);
      }
    });
  }
}

checkTables()
  .then(() => {
    console.log('\n✅ Verificação concluída!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro:', error);
    process.exit(1);
  });

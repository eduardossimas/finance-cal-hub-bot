import dotenv from 'dotenv';
import { processMessage } from '../src/bot/handlers';

dotenv.config();

async function testComplete() {
  const userId = '13e6a6b4-c9de-4693-8046-53ff49bdb26c';
  
  const tests = [
    'concluir 2',
    'finalizar 1',
    'completar tarefa 2',
    'feito 1',
    'ok 2',
  ];
  
  for (const msg of tests) {
    console.log(`\n📨 "${msg}"`);
    try {
      const response = await processMessage(userId, msg);
      console.log(`📤 ${response.substring(0, 150)}...`);
    } catch (error: any) {
      console.log(`❌ Erro: ${error.message}`);
    }
  }
}

testComplete();

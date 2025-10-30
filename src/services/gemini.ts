import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error('❌ GEMINI_API_KEY não configurada no .env');
}

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

export async function generateResponse(prompt: string): Promise<string> {
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error: any) {
    console.error('❌ Erro ao gerar resposta com Gemini:', error.message);
    throw error;
  }
}

export async function summarizeActivities(activities: string[]): Promise<string> {
  const prompt = `
Você é um assistente de produtividade amigável. Analise as seguintes atividades do usuário para hoje e crie um resumo curto, motivador e organizado em português do Brasil.

Atividades:
${activities.join('\n')}

Gere um resumo com:
1. Número total de atividades
2. Principais tarefas por status
3. Uma frase motivacional para o dia

Seja breve (máximo 200 palavras) e use emojis para tornar mais visual.
`.trim();

  return generateResponse(prompt);
}

export async function answerQuestion(question: string, context: string): Promise<string> {
  const prompt = `
Você é um assistente do Finance Cal Hub, um sistema de gestão de atividades.

Contexto das atividades do usuário:
${context}

Pergunta do usuário: ${question}

Responda de forma clara, objetiva e amigável em português do Brasil. Use emojis quando apropriado.
`.trim();

  return generateResponse(prompt);
}

console.log('✅ Cliente Gemini AI inicializado');

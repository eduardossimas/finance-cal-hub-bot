import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import {
  getExtractTaskInfoPrompt,
  getSummarizeActivitiesPrompt,
  getAnswerQuestionPrompt,
  getIdentifyActivityPrompt,
  getIdentifyIntentPrompt,
} from './prompts';

dotenv.config();

// Configuração do provider de IA
const AI_PROVIDER = process.env.AI_PROVIDER || 'openai'; // 'openai' ou 'gemini'

// Configurar OpenAI (sempre inicializar para processamento de mensagens)
let openai: OpenAI | null = null;
const openaiKey = process.env.OPENAI_API_KEY;
if (openaiKey) {
  openai = new OpenAI({ apiKey: openaiKey });
  console.log('✅ Cliente OpenAI inicializado');
} else {
  console.warn('⚠️  OPENAI_API_KEY não configurada - algumas funcionalidades podem não funcionar');
}

// Configurar Gemini (sempre inicializar para transcrição de áudio)
let genAI: GoogleGenerativeAI | null = null;
let geminiModel: any = null;
const geminiKey = process.env.GEMINI_API_KEY;
if (geminiKey) {
  genAI = new GoogleGenerativeAI(geminiKey);
  // Usar gemini-1.5-flash que suporta áudio
  geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });
  console.log('✅ Cliente Gemini AI inicializado (modelo: gemini-1.5-flash)');
} else {
  console.warn('⚠️  GEMINI_API_KEY não configurada - transcrição de áudio não funcionará');
}

/**
 * Gera resposta usando o provider configurado (OpenAI ou Gemini)
 */
export async function generateResponse(prompt: string): Promise<string> {
  try {
    if (AI_PROVIDER === 'openai' && openai) {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini', // Modelo mais barato e rápido
        messages: [
          {
            role: 'system',
            content: 'Você é um assistente inteligente especializado em gestão de atividades e tarefas.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      return response.choices[0]?.message?.content || '';
    } else if (AI_PROVIDER === 'gemini' && geminiModel) {
      const result = await geminiModel.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } else {
      throw new Error('❌ Provider de IA não configurado corretamente');
    }
  } catch (error: any) {
    console.error(`❌ Erro ao gerar resposta com ${AI_PROVIDER.toUpperCase()}:`, error.message);
    throw error;
  }
}

export async function summarizeActivities(activities: string[]): Promise<string> {
  const prompt = getSummarizeActivitiesPrompt(activities);
  return generateResponse(prompt);
}

export async function answerQuestion(question: string, context: string): Promise<string> {
  const prompt = getAnswerQuestionPrompt(question, context);
  return generateResponse(prompt);
}

/**
 * Extrai informações de uma tarefa a partir de texto natural
 */
export async function extractTaskInfo(
  message: string,
  availableClients: Array<{ id: string; name: string }>
): Promise<{
  title: string;
  description?: string;
  clientName?: string;
  estimatedDuration?: number;
  date?: string;
} | null> {
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDate = tomorrow.toISOString().split('T')[0];
  
  const prompt = getExtractTaskInfoPrompt(message, availableClients, today, tomorrowDate);

  try {
    const response = await generateResponse(prompt);
    
    // Limpar resposta (remover markdown se houver)
    let jsonText = response.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }
    
    const extracted = JSON.parse(jsonText);
    
    // Validar que tem título E cliente
    if (!extracted.title || extracted.title.trim() === '') {
      console.log('⚠️ IA não conseguiu extrair o título da tarefa');
      return null;
    }

    if (!extracted.clientName || extracted.clientName.trim() === '') {
      console.log('⚠️ IA não conseguiu extrair o nome do cliente');
      return null;
    }
    
    return extracted;
  } catch (error: any) {
    console.error('Erro ao extrair informações da tarefa:', error.message);
    console.error('Resposta da IA:', error);
    return null;
  }
}

/**
 * Transcreve áudio usando Gemini (que suporta áudio nativamente)
 */
export async function transcribeAudio(audioBuffer: Buffer): Promise<string | null> {
  try {
    console.log('🎤 Iniciando transcrição de áudio...');
    
    // Verificar se Gemini está disponível
    if (!genAI || !geminiModel) {
      console.error('❌ Cliente Gemini não está inicializado');
      return null;
    }

    console.log(`📦 Áudio: ${(audioBuffer.length / 1024).toFixed(2)} KB`);
    
    // Converter buffer para base64
    const base64Audio = audioBuffer.toString('base64');
    
    console.log('🌐 Enviando para Gemini API...');
    const startTime = Date.now();
    
    // Usar Gemini para transcrever (suporta áudio nativamente)
    const result = await geminiModel.generateContent([
      {
        inlineData: {
          mimeType: 'audio/ogg',
          data: base64Audio
        }
      },
      {
        text: 'Transcreva este áudio em português brasileiro. Retorne APENAS o texto falado, sem nenhuma explicação adicional, formatação ou comentário.'
      }
    ]);

    const response = await result.response;
    const transcription = response.text().trim();
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Áudio transcrito em ${duration}s: "${transcription}"`);

    return transcription;
  } catch (error: any) {
    console.error('❌ Erro ao transcrever áudio:', error.message);
    if (error.status) {
      console.error(`   Status: ${error.status} - ${error.statusText || ''}`);
    }
    return null;
  }
}

/**
 * Analisa imagem e extrai texto/tarefa
 */
export async function analyzeImage(imageBase64: string): Promise<string | null> {
  try {
    console.log('⚠️ Análise de imagem ainda não implementada');
    return null;
  } catch (error: any) {
    console.error('Erro ao analisar imagem:', error.message);
    return null;
  }
}

/**
 * Identifica qual atividade o usuário quer concluir
 */
export async function identifyActivityToComplete(
  userMessage: string,
  activities: any[]
): Promise<{ activityId: string; confidence: string } | null> {
  if (activities.length === 0) {
    return null;
  }

  const prompt = getIdentifyActivityPrompt(userMessage, activities);

  try {
    const response = await generateResponse(prompt);
    
    // Limpar resposta (remover markdown se houver)
    let jsonText = response.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }
    
    const result = JSON.parse(jsonText);
    
    if (!result.activityId || result.confidence === 'none') {
      return null;
    }
    
    return result;
  } catch (error: any) {
    console.error('Erro ao identificar atividade:', error.message);
    return null;
  }
}

/**
 * Identifica a intenção da mensagem do usuário
 */
export async function identifyIntent(message: string): Promise<{
  intent: 'query' | 'create_task' | 'update_task' | 'summary' | 'question';
  action: string;
  filters?: {
    date?: string;
    period?: string;
    client?: string;
  };
  operation?: string;
  period?: string;
} | null> {
  const prompt = getIdentifyIntentPrompt(message);

  try {
    const response = await generateResponse(prompt);
    
    // Limpar resposta (remover markdown se houver)
    let jsonText = response.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }
    
    const result = JSON.parse(jsonText);
    
    if (!result.intent || !result.action) {
      console.log('⚠️ IA não conseguiu identificar a intenção da mensagem');
      return null;
    }
    
    return result;
  } catch (error: any) {
    console.error('Erro ao identificar intenção:', error.message);
    return null;
  }
}

console.log(`✅ Sistema de IA inicializado (Provider: ${AI_PROVIDER.toUpperCase()})`);

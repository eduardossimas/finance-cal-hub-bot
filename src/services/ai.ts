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

// Configurar OpenAI
let openai: OpenAI | null = null;
if (AI_PROVIDER === 'openai') {
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    throw new Error('❌ OPENAI_API_KEY não configurada no .env');
  }
  openai = new OpenAI({ apiKey: openaiKey });
  console.log('✅ Cliente OpenAI inicializado');
}

// Configurar Gemini
let genAI: GoogleGenerativeAI | null = null;
let geminiModel: any = null;
if (AI_PROVIDER === 'gemini') {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    throw new Error('❌ GEMINI_API_KEY não configurada no .env');
  }
  genAI = new GoogleGenerativeAI(geminiKey);
  geminiModel = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
  console.log('✅ Cliente Gemini AI inicializado');
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
 * Transcreve áudio usando OpenAI Whisper
 */
export async function transcribeAudio(audioBuffer: Buffer): Promise<string | null> {
  try {
    console.log('\n🔊 ========================================');
    console.log('🔊 INICIANDO TRANSCRIÇÃO DE ÁUDIO');
    console.log('🔊 ========================================');
    
    if (AI_PROVIDER !== 'openai' || !openai) {
      console.error('❌ Provider não é OpenAI ou cliente não está inicializado');
      console.error(`   AI_PROVIDER atual: ${AI_PROVIDER}`);
      console.error(`   Cliente OpenAI: ${openai ? 'Inicializado' : 'NÃO inicializado'}`);
      console.error('⚠️  Transcrição de áudio requer OpenAI como provider');
      console.log('🔊 ========================================\n');
      return null;
    }

    console.log('✅ Provider OpenAI verificado');
    console.log(`📦 Tamanho do buffer recebido: ${audioBuffer.length} bytes`);

    // Criar um objeto File a partir do buffer
    console.log('🔧 Criando objeto File a partir do buffer...');
    const audioFile = new File([audioBuffer], 'audio.ogg', { type: 'audio/ogg' });
    console.log(`✅ Arquivo criado: ${audioFile.name} (${audioFile.size} bytes, tipo: ${audioFile.type})`);

    console.log('🌐 Enviando para OpenAI Whisper API...');
    console.log('   Modelo: whisper-1');
    console.log('   Idioma: pt (Português)');
    
    const startTime = Date.now();
    
    // Usar Whisper para transcrever
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'pt', // Português
    });

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log(`✅ Resposta recebida da OpenAI em ${duration}s`);
    console.log(`📝 Texto transcrito: "${transcription.text}"`);
    console.log(`📏 Comprimento: ${transcription.text.length} caracteres`);
    console.log('🔊 ========================================\n');

    return transcription.text;
  } catch (error: any) {
    console.error('\n❌ ========================================');
    console.error('❌ ERRO NA TRANSCRIÇÃO DE ÁUDIO');
    console.error('❌ ========================================');
    console.error('Tipo de erro:', error.constructor.name);
    console.error('Mensagem:', error.message);
    
    if (error.response) {
      console.error('Resposta da API:');
      console.error('  Status:', error.response.status);
      console.error('  Dados:', JSON.stringify(error.response.data, null, 2));
    }
    
    if (error.code) {
      console.error('Código de erro:', error.code);
    }
    
    console.error('Stack trace:', error.stack);
    console.error('❌ ========================================\n');
    
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

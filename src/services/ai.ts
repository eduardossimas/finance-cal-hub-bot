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
  geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
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
  console.log('\n🔊 ========================================');
  console.log('🔊 FUNCTION transcribeAudio() CHAMADA');
  console.log('🔊 ========================================');
  
  try {
    console.log('📥 Parâmetro recebido:');
    console.log('   - Tipo:', typeof audioBuffer);
    console.log('   - É Buffer?', Buffer.isBuffer(audioBuffer));
    console.log('   - É nulo?', audioBuffer === null);
    console.log('   - É undefined?', audioBuffer === undefined);
    
    if (audioBuffer) {
      console.log('   - Length:', audioBuffer.length);
      console.log('   - Primeiros 10 bytes:', audioBuffer.slice(0, 10));
    }
    
    console.log('\n🔍 Verificando clientes Gemini...');
    console.log('   - genAI existe?', genAI !== null && genAI !== undefined);
    console.log('   - geminiModel existe?', geminiModel !== null && geminiModel !== undefined);
    console.log('   - GEMINI_API_KEY configurada?', !!process.env.GEMINI_API_KEY);
    
    if (process.env.GEMINI_API_KEY) {
      console.log('   - GEMINI_API_KEY length:', process.env.GEMINI_API_KEY.length);
      console.log('   - GEMINI_API_KEY começa com:', process.env.GEMINI_API_KEY.substring(0, 10) + '...');
    }
    
    // Verificar se Gemini está disponível
    if (!genAI || !geminiModel) {
      console.error('\n❌ Cliente Gemini não está inicializado');
      console.error('   genAI:', genAI);
      console.error('   geminiModel:', geminiModel);
      console.error('⚠️  Verifique se GEMINI_API_KEY está configurada no .env');
      console.log('🔊 ========================================\n');
      return null;
    }

    console.log('\n✅ Cliente Gemini verificado e pronto');
    console.log(`📦 Tamanho do buffer: ${audioBuffer.length} bytes (${(audioBuffer.length / 1024).toFixed(2)} KB)`);

    console.log('\n🔧 [SUB-PASSO 1] Convertendo buffer para base64...');
    const startConvert = Date.now();
    
    // Converter buffer para base64
    const base64Audio = audioBuffer.toString('base64');
    
    const endConvert = Date.now();
    console.log(`✅ [SUB-PASSO 1] Conversão completa em ${endConvert - startConvert}ms`);
    console.log(`   📊 Base64 length: ${base64Audio.length} caracteres`);
    console.log(`   📊 Primeiros 50 chars: ${base64Audio.substring(0, 50)}...`);

    console.log('\n🌐 [SUB-PASSO 2] Preparando requisição para Gemini...');
    console.log('   📝 Modelo: gemini-1.5-flash');
    console.log('   📝 MimeType: audio/ogg');
    console.log('   📝 Prompt: Transcrever áudio em português brasileiro');
    
    const startTime = Date.now();
    
    console.log('\n🚀 [SUB-PASSO 3] Enviando para API do Gemini...');
    
    // Usar Gemini para transcrever (suporta áudio nativamente)
    let result;
    try {
      result = await geminiModel.generateContent([
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
      
      console.log('✅ [SUB-PASSO 3] Requisição enviada com sucesso');
    } catch (apiError: any) {
      console.error('\n❌ Erro ao chamar geminiModel.generateContent():');
      console.error('   Tipo:', apiError.constructor?.name);
      console.error('   Mensagem:', apiError.message);
      console.error('   Code:', apiError.code);
      
      if (apiError.response) {
        console.error('   Response status:', apiError.response.status);
        console.error('   Response data:', apiError.response.data);
      }
      
      throw apiError;
    }

    console.log('\n📡 [SUB-PASSO 4] Processando resposta do Gemini...');
    console.log('   🔍 Result type:', typeof result);
    console.log('   🔍 Result keys:', result ? Object.keys(result) : 'null');
    
    const response = await result.response;
    console.log('   ✅ Response obtido');
    console.log('   🔍 Response type:', typeof response);
    
    const transcription = response.text().trim();
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log('\n✅ [SUB-PASSO 4] Transcrição extraída com sucesso!');
    console.log(`⏱️  Tempo total: ${duration}s`);
    console.log(`📝 Texto transcrito: "${transcription}"`);
    console.log(`📏 Comprimento: ${transcription.length} caracteres`);
    console.log('🔊 ========================================\n');

    return transcription;
  } catch (error: any) {
    console.error('\n❌ ========================================');
    console.error('❌ ERRO NA FUNCTION transcribeAudio()');
    console.error('❌ ========================================');
    console.error('Tipo de erro:', error.constructor?.name || 'Desconhecido');
    console.error('Mensagem:', error.message);
    console.error('Name:', error.name);
    
    if (error.response) {
      console.error('\nResposta da API Gemini:');
      console.error('  Status:', error.response.status);
      console.error('  StatusText:', error.response.statusText);
      console.error('  Headers:', error.response.headers);
      console.error('  Data:', JSON.stringify(error.response.data, null, 2));
    }
    
    if (error.code) {
      console.error('Código de erro:', error.code);
    }
    
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    
    // Log de todas as propriedades do erro
    console.error('\nTodas as propriedades do erro:');
    console.error(JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    
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

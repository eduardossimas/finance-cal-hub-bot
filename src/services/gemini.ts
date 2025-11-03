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
  const clientNames = availableClients.map(c => c.name).join(', ');
  
  const prompt = `
Você é um assistente que extrai informações de tarefas a partir de mensagens em português.

Mensagem do usuário: "${message}"

Data de hoje: ${new Date().toLocaleDateString('pt-BR')} (${today})

**CLIENTES DISPONÍVEIS NA BASE DE DADOS:**
${clientNames}

Extraia as seguintes informações em formato JSON válido:
{
  "title": "título conciso da tarefa (obrigatório, máximo 100 caracteres)",
  "description": "descrição detalhada se houver (opcional)",
  "clientName": "nome EXATO do cliente da lista acima (OBRIGATÓRIO - escolha o mais similar se não for exato)",
  "estimatedDuration": tempo estimado em MINUTOS como número inteiro (opcional, padrão 60),
  "date": "data no formato YYYY-MM-DD (opcional, padrão ${today})"
}

**REGRAS IMPORTANTES:**
1. O campo "clientName" é OBRIGATÓRIO - SEMPRE escolha um cliente da lista acima
2. Se o usuário mencionar um cliente, encontre o nome mais similar na lista
3. Se não mencionar cliente, escolha o mais provável baseado no contexto
4. Use o nome EXATO da lista de clientes disponíveis
5. Se mencionar "hoje", use a data ${today}
6. Se mencionar "amanhã", calcule a data de amanhã
7. Se mencionar duração em horas, converta para minutos
8. Sempre retorne JSON válido

Exemplos:
- "reunião com João" → clientName deve ser "Dias Júnior Academy" se João trabalha lá
- "tarefa para clínica" → clientName deve ser "Clínica Maria Inês"
- "atividade EVO" → clientName deve ser "EVO"

Retorne APENAS o JSON, sem texto adicional.
`.trim();

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
      return null;
    }

    if (!extracted.clientName || extracted.clientName.trim() === '') {
      console.log('⚠️ IA não conseguiu extrair o nome do cliente');
      return null;
    }
    
    return extracted;
  } catch (error: any) {
    console.error('Erro ao extrair informações da tarefa:', error.message);
    return null;
  }
}

/**
 * Transcreve áudio usando Gemini (simulado)
 */
export async function transcribeAudio(audioBase64: string): Promise<string | null> {
  // NOTA: Baileys fornece áudio em base64
  // Gemini Pro não suporta áudio diretamente ainda
  // Esta é uma função preparada para quando suportar
  
  console.log('⚠️ Transcrição de áudio ainda não implementada no Gemini');
  return null;
}

/**
 * Analisa imagem e extrai texto/tarefa
 */
export async function analyzeImage(imageBase64: string): Promise<string | null> {
  try {
    // Usar gemini-pro-vision quando disponível
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

  const activitiesList = activities.map((a, i) => 
    `${i + 1}. ID: ${a.id} | Título: ${a.title} | Cliente: ${a.client_name || 'N/A'} | Data: ${a.date} | Status: ${a.status}`
  ).join('\n');

  const prompt = `
Você é um assistente que identifica qual atividade o usuário quer marcar como concluída.

Mensagem do usuário: "${userMessage}"

Atividades disponíveis (não concluídas):
${activitiesList}

Analise a mensagem e identifique qual atividade o usuário está se referindo. Considere:
- Palavras-chave do título
- Nome do cliente mencionado
- Contexto da mensagem

Retorne um JSON válido com:
{
  "activityId": "uuid-da-atividade-identificada",
  "confidence": "high|medium|low"
}

Se não conseguir identificar com certeza, retorne:
{
  "activityId": null,
  "confidence": "none"
}

Retorne APENAS o JSON, sem texto adicional.
`.trim();

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

console.log('✅ Cliente Gemini AI inicializado');

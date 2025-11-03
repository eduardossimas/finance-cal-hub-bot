import { readFileSync } from 'fs';
import { join } from 'path';

const PROMPTS_DIR = join(__dirname, '../../prompts');

/**
 * Carrega um prompt de arquivo .md
 */
function loadPrompt(filename: string): string {
  try {
    const filePath = join(PROMPTS_DIR, filename);
    return readFileSync(filePath, 'utf-8');
  } catch (error) {
    console.error(`❌ Erro ao carregar prompt ${filename}:`, error);
    throw error;
  }
}

/**
 * Substitui placeholders no prompt
 */
function replacePlaceholders(prompt: string, replacements: Record<string, string>): string {
  let result = prompt;
  for (const [key, value] of Object.entries(replacements)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return result;
}

/**
 * Gera prompt para extrair informações de tarefa
 */
export function getExtractTaskInfoPrompt(
  message: string,
  availableClients: Array<{ id: string; name: string }>,
  todayISO: string,
  tomorrowISO: string
): string {
  const template = loadPrompt('extract-task-info.md');
  
  const clientsList = availableClients.map((c, i) => `${i + 1}. ${c.name}`).join('\n');
  
  const today = new Date(todayISO + 'T00:00:00');
  const tomorrow = new Date(tomorrowISO + 'T00:00:00');
  
  return replacePlaceholders(template, {
    MESSAGE: message,
    TODAY_FORMATTED: today.toLocaleDateString('pt-BR'),
    TODAY_ISO: todayISO,
    TOMORROW_FORMATTED: tomorrow.toLocaleDateString('pt-BR'),
    TOMORROW_ISO: tomorrowISO,
    CLIENTS_LIST: clientsList,
  });
}

/**
 * Gera prompt para resumir atividades
 */
export function getSummarizeActivitiesPrompt(activities: string[]): string {
  const template = loadPrompt('summarize-activities.md');
  
  return replacePlaceholders(template, {
    ACTIVITIES_LIST: activities.join('\n'),
  });
}

/**
 * Gera prompt para responder pergunta
 */
export function getAnswerQuestionPrompt(question: string, context: string): string {
  const template = loadPrompt('answer-question.md');
  
  return replacePlaceholders(template, {
    QUESTION: question,
    CONTEXT: context,
  });
}

/**
 * Gera prompt para identificar atividade a concluir
 */
export function getIdentifyActivityPrompt(
  message: string,
  activities: any[]
): string {
  const template = loadPrompt('identify-activity-to-complete.md');
  
  const activitiesList = activities.map((a, i) => 
    `${i + 1}. ID: ${a.id} | Título: ${a.title} | Cliente: ${a.client_name || 'N/A'} | Data: ${a.date} | Status: ${a.status}`
  ).join('\n');
  
  return replacePlaceholders(template, {
    MESSAGE: message,
    ACTIVITIES_LIST: activitiesList,
  });
}

/**
 * Gera prompt para identificar intenção da mensagem
 */
export function getIdentifyIntentPrompt(message: string): string {
  const template = loadPrompt('identify-intent.md');
  
  // Usar timezone de Brasília (UTC-3)
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const todayISO = today.toISOString().split('T')[0];
  const tomorrowISO = tomorrow.toISOString().split('T')[0];
  
  console.log(`📅 Datas para prompt de intenção:`, {
    today: todayISO,
    tomorrow: tomorrowISO,
    todayFormatted: today.toLocaleDateString('pt-BR'),
    tomorrowFormatted: tomorrow.toLocaleDateString('pt-BR'),
  });
  
  return replacePlaceholders(template, {
    MESSAGE: message,
    TODAY_FORMATTED: today.toLocaleDateString('pt-BR'),
    TODAY_ISO: todayISO,
    TOMORROW_FORMATTED: tomorrow.toLocaleDateString('pt-BR'),
    TOMORROW_ISO: tomorrowISO,
  });
}

console.log('✅ Sistema de prompts inicializado');

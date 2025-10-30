import { Activity } from '../types';
import {
  getActivitiesToday,
  getPendingActivities,
  getInProgressActivities,
  createActivity,
  formatActivity,
} from '../services/activities';
import { summarizeActivities, answerQuestion } from '../services/gemini';

/**
 * Handler para comando "hoje" ou "atividades"
 */
export async function handleTodayCommand(userId: string): Promise<string> {
  const activities = await getActivitiesToday(userId);

  if (activities.length === 0) {
    return '🎉 Você não tem atividades para hoje! Aproveite seu dia livre.';
  }

  let message = `📅 *Suas atividades para hoje* (${activities.length})\n\n`;
  
  activities.forEach((activity, index) => {
    message += `${formatActivity(activity, index)}\n`;
  });

  message += `\n💡 _Use "resumo" para ver um resumo inteligente_`;

  return message;
}

/**
 * Handler para comando "pendentes"
 */
export async function handlePendingCommand(userId: string): Promise<string> {
  const activities = await getPendingActivities(userId);

  if (activities.length === 0) {
    return '✅ Parabéns! Você não tem atividades pendentes.';
  }

  let message = `⏳ *Atividades Pendentes* (${activities.length})\n\n`;
  
  activities.forEach((activity, index) => {
    const date = activity.date ? new Date(activity.date).toLocaleDateString('pt-BR') : 'Sem data';
    message += `${index + 1}. ${activity.title}\n`;
    message += `   📅 ${date} ${formatActivity(activity).split(' ').pop()}\n`;
  });

  return message;
}

/**
 * Handler para comando "fazendo" ou "andamento"
 */
export async function handleInProgressCommand(userId: string): Promise<string> {
  const activities = await getInProgressActivities(userId);

  if (activities.length === 0) {
    return '🔍 Nenhuma atividade em andamento no momento.';
  }

  let message = `▶️ *Atividades em Andamento* (${activities.length})\n\n`;
  
  activities.forEach((activity, index) => {
    message += `${formatActivity(activity, index)}\n`;
  });

  return message;
}

/**
 * Handler para comando "resumo"
 */
export async function handleSummaryCommand(userId: string): Promise<string> {
  const activities = await getActivitiesToday(userId);

  if (activities.length === 0) {
    return '🎉 Você não tem atividades para hoje! Dia livre para relaxar.';
  }

  try {
    const activitiesList = activities.map((a, i) => 
      `${i + 1}. ${a.title} - ${a.client_name || 'Sem cliente'} - Status: ${a.status || 'pending'} - Estimativa: ${a.estimated_duration || 0}min`
    );

    const summary = await summarizeActivities(activitiesList);
    return `🤖 *Resumo Inteligente do Seu Dia*\n\n${summary}`;
  } catch (error: any) {
    console.error('Erro ao gerar resumo:', error);
    return '❌ Erro ao gerar resumo inteligente. Tente "hoje" para ver a lista completa.';
  }
}

/**
 * Handler para perguntas com IA
 */
export async function handleQuestionCommand(userId: string, question: string): Promise<string> {
  try {
    const activities = await getActivitiesToday(userId);
    const context = activities.map((a, i) => 
      `${i + 1}. ${a.title} - Cliente: ${a.client_name || 'N/A'} - Status: ${a.status} - Tempo estimado: ${a.estimated_duration || 0}min`
    ).join('\n');

    const answer = await answerQuestion(question, context || 'Nenhuma atividade para hoje');
    return `🤖 ${answer}`;
  } catch (error: any) {
    console.error('Erro ao responder pergunta:', error);
    return '❌ Desculpe, não consegui processar sua pergunta no momento.';
  }
}

/**
 * Handler para comando de ajuda
 */
export function handleHelpCommand(): string {
  return `
📱 *Comandos Disponíveis do Finance Cal Hub Bot*

*Consultas:*
• \`hoje\` ou \`atividades\` - Lista suas atividades de hoje
• \`pendentes\` - Mostra todas as tarefas pendentes
• \`fazendo\` ou \`andamento\` - Atividades em andamento
• \`resumo\` - Resumo inteligente do dia com IA

*Perguntas:*
• Digite qualquer pergunta sobre suas atividades
• Ex: "Quanto tempo vou levar hoje?"
• Ex: "Qual minha próxima tarefa?"

*Comandos:*
• \`ajuda\` ou \`help\` - Mostra esta mensagem

💡 _Todas as respostas são personalizadas para você!_
  `.trim();
}

/**
 * Processa mensagem recebida e retorna resposta
 */
export async function processMessage(userId: string, message: string): Promise<string> {
  const normalizedMessage = message.toLowerCase().trim();

  // Comandos específicos
  if (normalizedMessage === 'hoje' || normalizedMessage === 'atividades') {
    return handleTodayCommand(userId);
  }

  if (normalizedMessage === 'pendentes' || normalizedMessage === 'pendente') {
    return handlePendingCommand(userId);
  }

  if (normalizedMessage === 'fazendo' || normalizedMessage === 'andamento') {
    return handleInProgressCommand(userId);
  }

  if (normalizedMessage === 'resumo') {
    return handleSummaryCommand(userId);
  }

  if (normalizedMessage === 'ajuda' || normalizedMessage === 'help' || normalizedMessage === 'menu') {
    return handleHelpCommand();
  }

  // Se não é um comando, trata como pergunta para a IA
  if (normalizedMessage.length > 5) {
    return handleQuestionCommand(userId, message);
  }

  // Fallback
  return handleHelpCommand();
}

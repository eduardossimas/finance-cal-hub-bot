import { Activity } from '../types';
import {
  getActivitiesToday,
  getPendingActivities,
  getInProgressActivities,
  getOverdueActivities,
  getActivitiesByDate,
  getRemainingTodayActivities,
  createActivityFromAI,
  completeActivity,
  findActivityByDescription,
  getAllClients,
  formatActivity,
  formatDate,
  getDaysOverdue,
  parseNaturalDate,
} from '../services/activities';
import { summarizeActivities, answerQuestion, extractTaskInfo, identifyActivityToComplete } from '../services/gemini';

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
 * Handler para comando "vencidas" ou "atrasadas"
 */
export async function handleOverdueCommand(userId: string): Promise<string> {
  const activities = await getOverdueActivities(userId);

  if (activities.length === 0) {
    return '✅ Ótimo! Você não tem atividades vencidas.';
  }

  let message = `🚨 *Atividades Vencidas* (${activities.length})\n\n`;
  
  activities.forEach((activity, index) => {
    const daysOverdue = getDaysOverdue(activity.date || '');
    const dateFormatted = formatDate(activity.date || '');
    message += `${index + 1}. ${activity.title}\n`;
    message += `   ${dateFormatted} | ⏰ ${daysOverdue} ${daysOverdue === 1 ? 'dia' : 'dias'} de atraso\n`;
    message += `   Status: ${formatActivity(activity).split(' ').slice(-2).join(' ')}\n\n`;
  });

  message += `⚠️ _Priorize essas tarefas!_`;

  return message;
}

/**
 * Handler para consultar atividades por data específica
 */
export async function handleDateCommand(userId: string, dateText: string): Promise<string> {
  // Tentar converter texto para data
  let targetDate = parseNaturalDate(dateText);
  
  // Se não conseguiu, tentar formato DD/MM ou DD/MM/YYYY
  if (!targetDate) {
    const dateMatch = dateText.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/);
    if (dateMatch) {
      const day = dateMatch[1].padStart(2, '0');
      const month = dateMatch[2].padStart(2, '0');
      const year = dateMatch[3] ? (dateMatch[3].length === 2 ? '20' + dateMatch[3] : dateMatch[3]) : new Date().getFullYear();
      targetDate = `${year}-${month}-${day}`;
    }
  }

  if (!targetDate) {
    return '❌ Não consegui entender a data. Use "hoje", "amanhã", "DD/MM" ou "DD/MM/YYYY".';
  }

  const activities = await getActivitiesByDate(userId, targetDate);
  const dateFormatted = formatDate(targetDate);

  if (activities.length === 0) {
    return `📅 ${dateFormatted}\n\n✨ Nenhuma atividade agendada para esta data.`;
  }

  let message = `📅 *Atividades - ${dateFormatted}* (${activities.length})\n\n`;
  
  activities.forEach((activity, index) => {
    message += `${formatActivity(activity, index)}\n`;
  });

  return message;
}

/**
 * Handler para listar atividades restantes do dia
 */
export async function handleRemainingCommand(userId: string): Promise<string> {
  const activities = await getRemainingTodayActivities(userId);

  if (activities.length === 0) {
    return '🎉 Parabéns! Você concluiu todas as atividades de hoje!';
  }

  const doing = activities.filter(a => a.status === 'doing');
  const pending = activities.filter(a => a.status !== 'doing');

  let message = `📋 *Atividades Restantes Hoje* (${activities.length})\n\n`;

  if (doing.length > 0) {
    message += `▶️ *Em Andamento:* (${doing.length})\n`;
    doing.forEach((activity, index) => {
      message += `${formatActivity(activity, index)}\n`;
    });
    message += '\n';
  }

  if (pending.length > 0) {
    message += `⏳ *Pendentes:* (${pending.length})\n`;
    pending.forEach((activity, index) => {
      message += `${formatActivity(activity, index)}\n`;
    });
  }

  return message;
}

/**
 * Handler para criar nova tarefa via IA
 */
export async function handleCreateTaskCommand(userId: string, message: string): Promise<string> {
  try {
    // Buscar clientes disponíveis
    const availableClients = await getAllClients();

    if (availableClients.length === 0) {
      return '⚠️ *Nenhum cliente cadastrado*\n\nPara criar atividades, é necessário ter clientes cadastrados na plataforma web.\n\n💡 Acesse o sistema web e cadastre seus clientes primeiro.';
    }

    // Extrair informações da mensagem
    const extracted = await extractTaskInfo(message, availableClients);

    if (!extracted) {
      // Listar clientes disponíveis
      let response = '❌ Não consegui extrair informações suficientes para criar a tarefa.\n\n';
      response += `📋 *Clientes disponíveis:*\n`;
      availableClients.slice(0, 10).forEach((client, index) => {
        response += `• ${client.name}\n`;
      });
      response += `\n💡 *Exemplo:* "criar reunião com ${availableClients[0].name} amanhã às 14h"`;
      return response;
    }

    // Criar atividade
    const result = await createActivityFromAI(userId, extracted);

    if (result.clientNotFound) {
      // Cliente mencionado não existe
      let response = `⚠️ *Cliente "${extracted.clientName}" não encontrado*\n\n`;
      response += `📋 *Clientes disponíveis:*\n`;
      availableClients.slice(0, 10).forEach((client) => {
        response += `• ${client.name}\n`;
      });
      response += `\n💡 Use um dos clientes acima ou cadastre "${extracted.clientName}" na plataforma web primeiro.`;
      return response;
    }

    if (!result.activity) {
      return '❌ Erro ao criar a atividade. Tente novamente.';
    }

    const activity = result.activity;
    const dateFormatted = formatDate(activity.date || '');
    let response = `✅ *Tarefa criada com sucesso!*\n\n`;
    response += `📝 *Título:* ${activity.title}\n`;
    if (activity.description) response += `📄 *Descrição:* ${activity.description}\n`;
    if (extracted.clientName) response += `👤 *Cliente:* ${extracted.clientName}\n`;
    response += `📅 *Data:* ${dateFormatted}\n`;
    response += `⏱️ *Duração estimada:* ${activity.estimated_duration}min\n`;
    response += `📊 *Status:* Pendente\n`;

    return response;
  } catch (error: any) {
    console.error('Erro ao criar tarefa:', error);
    return '❌ Erro ao processar sua solicitação. Tente novamente.';
  }
}

/**
 * Handler para concluir atividade via IA
 */
export async function handleCompleteTaskCommand(userId: string, message: string): Promise<string> {
  try {
    // Buscar atividades não concluídas do usuário
    const activities = await findActivityByDescription(userId, message);

    if (activities.length === 0) {
      return '🤔 Você não tem atividades pendentes para concluir.';
    }

    // Usar IA para identificar qual atividade
    const identified = await identifyActivityToComplete(message, activities);

    if (!identified || !identified.activityId) {
      // Se não identificou, listar opções
      let response = `🤔 Não consegui identificar qual atividade você quer concluir.\n\n`;
      response += `📋 *Suas atividades pendentes:*\n\n`;
      
      activities.slice(0, 10).forEach((activity, index) => {
        response += `${index + 1}. ${activity.title}`;
        if (activity.client_name) response += ` | 👤 ${activity.client_name}`;
        response += `\n`;
      });

      response += `\n💡 _Seja mais específico. Exemplo: "concluir reunião com João"_`;
      return response;
    }

    // Encontrar a atividade identificada
    const activityToComplete = activities.find(a => a.id === identified.activityId);

    if (!activityToComplete) {
      return '❌ Erro ao localizar a atividade. Tente novamente.';
    }

    // Marcar como concluída
    const success = await completeActivity(identified.activityId);

    if (!success) {
      return '❌ Erro ao concluir a atividade. Tente novamente.';
    }

    let response = `✅ *Atividade concluída com sucesso!*\n\n`;
    response += `📝 *Título:* ${activityToComplete.title}\n`;
    if (activityToComplete.client_name) response += `👤 *Cliente:* ${activityToComplete.client_name}\n`;
    response += `📅 *Data:* ${formatDate(activityToComplete.date || '')}\n`;
    response += `🎉 *Status:* Concluída\n\n`;

    // Se tinha estimativa, mostrar
    if (activityToComplete.estimated_duration) {
      response += `⏱️ _Tempo estimado: ${activityToComplete.estimated_duration}min_\n`;
    }

    response += `\n💪 Continue assim! Use "restantes" para ver o que ainda falta.`;

    return response;
  } catch (error: any) {
    console.error('Erro ao concluir tarefa:', error);
    return '❌ Erro ao processar sua solicitação. Tente novamente.';
  }
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
 * Handler para listar clientes disponíveis
 */
export async function handleListClientsCommand(): Promise<string> {
  const clients = await getAllClients();

  if (clients.length === 0) {
    return '⚠️ *Nenhum cliente cadastrado*\n\nCadastre clientes na plataforma web para começar a criar atividades.';
  }

  let message = `👥 *Clientes Disponíveis* (${clients.length})\n\n`;
  
  clients.forEach((client, index) => {
    message += `${index + 1}. ${client.name}\n`;
  });

  message += `\n💡 _Use estes nomes ao criar atividades_\n`;
  message += `Exemplo: "criar reunião com ${clients[0].name}"`;

  return message;
}

/**
 * Handler para comando de ajuda
 */
export function handleHelpCommand(): string {
  return `
📱 *Finance Cal Hub Bot - Comandos Disponíveis*

*📊 Consultas de Atividades:*
• \`hoje\` ou \`atividades\` - Suas atividades de hoje
• \`restantes\` - O que ainda falta fazer hoje
• \`fazendo\` ou \`andamento\` - Atividades em progresso
• \`pendentes\` - Todas as tarefas pendentes
• \`vencidas\` ou \`atrasadas\` - Tarefas com prazo vencido
• \`resumo\` - Resumo inteligente do dia com IA

*📅 Consultas por Data:*
• \`amanhã\` - Atividades de amanhã
• \`15/12\` ou \`15/12/2025\` - Atividades de data específica
• \`próxima semana\` - Atividades da próxima semana

*👥 Clientes:*
• \`clientes\` - Lista todos os clientes disponíveis

*➕ Criar Tarefas:*
• \`criar [descrição] para [cliente]\` - Cria tarefa com IA
• \`nova tarefa [descrição]\` - Cria tarefa com IA
• _Exemplo:_ "criar reunião com Dias Júnior Academy amanhã às 14h"
• ⚠️ *Cliente é obrigatório!* Use \`clientes\` para ver a lista

*✅ Concluir Tarefas:*
• \`concluir [descrição]\` - Marca tarefa como concluída
• \`finalizar [descrição]\` - Marca tarefa como concluída
• _Exemplo:_ "concluir reunião com João"

*❓ Perguntas com IA:*
• Digite qualquer pergunta sobre suas atividades
• _Exemplo:_ "Quanto tempo vou levar hoje?"

*ℹ️ Ajuda:*
• \`ajuda\` ou \`menu\` - Mostra este menu

💡 _Todas as tarefas precisam ter um cliente associado!_
  `.trim();
}

/**
 * Processa mensagem recebida e retorna resposta
 */
export async function processMessage(userId: string, message: string): Promise<string> {
  const normalizedMessage = message.toLowerCase().trim();

  // Comandos específicos de consulta
  if (normalizedMessage === 'hoje' || normalizedMessage === 'atividades') {
    return handleTodayCommand(userId);
  }

  if (normalizedMessage === 'pendentes' || normalizedMessage === 'pendente') {
    return handlePendingCommand(userId);
  }

  if (normalizedMessage === 'fazendo' || normalizedMessage === 'andamento') {
    return handleInProgressCommand(userId);
  }

  if (normalizedMessage === 'vencidas' || normalizedMessage === 'atrasadas' || normalizedMessage === 'vencida' || normalizedMessage === 'atrasada') {
    return handleOverdueCommand(userId);
  }

  if (normalizedMessage === 'restantes' || normalizedMessage === 'falta fazer' || normalizedMessage === 'restante') {
    return handleRemainingCommand(userId);
  }

  if (normalizedMessage === 'resumo') {
    return handleSummaryCommand(userId);
  }

  if (normalizedMessage === 'ajuda' || normalizedMessage === 'help' || normalizedMessage === 'menu') {
    return handleHelpCommand();
  }

  // Listar clientes
  if (normalizedMessage === 'clientes' || normalizedMessage === 'cliente') {
    return handleListClientsCommand();
  }

  // Consultas por data
  if (normalizedMessage === 'amanhã' || normalizedMessage === 'amanha') {
    return handleDateCommand(userId, 'amanhã');
  }

  if (normalizedMessage.includes('próxima semana') || normalizedMessage.includes('proxima semana')) {
    return handleDateCommand(userId, 'próxima semana');
  }

  // Data no formato DD/MM ou DD/MM/YYYY
  const datePattern = /\b(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)\b/;
  if (datePattern.test(normalizedMessage)) {
    const dateMatch = normalizedMessage.match(datePattern);
    if (dateMatch) {
      return handleDateCommand(userId, dateMatch[1]);
    }
  }

  // Comandos de criação de tarefa
  if (normalizedMessage.startsWith('criar ') || 
      normalizedMessage.startsWith('nova tarefa ') || 
      normalizedMessage.startsWith('adicionar ') ||
      normalizedMessage.startsWith('cadastrar ')) {
    const taskText = message.replace(/^(criar|nova tarefa|adicionar|cadastrar)\s+/i, '');
    return handleCreateTaskCommand(userId, taskText);
  }

  // Comandos de conclusão de tarefa
  if (normalizedMessage.startsWith('concluir ') || 
      normalizedMessage.startsWith('finalizar ') || 
      normalizedMessage.startsWith('concluída ') ||
      normalizedMessage.startsWith('concluida ') ||
      normalizedMessage.startsWith('completar ') ||
      normalizedMessage.startsWith('feito ') ||
      normalizedMessage.startsWith('pronto ')) {
    const taskText = message.replace(/^(concluir|finalizar|concluída|concluida|completar|feito|pronto)\s+/i, '');
    return handleCompleteTaskCommand(userId, taskText);
  }

  // Se parece uma descrição de tarefa (contém palavras-chave)
  const taskKeywords = ['reunião', 'reuniao', 'ligar', 'enviar', 'fazer', 'preparar', 'revisar', 'atualizar', 'corrigir', 'terminar', 'finalizar'];
  const hasTaskKeyword = taskKeywords.some(keyword => normalizedMessage.includes(keyword));
  
  if (hasTaskKeyword && normalizedMessage.length > 10) {
    return handleCreateTaskCommand(userId, message);
  }

  // Se não é um comando, trata como pergunta para a IA
  if (normalizedMessage.length > 5) {
    return handleQuestionCommand(userId, message);
  }

  // Fallback
  return handleHelpCommand();
}

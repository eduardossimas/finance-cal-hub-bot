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
  isRecurringActivityCompletedOnDate,
} from '../services/activities';
import { summarizeActivities, answerQuestion, extractTaskInfo, identifyActivityToComplete, identifyIntent } from '../services/ai';

/**
 * Converte HTML de descrição para texto legível para WhatsApp
 */
function htmlToReadableText(html: string): string {
  if (!html) return '';
  
  // Remove o cabeçalho <h3>Cliente Assistant</h3>
  let text = html.replace(/<h3>.*?Assistant<\/h3>/gi, '');
  
  // Extrai itens da task list
  const taskItemRegex = /<li[^>]*data-type="taskItem"[^>]*>.*?<p>(.*?)<\/p>.*?<\/li>/gi;
  const matches = Array.from(html.matchAll(taskItemRegex));
  
  if (matches.length > 0) {
    const items = matches.map((match, index) => `   ${index + 1}. ${match[1]}`);
    return items.join('\n');
  }
  
  // Se não tem task list, pega conteúdo de <p>
  text = text.replace(/<p>(.*?)<\/p>/gi, '$1');
  
  // Remove outras tags HTML
  text = text.replace(/<[^>]*>/g, '');
  
  return text.trim();
}

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

    console.log(`📝 Analisando mensagem: "${message}"`);
    console.log(`👥 Clientes disponíveis: ${availableClients.map(c => c.name).join(', ')}`);

    // Extrair informações da mensagem (IA já tem acesso à lista de clientes)
    const extracted = await extractTaskInfo(message, availableClients);

    if (!extracted) {
      // IA não conseguiu extrair informações
      let response = '🤔 *Não consegui entender sua mensagem*\n\n';
      response += `📋 *Clientes disponíveis:*\n`;
      availableClients.forEach((client, index) => {
        response += `   ${index + 1}. ${client.name}\n`;
      });
      response += `\n💡 *Para criar uma tarefa, mencione:*\n`;
      response += `   • O que fazer (ex: "reunião", "ligar")\n`;
      response += `   • Qual cliente\n`;
      response += `   • Quando (ex: "hoje", "amanhã")\n\n`;
      response += `🔹 *Exemplo:* "reunião com ${availableClients[0].name} amanhã às 14h"`;
      return response;
    }

    // Verificar se IA extraiu um cliente
    if (!extracted.clientName || extracted.clientName.trim() === '') {
      // IA não identificou nenhum cliente na mensagem
      let response = '⚠️ *Não identifiquei o cliente nesta tarefa*\n\n';
      response += `📋 *Clientes disponíveis:*\n`;
      availableClients.forEach((client, index) => {
        response += `   ${index + 1}. ${client.name}\n`;
      });
      response += `\n💡 *Por favor, mencione o cliente na sua mensagem.*\n\n`;
      response += `🔹 *Exemplo:* "${extracted.title || 'sua tarefa'} para ${availableClients[0].name}"`;
      return response;
    }

    console.log(`✅ Informações extraídas:`, extracted);

    // Criar atividade
    const result = await createActivityFromAI(userId, extracted);

    if (result.clientNotFound) {
      // Cliente mencionado não existe no sistema
      let response = `⚠️ *Cliente "${extracted.clientName}" não está cadastrado*\n\n`;
      response += `📋 *Clientes cadastrados no sistema:*\n`;
      availableClients.forEach((client, index) => {
        response += `   ${index + 1}. ${client.name}\n`;
      });
      response += `\n💡 *Você quis dizer algum destes clientes?*\n`;
      response += `Ou cadastre "${extracted.clientName}" na plataforma web primeiro.`;
      return response;
    }

    if (!result.activity) {
      return '❌ Erro ao criar a atividade. Tente novamente ou use "ajuda" para ver os comandos.';
    }

    const activity = result.activity;
    const dateFormatted = formatDate(activity.date || '');
    
    let response = `✅ *Tarefa criada com sucesso!*\n\n`;
    response += `📝 ${activity.title}\n`;
    
    // Converter HTML para texto legível
    if (activity.description) {
      const readableDescription = htmlToReadableText(activity.description);
      if (readableDescription) {
        response += `\n� *Itens:*\n${readableDescription}\n`;
      }
    }
    
    response += `\n👤 Cliente: *${extracted.clientName}*\n`;
    response += `📅 ${dateFormatted}\n`;
    response += `⏱️ ${activity.estimated_duration} minutos\n`;
    response += `📊 Status: ⏳ Pendente\n\n`;
    response += `💡 Use "hoje" para ver todas as tarefas de hoje`;

    return response;
  } catch (error: any) {
    console.error('❌ Erro ao criar tarefa:', error);
    return '❌ Erro ao processar sua solicitação. Verifique sua mensagem e tente novamente.\n\n💡 Use "ajuda" para ver exemplos de comandos.';
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
 * Handler para concluir tarefa por número
 */
export async function handleCompleteTaskByNumber(userId: string, taskNumber: number): Promise<string> {
  try {
    console.log(`✅ Tentando concluir tarefa número ${taskNumber}`);
    
    // Buscar atividades de hoje do usuário
    const todayActivities = await getActivitiesToday(userId);
    
    if (todayActivities.length === 0) {
      return '📅 Você não tem atividades para hoje.\n\n💡 Use "hoje" para ver suas atividades.';
    }
    
    // Verificar se o número é válido
    if (taskNumber < 1 || taskNumber > todayActivities.length) {
      return `❌ *Número inválido*\n\nVocê tem ${todayActivities.length} atividade${todayActivities.length > 1 ? 's' : ''} hoje.\n\n💡 Use "hoje" para ver a lista completa.`;
    }
    
    // Pegar a atividade (índice é número - 1)
    const activity = todayActivities[taskNumber - 1];
    const today = new Date().toISOString().split('T')[0];
    
    // Verificar se é recorrente e já foi completada hoje
    if (activity.is_recurring && isRecurringActivityCompletedOnDate(activity, today)) {
      return `✅ *${activity.title}* já foi marcada como concluída hoje!\n\n💡 Use "restantes" para ver o que ainda falta fazer.`;
    }
    
    // Verificar se já está concluída (atividades não recorrentes)
    if (!activity.is_recurring && activity.status === 'completed') {
      return `✅ *${activity.title}* já está concluída!\n\n💡 Use "restantes" para ver o que ainda falta fazer.`;
    }
    
    // Para atividades recorrentes, precisamos atualizar o campo description
    if (activity.is_recurring) {
      return `⚠️ *Conclusão de atividades recorrentes*\n\nPor favor, marque como concluída diretamente no aplicativo.\n\nEsta funcionalidade estará disponível em breve no bot! 🚀`;
    }
    
    // Concluir a atividade
    const completed = await completeActivity(activity.id);
    
    if (!completed) {
      return '❌ Erro ao concluir atividade. Tente novamente.';
    }
    
    let response = `✅ *Atividade Concluída!*\n\n`;
    response += `${taskNumber}. ${activity.title}\n`;
    
    if (activity.client_name) {
      response += `👤 Cliente: ${activity.client_name}\n`;
    }
    
    if (activity.estimated_duration) {
      response += `⏱️ Tempo estimado: ${activity.estimated_duration}min\n`;
    }
    
    response += `\n🎉 Parabéns! Continue assim!`;
    response += `\n\n💡 Use "restantes" para ver o que ainda falta fazer.`;
    
    return response;
  } catch (error: any) {
    console.error('Erro ao concluir tarefa por número:', error);
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
📱 *Finance Cal Hub Bot*

🚀 *MODO INTELIGENTE ATIVADO*
Simplesmente escreva o que você precisa fazer e eu crio a tarefa automaticamente!

*Exemplo:*
• "atividades teste hoje para ConectFin"
• "reunião com Clínica Maria Inês amanhã"
• "ligar para Dias Júnior Academy"

🎤 *ÁUDIOS SUPORTADOS!*
Você pode enviar áudios e eu vou transcrever automaticamente usando IA!

---

*📊 Ver Suas Tarefas:*
• \`hoje\` ou \`quais minhas atividades de hoje\`
• \`amanhã\` ou \`o que tenho amanhã\`
• \`restantes\` ou \`o que falta fazer\`
• \`pendentes\` ou \`minhas tarefas pendentes\`
• \`fazendo\` ou \`o que estou fazendo\`
• \`vencidas\` ou \`tarefas atrasadas\`
• \`resumo\` - Resumo inteligente do dia

*✅ Concluir Tarefas:*
• \`concluir 2\` - Marca a tarefa 2 como concluída
• \`finalizar tarefa 1\` - Marca a tarefa 1 como concluída
• \`completar 3\` - Marca a tarefa 3 como concluída
• \`feito 1\` - Marca a tarefa 1 como concluída
• \`ok 2\` - Marca a tarefa 2 como concluída

💡 _Os números se referem à ordem que aparecem em "hoje"_

*👥 Clientes:*
• \`clientes\` - Ver clientes disponíveis

⚠️ *Importante:* Toda tarefa precisa ter um cliente. Use \`clientes\` para ver a lista.
  `.trim();
}

/**
 * Processa mensagem recebida e retorna resposta
 */
export async function processMessage(userId: string, message: string): Promise<string> {
  const normalizedMessage = message.toLowerCase().trim();

  // ========== COMANDOS DE CONSULTA ==========
  
  // Hoje - todas as variações
  if (normalizedMessage === 'hoje' || 
      normalizedMessage === 'atividades' ||
      normalizedMessage.match(/^(quais?|qual|me mostra?|mostra?|ver|lista?) .*(atividade|tarefa|compromisso)s? .*(hoje|hj)$/i) ||
      normalizedMessage.match(/^(minhas?|as) (atividade|tarefa|compromisso)s? .*(hoje|hj)$/i) ||
      normalizedMessage.match(/^(o que|oque) .*(tenho|tem) (hoje|hj)$/i)) {
    return handleTodayCommand(userId);
  }

  // Amanhã - todas as variações
  if (normalizedMessage === 'amanhã' || 
      normalizedMessage === 'amanha' ||
      normalizedMessage.match(/^(quais?|qual|me mostra?|mostra?|ver|lista?) .*(atividade|tarefa|compromisso)s? .*(amanhã|amanha)$/i) ||
      normalizedMessage.match(/^(minhas?|as) (atividade|tarefa|compromisso)s? .*(amanhã|amanha)$/i) ||
      normalizedMessage.match(/^(o que|oque) .*(tenho|tem) (amanhã|amanha)$/i)) {
    return handleDateCommand(userId, 'amanhã');
  }

  // Pendentes - todas as variações
  if (normalizedMessage === 'pendentes' || 
      normalizedMessage === 'pendente' ||
      normalizedMessage.match(/^(quais?|qual|me mostra?|mostra?|ver|lista?) .*(atividade|tarefa|compromisso)s? .*(pendente|em aberto|abertas?)$/i) ||
      normalizedMessage.match(/^(minhas?|as) (atividade|tarefa|compromisso)s? .*(pendente|em aberto|abertas?)$/i)) {
    return handlePendingCommand(userId);
  }

  // Em andamento - todas as variações
  if (normalizedMessage === 'fazendo' || 
      normalizedMessage === 'andamento' ||
      normalizedMessage.match(/^(quais?|qual|me mostra?|mostra?|ver|lista?) .*(atividade|tarefa|compromisso)s? .*(fazendo|andamento|em progresso)$/i) ||
      normalizedMessage.match(/^(minhas?|as) (atividade|tarefa|compromisso)s? .*(fazendo|andamento|em progresso)$/i)) {
    return handleInProgressCommand(userId);
  }

  // Vencidas - todas as variações
  if (normalizedMessage === 'vencidas' || 
      normalizedMessage === 'atrasadas' || 
      normalizedMessage === 'vencida' || 
      normalizedMessage === 'atrasada' ||
      normalizedMessage.match(/^(quais?|qual|me mostra?|mostra?|ver|lista?) .*(atividade|tarefa|compromisso)s? .*(vencida|atrasada|atrasado)s?$/i) ||
      normalizedMessage.match(/^(minhas?|as) (atividade|tarefa|compromisso)s? .*(vencida|atrasada|atrasado)s?$/i)) {
    return handleOverdueCommand(userId);
  }

  // Restantes - todas as variações
  if (normalizedMessage === 'restantes' || 
      normalizedMessage === 'falta fazer' || 
      normalizedMessage === 'restante' ||
      normalizedMessage.match(/^(o que|oque) .*(falta|resta|restam?) .*fazer$/i) ||
      normalizedMessage.match(/^(quais?|qual) .*(atividade|tarefa|compromisso)s? .*(falta|resta|restam?)$/i)) {
    return handleRemainingCommand(userId);
  }

  // Resumo
  if (normalizedMessage === 'resumo') {
    return handleSummaryCommand(userId);
  }

  // Ajuda
  if (normalizedMessage === 'ajuda' || normalizedMessage === 'help' || normalizedMessage === 'menu') {
    return handleHelpCommand();
  }

  // Listar clientes
  if (normalizedMessage === 'clientes' || normalizedMessage === 'cliente') {
    return handleListClientsCommand();
  }

  // Próxima semana
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

  // ========== COMANDOS DE CONCLUSÃO ==========
  
  // Concluir tarefa por número: "concluir tarefa 2", "completar 1", "finalizar atividade 3"
  const completeByNumberPattern = /^(concluir|finalizar|concluída?|completar|feito|pronto|ok|done|marcar como (concluída?|feita?|completa?)) +(tarefa|atividade|item|número|numero|n[oº°])? *(\d+)$/i;
  const completeNumberMatch = normalizedMessage.match(completeByNumberPattern);
  
  if (completeNumberMatch) {
    // O número está sempre no último grupo capturado
    const taskNumber = parseInt(completeNumberMatch[completeNumberMatch.length - 1]);
    console.log(`✅ Detectado comando de conclusão por número: ${taskNumber}`);
    return handleCompleteTaskByNumber(userId, taskNumber);
  }

  // Concluir tarefa por descrição
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

  // 🆕 USAR IA PARA IDENTIFICAR INTENÇÃO DA MENSAGEM
  console.log(`🤖 Identificando intenção da mensagem: "${message}"`);
  
  try {
    const intent = await identifyIntent(message);
    
    if (intent) {
      console.log(`✅ Intenção identificada:`, intent);
      
      // Se for consulta (query), buscar atividades
      if (intent.intent === 'query' && intent.filters) {
        console.log(`📋 Consulta detectada com filtros:`, intent.filters);
        
        // Verificar se é consulta de HOJE (de qualquer forma)
        const today = new Date().toISOString().split('T')[0];
        const isToday = intent.filters.date === today || 
                       intent.filters.period === 'today' ||
                       (intent.filters.date && intent.filters.date === today);
        
        if (isToday) {
          console.log(`📅 Consulta identificada como HOJE - usando handleTodayCommand`);
          return handleTodayCommand(userId);
        }
        
        // Se tem data específica no formato ISO (YYYY-MM-DD) e NÃO é hoje
        if (intent.filters.date) {
          const dateISO = intent.filters.date;
          
          // Verificar se já está no formato ISO
          if (/^\d{4}-\d{2}-\d{2}$/.test(dateISO)) {
            // Buscar atividades diretamente com a data ISO
            const activities = await getActivitiesByDate(userId, dateISO);
            const dateFormatted = formatDate(dateISO);

            if (activities.length === 0) {
              return `📅 ${dateFormatted}\n\n✨ Nenhuma atividade agendada para esta data.`;
            }

            let message = `📅 *Atividades - ${dateFormatted}* (${activities.length})\n\n`;
            
            activities.forEach((activity, index) => {
              message += `${formatActivity(activity, index)}\n`;
            });

            return message;
          } else {
            // Se não está no formato ISO, usar handleDateCommand
            return handleDateCommand(userId, intent.filters.date);
          }
        }
        
        // Se tem período
        if (intent.filters.period) {
          if (intent.filters.period === 'current_week') {
            return '📅 *Atividades da Semana Atual*\n\nRecurso em desenvolvimento! Por enquanto, use "hoje", "amanhã" ou datas específicas (DD/MM).';
          }
        }
        
        // Consulta genérica - retornar hoje por padrão
        console.log(`📅 Consulta genérica - retornando atividades de hoje`);
        return handleTodayCommand(userId);
      }
      
      // Se for resumo
      if (intent.intent === 'summary') {
        return handleSummaryCommand(userId);
      }
      
      // Se for atualização de tarefa
      if (intent.intent === 'update_task') {
        if (intent.operation === 'complete') {
          return handleCompleteTaskCommand(userId, message);
        }
        return '⚠️ Operação de atualização ainda não implementada. Use "concluir [tarefa]" para marcar como concluída.';
      }
      
      // Se for pergunta
      if (intent.intent === 'question') {
        return handleQuestionCommand(userId, message);
      }
      
      // Se for criar tarefa, continua para o fluxo normal abaixo
      if (intent.intent === 'create_task') {
        console.log(`➕ Criação de tarefa detectada`);
        return handleCreateTaskCommand(userId, message);
      }
    }
  } catch (error: any) {
    console.error('❌ Erro ao identificar intenção:', error);
    // Em caso de erro, tenta criar tarefa (comportamento padrão)
  }

  // FALLBACK: QUALQUER OUTRA MENSAGEM É TRATADA COMO CRIAÇÃO DE TAREFA
  // A IA vai identificar o cliente e extrair as informações
  console.log(`📝 Tentando criar tarefa (fallback)`);
  return handleCreateTaskCommand(userId, message);
}

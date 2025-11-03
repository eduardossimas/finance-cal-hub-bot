import { supabase } from '../config/supabase';
import { Activity, User } from '../types';

/**
 * Obtém o user_id através do número de telefone
 */
export async function getUserIdByPhone(phone: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('phone', phone)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    console.error('Erro ao buscar usuário por telefone:', error);
    return null;
  }

  return data?.id || null;
}

/**
 * Lista todas as atividades do usuário para hoje
 */
export async function getActivitiesToday(userId: string): Promise<Activity[]> {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('date', today)
    .contains('assigned_users', [userId])
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Erro ao buscar atividades:', error);
    return [];
  }

  return data || [];
}

/**
 * Lista atividades pendentes do usuário
 */
export async function getPendingActivities(userId: string): Promise<Activity[]> {
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .contains('assigned_users', [userId])
    .in('status', ['pending', 'waiting-client', 'waiting-team'])
    .order('date', { ascending: true });

  if (error) {
    console.error('Erro ao buscar atividades pendentes:', error);
    return [];
  }

  return data || [];
}

/**
 * Lista atividades em andamento do usuário
 */
export async function getInProgressActivities(userId: string): Promise<Activity[]> {
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .contains('assigned_users', [userId])
    .eq('status', 'doing')
    .order('date', { ascending: true });

  if (error) {
    console.error('Erro ao buscar atividades em andamento:', error);
    return [];
  }

  return data || [];
}

/**
 * Cria uma nova atividade
 */
export async function createActivity(
  userId: string,
  title: string,
  clientName?: string,
  estimatedMinutes?: number
): Promise<Activity | null> {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('activities')
    .insert({
      title,
      client_name: clientName,
      assigned_users: [userId],
      assigned_to: userId,
      date: today,
      estimated_duration: estimatedMinutes,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar atividade:', error);
    return null;
  }

  return data;
}

/**
 * Atualiza o status de uma atividade
 */
export async function updateActivityStatus(
  activityId: string,
  status: string
): Promise<boolean> {
  const updateData: any = { 
    status, 
    updated_at: new Date().toISOString() 
  };

  // Se estiver marcando como concluída, registrar timestamp
  if (status === 'completed') {
    updateData.completed_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('activities')
    .update(updateData)
    .eq('id', activityId);

  if (error) {
    console.error('Erro ao atualizar status:', error);
    return false;
  }

  return true;
}

/**
 * Marca atividade como concluída
 */
export async function completeActivity(activityId: string): Promise<boolean> {
  return updateActivityStatus(activityId, 'completed');
}

/**
 * Busca atividade por título ou descrição (fuzzy match)
 */
export async function findActivityByDescription(
  userId: string,
  description: string
): Promise<Activity[]> {
  // Buscar atividades não concluídas do usuário
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .contains('assigned_users', [userId])
    .in('status', ['pending', 'doing', 'waiting-client', 'waiting-team'])
    .order('date', { ascending: false });

  if (error) {
    console.error('Erro ao buscar atividades:', error);
    return [];
  }

  return data || [];
}

/**
 * Lista todos os usuários com telefone cadastrado (para envio de resumos diários)
 */
export async function getAllUsersWithPhone(): Promise<User[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .not('phone', 'is', null);

  if (error) {
    console.error('Erro ao buscar usuários:', error);
    return [];
  }

  return data || [];
}

/**
 * Formata uma atividade para exibição
 */
export function formatActivity(activity: Activity, index?: number): string {
  const prefix = index !== undefined ? `${index + 1}. ` : '';
  const status = formatStatus(activity.status);
  const time = activity.estimated_duration 
    ? ` | ⏱️ ${activity.estimated_duration}min` 
    : '';
  const client = activity.client_name ? ` | 👤 ${activity.client_name}` : '';
  
  return `${prefix}${activity.title}${client}${time} ${status}`;
}

/**
 * Formata o status com emoji
 */
export function formatStatus(status?: string): string {
  const statusMap: Record<string, string> = {
    pending: '⏳ Pendente',
    doing: '▶️ Em Andamento',
    completed: '✅ Concluída',
    'waiting-client': '⏸️ Aguardando Cliente',
    'waiting-team': '⏸️ Aguardando Equipe',
  };
  
  return statusMap[status || 'pending'] || '❓ Desconhecido';
}

/**
 * Lista atividades vencidas (data anterior a hoje e não concluídas)
 */
export async function getOverdueActivities(userId: string): Promise<Activity[]> {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .contains('assigned_users', [userId])
    .lt('date', today)
    .in('status', ['pending', 'doing', 'waiting-client', 'waiting-team'])
    .order('date', { ascending: true });

  if (error) {
    console.error('Erro ao buscar atividades vencidas:', error);
    return [];
  }

  return data || [];
}

/**
 * Lista atividades por data específica
 */
export async function getActivitiesByDate(userId: string, date: string): Promise<Activity[]> {
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .contains('assigned_users', [userId])
    .eq('date', date)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Erro ao buscar atividades por data:', error);
    return [];
  }

  return data || [];
}

/**
 * Lista atividades restantes de hoje (pendentes + doing)
 */
export async function getRemainingTodayActivities(userId: string): Promise<Activity[]> {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('date', today)
    .contains('assigned_users', [userId])
    .in('status', ['pending', 'doing', 'waiting-client', 'waiting-team'])
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Erro ao buscar atividades restantes:', error);
    return [];
  }

  return data || [];
}

/**
 * Busca ou cria cliente por nome
 */
export async function getOrCreateClient(clientName: string): Promise<string | null> {
  // Normalizar nome para busca (remover acentos, lowercase)
  const normalizedName = clientName.toLowerCase().trim();
  
  // Buscar cliente existente (case-insensitive)
  const { data: existingClients } = await supabase
    .from('clients')
    .select('id, name')
    .ilike('name', `%${clientName}%`)
    .eq('is_active', true);

  if (existingClients && existingClients.length > 0) {
    // Se encontrou, retorna o primeiro (mais similar)
    console.log(`✅ Cliente encontrado: ${existingClients[0].name}`);
    return existingClients[0].id;
  }

  console.log(`⚠️ Cliente "${clientName}" não encontrado na base de dados`);
  console.log(`💡 Sugestão: Cadastre o cliente na interface web primeiro`);
  
  return null;
}

/**
 * Lista todos os clientes ativos
 */
export async function getAllClients(): Promise<Array<{ id: string; name: string }>> {
  const { data, error } = await supabase
    .from('clients')
    .select('id, name')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) {
    console.error('Erro ao buscar clientes:', error);
    return [];
  }

  return data || [];
}

/**
 * Cria atividade com informações extraídas pela IA
 */
export async function createActivityFromAI(
  userId: string,
  extractedData: {
    title: string;
    description?: string;
    clientName?: string;
    estimatedDuration?: number;
    date?: string;
  }
): Promise<{ activity: Activity | null; clientNotFound: boolean }> {
  const activityDate = extractedData.date || new Date().toISOString().split('T')[0];

  let clientId: string | null = null;
  let clientNotFound = false;

  if (extractedData.clientName) {
    clientId = await getOrCreateClient(extractedData.clientName);
    if (!clientId) {
      clientNotFound = true;
      console.log(`⚠️ Cliente "${extractedData.clientName}" não encontrado - atividade NÃO será criada`);
    }
  }

  // Se cliente foi mencionado mas não encontrado, não criar
  if (extractedData.clientName && !clientId) {
    return { activity: null, clientNotFound: true };
  }

  // Se não há cliente mencionado, também não criar (cliente é obrigatório)
  if (!clientId) {
    console.log('⚠️ Cliente não especificado - atividade NÃO será criada');
    return { activity: null, clientNotFound: true };
  }

  const { data, error } = await supabase
    .from('activities')
    .insert({
      title: extractedData.title,
      description: extractedData.description || null,
      client_id: clientId,
      assigned_users: [userId],
      assigned_to: userId,
      date: activityDate,
      estimated_duration: extractedData.estimatedDuration || 60,
      status: 'pending',
      is_recurring: false,
    })
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar atividade:', error);
    return { activity: null, clientNotFound: false };
  }

  return { activity: data, clientNotFound: false };
}

/**
 * Formata data legível em português
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const compareDate = new Date(date);
  
  if (compareDate.getTime() === today.getTime()) return '🔵 Hoje';
  if (compareDate.getTime() === tomorrow.getTime()) return '🟢 Amanhã';
  if (compareDate.getTime() === yesterday.getTime()) return '🔴 Ontem';
  
  return date.toLocaleDateString('pt-BR', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric' 
  });
}

/**
 * Calcula dias de atraso
 */
export function getDaysOverdue(dateString: string): number {
  const taskDate = new Date(dateString + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const diffTime = today.getTime() - taskDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

/**
 * Converte data em linguagem natural para formato YYYY-MM-DD
 */
export function parseNaturalDate(text: string): string | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const lowerText = text.toLowerCase();
  
  // Hoje
  if (lowerText.includes('hoje')) {
    return today.toISOString().split('T')[0];
  }
  
  // Amanhã
  if (lowerText.includes('amanhã') || lowerText.includes('amanha')) {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }
  
  // Depois de amanhã
  if (lowerText.includes('depois de amanhã') || lowerText.includes('depois de amanha')) {
    const afterTomorrow = new Date(today);
    afterTomorrow.setDate(afterTomorrow.getDate() + 2);
    return afterTomorrow.toISOString().split('T')[0];
  }
  
  // Próxima semana (próxima segunda-feira)
  if (lowerText.includes('próxima semana') || lowerText.includes('proxima semana')) {
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + (8 - nextWeek.getDay()));
    return nextWeek.toISOString().split('T')[0];
  }
  
  // Daqui a X dias
  const daysMatch = lowerText.match(/daqui\s+a\s+(\d+)\s+dias?/);
  if (daysMatch) {
    const days = parseInt(daysMatch[1]);
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + days);
    return futureDate.toISOString().split('T')[0];
  }
  
  return null;
}

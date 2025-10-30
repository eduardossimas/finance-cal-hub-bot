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
  const { error } = await supabase
    .from('activities')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', activityId);

  if (error) {
    console.error('Erro ao atualizar status:', error);
    return false;
  }

  return true;
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

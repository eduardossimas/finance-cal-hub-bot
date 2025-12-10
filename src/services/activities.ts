import { supabase } from '../config/supabase';
import { Activity, User } from '../types';

const ACTIVITY_SELECT =
  '*, client:clients!activities_client_id_fkey (id, name)';

/**
 * Verifica se uma atividade recorrente foi completada em uma data específica
 */
export function isRecurringActivityCompletedOnDate(activity: Activity, date: string): boolean {
  if (!activity.is_recurring || !activity.description) {
    return false;
  }

  try {
    // Extrair JSON da descrição (formato: <recurrence>...</recurrence>)
    const match = activity.description.match(/<recurrence>(.*?)<\/recurrence>/);
    if (!match) return false;

    const recurrenceData = JSON.parse(match[1]);
    const completedDates: string[] = recurrenceData.completedDates || [];

    return completedDates.includes(date);
  } catch (error) {
    console.error('Erro ao parsear recurrence data:', error);
    return false;
  }
}

function normalizeActivityClient(data: any): Activity {
  if (!data) return data;

  const clientName =
    data.client_name ||
    data.client?.name ||
    data.clients?.name ||
    null;

  return {
    ...data,
    client_name: clientName || undefined,
  };
}

function normalizeActivities(data: any[] | null): Activity[] {
  if (!data) return [];
  return data.map(normalizeActivityClient);
}

/**
 * Obtém o user_id através do número de telefone
 */
export async function getUserIdByPhone(phone: string): Promise<string | null> {
  console.log(`🔍 Buscando usuário com telefone: ${phone}`);
  
  const { data, error } = await supabase
    .from('users')
    .select('id, name, phone')
    .eq('phone', phone)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      console.log(`⚠️ Nenhum usuário encontrado com o telefone: ${phone}`);
      return null;
    }
    console.error('❌ Erro ao buscar usuário por telefone:', error);
    return null;
  }

  console.log(`✅ Usuário encontrado: ${data.name} (ID: ${data.id})`);
  return data?.id || null;
}

/**
 * Lista todas as atividades do usuário para hoje
 * Inclui atividades recorrentes (diárias, semanais, mensais) independentemente do status
 */
export async function getActivitiesToday(userId: string): Promise<Activity[]> {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  
  // Extrair dia do mês e dia da semana diretamente da string para evitar problemas de timezone
  const [year, month, day] = today.split('-').map(Number);
  const todayDate = new Date(year, month - 1, day); // month é 0-indexed
  const dayOfWeek = todayDate.getDay(); // 0 = domingo, 1 = segunda, etc.
  const dayOfMonth = day; // Usar o valor direto da string
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📅 BUSCANDO ATIVIDADES DE HOJE: ${today}`);
  console.log(`   Usuário ID: ${userId}`);
  console.log(`   Dia da semana: ${dayOfWeek} (0=Dom, 1=Seg, ..., 6=Sab)`);
  console.log(`   Dia do mês: ${dayOfMonth}`);
  console.log(`${'='.repeat(60)}`);

  // 1. Buscar atividades específicas de hoje (não recorrentes ou recorrentes com data de hoje)
  console.log('\n1️⃣ Buscando atividades com date = hoje...');
  const { data: todayActivities, error: error1 } = await supabase
    .from('activities')
    .select(ACTIVITY_SELECT)
    .eq('date', today)
    .or(`assigned_to.eq.${userId},assigned_users.cs.{${userId}}`)
    .order('created_at', { ascending: true });

  if (error1) {
    console.error('   ❌ Erro:', error1);
    return [];
  }
  console.log(`   ✅ Encontradas: ${todayActivities?.length || 0}`);
  todayActivities?.forEach(act => {
    console.log(`      - ${act.title} (${act.is_recurring ? 'recorrente' : 'normal'})`);
  });

  // 2. Buscar atividades recorrentes DIÁRIAS (independente da data)
  console.log('\n2️⃣ Buscando atividades recorrentes DIÁRIAS...');
  const { data: dailyRecurring, error: error2 } = await supabase
    .from('activities')
    .select(ACTIVITY_SELECT)
    .or(`assigned_to.eq.${userId},assigned_users.cs.{${userId}}`)
    .eq('is_recurring', true)
    .eq('recurrence_type', 'daily');

  if (error2) {
    console.error('   ❌ Erro:', error2);
  } else {
    console.log(`   ✅ Encontradas: ${dailyRecurring?.length || 0}`);
    dailyRecurring?.forEach(act => {
      console.log(`      - ${act.title} (data: ${act.date})`);
    });
  }

  // 3. Buscar atividades recorrentes SEMANAIS que correspondem ao dia da semana de hoje
  console.log('\n3️⃣ Buscando atividades recorrentes SEMANAIS...');
  const { data: weeklyRecurring, error: error3 } = await supabase
    .from('activities')
    .select(ACTIVITY_SELECT)
    .or(`assigned_to.eq.${userId},assigned_users.cs.{${userId}}`)
    .eq('is_recurring', true)
    .eq('recurrence_type', 'weekly');

  if (error3) {
    console.error('   ❌ Erro:', error3);
  } else {
    console.log(`   ✅ Encontradas: ${weeklyRecurring?.length || 0}`);
    weeklyRecurring?.forEach(act => {
      const actDate = new Date(act.date);
      console.log(`      - ${act.title} (data: ${act.date}, dia semana: ${actDate.getDay()})`);
    });
  }

  // 4. Buscar atividades recorrentes MENSAIS que correspondem ao dia do mês
  console.log('\n4️⃣ Buscando atividades recorrentes MENSAIS...');
  const { data: monthlyRecurring, error: error4 } = await supabase
    .from('activities')
    .select(ACTIVITY_SELECT)
    .or(`assigned_to.eq.${userId},assigned_users.cs.{${userId}}`)
    .eq('is_recurring', true)
    .eq('recurrence_type', 'monthly');

  if (error4) {
    console.error('   ❌ Erro:', error4);
  } else {
    console.log(`   ✅ Encontradas: ${monthlyRecurring?.length || 0}`);
    monthlyRecurring?.forEach(act => {
      const actDate = new Date(act.date);
      console.log(`      - ${act.title} (data: ${act.date}, dia do mês: ${actDate.getDate()})`);
    });
  }

  // Combinar todas as atividades, evitando duplicatas
  console.log('\n5️⃣ Combinando atividades...');
  const allActivities: any[] = [...(todayActivities || [])];
  const existingIds = new Set(allActivities.map(a => a.id));

  // Adicionar recorrentes diárias (todas devem aparecer hoje)
  if (dailyRecurring) {
    let addedDaily = 0;
    dailyRecurring.forEach(activity => {
      if (!existingIds.has(activity.id)) {
        allActivities.push(activity);
        existingIds.add(activity.id);
        addedDaily++;
        console.log(`   + Adicionada diária: ${activity.title}`);
      } else {
        console.log(`   ⊘ Diária duplicada ignorada: ${activity.title}`);
      }
    });
    console.log(`   Total de diárias adicionadas: ${addedDaily}`);
  }

  // Adicionar recorrentes semanais que correspondem ao dia da semana
  if (weeklyRecurring) {
    let addedWeekly = 0;
    weeklyRecurring.forEach(activity => {
      // Parsear data evitando problemas de timezone
      const [actYear, actMonth, actDay] = activity.date.split('-').map(Number);
      const activityDate = new Date(actYear, actMonth - 1, actDay);
      const activityDayOfWeek = activityDate.getDay();
      console.log(`   Verificando semanal: ${activity.title} - Dia semana atividade: ${activityDayOfWeek}, Hoje: ${dayOfWeek}`);
      
      // Mostrar se o dia da semana corresponder
      if (activityDayOfWeek === dayOfWeek && !existingIds.has(activity.id)) {
        allActivities.push(activity);
        existingIds.add(activity.id);
        addedWeekly++;
        console.log(`   + Adicionada semanal: ${activity.title}`);
      }
    });
    console.log(`   Total de semanais adicionadas: ${addedWeekly}`);
  }

  // Adicionar recorrentes mensais que correspondem ao dia do mês
  if (monthlyRecurring) {
    let addedMonthly = 0;
    monthlyRecurring.forEach(activity => {
      // Parsear dia do mês diretamente da string
      const [, , actDay] = activity.date.split('-').map(Number);
      const activityDayOfMonth = actDay;
      console.log(`   Verificando mensal: ${activity.title} - Dia do mês atividade: ${activityDayOfMonth}, Hoje: ${dayOfMonth}`);
      
      // Mostrar se o dia do mês corresponder
      if (activityDayOfMonth === dayOfMonth && !existingIds.has(activity.id)) {
        allActivities.push(activity);
        existingIds.add(activity.id);
        addedMonthly++;
        console.log(`   + Adicionada mensal: ${activity.title}`);
      }
    });
    console.log(`   Total de mensais adicionadas: ${addedMonthly}`);
  }

  // Ordenar: primeiro não completadas, depois completadas
  allActivities.sort((a, b) => {
    const statusOrder = { 'pending': 0, 'doing': 1, 'waiting-client': 2, 'waiting-team': 3, 'completed': 4 };
    const aOrder = statusOrder[a.status as keyof typeof statusOrder] ?? 99;
    const bOrder = statusOrder[b.status as keyof typeof statusOrder] ?? 99;
    return aOrder - bOrder;
  });

  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 RESULTADO FINAL:`);
  console.log(`   Total de atividades: ${allActivities.length}`);
  console.log(`   - Específicas de hoje: ${todayActivities?.length || 0}`);
  console.log(`   - Recorrentes adicionadas: ${allActivities.length - (todayActivities?.length || 0)}`);
  console.log(`\n   Lista final:`);
  allActivities.forEach((act, idx) => {
    const completedToday = act.is_recurring && isRecurringActivityCompletedOnDate(act, today);
    console.log(`   ${idx + 1}. ${act.title}`);
    console.log(`      Tipo: ${act.is_recurring ? `Recorrente ${act.recurrence_type}` : 'Normal'}`);
    console.log(`      Status: ${act.status}${completedToday ? ' (completada hoje)' : ''}`);
  });
  console.log(`${'='.repeat(60)}\n`);
  
  return normalizeActivities(allActivities);
}

/**
 * Lista atividades pendentes do usuário
 */
export async function getPendingActivities(userId: string): Promise<Activity[]> {
  const { data, error } = await supabase
    .from('activities')
    .select(ACTIVITY_SELECT)
    .or(`assigned_to.eq.${userId},assigned_users.cs.{${userId}}`)
    .in('status', ['pending', 'waiting-client', 'waiting-team'])
    .order('date', { ascending: true });

  if (error) {
    console.error('Erro ao buscar atividades pendentes:', error);
    return [];
  }

  return normalizeActivities(data);
}

/**
 * Lista atividades em andamento do usuário
 */
export async function getInProgressActivities(userId: string): Promise<Activity[]> {
  const { data, error } = await supabase
    .from('activities')
    .select(ACTIVITY_SELECT)
    .or(`assigned_to.eq.${userId},assigned_users.cs.{${userId}}`)
    .eq('status', 'doing')
    .order('date', { ascending: true });

  if (error) {
    console.error('Erro ao buscar atividades em andamento:', error);
    return [];
  }

  return normalizeActivities(data);
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

  const clientId = clientName ? await getOrCreateClient(clientName) : null;

  if (!clientId) {
    console.log('⚠️ Cliente não especificado ou não encontrado - atividade não será criada');
    return null;
  }

  const { data, error } = await supabase
    .from('activities')
    .insert({
      title,
      client_id: clientId,
      assigned_users: [userId],
      assigned_to: userId,
      date: today,
      estimated_duration: estimatedMinutes,
      status: 'pending',
    })
    .select(ACTIVITY_SELECT)
    .single();

  if (error) {
    console.error('Erro ao criar atividade:', error);
    return null;
  }

  return normalizeActivityClient(data);
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
    .select(ACTIVITY_SELECT)
    .or(`assigned_to.eq.${userId},assigned_users.cs.{${userId}}`)
    .in('status', ['pending', 'doing', 'waiting-client', 'waiting-team'])
    .order('date', { ascending: false });

  if (error) {
    console.error('Erro ao buscar atividades:', error);
    return [];
  }

  return normalizeActivities(data);
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
export function formatActivity(activity: Activity, index?: number, checkDate?: string): string {
  const prefix = index !== undefined ? `${index + 1}. ` : '';
  
  // Para atividades recorrentes, verificar se foi completada na data especificada
  const today = checkDate || new Date().toISOString().split('T')[0];
  let displayStatus = activity.status;
  
  if (activity.is_recurring && isRecurringActivityCompletedOnDate(activity, today)) {
    displayStatus = 'completed';
  }
  
  const status = formatStatus(displayStatus);
  const time = activity.estimated_duration 
    ? ` | ⏱️ ${activity.estimated_duration}min` 
    : '';
  const clientName =
    activity.client_name ||
    (activity as any).client?.name ||
    (activity as any).clients?.name;
  const client = clientName ? ` | 👤 ${clientName}` : '';
  
  // Indicador de recorrência
  let recurrence = '';
  if (activity.is_recurring) {
    const recurrenceIcons: Record<string, string> = {
      daily: '🔄 Diária',
      weekly: '📅 Semanal',
      monthly: '📆 Mensal',
      custom: '🔁 Personalizada'
    };
    recurrence = ` | ${recurrenceIcons[activity.recurrence_type || 'custom'] || '🔁'}`;
  }
  
  return `${prefix}${activity.title}${client}${time}${recurrence} ${status}`;
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
    .select(ACTIVITY_SELECT)
    .or(`assigned_to.eq.${userId},assigned_users.cs.{${userId}}`)
    .lt('date', today)
    .in('status', ['pending', 'doing', 'waiting-client', 'waiting-team'])
    .order('date', { ascending: true });

  if (error) {
    console.error('Erro ao buscar atividades vencidas:', error);
    return [];
  }

  return normalizeActivities(data);
}

/**
 * Lista atividades por data específica
 */
export async function getActivitiesByDate(userId: string, date: string): Promise<Activity[]> {
  const { data, error } = await supabase
    .from('activities')
    .select(ACTIVITY_SELECT)
    .or(`assigned_to.eq.${userId},assigned_users.cs.{${userId}}`)
    .eq('date', date)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Erro ao buscar atividades por data:', error);
    return [];
  }

  return normalizeActivities(data);
}

/**
 * Lista atividades restantes de hoje (pendentes + doing)
 */
export async function getRemainingTodayActivities(userId: string): Promise<Activity[]> {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('activities')
    .select(ACTIVITY_SELECT)
    .eq('date', today)
    .or(`assigned_to.eq.${userId},assigned_users.cs.{${userId}}`)
    .in('status', ['pending', 'doing', 'waiting-client', 'waiting-team'])
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Erro ao buscar atividades restantes:', error);
    return [];
  }

  return normalizeActivities(data);
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
    .select(ACTIVITY_SELECT)
    .single();

  if (error) {
    console.error('Erro ao criar atividade:', error);
    return { activity: null, clientNotFound: false };
  }

  return { activity: normalizeActivityClient(data), clientNotFound: false };
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

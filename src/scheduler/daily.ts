import cron from 'node-cron';
import { WASocket } from '@whiskeysockets/baileys';
import { getAllUsersWithPhone, getActivitiesToday, formatActivity } from '../services/activities';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Envia resumo diário para todos os usuários cadastrados
 */
export async function sendDailySummaries(sock: WASocket): Promise<void> {
  console.log('📤 Iniciando envio de resumos diários...');

  const users = await getAllUsersWithPhone();

  if (users.length === 0) {
    console.log('⚠️ Nenhum usuário com telefone cadastrado para receber resumos');
    return;
  }

  for (const user of users) {
    try {
      if (!user.phone) continue;

      const activities = await getActivitiesToday(user.id);

      // Formatar número para formato WhatsApp
      const phone = user.phone.replace(/\+/g, '');
      const whatsappId = `${phone}@s.whatsapp.net`;

      let message: string;
      const today = new Date().toLocaleDateString('pt-BR', { 
        weekday: 'long', 
        day: '2-digit', 
        month: 'long', 
        year: 'numeric' 
      });

      if (activities.length === 0) {
        message = `🌅 *Bom dia, ${user.name}!*\n\n`;
        message += `📅 *${today}*\n\n`;
        message += `🎉 Você não tem atividades programadas para hoje!\n\n`;
        message += `✨ Aproveite seu dia livre ou que tal planejar algo novo?\n\n`;
        message += `💡 _Use "criar [tarefa]" para adicionar novas atividades._`;
      } else {
        const pending = activities.filter(a => a.status === 'pending').length;
        const doing = activities.filter(a => a.status === 'doing').length;
        const waiting = activities.filter(a => a.status?.includes('waiting')).length;

        message = `🌅 *Bom dia, ${user.name}!*\n\n`;
        message += `📅 *${today}*\n\n`;
        message += `📊 *Resumo do Dia:*\n`;
        message += `• Total: ${activities.length} ${activities.length === 1 ? 'atividade' : 'atividades'}\n`;
        if (pending > 0) message += `• ⏳ Pendentes: ${pending}\n`;
        if (doing > 0) message += `• ▶️ Em andamento: ${doing}\n`;
        if (waiting > 0) message += `• ⏸️ Aguardando: ${waiting}\n`;
        message += `\n`;

        message += `📋 *Suas atividades:*\n`;
        activities.forEach((activity, index) => {
          message += `${formatActivity(activity, index)}\n`;
        });

        message += `\n💪 Vamos começar o dia com produtividade!\n`;
        message += `💡 _Use "resumo" para ver uma análise inteligente_`;
      }

      await sock.sendMessage(whatsappId, { text: message });
      console.log(`✅ Resumo enviado para ${user.phone} (${user.name})`);

      // Delay entre envios para evitar spam detection
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error: any) {
      console.error(`❌ Erro ao enviar para ${user.phone}:`, error.message);
    }
  }

  console.log('✅ Envio de resumos concluído');
}

/**
 * Configura o scheduler de resumos diários
 */
export function setupDailyScheduler(sock: WASocket): void {
  // 0 8 * * 1-5 = 8h da manhã, segunda a sexta (1=segunda, 5=sexta)
  const cronExpression = process.env.DAILY_SUMMARY_CRON || '0 8 * * 1-5';
  const timezone = process.env.TIMEZONE || 'America/Sao_Paulo';

  console.log(`⏰ Agendamento configurado: ${cronExpression} (${timezone})`);
  console.log(`📅 Resumos serão enviados de segunda a sexta-feira às 8h`);

  cron.schedule(
    cronExpression,
    async () => {
      const now = new Date().toLocaleString('pt-BR', { timeZone: timezone });
      console.log(`\n⏰ [${now}] Executando rotina de resumos diários...`);
      await sendDailySummaries(sock);
    },
    {
      timezone,
      scheduled: true,
    }
  );

  console.log('✅ Scheduler de resumos diários ativado');
  
  // Log adicional para debug
  const nextExecution = cron.getTasks();
  console.log(`📊 Tarefas agendadas: ${nextExecution.size}`);
}

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

      if (activities.length === 0) {
        message = `🌅 *Bom dia, ${user.name}!*\n\nVocê não tem atividades programadas para hoje. Aproveite! 🎉`;
      } else {
        message = `🌅 *Bom dia, ${user.name}! Suas atividades para hoje*\n\n`;
        message += `Total: ${activities.length} ${activities.length === 1 ? 'atividade' : 'atividades'}\n\n`;

        activities.forEach((activity, index) => {
          message += `${formatActivity(activity, index)}\n`;
        });

        message += `\n💪 Vamos começar o dia com produtividade!\n`;
        message += `💡 Use "resumo" para ver um resumo inteligente`;
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
  const cronExpression = process.env.DAILY_SUMMARY_CRON || '0 8 * * *'; // Padrão: 8h da manhã
  const timezone = process.env.TIMEZONE || 'America/Sao_Paulo';

  console.log(`⏰ Agendamento configurado: ${cronExpression} (${timezone})`);

  cron.schedule(
    cronExpression,
    async () => {
      console.log('⏰ Executando rotina de resumos diários...');
      await sendDailySummaries(sock);
    },
    {
      timezone,
    }
  );

  console.log('✅ Scheduler de resumos diários ativado');
}

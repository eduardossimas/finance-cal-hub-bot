import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  WASocket,
  fetchLatestBaileysVersion,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import P from 'pino';
// @ts-ignore: qrcode-terminal has no type declarations
const qrcode: any = require('qrcode-terminal');
import { getUserIdByPhone } from '../services/activities';
import { processMessage } from './handlers';
ssh -i ~/.ssh/finance-bot-key.pem ubuntu@54.123.45.67
const logger = P({ level: 'info' });

/**
 * Inicializa e conecta o bot WhatsApp
 */
export async function startWhatsAppBot(): Promise<WASocket> {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

  const { version } = await fetchLatestBaileysVersion();
  
  const sock = makeWASocket({
    version,
    logger,
    printQRInTerminal: false,
    auth: state,
    getMessage: async () => undefined,
  });

  // QR Code para autenticação
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('\n📱 Escaneie o QR Code abaixo com seu WhatsApp:\n');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'close') {
      const shouldReconnect = 
        (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;

      console.log('Conexão fechada. Reconectando...', shouldReconnect);

      if (shouldReconnect) {
        await startWhatsAppBot();
      }
    } else if (connection === 'open') {
      console.log('✅ WhatsApp conectado com sucesso!');
    }
  });

  // Salvar credenciais
  sock.ev.on('creds.update', saveCreds);

  // Processar mensagens recebidas
  sock.ev.on('messages.upsert', async ({ messages }) => {
    for (const msg of messages) {
      // Ignorar mensagens do próprio bot
      if (msg.key.fromMe) continue;

      const from = msg.key.remoteJid;
      if (!from) continue;

      // Extrair texto da mensagem
      const text = 
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        '';

      if (!text) continue;

      console.log(`📩 Mensagem de ${from}: ${text}`);

      try {
        // Extrair número de telefone (formato: 5511999999999@s.whatsapp.net)
        const phone = from.split('@')[0];
        const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;

        // Buscar userId associado ao telefone
        const userId = await getUserIdByPhone(formattedPhone);

        if (!userId) {
          // ⚠️ NÚMERO NÃO CADASTRADO - IGNORAR MENSAGEM
          console.log(`⚠️ Mensagem ignorada de número não cadastrado: ${formattedPhone}`);
          continue;
        }

        // Processar mensagem e obter resposta
        const response = await processMessage(userId, text);

        // Enviar resposta
        await sock.sendMessage(from, { text: response });
        console.log(`✅ Resposta enviada para ${from}`);
      } catch (error: any) {
        console.error('❌ Erro ao processar mensagem:', error);
        // Não envia mensagem de erro para evitar spam em números não cadastrados
      }
    }
  });

  return sock;
}

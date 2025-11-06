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
import { transcribeAudio } from '../services/ai';
import { downloadMediaMessage } from '@whiskeysockets/baileys';
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

      try {
        let textToProcess = '';
        let response = '';

        // Processar diferentes tipos de mensagem
        const messageType = Object.keys(msg.message || {})[0];
        
        // Mensagem de texto
        if (msg.message?.conversation || msg.message?.extendedTextMessage?.text) {
          textToProcess = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
        }
        // Mensagem de áudio
        else if (msg.message?.audioMessage || messageType === 'audioMessage' || messageType?.toLowerCase().includes('audio')) {
          console.log(`🎤 Áudio recebido de ${from}`);
          console.log(`🎤 Áudio recebido de ${from}`);
          
          try {
            // Baixar o áudio
            const buffer = await downloadMediaMessage(
              msg,
              'buffer',
              {},
              {
                logger,
                reuploadRequest: sock.updateMediaMessage
              }
            );

            if (!buffer) {
              throw new Error('Não foi possível baixar o áudio');
            }

            // Transcrever usando Gemini
            const transcription = await transcribeAudio(buffer as Buffer);

            if (!transcription) {
              response = '❌ Não consegui processar o áudio. Tente enviar novamente ou use mensagem de texto.';
              await sock.sendMessage(from, { text: response });
              continue;
            }

            // Processar a transcrição como uma mensagem de texto normal
            textToProcess = transcription;
            console.log(`📝 Processando transcrição: "${transcription}"`);
          } catch (error: any) {
            console.error('❌ Erro ao processar áudio:', error.message);
            response = '❌ Erro ao processar áudio. Tente novamente ou use mensagem de texto.';
            await sock.sendMessage(from, { text: response });
            continue;
          }
        }
        // Mensagem de imagem
        else if (msg.message?.imageMessage) {
          console.log(`🖼️ Imagem recebida de ${from}`);
          
          const caption = msg.message.imageMessage.caption || '';
          
          if (caption) {
            textToProcess = caption;
            console.log(`📝 Legenda da imagem: ${caption}`);
          } else {
            response = '🖼️ *Imagem recebida!*\n\n';
            response += '⚠️ A análise de imagens ainda está em desenvolvimento.\n\n';
            response += '💡 Você pode adicionar uma legenda à imagem descrevendo a tarefa!\n\n';
            response += '_Em breve: extração automática de texto e tarefas de imagens!_';
            
            await sock.sendMessage(from, { text: response });
            console.log(`✅ Resposta sobre imagem enviada para ${from}`);
            continue;
          }
        }
        // Outros tipos de mensagem
        else {
          console.log(`❓ Tipo de mensagem não suportado: ${messageType}`);
          response = '❓ *Tipo de mensagem não suportado*\n\n';
          response += 'No momento, suporto:\n';
          response += '• 📝 Mensagens de texto\n';
          response += '• 🖼️ Imagens com legenda\n\n';
          response += 'Use "ajuda" para ver os comandos disponíveis!';
          
          await sock.sendMessage(from, { text: response });
          continue;
        }

        if (!textToProcess) continue;

        console.log(`📩 Mensagem de ${from}: ${textToProcess}`);

        // Processar mensagem e obter resposta
        response = await processMessage(userId, textToProcess);

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

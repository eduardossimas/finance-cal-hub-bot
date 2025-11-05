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
        else if (msg.message?.audioMessage) {
          console.log('\n🎤 ========================================');
          console.log(`🎤 ÁUDIO RECEBIDO de ${from}`);
          console.log(`📱 Telefone: ${formattedPhone}`);
          console.log(`👤 User ID: ${userId}`);
          console.log('🎤 Informações do áudio:');
          console.log('   - Seconds:', msg.message.audioMessage.seconds);
          console.log('   - MimeType:', msg.message.audioMessage.mimetype);
          console.log('   - FileLength:', msg.message.audioMessage.fileLength);
          console.log('🎤 ========================================\n');
          
          try {
            console.log('📥 [PASSO 1/4] Iniciando download do áudio...');
            console.log('   🔧 Verificando mensagem...');
            console.log('   🔧 Tipo de mensagem:', typeof msg);
            console.log('   🔧 Message keys:', Object.keys(msg.message || {}));
            
            // Baixar o áudio
            console.log('   🌐 Chamando downloadMediaMessage...');
            const buffer = await downloadMediaMessage(
              msg,
              'buffer',
              {},
              {
                logger,
                reuploadRequest: sock.updateMediaMessage
              }
            );

            console.log('   ✅ downloadMediaMessage retornou');
            console.log('   🔍 Tipo do buffer:', typeof buffer);
            console.log('   🔍 Buffer é nulo?', buffer === null);
            console.log('   🔍 Buffer é undefined?', buffer === undefined);

            if (!buffer) {
              console.error('   ❌ Buffer é nulo ou undefined!');
              throw new Error('Não foi possível baixar o áudio');
            }

            console.log(`✅ [PASSO 1/4] Áudio baixado com sucesso!`);
            console.log(`📦 Tamanho do buffer: ${buffer.length} bytes (${(buffer.length / 1024).toFixed(2)} KB)`);
            console.log(`📦 É um Buffer? ${Buffer.isBuffer(buffer)}`);

            console.log('\n🔄 [PASSO 2/4] Iniciando transcrição com Gemini...');
            console.log('   📤 Enviando buffer para transcribeAudio()...');
            
            // Transcrever usando Gemini
            const transcription = await transcribeAudio(buffer as Buffer);

            console.log('   📥 transcribeAudio() retornou');
            console.log('   🔍 Tipo da transcrição:', typeof transcription);
            console.log('   🔍 Transcrição é nula?', transcription === null);
            console.log('   🔍 Transcrição é undefined?', transcription === undefined);
            console.log('   🔍 Transcrição vazia?', transcription === '');

            if (!transcription) {
              console.error('❌ [PASSO 2/4] Transcrição falhou - retornou null/vazio');
              console.error('   ⚠️  Valor retornado:', transcription);
              response = '❌ *Erro ao transcrever áudio*\n\n';
              response += 'Não consegui processar o áudio. Tente:\n';
              response += '• Enviar novamente\n';
              response += '• Usar mensagem de texto\n';
              response += '• Verificar se o áudio está claro';
              
              await sock.sendMessage(from, { text: response });
              console.log(`⚠️ Resposta de erro enviada para ${from}`);
              continue;
            }

            console.log(`✅ [PASSO 2/4] Áudio transcrito com sucesso!`);
            console.log(`📝 Transcrição: "${transcription}"`);
            console.log(`📏 Tamanho da transcrição: ${transcription.length} caracteres\n`);
            
            console.log('💬 [PASSO 3/4] Enviando feedback ao usuário...');
            
            // Enviar feedback ao usuário
            await sock.sendMessage(from, { 
              text: `🎤 *Áudio transcrito:*\n"${transcription}"\n\n⏳ _Processando comando..._` 
            });
            
            console.log('✅ [PASSO 3/4] Feedback enviado!');
            
            // Processar a transcrição como uma mensagem de texto normal
            textToProcess = transcription;
            
            console.log('🤖 [PASSO 4/4] Processando transcrição como mensagem de texto...');
            console.log('   📝 Texto a processar:', textToProcess);
          } catch (error: any) {
            console.error('\n❌ ========================================');
            console.error('❌ ERRO AO PROCESSAR ÁUDIO');
            console.error('❌ ========================================');
            console.error('Tipo de erro:', error.constructor?.name || 'Desconhecido');
            console.error('Mensagem:', error.message);
            console.error('Code:', error.code);
            console.error('Stack:', error.stack);
            
            if (error.response) {
              console.error('\nResposta HTTP:');
              console.error('  Status:', error.response.status);
              console.error('  StatusText:', error.response.statusText);
              console.error('  Data:', JSON.stringify(error.response.data, null, 2));
            }
            
            console.error('❌ ========================================\n');
            
            response = '❌ *Erro ao processar áudio*\n\n';
            response += `Erro: ${error.message}\n\n`;
            response += '💡 Tente enviar uma mensagem de texto ou grave o áudio novamente.';
            
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

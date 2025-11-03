# 📱 Próximos Passos - Após Escanear o QR Code

## ✅ O que você já fez até agora:

- [x] Criou instância EC2 na AWS
- [x] Conectou via SSH
- [x] Instalou Node.js e dependências
- [x] Transferiu o código
- [x] Configurou o `.env`
- [x] Executou `npm run build`
- [ ] **⏸️ PARADO AQUI:** Aguardando celular para escanear QR Code

---

## 🔄 Quando estiver com o celular em mãos

### **1️⃣ Iniciar o bot temporariamente**

No servidor SSH, execute:

```bash
cd ~/finance-cal-hub-bot
npm run dev
```

Aguarde o QR Code aparecer no terminal (~10-30 segundos).

---

### **2️⃣ Escanear o QR Code**

1. Abra o **WhatsApp** no celular
2. Vá em **Configurações** → **Aparelhos conectados**
3. Toque em **Conectar um aparelho**
4. Aponte a câmera para o QR Code no terminal SSH

✅ Quando conectar, você verá:
```
✅ WhatsApp conectado com sucesso!
```

⚠️ **NÃO feche o terminal ainda!** Aguarde ~5 segundos para garantir que a sessão foi salva.

---

### **3️⃣ Parar o processo temporário**

Pressione **Ctrl+C** no terminal SSH para parar o bot.

---

### **4️⃣ Verificar se a autenticação foi salva**

```bash
ls -la auth_info_baileys/
```

Você deve ver vários arquivos JSON:
```
creds.json
app-state-sync-key-...json
app-state-sync-version-...json
```

✅ **Se esses arquivos existirem, a autenticação está OK!**

---

### **5️⃣ Iniciar o bot com PM2 (modo produção)**

```bash
pm2 start dist/index.js --name whatsapp-bot
```

Verificar se está rodando:

```bash
pm2 status
```

Você deve ver:

```
┌────┬────────────────┬─────────────┬─────────┬─────────┬──────────┐
│ id │ name           │ mode        │ ↺       │ status  │ cpu      │
├────┼────────────────┼─────────────┼─────────┼─────────┼──────────┤
│ 0  │ whatsapp-bot   │ fork        │ 0       │ online  │ 0%       │
└────┴────────────────┴─────────────┴─────────┴─────────┴──────────┘
```

---

### **6️⃣ Ver logs em tempo real**

```bash
pm2 logs whatsapp-bot
```

Aguarde até ver:
```
✅ WhatsApp conectado com sucesso!
```

Pressione **Ctrl+C** para sair dos logs (o bot continua rodando).

---

### **7️⃣ Configurar PM2 para auto-start**

```bash
# Salvar configuração atual
pm2 save

# Configurar para iniciar no boot
pm2 startup
```

O último comando vai gerar uma linha começando com `sudo`. **Copie e execute essa linha completa**. Exemplo:

```bash
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu
```

Depois execute:

```bash
pm2 save
```

✅ Agora o bot reinicia automaticamente se o servidor reiniciar!

---

## 🧪 **8️⃣ TESTAR O BOT**

### No WhatsApp (pelo mesmo número que escaneou o QR):

Envie uma mensagem para o número do bot:

```
ajuda
```

Você deve receber:

```
💰 *Finance Cal Hub Bot*

📋 Comandos disponíveis:

*Transações:*
• `adicionar [valor] [descrição]` - Registrar despesa
• `adicionar receita [valor] [descrição]` - Registrar receita
• `resumo` - Ver resumo do dia
• `resumo semana` - Ver últimos 7 dias
• `resumo mes` - Ver mês atual

*Orçamento:*
• `saldo` - Ver orçamento mensal e quanto resta

*Outros:*
• `ajuda` - Ver esta mensagem
```

### Testar adicionar transação:

```
adicionar 25.50 almoço
```

Resposta esperada:
```
✅ Despesa registrada!

💸 R$ 25,50 - almoço
📅 30/10/2025
```

---

## 📊 **9️⃣ Monitorar o bot**

### Ver status

```bash
pm2 status
```

### Ver logs (últimas 50 linhas)

```bash
pm2 logs whatsapp-bot --lines 50
```

### Ver logs em tempo real

```bash
pm2 logs whatsapp-bot
```

### Monitorar recursos (CPU/memória)

```bash
pm2 monit
```

Pressione **Ctrl+C** para sair.

---

## 🔄 **10️⃣ Comandos úteis de manutenção**

### Reiniciar o bot

```bash
pm2 restart whatsapp-bot
```

### Parar o bot

```bash
pm2 stop whatsapp-bot
```

### Iniciar novamente

```bash
pm2 start whatsapp-bot
```

### Ver informações detalhadas

```bash
pm2 info whatsapp-bot
```

### Remover do PM2 (se quiser deletar)

```bash
pm2 delete whatsapp-bot
```

---

## 🔐 **11️⃣ Desconectar do servidor**

Quando terminar, saia do SSH:

```bash
exit
```

✅ O bot **continua rodando** em background!

---

## 🆘 **12️⃣ Troubleshooting**

### ❌ Bot não conecta ao WhatsApp

**Solução:**
```bash
# Parar o bot
pm2 stop whatsapp-bot

# Deletar sessão antiga
rm -rf auth_info_baileys

# Autenticar novamente
npm run dev

# Escanear QR Code novamente
# Ctrl+C após conectar

# Reiniciar com PM2
pm2 restart whatsapp-bot
```

---

### ❌ Bot não responde mensagens

**Verificar logs:**
```bash
pm2 logs whatsapp-bot --lines 100
```

Procure por erros. Se ver:
```
⚠️ Mensagem ignorada de número não cadastrado: +5511999999999
```

Significa que o número que você está usando **não está cadastrado** na tabela `users` do Supabase.

**Solução:** Cadastre seu número no Supabase:

1. Acesse [dqojwruffsfmaqyotstr.supabase.co](https://dqojwruffsfmaqyotstr.supabase.co)
2. Vá em **Table Editor** → **users**
3. Adicione um novo usuário com seu número de telefone **no formato:** `+5511999999999`

---

### ❌ Bot parou de funcionar

**Verificar status:**
```bash
pm2 status
```

Se estiver `stopped` ou `errored`:

```bash
pm2 restart whatsapp-bot
pm2 logs whatsapp-bot
```

---

### ❌ Servidor reiniciou e bot não voltou

**Verificar PM2:**
```bash
pm2 list
```

Se estiver vazio:

```bash
pm2 resurrect
```

Se não funcionar, inicie manualmente:

```bash
cd ~/finance-cal-hub-bot
pm2 start dist/index.js --name whatsapp-bot
pm2 save
```

---

## 📱 **13️⃣ Reconectar ao servidor SSH (futuro)**

Sempre que quiser acessar o servidor novamente:

```bash
ssh -i ~/.ssh/finance-bot-key.pem ubuntu@54.123.45.67
```

*(Substitua `54.123.45.67` pelo IP público da sua instância)*

---

## ✅ **Checklist Final**

Quando tiver o celular:

- [ ] Executar `npm run dev`
- [ ] Escanear QR Code com WhatsApp
- [ ] Ver mensagem "✅ WhatsApp conectado"
- [ ] Parar com Ctrl+C
- [ ] Verificar arquivos em `auth_info_baileys`
- [ ] Iniciar com PM2: `pm2 start dist/index.js --name whatsapp-bot`
- [ ] Configurar auto-start: `pm2 save` e `pm2 startup`
- [ ] Testar enviando "ajuda" no WhatsApp
- [ ] Testar enviando "adicionar 10 teste"
- [ ] Verificar logs: `pm2 logs whatsapp-bot`
- [ ] Sair do SSH: `exit`

---

## 🎉 Pronto!

Seu bot estará rodando **24/7 na AWS**, respondendo mensagens automaticamente!

Quando tiver o celular, volte aqui e siga do passo **1️⃣** em diante. 

Alguma dúvida? Me chama! 🚀

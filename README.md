# 🤖 Finance Cal Hub - WhatsApp Bot

Bot inteligente para WhatsApp integrado ao **Finance Cal Hub**, usando **Gemini AI** (gratuito) para consultar suas atividades diárias de forma natural e conversacional.

---

## 🎯 Funcionalidades

### 🎤 **Transcrição de Áudio com IA**
- ✅ Envie áudios pelo WhatsApp e o bot transcreve automaticamente
- ✅ Usa **OpenAI Whisper** para alta precisão em português
- ✅ Crie tarefas, consulte atividades ou faça perguntas por áudio
- 📖 [Documentação completa sobre áudios](./docs/AUDIO_TRANSCRIPTION.md)

### 📋 Consultas
- ✅ **Atividades de hoje** - Veja todas as suas tarefas do dia
- ⏳ **Atividades pendentes** - Liste todas as tarefas não concluídas
- ▶️ **Atividades em andamento** - Veja o que está sendo feito agora
- 🤖 **Resumo inteligente** - Gemini AI gera um resumo personalizado do seu dia

### 💬 Conversação com IA
- Faça perguntas naturais sobre suas atividades
- "Quanto tempo vou levar hoje?"
- "Qual minha próxima tarefa?"
- "Estou atrasado em alguma coisa?"

### 🌅 Resumo Diário Automático
- Receba automaticamente às 8h da manhã um resumo das suas atividades
- Configurável via variável de ambiente

---

## 🏗️ Arquitetura

```
├── src/
│   ├── types/           # Interfaces TypeScript
│   ├── config/          # Configuração Supabase
│   ├── services/        # Lógica de negócio
│   │   ├── gemini.ts    # Cliente Gemini AI
│   │   └── activities.ts # Consultas ao banco
│   ├── bot/
│   │   ├── whatsapp.ts  # Cliente WhatsApp (Baileys)
│   │   └── handlers.ts  # Processamento de comandos
│   ├── scheduler/
│   │   └── daily.ts     # Envio automático de resumos
│   └── index.ts         # Entrypoint principal
├── package.json
├── tsconfig.json
└── .env
```

---

## 📦 Pré-requisitos

1. **Node.js** 18 ou superior
2. **Conta Google AI Studio** (gratuita) para Gemini API
3. **Projeto Supabase** do Finance Cal Hub configurado
4. **Telefone com WhatsApp** para autenticar o bot

---

## 🚀 Instalação

### 1. Clone ou crie o projeto

```bash
cd /Users/eduardosalzer/Desktop/Programacao/finance-cal-hub-bot
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Copie o arquivo `.env.example` para `.env`:

```bash
cp .env.example .env
```

Edite o `.env` com suas credenciais:

```env
# Supabase Configuration
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-chave-anon-aqui

# AI Provider: 'openai' ou 'gemini'
AI_PROVIDER=openai

# OpenAI (necessário para transcrição de áudio)
OPENAI_API_KEY=sk-...

# Google Gemini AI (alternativa gratuita, mas sem suporte a áudio)
GEMINI_API_KEY=sua-api-key-do-google-ai-studio

# Timezone para agendamento
TIMEZONE=America/Sao_Paulo

# Horário do resumo diário (formato cron: minuto hora)
DAILY_SUMMARY_CRON=0 8 * * *
```

---

## 🔑 Obtendo as Credenciais

### **OpenAI API Key (Para Transcrição de Áudio)**

1. Acesse [OpenAI Platform](https://platform.openai.com/api-keys)
2. Faça login ou crie uma conta
3. Clique em **"Create new secret key"**
4. Copie a chave e cole no `.env` como `OPENAI_API_KEY`
5. Configure `AI_PROVIDER=openai` no `.env`

💰 **Custos:** ~$0.006/minuto de áudio transcrito (ver [documentação](./docs/AUDIO_TRANSCRIPTION.md))

### **Gemini API Key (Alternativa Gratuita - sem áudio)**

1. Acesse [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Faça login com sua conta Google
3. Clique em **"Get API Key"**
4. Copie a chave e cole no `.env` como `GEMINI_API_KEY`
5. Configure `AI_PROVIDER=gemini` no `.env`

⚠️ **Nota:** Gemini não suporta transcrição de áudio. Use OpenAI para essa funcionalidade.

### **Supabase**

1. Acesse seu [dashboard Supabase](https://app.supabase.com)
2. Vá em **Settings → API**
3. Copie:
   - **Project URL** → `SUPABASE_URL`
   - **anon public key** → `SUPABASE_ANON_KEY`

---

## 🗄️ Configuração do Banco de Dados

Para o bot funcionar, você precisa criar a tabela `whatsapp_mappings` no Supabase:

```sql
-- Tabela para mapear telefones WhatsApp com usuários do sistema
CREATE TABLE whatsapp_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT UNIQUE NOT NULL,  -- Formato: +5511999999999
  user_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índice para busca rápida por telefone
CREATE INDEX idx_whatsapp_phone ON whatsapp_mappings(phone);

-- RLS (Row Level Security) - usuários só acessam seus dados
ALTER TABLE whatsapp_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own mapping"
  ON whatsapp_mappings FOR SELECT
  USING (auth.uid() = user_id);
```

### Adicionar seu número:

```sql
INSERT INTO whatsapp_mappings (phone, user_id)
VALUES ('+5511999999999', 'seu-uuid-de-usuario-aqui');
```

💡 **Importante**: O número deve estar no formato internacional com `+` (ex: `+5511999999999`)

---

## ▶️ Executar o Bot

### Modo desenvolvimento (recarrega automaticamente):

```bash
npm run dev
```

### Modo produção:

```bash
npm run build
npm start
```

---

## 📱 Conectar o WhatsApp

1. Execute o bot com `npm run dev`
2. Um **QR Code** aparecerá no terminal
3. Abra o WhatsApp no celular
4. Vá em **⋮ Mais opções → Aparelhos conectados**
5. Clique em **Conectar um aparelho**
6. Escaneie o QR Code

✅ Quando conectar, você verá: `✅ WhatsApp conectado com sucesso!`

---

## 💬 Como Usar

Envie mensagens via WhatsApp para o número que você autenticou:

### **Comandos:**

| Comando | Descrição |
|---------|-----------|
| `hoje` ou `atividades` | Lista suas atividades de hoje |
| `pendentes` | Mostra todas as tarefas pendentes |
| `fazendo` ou `andamento` | Atividades em andamento |
| `resumo` | Resumo inteligente com Gemini AI |
| `ajuda` ou `help` | Lista todos os comandos |

### **🎤 Áudios:**

Envie um áudio descrevendo o que você precisa:

- 🎤 "Criar reunião com ConectFin amanhã às 14h"
- 🎤 "Quais são minhas atividades de hoje?"
- 🎤 "Concluir a tarefa de ligação com Maria"

O bot transcreve automaticamente e processa como uma mensagem de texto!

### **Perguntas com IA:**

Digite qualquer pergunta sobre suas atividades:

- "Quanto tempo vou levar hoje?"
- "Qual minha próxima tarefa?"
- "O que tenho pendente?"
- "Quantas atividades tenho?"

---

## 🌅 Resumo Diário Automático

Por padrão, o bot envia um resumo às **8h da manhã** (horário de Brasília) para todos os usuários cadastrados em `whatsapp_mappings`.

### Personalizar horário:

Edite no `.env`:

```env
# Enviar às 7h
DAILY_SUMMARY_CRON=0 7 * * *

# Enviar às 9h30
DAILY_SUMMARY_CRON=30 9 * * *

# Enviar às 8h e 18h
DAILY_SUMMARY_CRON=0 8,18 * * *
```

Formato cron: `minuto hora dia mês dia-da-semana`

---

## 🧪 Testando

### Teste manual:

1. Inicie o bot: `npm run dev`
2. Envie "**ajuda**" pelo WhatsApp
3. Você deve receber a lista de comandos
4. Teste outros comandos: `hoje`, `resumo`, etc.

### Verificar se seu número está cadastrado:

```sql
SELECT * FROM whatsapp_mappings WHERE phone = '+5511999999999';
```

---

## 🐛 Solução de Problemas

### ❌ "Número não cadastrado"

**Causa**: Seu telefone não está na tabela `whatsapp_mappings`

**Solução**: Execute no Supabase SQL Editor:

```sql
INSERT INTO whatsapp_mappings (phone, user_id)
VALUES ('+55SEU_DDD_NUMERO', 'seu-user-id');
```

### ❌ "Erro ao gerar resposta com Gemini"

**Causa**: API Key inválida ou limite excedido

**Solução**:
1. Verifique se `GEMINI_API_KEY` está correta no `.env`
2. Confirme que tem cota disponível no [Google AI Studio](https://makersuite.google.com/app/apikey)

### ❌ QR Code não aparece

**Causa**: Autenticação já existe

**Solução**: Delete a pasta `auth_info_baileys/` e reinicie

```bash
rm -rf auth_info_baileys
npm run dev
```

---

## 📊 Estrutura do Banco de Dados

O bot consulta as seguintes tabelas do Finance Cal Hub:

### `activities`
```typescript
{
  id: string;
  title: string;
  date: string; // ISO date
  status: 'pending' | 'doing' | 'completed' | 'waiting-client' | 'waiting-team';
  assigned_users: string[]; // Array de user IDs
  estimated_duration: number; // minutos
  client_name: string;
}
```

### `whatsapp_mappings` (nova)
```typescript
{
  id: string;
  phone: string; // +5511999999999
  user_id: string; // UUID do Supabase Auth
}
```

---

## 🔒 Segurança

- ✅ O bot **só acessa atividades** onde o usuário está em `assigned_users`
- ✅ Respeita as políticas de **Row Level Security (RLS)** do Supabase
- ✅ Autenticação WhatsApp **criptografada** (Baileys)
- ✅ API Keys **nunca** são expostas no código

---

## 🚀 Deploy em Produção

### Opção 1: VPS/Servidor

```bash
# Clone o projeto
git clone seu-repo
cd finance-cal-hub-bot

# Instale dependências
npm install

# Configure .env
nano .env

# Build
npm run build

# Rode com PM2 (processo em background)
npm install -g pm2
pm2 start dist/index.js --name whatsapp-bot
pm2 save
pm2 startup
```

### Opção 2: Railway/Render

1. Conecte seu repositório
2. Configure as variáveis de ambiente no dashboard
3. Comando de build: `npm run build`
4. Comando de start: `npm start`

⚠️ **Nota**: A primeira vez sempre precisará escanear o QR Code. Garanta que a pasta `auth_info_baileys/` persista entre deploys.

---

## 📝 Scripts Disponíveis

```bash
# Desenvolvimento (hot reload)
npm run dev

# Build para produção
npm run build

# Executar build
npm start

# Verificar tipos TypeScript
npm run type-check
```

---

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch: `git checkout -b feature/nova-funcionalidade`
3. Commit: `git commit -m 'Add nova funcionalidade'`
4. Push: `git push origin feature/nova-funcionalidade`
5. Abra um Pull Request

---

## 📄 Licença

MIT License - veja o arquivo LICENSE para detalhes

---

## 🆘 Suporte

- 📧 Email: seu-email@exemplo.com
- 📝 Issues: [GitHub Issues](seu-repo/issues)

---

## 🎉 Recursos Futuros

- [ ] Criar atividade via WhatsApp
- [ ] Atualizar status de atividades
- [ ] Iniciar/pausar timer remotamente
- [ ] Notificações de atividades atrasadas
- [ ] Relatórios semanais automáticos

---

**Desenvolvido com ❤️ para o Finance Cal Hub**

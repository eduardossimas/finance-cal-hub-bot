# 📱 Funcionalidades WhatsApp - Finance Cal Hub Bot

## ✅ Implementações Concluídas

### 1️⃣ **Consultas de Atividades**

#### 📊 Atividades de Hoje
**Comandos:** `hoje`, `atividades`
- Lista todas as atividades programadas para o dia atual
- Mostra status, cliente, duração estimada de cada atividade
- Conta total de atividades

#### 🚨 Atividades Vencidas
**Comandos:** `vencidas`, `atrasadas`
- Lista atividades com data anterior a hoje que não foram concluídas
- Mostra quantos dias de atraso
- Exibe data original da tarefa
- Status atual de cada atividade

#### 📅 Atividades por Data
**Comandos:** 
- `amanhã` ou `amanha` - Atividades de amanhã
- `15/12` ou `15/12/2025` - Data específica
- `próxima semana` - Próxima segunda-feira

#### 📋 Atividades Restantes do Dia
**Comandos:** `restantes`, `falta fazer`
- Lista o que ainda falta fazer hoje
- Separa entre "Em Andamento" e "Pendentes"
- Exclui atividades já concluídas

#### ▶️ Atividades em Andamento
**Comandos:** `fazendo`, `andamento`
- Mostra apenas atividades com status "doing"
- Útil para saber o que está em progresso no momento

#### ⏳ Atividades Pendentes
**Comandos:** `pendentes`, `pendente`
- Lista todas as atividades não concluídas
- Ordenadas por data
- Mostra data de cada atividade

---

### 2️⃣ **Criação de Tarefas com IA**

### Criar Tarefas
```
criar tarefa X
nova tarefa enviar relatório hoje
adicionar ligar para cliente X
```

### Concluir Tarefas
```
concluir reunião com João
finalizar relatório mensal
concluída proposta
```

### Perguntas
```
Quanto tempo vou levar hoje?
Qual minha próxima tarefa?
```

### ✅ Concluir Tarefa via Texto
**Comandos:** `concluir [descrição]`, `finalizar [descrição]`, `concluída [descrição]`

**Como funciona:**
- A IA analisa sua mensagem e identifica qual atividade você quer concluir
- Compara com suas atividades pendentes
- Marca automaticamente como concluída
- Registra data/hora de conclusão

**Exemplos:**
```
concluir reunião com João
finalizar relatório mensal
concluída proposta para Maria
```

**Inteligência:**
- Reconhece título parcial: "concluir reunião" → encontra "Reunião com cliente João"
- Identifica por cliente: "finalizar tarefa do João" → encontra tarefa associada
- Contexto temporal: "concluir de hoje" → busca em atividades de hoje

#### 🤖 Extração Inteligente com Gemini AI
A IA extrai automaticamente:
- ✅ **Título da tarefa** (obrigatório)
- 📄 **Descrição detalhada** (opcional)
- 👤 **Nome do cliente** (opcional, cria cliente se não existir)
- ⏱️ **Duração estimada** (em minutos)
- 📅 **Data** (suporta linguagem natural: "hoje", "amanhã", "15/12")

#### 🖼️ Criar Tarefa via Imagem com Legenda
- Envie uma imagem com legenda descrevendo a tarefa
- A legenda será processada pela IA
- Útil para fotos de anotações, post-its, etc.

#### 🎤 Criar Tarefa via Áudio (Em Desenvolvimento)
- Suporte preparado para transcrição de áudio
- Aguardando integração com API de transcrição

#### 🧠 Criação Natural
O bot detecta automaticamente quando você está descrevendo uma tarefa:
```
reunião com cliente às 15h hoje
ligar para fornecedor amanhã
preparar relatório mensal
```

---

### 3️⃣ **Notificações Diárias Automáticas**

#### 🌅 Resumo Matinal às 8h
**Configurado via cron job**

**O que é enviado:**
- Saudação personalizada com nome do usuário
- Data completa (dia da semana, dia, mês, ano)
- Resumo estatístico:
  - Total de atividades
  - Quantidade pendentes
  - Quantidade em andamento
  - Quantidade aguardando
- Lista completa de atividades do dia
- Mensagem motivacional

**Se não houver atividades:**
- Mensagem avisando que o dia está livre
- Sugestão para planejar novas atividades

**Configuração:**
- Horário padrão: 8h da manhã (timezone São Paulo)
- Configurável via variável de ambiente `DAILY_SUMMARY_CRON`
- Envia apenas para usuários com telefone cadastrado

---

### 4️⃣ **Resumo Inteligente com IA**

#### 🤖 Comando Resumo
**Comando:** `resumo`
- Análise inteligente das atividades do dia
- Gemini AI gera resumo personalizado
- Organiza por status e prioridade
- Frase motivacional
- Estimativa de tempo total

---

### 5️⃣ **Perguntas com IA**

#### ❓ Faça Perguntas Naturais
**Exemplos:**
```
Quanto tempo vou levar hoje?
Qual minha próxima tarefa?
Tenho reunião marcada?
O que ainda preciso fazer?
Quantas tarefas tenho para o cliente X?
```

A IA analisa suas atividades e responde de forma contextualizada.

---

### 6️⃣ **Sistema de Ajuda**

#### ℹ️ Menu de Comandos
**Comandos:** `ajuda`, `help`, `menu`
- Lista completa de todos os comandos
- Exemplos de uso
- Organizado por categorias

---

## 🔧 Funcionalidades Técnicas

### 📊 Status de Atividades Suportados
- `pending` - ⏳ Pendente
- `doing` - ▶️ Em Andamento
- `completed` - ✅ Concluída
- `waiting-client` - ⏸️ Aguardando Cliente
- `waiting-team` - ⏸️ Aguardando Equipe

### 📅 Formatação de Datas
- Reconhece linguagem natural em português
- Converte automaticamente:
  - "hoje" → Data atual
  - "amanhã" → Próximo dia
  - "próxima semana" → Próxima segunda
  - "daqui a 3 dias" → Data calculada
- Aceita formatos: DD/MM e DD/MM/YYYY

### 👤 Gestão de Clientes
- Criação automática de clientes mencionados
- Busca case-insensitive
- Associação com cor aleatória

### 🔐 Segurança
- Apenas usuários cadastrados podem usar o bot
- Números não cadastrados são ignorados silenciosamente
- Validação de telefone no formato internacional

---

## 📋 Estrutura do Banco de Dados

### Tabela `activities`
```sql
- id (uuid)
- title (text) ✅
- description (text) ✅
- client_id (uuid) ✅
- assigned_to (uuid) ✅
- assigned_users (array) ✅
- date (date) ✅
- estimated_duration (integer) ✅
- actual_duration (integer)
- status (text) ✅
- is_recurring (boolean)
- recurrence_type (text)
- started_at (timestamp)
- completed_at (timestamp)
```

### Tabela `users`
```sql
- id (uuid)
- name (text)
- phone (text) ✅ UNIQUE
- created_at (timestamp)
```

### Tabela `clients`
```sql
- id (uuid)
- name (text)
- color_index (integer)
- is_active (boolean)
- created_at (timestamp)
```

---

## 🚀 Como Usar

### Consultar Atividades
```
hoje
vencidas
amanhã
restantes
fazendo
pendentes
resumo
```

### Criar Tarefas
```
criar reunião com João amanhã às 14h
nova tarefa enviar relatório hoje
adicionar ligar para cliente X
```

### Perguntas
```
Quanto tempo vou levar hoje?
Qual minha próxima tarefa?
```

### Ajuda
```
ajuda
menu
```

---

## 🎯 Próximas Implementações

### 🎤 Transcrição de Áudio
- Integração com API de Speech-to-Text
- Criação de tarefas por comando de voz
- Suporte a múltiplos idiomas

### 🖼️ Análise de Imagens
- OCR para extrair texto de imagens
- Detecção de tarefas em fotos de documentos
- Análise de screenshots

### ⏱️ Controle de Tempo
- Iniciar/pausar atividades
- Registrar tempo real gasto
- Comparativo estimado vs real

### 📊 Relatórios
- Produtividade semanal/mensal
- Tempo por cliente
- Gráficos e estatísticas

### 🔔 Lembretes
- Notificações antes do horário da tarefa
- Lembretes de tarefas vencidas
- Alertas personalizados

---

## 🛠️ Tecnologias Utilizadas

- **WhatsApp:** @whiskeysockets/baileys
- **IA:** Google Gemini Pro
- **Banco de Dados:** Supabase (PostgreSQL)
- **Linguagem:** TypeScript
- **Agendamento:** node-cron
- **Runtime:** Node.js

---

## ✨ Diferenciais

1. ✅ **Processamento de Linguagem Natural** - Entende comandos em português
2. ✅ **Extração Inteligente** - IA identifica título, cliente, data e duração
3. ✅ **Múltiplos Formatos** - Texto, imagem com legenda (áudio em breve)
4. ✅ **Notificações Proativas** - Resumo diário automático
5. ✅ **Interface Conversacional** - Responde perguntas naturalmente
6. ✅ **Zero Configuração Manual** - Cria clientes automaticamente
7. ✅ **Segurança** - Apenas números cadastrados
8. ✅ **Conclusão Inteligente** - Marca tarefas como concluídas via IA

---

## 📞 Suporte

Para dúvidas ou problemas, envie "ajuda" no WhatsApp para ver todos os comandos disponíveis.

**Desenvolvido com ❤️ para Finance Cal Hub**

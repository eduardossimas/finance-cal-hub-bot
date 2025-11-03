# 📱 Exemplos de Mensagens - WhatsApp Bot

## 📊 Consultas de Atividades

### 1️⃣ Comando: `hoje`
```
📅 *Suas atividades para hoje* (3)

1. Reunião com cliente João | 👤 João | ⏱️ 60min ⏳ Pendente
2. Preparar relatório mensal | 👤 Empresa X | ⏱️ 120min ▶️ Em Andamento
3. Ligar para fornecedor | ⏱️ 30min ⏳ Pendente

💡 _Use "resumo" para ver um resumo inteligente_
```

### 2️⃣ Comando: `vencidas`
```
🚨 *Atividades Vencidas* (2)

1. Enviar proposta
   🔴 Ontem | ⏰ 1 dia de atraso
   Status: ⏳ Pendente

2. Atualizar planilha
   30/10/2025 | ⏰ 4 dias de atraso
   Status: ⏸️ Aguardando Cliente

⚠️ _Priorize essas tarefas!_
```

### 3️⃣ Comando: `amanhã`
```
📅 *Atividades - 🟢 Amanhã* (2)

1. Reunião estratégica | 👤 Maria | ⏱️ 90min ⏳ Pendente
2. Code review | ⏱️ 45min ⏳ Pendente
```

### 4️⃣ Comando: `restantes`
```
📋 *Atividades Restantes Hoje* (3)

▶️ *Em Andamento:* (1)
0. Preparar relatório mensal | 👤 Empresa X | ⏱️ 120min ▶️ Em Andamento

⏳ *Pendentes:* (2)
0. Reunião com cliente João | 👤 João | ⏱️ 60min ⏳ Pendente
1. Ligar para fornecedor | ⏱️ 30min ⏳ Pendente
```

### 5️⃣ Comando: `fazendo`
```
▶️ *Atividades em Andamento* (1)

0. Preparar relatório mensal | 👤 Empresa X | ⏱️ 120min ▶️ Em Andamento
```

### 6️⃣ Comando: `pendentes`
```
⏳ *Atividades Pendentes* (5)

1. Reunião com cliente João
   📅 🔵 Hoje ⏳ Pendente
2. Ligar para fornecedor
   📅 🔵 Hoje ⏳ Pendente
3. Reunião estratégica
   📅 🟢 Amanhã ⏳ Pendente
4. Enviar proposta
   📅 🔴 Ontem ⏳ Pendente
5. Revisar contrato
   📅 05/11/2025 ⏳ Pendente
```

---

## ➕ Criação de Tarefas

### 7️⃣ Comando: `criar reunião com João amanhã às 14h, duração 1 hora`
```
✅ *Tarefa criada com sucesso!*

📝 *Título:* Reunião com João
📄 *Descrição:* Reunião agendada para às 14h
👤 *Cliente:* João
📅 *Data:* 🟢 Amanhã
⏱️ *Duração estimada:* 60min
📊 *Status:* Pendente
```

### 8️⃣ Comando: `nova tarefa enviar relatório hoje`
```
✅ *Tarefa criada com sucesso!*

📝 *Título:* Enviar relatório
📅 *Data:* 🔵 Hoje
⏱️ *Duração estimada:* 60min
📊 *Status:* Pendente
```

### 9️⃣ Descrição Natural: `ligar para fornecedor Empresa X`
```
✅ *Tarefa criada com sucesso!*

📝 *Título:* Ligar para fornecedor Empresa X
👤 *Cliente:* Empresa X
📅 *Data:* 🔵 Hoje
⏱️ *Duração estimada:* 60min
📊 *Status:* Pendente
```

### 🔟 Imagem com Legenda: [Foto] + `"reunião amanhã com Maria"`
```
✅ *Tarefa criada com sucesso!*

📝 *Título:* Reunião amanhã com Maria
👤 *Cliente:* Maria
📅 *Data:* 🟢 Amanhã
⏱️ *Duração estimada:* 60min
📊 *Status:* Pendente
```

---

## ✅ Conclusão de Tarefas

### 1️⃣1️⃣ Comando: `concluir reunião com João`
```
✅ *Atividade concluída com sucesso!*

📝 *Título:* Reunião com cliente João
👤 *Cliente:* João
📅 *Data:* 🔵 Hoje
🎉 *Status:* Concluída

⏱️ _Tempo estimado: 60min_

💪 Continue assim! Use "restantes" para ver o que ainda falta.
```

### 1️⃣2️⃣ Comando: `finalizar relatório`
```
✅ *Atividade concluída com sucesso!*

📝 *Título:* Preparar relatório mensal
👤 *Cliente:* Empresa X
📅 *Data:* 🔵 Hoje
🎉 *Status:* Concluída

⏱️ _Tempo estimado: 120min_

💪 Continue assim! Use "restantes" para ver o que ainda falta.
```

### 1️⃣3️⃣ IA não identifica: `concluir tarefa`
```
🤔 Não consegui identificar qual atividade você quer concluir.

📋 *Suas atividades pendentes:*

1. Reunião com cliente João | 👤 João
2. Preparar relatório mensal | 👤 Empresa X
3. Ligar para fornecedor
4. Enviar proposta | 👤 Maria

💡 _Seja mais específico. Exemplo: "concluir reunião com João"_
```

---

## 🤖 Resumo e IA

### 1️⃣4️⃣ Comando: `resumo`
```
🤖 *Resumo Inteligente do Seu Dia*

📊 Você tem 3 atividades programadas para hoje!

▶️ *Em Andamento* (1):
• Preparar relatório mensal - já iniciada, foco total!

⏳ *Pendentes* (2):
• Reunião com cliente João (60min)
• Ligar para fornecedor (30min)

⏱️ *Tempo Total Estimado*: 3h 30min

💪 Você tem uma reunião importante pela frente e um relatório em progresso. Termine o relatório primeiro para depois focar 100% na reunião com João. O resto do dia será tranquilo!

✨ Dica: Priorize a reunião com João, ela pode desbloquear outras tarefas.

Bom trabalho! 🚀
```

### 1️⃣5️⃣ Pergunta: `Quanto tempo vou levar hoje?`
```
🤖 Com base nas suas atividades de hoje, você tem um total estimado de 3 horas e 30 minutos de trabalho. 

Isso inclui:
• 2h para o relatório mensal (em andamento)
• 1h para reunião com João
• 30min para ligar para fornecedor

Se você já iniciou o relatório, deve levar cerca de 1h30 ainda. No total, deve conseguir concluir tudo antes do fim do dia! 💪
```

### 1️⃣6️⃣ Pergunta: `Qual minha próxima tarefa?`
```
🤖 Sua próxima tarefa é a **Reunião com cliente João** às 14h, com duração estimada de 1 hora.

Como você ainda tem o relatório mensal em andamento, sugiro finalizar ele antes da reunião para poder focar 100% na conversa com João! 📊➡️🤝
```

---

## 🌅 Notificação Diária (8h da manhã)

### 1️⃣7️⃣ Com Atividades
```
🌅 *Bom dia, Eduardo!*

📅 *domingo, 03 de novembro de 2025*

📊 *Resumo do Dia:*
• Total: 3 atividades
• ⏳ Pendentes: 2
• ▶️ Em andamento: 1

📋 *Suas atividades:*
0. Reunião com cliente João | 👤 João | ⏱️ 60min ⏳ Pendente
1. Preparar relatório mensal | 👤 Empresa X | ⏱️ 120min ▶️ Em Andamento
2. Ligar para fornecedor | ⏱️ 30min ⏳ Pendente

💪 Vamos começar o dia com produtividade!
💡 _Use "resumo" para ver uma análise inteligente_
```

### 1️⃣8️⃣ Sem Atividades
```
🌅 *Bom dia, Eduardo!*

📅 *domingo, 03 de novembro de 2025*

🎉 Você não tem atividades programadas para hoje!

✨ Aproveite seu dia livre ou que tal planejar algo novo?

💡 _Use "criar [tarefa]" para adicionar novas atividades._
```

---

## ℹ️ Sistema de Ajuda

### 1️⃣9️⃣ Comando: `ajuda`
```
📱 *Finance Cal Hub Bot - Comandos Disponíveis*

*📊 Consultas de Atividades:*
• `hoje` ou `atividades` - Suas atividades de hoje
• `restantes` - O que ainda falta fazer hoje
• `fazendo` ou `andamento` - Atividades em progresso
• `pendentes` - Todas as tarefas pendentes
• `vencidas` ou `atrasadas` - Tarefas com prazo vencido
• `resumo` - Resumo inteligente do dia com IA

*📅 Consultas por Data:*
• `amanhã` - Atividades de amanhã
• `15/12` ou `15/12/2025` - Atividades de data específica
• `próxima semana` - Atividades da próxima semana

*➕ Criar Tarefas:*
• `criar [descrição]` - Cria tarefa com IA
• `nova tarefa [descrição]` - Cria tarefa com IA
• _Exemplo:_ "criar reunião com cliente João amanhã às 14h, duração 1 hora"

*✅ Concluir Tarefas:*
• `concluir [descrição]` - Marca tarefa como concluída
• `finalizar [descrição]` - Marca tarefa como concluída
• `concluída [descrição]` - Marca tarefa como concluída
• _Exemplo:_ "concluir reunião com João"

*❓ Perguntas com IA:*
• Digite qualquer pergunta sobre suas atividades
• _Exemplo:_ "Quanto tempo vou levar hoje?"

*ℹ️ Ajuda:*
• `ajuda` ou `menu` - Mostra este menu

💡 _Você também pode descrever tarefas naturalmente!_
```

---

## 🎤 Mensagens Especiais

### 2️⃣0️⃣ Áudio Recebido
```
🎤 *Áudio recebido!*

⚠️ A transcrição de áudio ainda está em desenvolvimento.

💡 Por enquanto, você pode:
• Enviar mensagens de texto
• Usar comandos como "hoje", "vencidas", "criar tarefa"
• Descrever tarefas naturalmente

_Em breve: transcrição automática de áudio com IA!_
```

### 2️⃣1️⃣ Imagem sem Legenda
```
🖼️ *Imagem recebida!*

⚠️ A análise de imagens ainda está em desenvolvimento.

💡 Você pode adicionar uma legenda à imagem descrevendo a tarefa!

_Em breve: extração automática de texto e tarefas de imagens!_
```

### 2️⃣2️⃣ Tipo de Mensagem Não Suportado
```
❓ *Tipo de mensagem não suportado*

No momento, suporto:
• 📝 Mensagens de texto
• 🖼️ Imagens com legenda

Use "ajuda" para ver os comandos disponíveis!
```

---

## 🎯 Casos Especiais

### 2️⃣3️⃣ Nenhuma Atividade para Hoje
```
🎉 Você não tem atividades para hoje! Aproveite seu dia livre.
```

### 2️⃣4️⃣ Nenhuma Atividade Vencida
```
✅ Ótimo! Você não tem atividades vencidas.
```

### 2️⃣5️⃣ Todas Atividades Concluídas
```
🎉 Parabéns! Você concluiu todas as atividades de hoje!
```

### 2️⃣6️⃣ Nenhuma Atividade em Andamento
```
🔍 Nenhuma atividade em andamento no momento.
```

### 2️⃣7️⃣ Nenhuma Atividade Pendente
```
✅ Parabéns! Você não tem atividades pendentes.
```

### 2️⃣8️⃣ Data sem Atividades
```
📅 🟢 Amanhã

✨ Nenhuma atividade agendada para esta data.
```

### 2️⃣9️⃣ Erro ao Criar Tarefa
```
❌ Não consegui extrair informações suficientes para criar a tarefa. Por favor, inclua pelo menos um título ou descrição do que precisa ser feito.
```

---

## 📊 Formatação de Status

- ⏳ Pendente - `pending`
- ▶️ Em Andamento - `doing`
- ✅ Concluída - `completed`
- ⏸️ Aguardando Cliente - `waiting-client`
- ⏸️ Aguardando Equipe - `waiting-team`

---

## 🎨 Formatação de Datas

- 🔵 Hoje
- 🟢 Amanhã
- 🔴 Ontem
- DD/MM/YYYY (demais datas)

---

**Todas as mensagens são formatadas com:**
- ✨ Emojis para facilitar visualização
- 📝 Negrito para títulos e seções
- 💡 Itálico para dicas e informações extras
- 🎯 Organização clara e hierárquica

**Experiência mobile-first otimizada para WhatsApp! 📱**

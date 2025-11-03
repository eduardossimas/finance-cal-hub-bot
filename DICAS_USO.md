# 💡 Dicas de Uso & Troubleshooting

## 🎯 Melhores Práticas

### ✅ Criação de Tarefas

#### Seja Específico
```
❌ Ruim: "reunião"
✅ Bom: "reunião com João para discutir projeto X"
```

#### Inclua Data e Horário
```
❌ Ruim: "ligar para cliente"
✅ Bom: "ligar para cliente João amanhã às 10h"
```

#### Especifique Duração
```
❌ Ruim: "preparar relatório"
✅ Bom: "preparar relatório, estimativa 2 horas"
```

#### Mencione o Cliente
```
❌ Ruim: "enviar proposta"
✅ Bom: "enviar proposta para Empresa X"
```

---

## 🔍 Comandos Inteligentes

### Consultas Rápidas
```
Dia atual:       hoje
Próximo dia:     amanhã
Data específica: 15/12
Atrasadas:       vencidas
Restantes:       restantes
Em progresso:    fazendo
```

### Criação Rápida
```
Simples:    criar tarefa X
Completa:   criar reunião com João amanhã às 14h, 1 hora
Natural:    reunião com cliente às 15h
```

### Perguntas Úteis
```
Tempo total:          "quanto tempo vou levar hoje?"
Próxima tarefa:       "qual minha próxima tarefa?"
Tarefas de cliente:   "quantas tarefas tenho para João?"
Resumo:               "resumo"
```

---

## 🐛 Troubleshooting

### Problema: Bot não responde

#### Causa 1: Número não cadastrado
```
Solução: Adicione o telefone no banco de dados (tabela users)
```

#### Causa 2: Bot offline
```
Solução: Verifique se npm run dev está rodando
```

#### Causa 3: Erro de autenticação
```
Solução: 
1. Pare o bot
2. Delete a pasta auth_info_baileys
3. Inicie o bot novamente
4. Escaneie o QR Code
```

---

### Problema: Tarefa não é criada

#### Causa 1: Descrição muito vaga
```
❌ "fazer"
✅ "fazer reunião com João"

Solução: Seja mais específico
```

#### Causa 2: Erro na API Gemini
```
Solução: Verifique se GEMINI_API_KEY está configurada
Verifique se tem créditos na API
```

#### Causa 3: Erro de conexão com Supabase
```
Solução: Verifique SUPABASE_URL e SUPABASE_ANON_KEY
Teste a conexão com o banco
```

---

### Problema: Data interpretada errada

#### Causa: Formato ambíguo
```
❌ "01/02" (pode ser 1º fev ou 2 de janeiro)
✅ "01/02/2025" (explícito)
✅ "amanhã" (não ambíguo)

Solução: Use formato completo ou linguagem natural
```

---

### Problema: Cliente não é reconhecido

#### Causa: Nome muito diferente
```
Banco: "João da Silva"
Mensagem: "João"

Solução: IA vai criar novo cliente "João"
Depois você pode mesclar manualmente no banco
```

---

### Problema: Notificação diária não chega

#### Causa 1: Horário errado
```
Solução: Ajuste DAILY_SUMMARY_CRON no .env
Formato: "0 8 * * *" (8h) ou "30 9 * * *" (9h30)
```

#### Causa 2: Timezone errado
```
Solução: Ajuste TIMEZONE no .env
Exemplo: "America/Sao_Paulo"
```

#### Causa 3: Telefone não cadastrado
```
Solução: Verifique se users.phone está preenchido
Formato: +5511999999999
```

---

## ⚠️ Limitações Conhecidas

### 1. Áudio
- ✅ Reconhece que é áudio
- ❌ Não transcreve (em desenvolvimento)
- 💡 Use texto por enquanto

### 2. Imagem sem Legenda
- ✅ Reconhece que é imagem
- ❌ Não extrai texto (em desenvolvimento)
- 💡 Adicione legenda para criar tarefa

### 3. Edição de Tarefas
- ❌ Não é possível editar pelo WhatsApp ainda
- 💡 Edite pela interface web ou banco de dados

### 4. Exclusão de Tarefas
- ❌ Não é possível deletar pelo WhatsApp ainda
- 💡 Delete pela interface web ou banco de dados

### 5. Marcar como Concluída
- ❌ Não é possível marcar pelo WhatsApp ainda
- 💡 Marque pela interface web ou banco de dados

---

## 🚀 Dicas Avançadas

### 1. Múltiplas Tarefas de Uma Vez
```
Envie uma mensagem por tarefa:

criar reunião com João amanhã
[aguarde resposta]
criar ligar para Maria hoje
[aguarde resposta]
criar enviar relatório 15/12
```

### 2. Use Resumo para Planejar
```
Manhã: "hoje" (ver o que tem)
Meio-dia: "restantes" (ver o que falta)
Fim do dia: "resumo" (análise)
```

### 3. Acompanhe Vencidas
```
Todo dia: "vencidas"
→ Priorize as mais antigas
```

### 4. Planeje com Antecedência
```
Domingo à noite: "amanhã"
Sexta à tarde: "próxima semana"
```

### 5. Use Perguntas para Insights
```
"Quanto tempo vou levar esta semana?"
"Qual cliente tem mais tarefas?"
"Estou muito sobrecarregado?"
```

---

## 📊 Comandos por Situação

### 🌅 Início do Dia
```
1. hoje           → Ver agenda
2. vencidas       → Prioridades
3. resumo         → Planejamento
```

### 🕐 Durante o Dia
```
1. restantes      → Progresso
2. fazendo        → Em andamento
3. [perguntas]    → Decisões rápidas
```

### 🌙 Fim do Dia
```
1. restantes      → Pendências
2. amanhã         → Próximo dia
3. resumo         → Análise
```

---

## 🔧 Configurações Recomendadas

### .env Otimizado
```bash
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx

# Gemini AI
GEMINI_API_KEY=xxx

# Notificações (opcional)
DAILY_SUMMARY_CRON="0 8 * * *"     # 8h da manhã
TIMEZONE="America/Sao_Paulo"        # Fuso horário

# Desenvolvimento (opcional)
NODE_ENV=development
LOG_LEVEL=info
```

### Horários Alternativos de Notificação
```bash
# 7h da manhã
DAILY_SUMMARY_CRON="0 7 * * *"

# 9h30 da manhã
DAILY_SUMMARY_CRON="30 9 * * *"

# Apenas dias úteis às 8h
DAILY_SUMMARY_CRON="0 8 * * 1-5"

# Duas vezes ao dia (8h e 18h)
# (Precisa configurar dois cron jobs no código)
```

---

## 📱 Formato do Telefone

### No Banco de Dados (users.phone)
```
✅ Correto: +5511999999999
❌ Errado: 5511999999999
❌ Errado: (11) 99999-9999
❌ Errado: 11999999999
```

### Formato Internacional
```
+ [código país] [código área] [número]
  +55           11            999999999
```

---

## 🧪 Como Testar Rapidamente

### Teste Básico (2 min)
```bash
1. npm run dev
2. Escaneie QR Code
3. Envie: "hoje"
4. Envie: "ajuda"
```

### Teste Completo (10 min)
```bash
1. Consultas: hoje, vencidas, restantes
2. Criação: criar teste de tarefa
3. Data: amanhã, 15/12
4. IA: resumo, "quanto tempo?"
5. Ajuda: ajuda
```

---

## 📞 Suporte Rápido

### Erro Comum 1
```
Erro: "Cannot find module..."
Solução: npm install
```

### Erro Comum 2
```
Erro: "GEMINI_API_KEY não configurada"
Solução: Adicione no .env
```

### Erro Comum 3
```
Erro: "Connection refused Supabase"
Solução: Verifique URL e KEY no .env
```

### Erro Comum 4
```
Bot não responde
Solução: Verifique se telefone está no banco
```

---

## ✅ Checklist de Funcionamento

### Antes de Usar
- [ ] npm install executado
- [ ] .env configurado (3 variáveis mínimas)
- [ ] Banco de dados com estrutura criada
- [ ] Telefone cadastrado no users.phone

### Ao Iniciar
- [ ] Bot conecta (mensagem verde no console)
- [ ] QR Code escaneado
- [ ] Mensagem "WhatsApp conectado com sucesso"

### Testando
- [ ] "hoje" responde
- [ ] "ajuda" mostra menu
- [ ] "criar teste" cria tarefa
- [ ] Bot não responde números não cadastrados

---

## 🎓 Recursos Adicionais

### Documentação
- `FUNCIONALIDADES_WHATSAPP.md` - Funcionalidades completas
- `TESTES_WHATSAPP.md` - Guia de testes
- `EXEMPLOS_MENSAGENS.md` - Exemplos visuais
- `IMPLEMENTACOES_RESUMO.md` - Resumo técnico

### Logs Úteis
```bash
# Ver logs em tempo real
npm run dev

# Logs importantes:
✅ WhatsApp conectado
📩 Mensagem de [número]
✅ Resposta enviada
⚠️ Número não cadastrado
❌ Erro ao...
```

---

**Dica Final:** Comece simples! Use "hoje" e "criar tarefa X" para se familiarizar, depois explore recursos avançados. 🚀

**Bom uso! 📱✨**

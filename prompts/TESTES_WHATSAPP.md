# 🧪 Guia de Testes - WhatsApp Bot

## 📝 Checklist de Testes

### ✅ 1. Consultas de Atividades

#### Teste 1.1: Atividades de Hoje
```
Enviar: hoje
Enviar: atividades

Esperado:
- Lista de atividades do dia atual
- Formato: número, título, cliente, duração, status
- Total de atividades
```

#### Teste 1.2: Atividades Vencidas
```
Enviar: vencidas
Enviar: atrasadas

Esperado:
- Lista de atividades com data anterior a hoje
- Dias de atraso calculados
- Data original de cada tarefa
- Alerta para priorizar
```

#### Teste 1.3: Atividades por Data
```
Enviar: amanhã
Enviar: 15/12
Enviar: 15/12/2025
Enviar: próxima semana

Esperado:
- Lista de atividades da data especificada
- Data formatada legível (Hoje, Amanhã, DD/MM/YYYY)
- Mensagem se não houver atividades
```

#### Teste 1.4: Atividades Restantes
```
Enviar: restantes
Enviar: falta fazer

Esperado:
- Separação entre "Em Andamento" e "Pendentes"
- Apenas atividades não concluídas do dia
- Mensagem de parabéns se tudo concluído
```

#### Teste 1.5: Atividades em Andamento
```
Enviar: fazendo
Enviar: andamento

Esperado:
- Apenas atividades com status "doing"
- Mensagem se nenhuma em andamento
```

#### Teste 1.6: Atividades Pendentes
```
Enviar: pendentes
Enviar: pendente

Esperado:
- Todas as atividades não concluídas
- Ordenadas por data
- Exibição da data de cada uma
```

---

### ✅ 2. Criação de Tarefas

#### Teste 2.1: Criar Tarefa Simples
```
Enviar: criar reunião com João

Esperado:
- Confirmação de criação
- Título: "reunião com João"
- Cliente: João (criado automaticamente)
- Data: hoje
- Duração: 60min (padrão)
- Status: Pendente
```

#### Teste 2.2: Criar Tarefa com Data
```
Enviar: criar ligar para fornecedor amanhã

Esperado:
- Data: amanhã (calculada automaticamente)
- Título: "ligar para fornecedor"
```

#### Teste 2.3: Criar Tarefa com Duração
```
Enviar: nova tarefa preparar relatório, 2 horas

Esperado:
- Duração: 120min (convertido automaticamente)
```

#### Teste 2.4: Criar Tarefa Completa
```
Enviar: criar reunião com cliente Maria amanhã às 14h, duração 1 hora e 30 minutos

Esperado:
- Título: "reunião com cliente Maria"
- Cliente: Maria
- Data: amanhã
- Duração: 90min
```

#### Teste 2.5: Criação Natural (sem comando)
```
Enviar: reunião com cliente às 15h hoje
Enviar: ligar para fornecedor amanhã
Enviar: preparar apresentação

Esperado:
- Bot detecta automaticamente que é uma tarefa
- Cria tarefa com informações extraídas
```

#### Teste 2.6: Imagem com Legenda
```
1. Enviar foto qualquer
2. Adicionar legenda: "reunião amanhã com João"

Esperado:
- Processa a legenda como texto
- Cria tarefa normalmente
```

#### Teste 2.7: Imagem sem Legenda
```
Enviar foto sem legenda

Esperado:
- Mensagem informando que análise está em desenvolvimento
- Sugestão para adicionar legenda
```

#### Teste 2.8: Áudio
```
Enviar mensagem de áudio

Esperado:
- Mensagem informando que transcrição está em desenvolvimento
- Sugestão para usar texto por enquanto
```

---

### ✅ 3. Resumo e IA

#### Teste 3.1: Resumo Inteligente
```
Enviar: resumo

Esperado:
- Análise das atividades do dia
- Organização por status
- Estimativa de tempo total
- Mensagem motivacional
- Emojis e formatação
```

#### Teste 3.2: Perguntas com IA
```
Enviar: Quanto tempo vou levar hoje?
Enviar: Qual minha próxima tarefa?
Enviar: Tenho reunião marcada?
Enviar: Quantas tarefas tenho?

Esperado:
- Resposta contextualizada baseada nas atividades
- Linguagem natural e amigável
- Uso de emojis
```

---

### ✅ 4. Sistema de Ajuda

#### Teste 4.1: Menu de Ajuda
```
Enviar: ajuda
Enviar: help
Enviar: menu

Esperado:
- Lista completa de comandos
- Organizado por categorias
- Exemplos de uso
```

---

### ✅ 5. Notificação Diária

#### Teste 5.1: Resumo Matinal (8h)
```
Aguardar horário configurado (padrão 8h)

Esperado:
- Mensagem automática às 8h
- Saudação com nome
- Data completa
- Resumo estatístico
- Lista de atividades do dia
- Mensagem motivacional
```

#### Teste 5.2: Sem Atividades
```
Garantir que não há atividades no dia
Aguardar 8h

Esperado:
- Mensagem informando que o dia está livre
- Sugestão para planejar atividades
```

---

### ✅ 6. Segurança e Validação

#### Teste 6.1: Número Não Cadastrado
```
Enviar mensagem de número não cadastrado no banco

Esperado:
- Nenhuma resposta
- Log no console: "Mensagem ignorada de número não cadastrado"
```

#### Teste 6.2: Mensagem Vazia
```
Enviar mensagem vazia ou apenas espaços

Esperado:
- Ignorar ou mostrar menu de ajuda
```

#### Teste 6.3: Comando Inválido
```
Enviar: xpto123

Esperado:
- Se muito curto: menu de ajuda
- Se longo: tentar processar como pergunta para IA
```

---

## 🔍 Testes de Casos Extremos

### Teste E1: Múltiplas Atividades
```
Criar 10+ atividades para hoje
Enviar: hoje

Esperado:
- Lista todas sem truncar
- Formatação mantida
```

### Teste E2: Título Muito Longo
```
Enviar: criar reunião importantíssima com cliente muito especial para discutir projeto estratégico de longo prazo

Esperado:
- IA reduz para ~100 caracteres
- Mantém essência da tarefa
```

### Teste E3: Cliente com Nome Composto
```
Enviar: criar tarefa para Maria da Silva

Esperado:
- Cliente: "Maria da Silva" (completo)
```

### Teste E4: Data Ambígua
```
Enviar: criar tarefa para 01/02

Esperado:
- Interpreta como DD/MM do ano atual
```

### Teste E5: Comandos Simultâneos
```
Enviar várias mensagens rapidamente

Esperado:
- Processa todas em ordem
- Nenhuma perdida
```

---

## 📊 Métricas de Sucesso

### Performance
- ✅ Resposta em < 3 segundos
- ✅ Sem erros de processamento
- ✅ Logs claros no console

### Usabilidade
- ✅ Comandos intuitivos
- ✅ Mensagens de erro amigáveis
- ✅ Confirmações visuais

### Funcionalidade
- ✅ Todas as features funcionando
- ✅ IA extraindo informações corretamente
- ✅ Notificações sendo enviadas

---

## 🐛 Como Reportar Bugs

Se encontrar algum problema:

1. **Descrição:** O que aconteceu?
2. **Esperado:** O que deveria acontecer?
3. **Reprodução:** Passos para reproduzir
4. **Logs:** Mensagem de erro no console
5. **Dados:** Exemplo de entrada que causou o erro

---

## ✅ Checklist Final

- [ ] Todos os comandos de consulta funcionam
- [ ] Criação de tarefas via texto funciona
- [ ] Criação com IA extrai informações corretamente
- [ ] Imagens com legenda são processadas
- [ ] Resumo com IA funciona
- [ ] Perguntas são respondidas corretamente
- [ ] Menu de ajuda exibe corretamente
- [ ] Notificação diária às 8h funciona
- [ ] Números não cadastrados são ignorados
- [ ] Datas são interpretadas corretamente
- [ ] Clientes são criados automaticamente
- [ ] Status são exibidos corretamente
- [ ] Formatação de mensagens está boa
- [ ] Performance é aceitável
- [ ] Logs estão claros

---

## 🎯 Próximos Testes (Futuras Features)

- [ ] Transcrição de áudio
- [ ] Análise de imagens (OCR)
- [ ] Iniciar/pausar atividades
- [ ] Marcar como concluída
- [ ] Editar atividades
- [ ] Deletar atividades
- [ ] Relatórios semanais
- [ ] Lembretes programados

---

**Happy Testing! 🚀**

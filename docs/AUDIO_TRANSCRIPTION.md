# 🎤 Transcrição de Áudio

## Visão Geral

O bot agora suporta **transcrição automática de áudios** usando a API Whisper da OpenAI. Quando você envia um áudio pelo WhatsApp, o bot:

1. 📥 Baixa o arquivo de áudio
2. 🎤 Transcreve usando Whisper AI (modelo `whisper-1`)
3. 📝 Processa a transcrição como uma mensagem de texto normal
4. ✅ Cria tarefas ou executa comandos baseado no conteúdo do áudio

## Como Usar

### Enviar Áudio
Simplesmente grave e envie um áudio pelo WhatsApp descrevendo:
- Tarefas que você quer criar
- Comandos que deseja executar
- Perguntas sobre suas atividades

### Exemplos de Áudios

**Criar Tarefa:**
> 🎤 "Criar reunião com ConectFin amanhã às 14h"

**Consultar Atividades:**
> 🎤 "Quais são minhas atividades de hoje?"

**Concluir Tarefa:**
> 🎤 "Concluir a reunião com Maria"

## Tecnologia

### OpenAI Whisper
- **Modelo:** `whisper-1`
- **Idioma:** Português (pt)
- **Formatos:** Suporta OGG, MP3, WAV, M4A, etc.
- **Qualidade:** Alta precisão em português brasileiro

### Fluxo Técnico

```
┌─────────────────┐
│  Áudio WhatsApp │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│ downloadMediaMessage()  │
│  (Baileys)              │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ transcribeAudio()       │
│  (OpenAI Whisper)       │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ processMessage()        │
│  (IA identifica intent) │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ Resposta ao usuário     │
└─────────────────────────┘
```

## Requisitos

### Variáveis de Ambiente
```env
# OpenAI (necessário para transcrição)
OPENAI_API_KEY=sk-...
AI_PROVIDER=openai
```

⚠️ **Importante:** A transcrição de áudio **requer OpenAI** como provider. Não funciona com Gemini.

### Dependências
```json
{
  "openai": "^6.7.0",
  "@whiskeysockets/baileys": "^6.7.8"
}
```

## Custos

A API Whisper da OpenAI cobra por minuto de áudio transcrito:

- **$0.006 por minuto** (aproximadamente R$0.03/minuto)

**Exemplo de custo:**
- 1 áudio de 30 segundos = $0.003 (R$0.015)
- 100 áudios de 30 segundos/dia = $0.30/dia (R$1.50/dia)
- 100 áudios de 30 segundos/dia x 30 dias = $9/mês (R$45/mês)

💡 **Dica:** Incentive áudios curtos e objetivos para reduzir custos.

## Limitações

1. **Provider:** Apenas OpenAI (Gemini não suporta transcrição de áudio via API)
2. **Tamanho:** Máximo de 25MB por arquivo
3. **Duração:** Recomendado até 2 minutos para melhor performance
4. **Qualidade:** Áudios com ruído podem ter transcrição menos precisa

## Tratamento de Erros

O bot trata os seguintes erros:

### Erro ao Baixar Áudio
```
❌ Erro ao processar áudio
Não consegui baixar o áudio. Tente novamente.
```

### Erro na Transcrição
```
❌ Erro ao transcrever áudio
Não consegui processar o áudio. Tente:
• Enviar novamente
• Usar mensagem de texto
• Verificar se o áudio está claro
```

### Áudio Incompreensível
Se a transcrição retornar vazio ou ininteligível, a IA pode não conseguir identificar a intenção e responderá com sugestões de como formular melhor a mensagem.

## Feedback ao Usuário

Quando você envia um áudio, o bot:

1. Confirma o recebimento
2. Mostra a transcrição
3. Processa o comando
4. Retorna o resultado

**Exemplo:**
```
🎤 Áudio transcrito:
"criar reunião com ConectFin amanhã às 14h"

⏳ Processando...

✅ Tarefa criada com sucesso!
📝 Reunião com ConectFin
📅 06/11/2025 - 14:00
...
```

## Melhorias Futuras

- [ ] Suporte a áudios longos (chunking)
- [ ] Cache de transcrições similares
- [ ] Detecção de idioma automática
- [ ] Análise de sentimento do áudio
- [ ] Suporte a múltiplos idiomas
- [ ] Integração com Gemini quando disponível

## Segurança e Privacidade

- ✅ Áudios são processados apenas pela OpenAI
- ✅ Não são armazenados permanentemente
- ✅ Transcrições são usadas apenas para processar comandos
- ✅ Conformidade com LGPD (dados processados sob demanda)

## Código-fonte

### Transcrição
```typescript
// src/services/ai.ts
export async function transcribeAudio(audioBuffer: Buffer): Promise<string | null>
```

### Handler WhatsApp
```typescript
// src/bot/whatsapp.ts
// Processamento de audioMessage
```

## Suporte

Em caso de problemas:
1. Verifique se `OPENAI_API_KEY` está configurada
2. Verifique se `AI_PROVIDER=openai` no `.env`
3. Teste com áudio curto e claro
4. Verifique os logs do console
5. Envie mensagem de texto como alternativa

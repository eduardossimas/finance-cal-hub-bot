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

### Google Gemini 1.5 Pro
- **Modelo:** `gemini-1.5-pro`
- **Idioma:** Português (pt-BR)
- **Formatos:** Suporta OGG, MP3, WAV, M4A, etc.
- **Qualidade:** Alta precisão em português brasileiro
- **Custo:** GRATUITO (dentro dos limites da API)

### Arquitetura Híbrida
O sistema usa uma abordagem híbrida:
- 🎤 **Gemini** → Transcrição de áudio (gratuito)
- 🤖 **OpenAI** → Processamento de mensagens e extração de tarefas (pago, mas mais preciso)

Esta combinação oferece o melhor dos dois mundos: transcrição gratuita e processamento de alta qualidade.

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
│  (Google Gemini)        │  ← GRATUITO
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ processMessage()        │
│  (OpenAI - IA)          │  ← PAGO
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
# Gemini (necessário para transcrição de áudio - GRATUITO)
GEMINI_API_KEY=sua-api-key-do-google-ai-studio

# OpenAI (necessário para processamento de mensagens)
OPENAI_API_KEY=sk-...
AI_PROVIDER=openai
```

⚠️ **Importante:** 
- **Gemini** é usado para transcrição de áudio (GRATUITO)
- **OpenAI** é usado para processar mensagens e criar tarefas (pago)
- Ambas as chaves são necessárias para funcionalidade completa

### Dependências
```json
{
  "openai": "^6.7.0",
  "@whiskeysockets/baileys": "^6.7.8"
}
```

## Custos

### Transcrição de Áudio: **GRATUITO** 🎉

O **Google Gemini** oferece transcrição de áudio **totalmente gratuita** dentro dos limites da API gratuita:

- ✅ **60 requisições por minuto**
- ✅ **1.500 requisições por dia**
- ✅ **1 milhão de tokens por mês**

Isso significa que você pode transcrever centenas de áudios por dia sem custo!

### Processamento de Mensagens: Baixo Custo

A OpenAI é usada apenas para processar o texto transcrito:

- **GPT-4o-mini:** $0.150 / 1M tokens de entrada, $0.600 / 1M tokens de saída
- Uma mensagem típica usa ~500 tokens
- **Custo estimado:** $0.0003 por processamento (R$0.0015)

**Exemplo de custo mensal:**
- 100 áudios/dia = 3.000 áudios/mês
- Transcrição: **R$0** (Gemini gratuito)
- Processamento: ~R$4,50/mês (OpenAI)
- **Total:** ~R$4,50/mês 🎯

💡 **Economia:** Comparado com usar apenas OpenAI Whisper (~R$45/mês), você economiza 90%!

## Limitações

1. **Limites da API Gratuita do Gemini:**
   - 60 requisições/minuto
   - 1.500 requisições/dia
   - 1 milhão de tokens/mês
2. **Tamanho:** Máximo de 25MB por arquivo (limite do WhatsApp)
3. **Duração:** Funciona bem até 5 minutos de áudio
4. **Qualidade:** Áudios com muito ruído podem ter transcrição menos precisa

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
1. Verifique se `GEMINI_API_KEY` está configurada (para transcrição)
2. Verifique se `OPENAI_API_KEY` está configurada (para processamento)
3. Verifique se `AI_PROVIDER=openai` no `.env`
4. Teste com áudio curto e claro
5. Verifique os logs do console (agora com detalhes completos)
6. Envie mensagem de texto como alternativa

### Logs Detalhados

O sistema agora possui logs detalhados em cada etapa:
- 🎤 Recebimento do áudio
- 📥 Download do arquivo
- 🔊 Transcrição com Gemini
- 💬 Processamento com OpenAI
- ✅ Resposta final

Acompanhe o console para diagnóstico completo!

# 🚀 Início Rápido - 3 Minutos

## ✅ Seu Banco Já Está Pronto!

O bot usa o campo `phone` da tabela `users` - não precisa criar tabelas novas!

---

## 1️⃣ Instalar Dependências

```bash
npm install
```

## 2️⃣ Configurar Ambiente

Copie e edite o `.env`:

```bash
cp .env.example .env
nano .env
```

Preencha:
- `SUPABASE_URL` e `SUPABASE_ANON_KEY` (do seu dashboard Supabase)
- `GEMINI_API_KEY` (de https://makersuite.google.com/app/apikey)

## 3️⃣ Adicionar Seu Telefone no Supabase

Execute no **SQL Editor**:

```sql
-- Ver seus usuários:
SELECT id, name, phone FROM public.users;

-- Adicionar seu telefone (SUBSTITUA os valores):
UPDATE public.users 
SET phone = '+5511999999999'
WHERE id = 'seu-user-id-uuid';
```

⚠️ **Importante:** O telefone DEVE ter `+` no início!

## 4️⃣ Iniciar o Bot

```bash
npm run dev
```

## 5️⃣ Conectar WhatsApp

1. Um QR Code aparecerá no terminal
2. Abra WhatsApp → ⋮ Mais → Aparelhos conectados
3. Escaneie o QR Code

## 6️⃣ Testar

Envie pelo WhatsApp:
- `ajuda` - Ver comandos
- `hoje` - Ver atividades de hoje
- `criar teste de tarefa` - Criar nova tarefa
- `concluir teste` - ✨ **NOVO:** Concluir tarefa
- `resumo` - Resumo com IA

---

## ✨ Nova Funcionalidade: Concluir Tarefas

### Como usar:
```
concluir reunião com João
finalizar relatório
concluída proposta
```

A IA identifica automaticamente qual tarefa você quer concluir! 🤖

---

✅ **Pronto!** O bot está funcionando com todas as features.

📚 Veja os arquivos de documentação:
- `FUNCIONALIDADES_WHATSAPP.md` - Todas as funcionalidades
- `EXEMPLOS_MENSAGENS.md` - Exemplos visuais de mensagens
- `TESTES_WHATSAPP.md` - Guia completo de testes
- `DICAS_USO.md` - Dicas e troubleshooting

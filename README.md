# FitCoach 💪

Sistema de gerenciamento de treinos para personal trainers e alunos.

---

## 🚀 Como rodar o projeto

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar o Supabase

Copie o arquivo de exemplo e preencha com suas credenciais:

```bash
cp .env.example .env
```

Abra o arquivo `.env` e preencha:

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> Onde encontrar: **https://app.supabase.com → seu projeto → Settings → API**

### 3. Configurar o banco de dados

No painel do Supabase, vá em **SQL Editor** e rode o conteúdo de:

```
supabase/schema.sql
```

### 4. Configurar a Edge Function (criar alunos)

A função `criar-aluno` é necessária para cadastrar alunos sem deslogar a personal trainer.

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Fazer deploy da função
supabase functions deploy criar-aluno --project-ref SEU_PROJECT_REF
```

### 5. Rodar o projeto

```bash
npm run dev
```

Acesse: **http://localhost:5173**

---

## 🗂️ Estrutura do projeto

```
src/
├── components/
│   ├── layout/       # Navbar, ProtectedRoute
│   └── ui/           # Spinner, Toast, Modal, EmptyState
├── hooks/
│   └── useAuth.js    # Hook de autenticação
├── lib/
│   └── supabase.js   # Cliente Supabase
├── pages/
│   ├── LoginPage.jsx
│   ├── aluno/        # Dashboard e treino do aluno
│   └── personal/     # Dashboard, detalhe de treino, modais
└── services/
    ├── alunos.js     # CRUD de alunos
    └── treinos.js    # CRUD de treinos e exercícios
```

---

## 👤 Roles de usuário

| Role | Acesso |
|------|--------|
| `personal` | Gerencia alunos, cria/edita treinos e exercícios |
| `aluno` | Visualiza e marca treinos como concluídos |

---

## 🛠️ Stack

- **React 18** com Vite
- **Supabase** (Auth, Database, Storage, Edge Functions, Realtime)
- **Tailwind CSS**
- **React Router v6**

---

## ❗ Problemas comuns

**Tela branca ao abrir o app**
→ Verifique se o arquivo `.env` existe e tem as variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` preenchidas corretamente.

**Erro ao fazer login**
→ Confirme que o usuário existe no Supabase Auth e que a tabela `profiles` tem um registro para esse usuário com o campo `role` preenchido (`personal` ou `aluno`).

**Erro ao cadastrar aluno**
→ A Edge Function `criar-aluno` precisa estar deployada. Veja o passo 4 acima.

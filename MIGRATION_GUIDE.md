# Migração: Supabase → PostgreSQL Railway

## 📋 Resumo

Este guia descreve como migrar dados operacionais do Supabase para PostgreSQL Railway, mantendo a autenticação no Supabase.

### O que muda?
- ✅ **Autenticação**: Continua no Supabase (sem mudanças)
- ✅ **Dados operacionais**: Migram para PostgreSQL Railway
  - Barbearias
  - Agendamentos (bookings)
  - Barbeiros
  - Serviços
  - Inventário
  - Clientes
  - Logs de superadmin

---

## 🚀 Passo a Passo

### 1. Configurar variáveis de ambiente

Adicione as variáveis do PostgreSQL Railway ao seu `.env`:

```bash
DATABASE_URL=postgresql://user:password@host:5432/database
PGHOST=host
PGPORT=5432
PGUSER=user
PGPASSWORD=password
PGDATABASE=database
```

No Railway, essas variáveis já estão disponíveis automaticamente quando você cria um PostgreSQL.

### 2. Inicializar o banco de dados

O banco é inicializado automaticamente na primeira execução. Se precisar fazer manualmente:

```bash
npx tsx scripts/migrate-supabase-to-postgres.ts
```

### 3. Atualizar o código

Substitua as importações de `db.ts` por `db-postgres.ts`:

**Antes:**
```typescript
import { loginBarbearia, addBooking } from './lib/db';
```

**Depois:**
```typescript
import { loginBarbearia, addBooking } from './lib/db-postgres';
```

### 4. Migrar dados (opcional)

Se você já tem dados no Supabase e quer migrá-los:

```bash
npx tsx scripts/migrate-supabase-to-postgres.ts
```

Este script:
- Lê todos os dados do Supabase
- Insere no PostgreSQL Railway
- Usa `ON CONFLICT` para evitar duplicatas

### 5. Testar

1. Faça login com uma conta existente
2. Crie um novo agendamento
3. Verifique se os dados aparecem no PostgreSQL

---

## 🔄 Diferenças de Comportamento

### Real-time Subscriptions

**Supabase** (antes):
```typescript
const channel = supabase
  .channel('bookings:123')
  .on('postgres_changes', { ... })
  .subscribe();
```

**PostgreSQL** (depois):
```typescript
// Polling a cada 5 segundos
const unsubscribe = subscribeBookings(barbeariaId, (bookings) => {
  // atualizar UI
});
```

PostgreSQL não tem subscriptions em tempo real como Supabase. A solução atual usa polling a cada 5 segundos. Para melhor performance em produção, considere:
- WebSockets customizados
- Server-Sent Events (SSE)
- Redis Pub/Sub

---

## 🔐 Segurança

### Autenticação
- Continua no Supabase Auth
- Tokens JWT validados normalmente

### Banco de dados
- PostgreSQL Railway usa SSL por padrão
- Credenciais armazenadas em variáveis de ambiente
- Sem acesso público (apenas via Railway private network)

---

## 📊 Monitoramento

### Verificar conexão
```bash
psql $DATABASE_URL -c "SELECT version();"
```

### Ver tabelas
```bash
psql $DATABASE_URL -c "\dt"
```

### Ver logs
```bash
# No Railway dashboard, vá para Logs do serviço PostgreSQL
```

---

## ⚠️ Rollback

Se precisar voltar para Supabase:

1. Revert as mudanças de import:
```typescript
import { loginBarbearia, addBooking } from './lib/db';
```

2. Remova as variáveis PostgreSQL do `.env`

3. Redeploy

---

## 🆘 Troubleshooting

### Erro: "DATABASE_URL is missing"
- Verifique se a variável está configurada no Railway
- Ou adicione ao `.env` local

### Erro: "Connection refused"
- PostgreSQL está rodando?
- Verifique o status no Railway dashboard
- Confirme que DATABASE_URL está correto

### Dados não aparecem após migração
- Execute o script de migração novamente
- Verifique se Supabase tem dados para migrar
- Confira os logs: `npx tsx scripts/migrate-supabase-to-postgres.ts`

---

## 📚 Referências

- [PostgreSQL Node.js Driver](https://node-postgres.com/)
- [Railway PostgreSQL](https://docs.railway.app/databases/postgresql)
- [Supabase Auth](https://supabase.com/docs/guides/auth)


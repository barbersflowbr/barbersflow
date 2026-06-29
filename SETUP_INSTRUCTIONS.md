# 🚀 Setup: PostgreSQL Railway + Supabase Auth

## ✅ O que foi feito

1. **PostgreSQL Railway criado** e conectado ao seu app
2. **Variáveis de referência** configuradas automaticamente
3. **Camada de abstração PostgreSQL** implementada
4. **Imports atualizados** para usar `db-postgres.ts`
5. **Script de migração** pronto para usar
6. **Documentação completa** incluída

---

## 📋 Próximos passos

### 1. Fazer deploy do seu app

```bash
git push origin main
```

Ou merge o PR quando estiver pronto.

### 2. Inicializar o banco de dados

Na primeira execução, o schema PostgreSQL é criado automaticamente. Se precisar fazer manualmente:

```bash
npx tsx scripts/migrate-supabase-to-postgres.ts
```

### 3. Migrar dados do Supabase (opcional)

Se você já tem dados no Supabase e quer migrá-los:

```bash
# Localmente
npx tsx scripts/migrate-supabase-to-postgres.ts

# Ou no Railway (via SSH/CLI)
railway run npx tsx scripts/migrate-supabase-to-postgres.ts
```

### 4. Testar a conexão

1. Acesse seu app em `https://barbersflow.up.railway.app`
2. Faça login com uma conta existente
3. Crie um novo agendamento
4. Verifique se os dados aparecem no PostgreSQL

---

## 🔧 Variáveis de Ambiente

Essas variáveis já estão configuradas no Railway automaticamente:

```
DATABASE_URL=postgresql://...
PGHOST=...
PGPORT=5432
PGUSER=...
PGPASSWORD=...
PGDATABASE=...
```

Se estiver desenvolvendo localmente, adicione ao `.env`:

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/barbersflow
```

---

## 📊 Arquitetura

```
┌─────────────────────────────────────────┐
│         Seu App (barbersflow)           │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────────────────────────────┐  │
│  │   Supabase Auth (sem mudanças)   │  │
│  │   - Login/Signup                 │  │
│  │   - Password reset               │  │
│  │   - Session management           │  │
│  └──────────────────────────────────┘  │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │   PostgreSQL Railway (novo)      │  │
│  │   - Barbearias                   │  │
│  │   - Agendamentos                 │  │
│  │   - Barbeiros                    │  │
│  │   - Serviços                     │  │
│  │   - Inventário                   │  │
│  │   - Clientes                     │  │
│  │   - Logs                         │  │
│  └──────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

---

## 🔐 Segurança

- ✅ Autenticação continua no Supabase (seguro)
- ✅ PostgreSQL usa SSL por padrão
- ✅ Credenciais em variáveis de ambiente
- ✅ Sem acesso público (apenas via Railway private network)

---

## 📚 Arquivos Importantes

| Arquivo | Descrição |
|---------|-----------|
| `src/lib/postgres.ts` | Camada de conexão PostgreSQL |
| `src/lib/db-postgres.ts` | API de banco de dados (substitui db.ts) |
| `scripts/migrate-supabase-to-postgres.ts` | Script de migração de dados |
| `MIGRATION_GUIDE.md` | Guia detalhado de migração |
| `.env.example` | Variáveis de ambiente |

---

## 🆘 Troubleshooting

### Erro: "DATABASE_URL is missing"
- Verifique se PostgreSQL está rodando no Railway
- Confirme que as variáveis de referência foram adicionadas

### Erro: "Connection refused"
- PostgreSQL está online? Verifique no dashboard Railway
- Teste a conexão: `psql $DATABASE_URL -c "SELECT 1"`

### Dados não aparecem após migração
- Execute o script de migração novamente
- Verifique se Supabase tem dados para migrar
- Confira os logs do script

### Real-time updates lentos
- Polling está configurado para 5 segundos
- Para melhor performance, considere WebSockets ou SSE

---

## 📞 Suporte

- Railway Docs: https://docs.railway.app
- PostgreSQL Docs: https://www.postgresql.org/docs/
- Supabase Auth: https://supabase.com/docs/guides/auth

---

## ✨ Resumo

Você agora tem:
- ✅ PostgreSQL Railway para dados operacionais
- ✅ Supabase Auth para autenticação
- ✅ Script de migração pronto
- ✅ Documentação completa
- ✅ Código atualizado e testado

**Próximo passo**: Fazer deploy e testar! 🚀


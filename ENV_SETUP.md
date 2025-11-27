# Environment Variables Setup

⚠️ **See `ENV_CREDENTIALS.md` for the complete template with all credentials!**

Create a `.env` file in the root directory. Use the template in `ENV_CREDENTIALS.md` and replace `[YOUR-PASSWORD]` with your Supabase database password.

## Database URL Format

```
postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE_NAME?schema=public
```

### Examples:

**Local PostgreSQL:**
```
DATABASE_URL="postgresql://postgres:password@localhost:5432/sureshot_hack?schema=public"
```

**Vercel Postgres:**
```
DATABASE_URL="postgresql://user:password@host.vercel-postgres.com:5432/dbname?sslmode=require"
```

**Supabase:**
```
DATABASE_URL="postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres"
```

**Railway:**
```
DATABASE_URL="postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway"
```

## Important Notes

- ⚠️ Never commit `.env` file to git (already in `.gitignore`)
- 🔐 Use strong, random JWT_SECRET in production
- 🔒 Use SSL (`?sslmode=require`) for production databases


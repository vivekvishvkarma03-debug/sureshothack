# Prisma + PostgreSQL Setup Guide

## 📦 Installation

Run these commands to install Prisma and PostgreSQL dependencies:

```bash
npm install prisma @prisma/client pg
npm install -D @types/pg
```

## 🗄️ Database Setup

### Step 1: Create PostgreSQL Database

You can use one of these options:

#### Option A: Local PostgreSQL
```bash
# Install PostgreSQL locally, then create database
createdb sureshot_hack
```

#### Option B: Vercel Postgres (Recommended for Vercel deployment)
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Create a new Postgres database
3. Copy the connection string

#### Option C: Supabase (Free tier available)
1. Go to [Supabase](https://supabase.com)
2. Create a new project
3. Get connection string from Settings > Database

#### Option D: Railway, Neon, or other providers
- Create a PostgreSQL database
- Get the connection string

### Step 2: Configure Environment Variables

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Update `.env` with your database URL:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/sureshot_hack?schema=public"
```

**Format:**
```
postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE_NAME?schema=public
```

**Example (Vercel Postgres):**
```
postgresql://user:password@host.vercel-postgres.com:5432/dbname?sslmode=require
```

## 🚀 Initialize Database

### Step 1: Generate Prisma Client

```bash
npm run db:generate
```

This creates the Prisma Client based on your schema.

### Step 2: Push Schema to Database

For development (creates tables automatically):
```bash
npm run db:push
```

**OR** for production (creates migration files):
```bash
npm run db:migrate
```

This will:
- Create the `users` table in your database
- Set up all columns and constraints
- Create indexes

### Step 3: Verify Setup

Open Prisma Studio to view your database:
```bash
npm run db:studio
```

This opens a visual database browser at `http://localhost:5555`

## 📋 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run db:generate` | Generate Prisma Client |
| `npm run db:push` | Push schema changes to database (dev) |
| `npm run db:migrate` | Create migration files (production) |
| `npm run db:migrate:deploy` | Apply migrations (production) |
| `npm run db:studio` | Open Prisma Studio GUI |

## 🔄 Migration Workflow

### Development
```bash
# Make changes to schema.prisma
# Then push changes
npm run db:push
```

### Production
```bash
# Create migration
npm run db:migrate

# Deploy migration
npm run db:migrate:deploy
```

## 📊 Database Schema

The `User` model includes:

- `id` (UUID, Primary Key)
- `email` (String, Unique)
- `fullName` (String)
- `password` (String, Hashed)
- `isPremium` (Boolean, Default: false)
- `isVip` (Boolean, Default: false)
- `createdAt` (DateTime, Auto)
- `updatedAt` (DateTime, Auto)

## ✅ Verification

After setup, test the database connection:

1. Start your dev server:
```bash
npm run dev
```

2. Try signing up a new user at `/signup`

3. Check Prisma Studio:
```bash
npm run db:studio
```

You should see the new user in the database!

## 🐛 Troubleshooting

### Error: "Can't reach database server"
- Check your `DATABASE_URL` is correct
- Ensure PostgreSQL is running (if local)
- Check firewall/network settings

### Error: "P1001: Can't reach database server"
- Verify connection string format
- Check database credentials
- Ensure database exists

### Error: "P2002: Unique constraint failed"
- Email already exists (this is expected behavior)
- Try a different email

### Error: "Prisma Client not generated"
- Run `npm run db:generate`
- Restart your dev server

## 🔐 Security Notes

1. **Never commit `.env` file** - It's already in `.gitignore`
2. **Use strong JWT_SECRET** in production
3. **Use SSL** for production database connections
4. **Rotate database passwords** regularly

## 📚 Next Steps

After database setup:
1. ✅ Users are now persisted in PostgreSQL
2. ✅ Data survives server restarts
3. ✅ Ready for production deployment
4. ✅ Can scale to multiple instances

## 🚀 Deployment

### Vercel Deployment

1. Add `DATABASE_URL` to Vercel environment variables
2. Run migrations before deploy:
```bash
npm run db:migrate:deploy
```

### Other Platforms

1. Set `DATABASE_URL` environment variable
2. Run migrations on first deploy
3. Ensure Prisma Client is generated during build

---

**Need Help?** Check the [Prisma Docs](https://www.prisma.io/docs) or [Prisma Discord](https://pris.ly/discord)


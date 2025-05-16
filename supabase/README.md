# CS2 Investment Tracker - Supabase Database Setup

This directory contains migration files to set up the database schema for the CS2 Investment Tracker application.

## Migration Files

- `migrations/20250516_initial_schema.sql`: Creates the database tables, indexes, functions, and triggers needed for the application
- `migrations/20250516_sample_data.sql`: Inserts sample data for testing the application

## How to Execute Migrations

### Option 1: Using the Supabase Dashboard (Recommended for Beginners)

1. Go to your [Supabase Project Dashboard](https://app.supabase.com)
2. Navigate to the SQL Editor
3. Create a new query
4. Copy the contents of `migrations/20250516_initial_schema.sql`
5. Paste into the SQL Editor and click "Run"
6. Create another query
7. Copy the contents of `migrations/20250516_sample_data.sql`
8. Paste into the SQL Editor and click "Run"

### Option 2: Using the Supabase CLI (Advanced)

If you have [Supabase CLI installed](https://supabase.com/docs/guides/cli), you can execute the migrations using:

```bash
# Link to your Supabase project
supabase link --project-ref your-project-ref

# Push the migrations to your Supabase project
supabase db push
```

## Environment Variables

After setting up the database, make sure to add the following environment variables to your `.env.local` file:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
CSFLOAT_API_KEY=your-csfloat-api-key (optional)
```

You can find these values in your Supabase project dashboard under "Project Settings" > "API". 
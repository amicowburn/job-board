# MMSS Job Board

A modern job board built for the Monash Marketing Students' Society (MMSS) using Next.js, TypeScript, Tailwind CSS, and Supabase.

## Features

- **Public Job Board**: Browse, search, and filter job listings
- **Admin Dashboard**: Manage jobs, review feedback, bulk operations
- **External Job Sync**: Automatically sync jobs from external APIs
- **User Feedback**: Anonymous feedback system for job listings
- **Modern UI**: Responsive design with customizable theme

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Styling**: Tailwind CSS
- **Deployment**: Vercel (with Cron jobs)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (or Docker for local development)

### 1. Clone and Install

```bash
git clone <repository-url>
cd mmss-job-board
npm install
```

### 2. Set Up Supabase

#### Option A: Supabase Cloud (Recommended for production)

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **Settings > API** and copy your project URL and keys

#### Option B: Supabase Local (Recommended for development)

```bash
# Install Supabase CLI
npm install -g supabase

# Start local Supabase (requires Docker)
supabase start
```

This will output your local credentials. The local dashboard will be available at `http://127.0.0.1:54323`.

### 3. Run Database Migration

#### For Supabase Cloud:
1. Go to **SQL Editor** in your Supabase dashboard
2. Copy the contents of `supabase/migrations/0001_init.sql`
3. Paste and run the SQL

#### For Supabase Local:
```bash
# Run migrations
supabase db push
```

### 4. Configure Environment Variables

```bash
# Copy the example file
cp .env.example .env.local

# Edit .env.local with your values
```

Required variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `SYNC_SECRET` - Secret token for sync endpoint

For local development with Supabase Local:
```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from supabase start output>
SUPABASE_SERVICE_ROLE_KEY=<from supabase start output>
```

### 5. Create Admin User

#### Step 1: Create Auth User

**Via Supabase Dashboard:**
1. Go to **Authentication > Users**
2. Click **Add user** > **Create new user**
3. Enter email and password

**Via SQL (for local development):**
```sql
-- Note: For local dev, you can create users via the Auth UI at http://127.0.0.1:54323
```

#### Step 2: Grant Admin Access

Run this SQL in your Supabase SQL Editor (replace with your user's email):

```sql
-- Find and promote user to admin
INSERT INTO admin_users (id, is_admin)
SELECT id, TRUE
FROM auth.users
WHERE email = 'admin@example.com';
```

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the job board.

Admin panel: [http://localhost:3000/admin](http://localhost:3000/admin)

## Project Structure

```
/
├── app/                    # Next.js App Router pages
│   ├── admin/             # Admin pages
│   ├── api/               # API routes
│   └── jobs/              # Public job pages
├── components/            # React components
│   ├── admin/             # Admin-specific components
│   ├── jobs/              # Job-related components
│   └── ui/                # Reusable UI components
├── lib/                   # Utilities and configurations
│   ├── supabase/          # Supabase client configurations
│   ├── externalJobsAdapter.ts  # External API adapter
│   ├── sync.ts            # Job sync logic
│   ├── types.ts           # TypeScript types
│   └── utils.ts           # Utility functions
├── supabase/              # Supabase configuration
│   └── migrations/        # Database migrations
└── public/                # Static assets
```

## Theme Customization

Update the MMSS brand colors in `app/globals.css`:

```css
:root {
  --mmss-primary: #your-primary-color;
  --mmss-secondary: #your-secondary-color;
  --mmss-accent: #your-accent-color;
  /* ... other variables */
}
```

## External Job Sync

### Configuration

1. Set the external API endpoint:
   ```
   EXTERNAL_JOBS_API_URL=https://api.example.com/jobs
   EXTERNAL_JOBS_API_KEY=your-api-key
   ```

2. Update `lib/externalJobsAdapter.ts` to match your API's response format

### Manual Sync

```bash
# Trigger sync manually
curl -X POST http://localhost:3000/api/sync-jobs \
  -H "Authorization: Bearer YOUR_SYNC_SECRET"
```

### Automated Sync (Vercel Cron)

The `vercel.json` configures a cron job to run every 3 days at 3 AM UTC:

```json
{
  "crons": [
    {
      "path": "/api/sync-jobs",
      "schedule": "0 3 */3 * *"
    }
  ]
}
```

**Note**: For Vercel Cron to authenticate, set `SYNC_SECRET` as an environment variable in your Vercel project, then configure Vercel to send it with cron requests.

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import the repository in Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

### Environment Variables for Production

Set these in Vercel Dashboard > Settings > Environment Variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL` (your production URL)
- `SYNC_SECRET`
- `EXTERNAL_JOBS_API_URL` (if using external sync)
- `EXTERNAL_JOBS_API_KEY` (if using external sync)
- `MARK_MISSING_INACTIVE=true`

## Database Schema

### Tables

- **jobs**: Job listings
- **job_feedback**: User feedback on jobs
- **admin_users**: Admin user permissions

### Row Level Security (RLS)

- Public users can only read active jobs
- Public users can submit feedback
- Admin operations require authentication + admin role

## Admin Operations

### Job Management
- Create/Edit/Delete jobs
- Soft delete (deactivate) or hard delete
- Bulk deactivate old jobs

### Feedback Moderation
- View all feedback
- Mark as reviewed
- Delete inappropriate feedback

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sync-jobs` | Sync status info |
| POST | `/api/sync-jobs` | Trigger job sync (requires auth) |
| POST | `/api/auth/signout` | Sign out admin user |

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Troubleshooting

### "Unauthorized" on admin pages
- Ensure you've created an admin user and added them to `admin_users` table
- Check that `is_admin` is set to `TRUE`

### Jobs not syncing
- Verify `SYNC_SECRET` is set correctly
- Check `EXTERNAL_JOBS_API_URL` configuration
- Review server logs for errors

### Supabase connection errors
- Verify environment variables are set correctly
- For local dev, ensure Supabase is running (`supabase status`)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details.

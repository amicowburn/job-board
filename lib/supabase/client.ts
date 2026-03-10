import { createBrowserClient } from '@supabase/ssr'

/**
 * Creates a Supabase client for use in browser/client components.
 * Uses the anon key for public access with RLS enforcement.
 *
 * Note: Type assertions should be used at query sites for type safety.
 * Example: const { data } = await supabase.from('jobs').select('*') as { data: Job[] | null }
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

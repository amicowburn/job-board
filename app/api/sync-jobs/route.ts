import { NextRequest, NextResponse } from 'next/server'
import { runJobSync } from '@/lib/sync'

const SYNC_SECRET = process.env.SYNC_SECRET

/**
 * POST /api/sync-jobs
 *
 * Triggers a job sync from external API.
 * Protected by SYNC_SECRET - must be provided in Authorization header or query param.
 *
 * Usage:
 * - Header: Authorization: Bearer <SYNC_SECRET>
 * - Query param: ?secret=<SYNC_SECRET>
 *
 * For Vercel Cron, configure the cron job to hit this endpoint.
 * See vercel.json for cron configuration.
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization')
    const querySecret = request.nextUrl.searchParams.get('secret')

    const providedSecret =
      authHeader?.replace('Bearer ', '') || querySecret

    if (!SYNC_SECRET) {
      console.error('SYNC_SECRET not configured')
      return NextResponse.json(
        { error: 'Sync not configured' },
        { status: 500 }
      )
    }

    if (providedSecret !== SYNC_SECRET) {
      console.warn('Unauthorized sync attempt')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Run sync
    console.log('Starting job sync via API...')
    const result = await runJobSync()

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Sync completed successfully',
        stats: {
          inserted: result.inserted,
          updated: result.updated,
          deactivated: result.deactivated,
          errors: result.errors.length,
          duration: `${result.duration}ms`,
        },
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          message: 'Sync completed with errors',
          errors: result.errors,
          stats: {
            inserted: result.inserted,
            updated: result.updated,
            deactivated: result.deactivated,
            duration: `${result.duration}ms`,
          },
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Sync endpoint error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/sync-jobs
 *
 * Returns sync endpoint status and usage info.
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/sync-jobs',
    method: 'POST',
    authentication: 'Bearer token in Authorization header or ?secret= query param',
    description: 'Triggers job sync from external API',
  })
}

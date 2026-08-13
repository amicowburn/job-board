#!/usr/bin/env node
/**
 * Makes sure the database the dev server is about to talk to actually exists.
 *
 * Without this, a stopped local Supabase (which is the default state after
 * every reboot — Docker does not come back on its own) surfaces as twenty-odd
 * `fetch failed` stack traces in the terminal and a job board that renders
 * "No jobs found". Both are indistinguishable from an app bug, and neither
 * names the thing that is actually wrong.
 *
 * Deliberately never fatal. It runs as `predev`, so throwing here would mean a
 * broken Docker install makes `npm run dev` impossible to run at all — the
 * failure mode this script exists to prevent, one layer up. Worst case it
 * prints what to do and hands over to Next anyway.
 */

import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const ENV_FILE = '.env.local'
const PROBE_TIMEOUT_MS = 2000

const bold = (s) => `\x1b[1m${s}\x1b[0m`
const dim = (s) => `\x1b[2m${s}\x1b[0m`
const yellow = (s) => `\x1b[33m${s}\x1b[0m`

/** The URL the app will use, env var first so the shell can override the file. */
function supabaseUrl() {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) return process.env.NEXT_PUBLIC_SUPABASE_URL

  try {
    const line = readFileSync(ENV_FILE, 'utf8')
      .split('\n')
      .find((l) => l.trim().startsWith('NEXT_PUBLIC_SUPABASE_URL='))
    return line?.split('=').slice(1).join('=').trim() ?? null
  } catch {
    return null
  }
}

function isLocal(url) {
  try {
    const { hostname } = new URL(url)
    return hostname === '127.0.0.1' || hostname === 'localhost' || hostname === '[::1]'
  } catch {
    return false
  }
}

/** Any HTTP answer means something is listening and routing — that is all we need. */
async function reachable(url) {
  try {
    await fetch(new URL('/auth/v1/health', url), {
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
    })
    return true
  } catch {
    return false
  }
}

function dockerRunning() {
  return spawnSync('docker', ['info'], { stdio: 'ignore' }).status === 0
}

const url = supabaseUrl()

if (!url) {
  console.log(
    yellow('⚠  No NEXT_PUBLIC_SUPABASE_URL found') +
      ` in ${ENV_FILE}. Every database call will fail.\n` +
      dim('   Copy .env.example to .env.local and fill it in.\n')
  )
  process.exit(0)
}

// A hosted project is somebody else's uptime problem: nothing to start, and a
// probe failure here would only be reporting on the network.
if (!isLocal(url)) process.exit(0)

if (await reachable(url)) process.exit(0)

console.log(`\n${yellow('⚠')}  Local Supabase at ${bold(url)} is not responding.`)

if (!dockerRunning()) {
  console.log(
    `   Docker is not running, and the local stack needs it.\n\n` +
      `   ${bold('open -a Docker')}   ${dim('then')}   ${bold('supabase start')}\n\n` +
      dim('   Continuing without a database — expect empty pages and fetch errors.\n')
  )
  process.exit(0)
}

console.log(dim('   Docker is up. Starting the local stack…\n'))

// `supabase start` is idempotent and returns quickly if the stack is already
// up, so there is no need to branch on why the probe failed.
const started = spawnSync('supabase', ['start'], { stdio: 'inherit' })

if (started.status !== 0) {
  console.log(
    `\n${yellow('⚠')}  ${bold('supabase start')} failed. Continuing without a database —\n` +
      dim('   expect empty pages and fetch errors until it is running.\n')
  )
}

process.exit(0)

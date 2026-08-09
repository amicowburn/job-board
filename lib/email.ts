import { Resend } from 'resend'
import type { CreateEmailOptions } from 'resend'

export type SendResult = { ok: true } | { ok: false; error: string }

/**
 * Sends one email via Resend, returning a result rather than throwing.
 *
 * Email is deliberately non-blocking everywhere it is used — a failed send must
 * never fail the submission or approval that triggered it. But it must not be
 * invisible either: a missing API key, an unverified sender domain, or a
 * rejected send all surface here instead of being swallowed, so callers can
 * report that the email did not arrive.
 *
 * `context` labels the send in server logs (e.g. 'submission confirmation').
 */
export async function sendEmail(
  payload: CreateEmailOptions,
  context: string
): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    const error = 'RESEND_API_KEY is not set'
    console.error(`Email skipped (${context}): ${error}`)
    return { ok: false, error }
  }

  try {
    const { error } = await new Resend(apiKey).emails.send(payload)

    if (error) {
      console.error(`Email failed (${context}):`, error)
      return { ok: false, error: error.message }
    }

    return { ok: true }
  } catch (cause) {
    const error = cause instanceof Error ? cause.message : String(cause)
    console.error(`Email threw (${context}):`, cause)
    return { ok: false, error }
  }
}

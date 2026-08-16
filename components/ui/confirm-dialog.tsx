'use client'

import { useCallback, useState } from 'react'
import { Button } from './button'
import { Textarea } from './textarea'
import { Modal } from './modal'

export interface ConfirmOptions {
  title: string
  description?: string
  /** Shown in an amber callout above the actions. Use for consequences the admin might not expect. */
  warning?: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  /** Adds a free-text field; its value comes back as `note`. */
  note?: {
    label: string
    placeholder?: string
    helper?: string
  }
}

export interface ConfirmResult {
  confirmed: boolean
  note: string
}

type Pending = ConfirmOptions & {
  resolve: (result: ConfirmResult) => void
}

/**
 * Promise-based replacement for `window.confirm` / `window.prompt`.
 *
 * Returns a `confirm()` you can await exactly like the native call, plus the
 * `dialog` node to render. Keeping the same shape means handlers read the same
 * as before, they just get branding, a warning slot, and a real text field.
 */
export function useConfirmDialog() {
  const [pending, setPending] = useState<Pending | null>(null)
  const [note, setNote] = useState('')

  const confirm = useCallback((options: ConfirmOptions) => {
    setNote('')
    return new Promise<ConfirmResult>((resolve) => {
      setPending({ ...options, resolve })
    })
  }, [])

  const settle = useCallback(
    (confirmed: boolean) => {
      pending?.resolve({ confirmed, note: confirmed ? note.trim() : '' })
      setPending(null)
      setNote('')
    },
    [pending, note]
  )

  const dialog = pending ? (
    <Modal
      open
      onClose={() => settle(false)}
      title={pending.title}
      description={pending.description}
      footer={
        <>
          <Button variant="ghost" size="sm" className="rounded-full" onClick={() => settle(false)}>
            {pending.cancelLabel ?? 'Cancel'}
          </Button>
          <Button
            variant={pending.destructive ? 'destructive' : 'primary'}
            size="sm"
            className="rounded-full"
            onClick={() => settle(true)}
          >
            {pending.confirmLabel ?? 'Confirm'}
          </Button>
        </>
      }
    >
      {pending.note && (
        <div className="space-y-1.5">
          <label
            htmlFor="confirm-dialog-note"
            className="text-xs font-medium text-foreground"
          >
            {pending.note.label}
          </label>
          <Textarea
            id="confirm-dialog-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={pending.note.placeholder}
            rows={3}
            className="text-sm"
          />
          {pending.note.helper && (
            <p className="text-xs text-muted-foreground">{pending.note.helper}</p>
          )}
        </div>
      )}

      {/* Uses the --warning token (app/globals.css) now, not raw amber-* —
          only reachable by dialogs that still pass `warning` (e.g. job-table's
          delete/bulk-action confirmations); the reject-submission dialog no
          longer passes one, so this doesn't render there any more. */}
      {pending.warning && (
        <div className="mt-4 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2.5">
          <p className="text-xs leading-relaxed">
            <span className="font-semibold text-warning">Heads up — </span>
            {pending.warning}
          </p>
        </div>
      )}
    </Modal>
  ) : null

  return { confirm, dialog }
}

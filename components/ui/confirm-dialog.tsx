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
          <Button variant="outline" size="sm" onClick={() => settle(false)}>
            {pending.cancelLabel ?? 'Cancel'}
          </Button>
          <Button
            variant={pending.destructive ? 'destructive' : 'primary'}
            size="sm"
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
            className="text-xs font-medium text-slate-600"
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
            <p className="text-xs text-slate-400">{pending.note.helper}</p>
          )}
        </div>
      )}

      {pending.warning && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
          <p className="text-xs text-amber-900 leading-relaxed">
            <span className="font-semibold">Heads up — </span>
            {pending.warning}
          </p>
        </div>
      )}
    </Modal>
  ) : null

  return { confirm, dialog }
}

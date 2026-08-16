'use client'

import { SHADOW_TOKENS } from '../lib/tokens'
import { Probe, boxProbe } from './introspect'

export function ShadowSection() {
  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold text-foreground">5. Shadow</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          No bespoke shadow tokens are defined in app/globals.css — these are Tailwind&apos;s
          unmodified default scale. The app&apos;s own <code>.card</code> utility uses{' '}
          <code>shadow-xs</code>.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {SHADOW_TOKENS.map((token) => (
          <div key={token.label} className="flex flex-col items-center gap-3 py-4">
            <Probe
              className={`h-16 w-24 rounded-md bg-card ${token.className}`}
              probe={boxProbe}
              render={(v) => (
                <div className="text-center text-xs">
                  <div className="font-medium text-foreground">shadow-{token.label}</div>
                  <div className="mt-0.5 max-w-[16rem] break-words text-muted-foreground">
                    {v.boxShadow}
                  </div>
                </div>
              )}
            />
          </div>
        ))}
      </div>
    </section>
  )
}

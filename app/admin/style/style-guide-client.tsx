'use client'

import type { RawPaletteReport, VariantUsageReport } from './lib/scan'
import { ColorSection } from './components/color-section'
import { RawPaletteSection } from './components/raw-palette-section'
import { TypeSection } from './components/type-section'
import { RadiusSection } from './components/radius-section'
import { ShadowSection } from './components/shadow-section'
import { ComponentsSection } from './components/components-section'

export function StyleGuideClient({
  rawPalette,
  variantReports,
}: {
  rawPalette: RawPaletteReport
  variantReports: VariantUsageReport[]
}) {
  return (
    <div className="mx-auto max-w-3xl space-y-16 pb-24">
      <header className="space-y-2 border-b border-border pb-6">
        <h1 className="text-3xl font-semibold text-foreground">Style reference</h1>
        <p className="text-sm text-muted-foreground">
          The design system as it currently exists — read live from app/globals.css, the Tailwind
          theme, and the real components in <code>components/ui</code> /{' '}
          <code>components/shadcn</code>. Nothing on this page is a hard-coded color, radius, or font
          value; it documents current state, not an intended one. Broken or missing things render
          broken, with a note.
        </p>
      </header>

      <ColorSection />
      <RawPaletteSection report={rawPalette} />
      <TypeSection />
      <RadiusSection />
      <ShadowSection />
      <ComponentsSection variantReports={variantReports} />
    </div>
  )
}

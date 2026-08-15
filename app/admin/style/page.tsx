import { scanRawPaletteUsage, scanVariantUsage } from './lib/scan'
import { VARIANT_AUDIT_TARGETS } from './lib/tokens'
import { StyleGuideClient } from './style-guide-client'

// Always re-scans the source tree — this page documents current state, so
// it must never serve a stale build-time snapshot.
export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Style reference | Admin',
}

export default async function StyleGuidePage() {
  const [rawPalette, variantReports] = await Promise.all([
    scanRawPaletteUsage(),
    scanVariantUsage(VARIANT_AUDIT_TARGETS),
  ])

  return <StyleGuideClient rawPalette={rawPalette} variantReports={variantReports} />
}

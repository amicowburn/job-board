'use client'

/**
 * Reads live, rendered values off the DOM so the reference page never has to
 * hard-code a color, size, or shadow — it asks the browser what the current
 * token layer actually resolved to.
 */

/**
 * Converts any computed CSS color (rgb, oklch, color(), …) to an 8-bit sRGB
 * hex string by letting a 1x1 canvas do the color-space conversion. Canvas
 * always rasterizes to sRGB regardless of the input color space, which is
 * more reliable than trusting getComputedStyle to return rgb() — modern
 * engines are increasingly allowed to echo back oklch()/color() as-is.
 */
export function cssColorToHex(cssColor: string): string | null {
  if (typeof document === 'undefined') return null
  if (!cssColor || cssColor === 'transparent' || cssColor === 'rgba(0, 0, 0, 0)') {
    return null
  }

  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return null

  // Guard against an unparsable value silently keeping the previous
  // fillStyle (canvas default is black, which would misreport as #000000).
  ctx.fillStyle = '#ff00ff'
  ctx.fillStyle = cssColor
  if (ctx.fillStyle === '#ff00ff' && cssColor.toLowerCase() !== 'magenta') {
    return null
  }

  ctx.fillRect(0, 0, 1, 1)
  const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data
  const hex = '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')
  return a < 255 ? hex + Math.round((a / 255) * 255).toString(16).padStart(2, '0') : hex
}

/** Raw (unresolved) value of a CSS custom property, as authored in the cascade. */
export function readCssVar(name: string, el: Element = document.documentElement): string {
  return getComputedStyle(el).getPropertyValue(name).trim()
}

export function readComputed(el: Element, prop: keyof CSSStyleDeclaration): string {
  const cs = getComputedStyle(el) as unknown as Record<string, string>
  return (cs[prop as string] ?? '').toString()
}

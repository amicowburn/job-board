'use client'

import { createElement, useCallback, useState, type ReactNode } from 'react'
import { cssColorToHex, readComputed, readCssVar } from '../lib/dom-color'

export type ProbeValues = Record<string, string | null>

/**
 * Renders `children` inside an element carrying `className`, then reads
 * back whichever computed values `probe` asks for — the only way this page
 * shows a numeric or color value without having typed it in ourselves.
 */
export function Probe({
  as = 'div',
  className,
  style,
  probe,
  children,
  render,
}: {
  as?: 'div' | 'span' | 'h1' | 'p' | 'button' | 'label'
  className?: string
  style?: React.CSSProperties
  probe: (el: HTMLElement) => ProbeValues
  children?: ReactNode
  render: (values: ProbeValues) => ReactNode
}) {
  const [values, setValues] = useState<ProbeValues>({})

  const setRef = useCallback(
    (el: HTMLElement | null) => {
      if (el) setValues(probe(el))
    },
    [probe]
  )

  return (
    <>
      {createElement(as, { className, style, ref: setRef }, children)}
      {render(values)}
    </>
  )
}

export function colorProbe(el: HTMLElement): ProbeValues {
  const bg = readComputed(el, 'backgroundColor')
  const fg = readComputed(el, 'color')
  return {
    backgroundColor: bg,
    backgroundHex: cssColorToHex(bg),
    color: fg,
    colorHex: cssColorToHex(fg),
  }
}

export function boxProbe(el: HTMLElement): ProbeValues {
  return {
    borderRadius: readComputed(el, 'borderRadius'),
    boxShadow: readComputed(el, 'boxShadow'),
  }
}

export function typeProbe(el: HTMLElement): ProbeValues {
  return {
    fontSize: readComputed(el, 'fontSize'),
    lineHeight: readComputed(el, 'lineHeight'),
    fontWeight: readComputed(el, 'fontWeight'),
    fontFamily: readComputed(el, 'fontFamily'),
  }
}

export function rootVarProbe(names: string[]) {
  return (_el: HTMLElement): ProbeValues => {
    const out: ProbeValues = {}
    for (const name of names) out[name] = readCssVar(name) || null
    return out
  }
}

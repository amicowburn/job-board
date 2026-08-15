import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'

/**
 * Server-only source audit for the /admin/style reference page.
 *
 * Walks the actual source tree at request time (not a build step, not a
 * hand-maintained list) so section 2 of the page — raw Tailwind palette
 * usage — stays accurate as the codebase changes. This file imports
 * `node:fs`; it must never be imported from a 'use client' module.
 */

const SCAN_ROOTS = ['app', 'components', 'lib']
const SKIP_DIR_NAMES = new Set(['node_modules', '.next', '.git'])
// This page's own route — excluded so the audit reports on the app it
// documents, not on itself.
const SKIP_PATH = path.join('app', 'admin', 'style')
const FILE_EXTENSIONS = new Set(['.ts', '.tsx'])

// Tailwind's raw palette families. Anything in this list bypasses the
// semantic token layer defined in app/globals.css.
const RAW_PALETTE_FAMILIES = [
  'slate', 'zinc', 'neutral', 'stone', 'gray',
  'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal',
  'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose',
]

const RAW_CLASS_RE = new RegExp(
  `\\b(bg|text|border|from|to|via|ring|fill|stroke|divide|outline|decoration|shadow|accent|caret)-(${RAW_PALETTE_FAMILIES.join('|')})-([0-9]{2,3})\\b`,
  'g'
)

export interface RawPaletteFileReport {
  file: string
  classes: { className: string; count: number }[]
  total: number
}

export interface RawPaletteReport {
  files: RawPaletteFileReport[]
  totalInstances: number
  totalFiles: number
  byFamily: { family: string; count: number }[]
}

async function walk(dir: string, projectRoot: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const files: string[] = []

  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    const rel = path.relative(projectRoot, full)

    if (rel === SKIP_PATH || rel.startsWith(SKIP_PATH + path.sep)) continue

    if (entry.isDirectory()) {
      if (SKIP_DIR_NAMES.has(entry.name)) continue
      files.push(...(await walk(full, projectRoot)))
    } else if (FILE_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(full)
    }
  }

  return files
}

export async function scanRawPaletteUsage(): Promise<RawPaletteReport> {
  const projectRoot = process.cwd()
  const allFiles: string[] = []

  for (const root of SCAN_ROOTS) {
    allFiles.push(...(await walk(path.join(projectRoot, root), projectRoot)))
  }

  const files: RawPaletteFileReport[] = []
  const familyCounts = new Map<string, number>()
  let totalInstances = 0

  for (const filePath of allFiles.sort()) {
    const source = await readFile(filePath, 'utf-8')
    const counts = new Map<string, number>()
    let match: RegExpExecArray | null
    RAW_CLASS_RE.lastIndex = 0

    while ((match = RAW_CLASS_RE.exec(source))) {
      const className = match[0]
      const family = match[2]
      counts.set(className, (counts.get(className) ?? 0) + 1)
      familyCounts.set(family, (familyCounts.get(family) ?? 0) + 1)
      totalInstances += 1
    }

    if (counts.size > 0) {
      const classes = [...counts.entries()]
        .map(([className, count]) => ({ className, count }))
        .sort((a, b) => b.count - a.count)
      const total = classes.reduce((sum, c) => sum + c.count, 0)
      files.push({
        file: path.relative(projectRoot, filePath),
        classes,
        total,
      })
    }
  }

  files.sort((a, b) => b.total - a.total)

  const byFamily = [...familyCounts.entries()]
    .map(([family, count]) => ({ family, count }))
    .sort((a, b) => b.count - a.count)

  return {
    files,
    totalInstances,
    totalFiles: files.length,
    byFamily,
  }
}

// --- Variant usage audit -------------------------------------------------
//
// Best-effort JSX scan: finds `<ComponentName ...>` opening tags and reads
// a `variant="x"` (or size="x") attribute out of the tag's attribute text.
// It does not parse JSX into an AST, so a variant built from a runtime
// expression (`variant={isError ? 'destructive' : 'primary'}`) won't be
// picked up — those show as "not statically detected" rather than a false
// "unused". Tags whose attributes span a literal `>` inside an expression
// (rare in this codebase) can also be missed. Good enough for a reference
// page whose job is to flag the obvious case: a variant nothing reaches for.

export interface VariantUsageReport {
  component: string
  prop: 'variant' | 'size'
  values: { value: string; count: number; isDefault: boolean }[]
}

function extractAttrValues(
  source: string,
  componentName: string,
  attr: 'variant' | 'size'
): string[] {
  const tagRe = new RegExp(`<${componentName}(?=[\\s/>])([^>]*)>`, 'gs')
  const found: string[] = []
  let m: RegExpExecArray | null

  while ((m = tagRe.exec(source))) {
    const attrs = m[1]
    const valMatch = new RegExp(`${attr}=(?:\\{?["'\`])([\\w-]+)(?:["'\`]\\}?)`).exec(attrs)
    found.push(valMatch ? valMatch[1] : '__default__')
  }

  return found
}

export async function scanVariantUsage(
  components: {
    component: string
    importedAs?: string
    variants: { prop: 'variant' | 'size'; values: string[]; defaultValue: string }[]
  }[]
): Promise<VariantUsageReport[]> {
  const projectRoot = process.cwd()
  const allFiles: string[] = []

  for (const root of SCAN_ROOTS) {
    allFiles.push(...(await walk(path.join(projectRoot, root), projectRoot)))
  }

  const sources = await Promise.all(allFiles.map((f) => readFile(f, 'utf-8')))

  const reports: VariantUsageReport[] = []

  for (const { component, importedAs, variants } of components) {
    const tagName = importedAs ?? component

    for (const { prop, values, defaultValue } of variants) {
      const counts = new Map(values.map((v) => [v, 0]))

      for (const source of sources) {
        for (const found of extractAttrValues(source, tagName, prop)) {
          const resolved = found === '__default__' ? defaultValue : found
          if (counts.has(resolved)) {
            counts.set(resolved, (counts.get(resolved) ?? 0) + 1)
          }
        }
      }

      reports.push({
        component,
        prop,
        values: values.map((value) => ({
          value,
          count: counts.get(value) ?? 0,
          isDefault: value === defaultValue,
        })),
      })
    }
  }

  return reports
}

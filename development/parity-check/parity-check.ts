#!/usr/bin/env -S node --require "./node_modules/tsx/dist/preflight.cjs" --import "./node_modules/tsx/dist/loader.mjs"

/**
 * parity-check.ts — AST-level parity check for moved selectors.
 *
 * For each (oldPath, symbol, newPath) entry in a moves manifest, fetches both
 * versions via `git show`, parses with @typescript-eslint/parser, and compares
 * the exported declaration's AST after stripping location/range/comment data.
 *
 * Usage:
 *   node --import tsx/esm development/parity-check/parity-check.ts \
 *     --manifest development/parity-check/pr-42441-moves.json \
 *     --old-ref main \
 *     --new-ref HEAD
 *
 * Exits 0 if all symbols match, 1 if any drift or missing symbol is found.
 */

import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parse } from '@typescript-eslint/parser'
import type { TSESTree } from '@typescript-eslint/types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SymbolKind = 'value' | 'type'

type SymbolMove = {
  symbol: string
  oldPath: string
  newPath: string
  kind?: SymbolKind
}

export type ParityResult =
  | { symbol: string; status: 'match' }
  | { symbol: string; status: 'drift'; notes: string[] }
  | { symbol: string; status: 'missing'; where: 'old' | 'new'; path: string }
  | { symbol: string; status: 'error'; message: string }

// ---------------------------------------------------------------------------
// Git helpers
// ---------------------------------------------------------------------------

function fetchAtRef(ref: string, path: string): string {
  try {
    return execSync(`git show "${ref}:${path}"`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    })
  } catch {
    return ''
  }
}

// ---------------------------------------------------------------------------
// AST helpers
// ---------------------------------------------------------------------------

function parseSource(source: string, filePath: string): TSESTree.Program | null {
  try {
    return parse(source, {
      sourceType: 'module',
      // Enable TS parsing even for .js files so JS selectors in selectors.js work
      jsx: filePath.endsWith('.tsx') || filePath.endsWith('.jsx'),
      loc: false,
      range: false,
    })
  } catch {
    return null
  }
}

function findExportedDeclaration(
  program: TSESTree.Program,
  symbol: string,
  kind: SymbolKind,
): TSESTree.Node | null {
  for (const node of program.body) {
    if (node.type !== 'ExportNamedDeclaration' || !node.declaration) continue
    const decl = node.declaration

    if (kind === 'type') {
      if (
        decl.type === 'TSTypeAliasDeclaration' &&
        decl.id.name === symbol
      ) {
        return decl.typeAnnotation
      }
      if (
        decl.type === 'TSInterfaceDeclaration' &&
        decl.id.name === symbol
      ) {
        return decl
      }
    } else {
      if (decl.type === 'VariableDeclaration') {
        for (const v of decl.declarations) {
          if (v.id.type === 'Identifier' && v.id.name === symbol) {
            return v.init ?? v
          }
        }
      }
      if (
        decl.type === 'FunctionDeclaration' &&
        decl.id?.name === symbol
      ) {
        return decl
      }
    }
  }
  return null
}

/**
 * Unwrap TypeScript-only expression nodes that have no runtime semantics.
 * `as Foo`, `x!`, `satisfies Foo`, `<Foo>x` all carry the same runtime value
 * as their inner expression.
 */
function stripTsWrappers(node: unknown): unknown {
  if (node === null || typeof node !== 'object') return node
  if (Array.isArray(node)) return node.map(stripTsWrappers)
  const obj = node as Record<string, unknown>
  if (
    obj['type'] === 'TSAsExpression' ||
    obj['type'] === 'TSNonNullExpression' ||
    obj['type'] === 'TSSatisfiesExpression' ||
    obj['type'] === 'TSTypeAssertion'
  ) {
    return stripTsWrappers(obj['expression'])
  }
  const result: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    result[k] = stripTsWrappers(v)
  }
  return result
}

/**
 * Canonicalize an AST node to a stable string.
 *
 * Strips: loc, range, parent, comments, TypeScript type annotations
 * (typeAnnotation, returnType, typeParameters), and TS-only expression
 * wrappers (TSAsExpression, TSNonNullExpression, etc.).
 *
 * Type constructs are expected to change when selectors move from JS to TS;
 * we compare runtime behavior only. Import paths are NOT stripped — a moved
 * selector calling a different helper surfaces as drift.
 */
function canonicalize(node: TSESTree.Node): string {
  const stripped = stripTsWrappers(node)
  return JSON.stringify(stripped, (key, value) => {
    if (
      key === 'loc' ||
      key === 'range' ||
      key === 'parent' ||
      key === 'comments' ||
      key === 'leadingComments' ||
      key === 'trailingComments' ||
      key === 'typeAnnotation' ||
      key === 'typeParameters' ||
      key === 'returnType' ||
      key === 'typeArguments'
    ) {
      return undefined
    }
    return value
  })
}

// ---------------------------------------------------------------------------
// Import diff helper
// ---------------------------------------------------------------------------

function extractImports(program: TSESTree.Program): string[] {
  return program.body
    .filter((n): n is TSESTree.ImportDeclaration => n.type === 'ImportDeclaration')
    .map((n) => n.source.value as string)
    .sort()
}

// ---------------------------------------------------------------------------
// Core parity check
// ---------------------------------------------------------------------------

export function checkParity(
  move: SymbolMove,
  oldRef: string,
  newRef: string,
): ParityResult {
  const kind: SymbolKind = move.kind ?? 'value'

  const oldSrc = fetchAtRef(oldRef, move.oldPath)
  if (!oldSrc) {
    return { symbol: move.symbol, status: 'missing', where: 'old', path: move.oldPath }
  }

  const newSrc = fetchAtRef(newRef, move.newPath)
  if (!newSrc) {
    return { symbol: move.symbol, status: 'missing', where: 'new', path: move.newPath }
  }

  const oldAst = parseSource(oldSrc, move.oldPath)
  const newAst = parseSource(newSrc, move.newPath)

  if (!oldAst) {
    return { symbol: move.symbol, status: 'error', message: `parse failed: ${move.oldPath}` }
  }
  if (!newAst) {
    return { symbol: move.symbol, status: 'error', message: `parse failed: ${move.newPath}` }
  }

  const oldNode = findExportedDeclaration(oldAst, move.symbol, kind)
  const newNode = findExportedDeclaration(newAst, move.symbol, kind)

  if (!oldNode) {
    return { symbol: move.symbol, status: 'missing', where: 'old', path: move.oldPath }
  }
  if (!newNode) {
    return { symbol: move.symbol, status: 'missing', where: 'new', path: move.newPath }
  }

  const oldCanon = canonicalize(oldNode)
  const newCanon = canonicalize(newNode)

  if (oldCanon === newCanon) {
    return { symbol: move.symbol, status: 'match' }
  }

  // Drift detected — annotate with import diff to help reviewer judge
  const notes: string[] = ['structural AST difference after stripping loc/range/comments']
  const oldImports = extractImports(oldAst)
  const newImports = extractImports(newAst)
  const addedImports = newImports.filter((i) => !oldImports.includes(i))
  const removedImports = oldImports.filter((i) => !newImports.includes(i))
  if (addedImports.length > 0) {
    notes.push(`new file imports added: ${addedImports.join(', ')}`)
  }
  if (removedImports.length > 0) {
    notes.push(`old file imports removed: ${removedImports.join(', ')}`)
  }

  return { symbol: move.symbol, status: 'drift', notes }
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

function parseArgs(): { manifest: string; oldRef: string; newRef: string } {
  const args = process.argv.slice(2)
  const get = (flag: string, fallback: string): string => {
    const idx = args.indexOf(flag)
    return idx !== -1 && args[idx + 1] ? args[idx + 1] : fallback
  }
  return {
    manifest: get('--manifest', 'development/parity-check/pr-42441-moves.json'),
    oldRef: get('--old-ref', 'main'),
    newRef: get('--new-ref', 'HEAD'),
  }
}

function main() {
  const { manifest, oldRef, newRef } = parseArgs()
  const moves: SymbolMove[] = JSON.parse(readFileSync(resolve(manifest), 'utf-8'))

  console.log(`\nParity check: ${oldRef} → ${newRef}`)
  console.log(`Manifest: ${manifest} (${moves.length} symbols)\n`)

  let pass = 0
  let fail = 0
  const rows: string[] = []

  for (const move of moves) {
    const result = checkParity(move, oldRef, newRef)
    if (result.status === 'match') {
      pass++
      rows.push(`  ✓ ${result.symbol}`)
    } else if (result.status === 'drift') {
      fail++
      rows.push(`  ✗ ${result.symbol}  [DRIFT]`)
      for (const note of result.notes) {
        rows.push(`      ${note}`)
      }
    } else if (result.status === 'missing') {
      fail++
      rows.push(`  ✗ ${result.symbol}  [MISSING on ${result.where}] ${result.path}`)
    } else {
      fail++
      rows.push(`  ✗ ${result.symbol}  [ERROR] ${result.message}`)
    }
  }

  for (const row of rows) {
    console.log(row)
  }

  console.log(`\n${pass}/${moves.length} match`)
  process.exit(fail > 0 ? 1 : 0)
}

main()

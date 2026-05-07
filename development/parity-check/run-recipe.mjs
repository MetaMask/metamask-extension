#!/usr/bin/env node
/**
 * run-recipe.mjs — thin runner for development/parity-check/recipe-pr-42441.json
 *
 * Dispatches each node in the recipe sequentially, captures output, and writes:
 *   - recipe-run.json       structured results
 *   - recipe-issues.md      human-readable summary
 *
 * Usage:
 *   node development/parity-check/run-recipe.mjs [--recipe <path>] [--out <dir>]
 */

import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve, join } from 'node:path'

const args = process.argv.slice(2)
const getArg = (flag, fallback) => {
  const idx = args.indexOf(flag)
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : fallback
}

const recipePath = getArg('--recipe', 'development/parity-check/recipe-pr-42441.json')
const outDir = getArg('--out', 'development/parity-check/run-artifacts')

const recipe = JSON.parse(readFileSync(resolve(recipePath), 'utf-8'))
const nodes = recipe.validate.workflow.nodes
mkdirSync(resolve(outDir), { recursive: true })

const results = []
let currentNode = recipe.validate.workflow.entry
let allPassed = true

console.log(`\nRecipe: ${recipe.title}`)
console.log(`PR: ${recipe.pr}`)
console.log('─'.repeat(60))

while (currentNode && currentNode !== 'done') {
  const node = nodes[currentNode]
  if (!node) break
  if (node.action === 'end') break

  const startMs = Date.now()
  console.log(`\n[${currentNode}] ${node.note ?? ''}`)

  let stdout = ''
  let stderr = ''
  let exitCode = 0

  try {
    const out = execSync(node.cmd, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: resolve('.'),
    })
    stdout = out
  } catch (err) {
    exitCode = err.status ?? 1
    stdout = err.stdout ?? ''
    stderr = err.stderr ?? ''
  }

  const durationMs = Date.now() - startMs

  // Evaluate assertion
  let passed = false
  const assert = node.assert
  if (assert.operator === 'exit_code') {
    passed = exitCode === assert.value
  } else if (assert.operator === 'output_empty') {
    passed = stdout.trim() === ''
  }

  const status = passed ? 'PASS' : 'FAIL'
  if (!passed) allPassed = false

  console.log(`  ${passed ? '✓' : '✗'} ${status} (${durationMs}ms)`)
  if (!passed && stdout.trim()) {
    console.log(`  stdout: ${stdout.slice(0, 500)}`)
  }
  if (!passed && stderr.trim()) {
    console.log(`  stderr: ${stderr.slice(0, 500)}`)
  }

  results.push({
    node: currentNode,
    status,
    durationMs,
    exitCode,
    stdout: stdout.slice(0, 2000),
    stderr: stderr.slice(0, 2000),
    note: node.note,
  })

  currentNode = node.next
}

// Write structured results
const runJson = {
  title: recipe.title,
  pr: recipe.pr,
  runAt: new Date().toISOString(),
  overall: allPassed ? 'PASS' : 'FAIL',
  nodes: results,
}
const runJsonPath = join(outDir, 'recipe-run.json')
writeFileSync(resolve(runJsonPath), JSON.stringify(runJson, null, 2))

// Write markdown summary
const md = [
  `# Recipe run: ${recipe.title}`,
  ``,
  `**PR:** ${recipe.pr}`,
  `**Result:** ${allPassed ? '✅ PASS' : '❌ FAIL'}`,
  `**Run at:** ${runJson.runAt}`,
  ``,
  `## Node results`,
  ``,
  `| Node | Status | Duration | Note |`,
  `|------|--------|----------|------|`,
  ...results.map(
    (r) =>
      `| \`${r.node}\` | ${r.status === 'PASS' ? '✅' : '❌'} ${r.status} | ${r.durationMs}ms | ${r.note ?? ''} |`,
  ),
  ``,
]

const failures = results.filter((r) => r.status === 'FAIL')
if (failures.length > 0) {
  md.push(`## Failures`, ``)
  for (const f of failures) {
    md.push(`### \`${f.node}\``, ``)
    if (f.stdout.trim()) md.push('```', f.stdout.slice(0, 1000), '```', '')
    if (f.stderr.trim()) md.push('**stderr:**', '```', f.stderr.slice(0, 1000), '```', '')
  }
}

const mdPath = join(outDir, 'recipe-issues.md')
writeFileSync(resolve(mdPath), md.join('\n'))

console.log(`\n${'─'.repeat(60)}`)
console.log(`Overall: ${allPassed ? '✅ PASS' : '❌ FAIL'}`)
console.log(`Artifacts: ${outDir}/`)
process.exit(allPassed ? 0 : 1)

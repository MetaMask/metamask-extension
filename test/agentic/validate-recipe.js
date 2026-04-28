'use strict';

/**
 * validate-recipe.js — Main recipe runner for MetaMask Extension.
 *
 * CLI: node validate-recipe.js --recipe <path> [options]
 *
 * Executes workflow-format JSON recipe files deterministically with zero LLM calls.
 * All recipes use validate.workflow (graph-based).
 */

const { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } = require('node:fs');
const { resolve, dirname, join, relative, sep } = require('node:path');

const { checkAssert, evaluateAssert, parseRaw } = require('./lib/assert');
const { normalizeWorkflowDocument, normalizePlayback, renderWorkflowMermaid, detectWorkflowCycles, findUnreachableNodes, findMissingTargets } = require('./lib/workflow');
const { renderTemplate, renderRuntimeVars } = require('./lib/catalog');
const { executeNodeAction, loadEvalRefs, waitForAdvance } = require('./lib/ext-bridge');
const { runPreConditions } = require('./lib/pre-condition-runner');
const { bootstrapSession, bootstrapCdpSession } = require('./lib/session-bootstrap');
const {
  applyAllowlist: applyIssueAllowlist,
  computeReview: computeIssueReview,
  normalizeFromCdpMessages,
  writeArtifacts: writeIssueArtifacts,
} = require('./lib/recipe-issues');

const AUTO_ISSUES_PROBE = '__auto_issues';

// ── CLI arg parsing ─────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  const result = {
    recipe: '',
    dryRun: false,
    stepMode: false,
    slowMs: null,
    skipManual: false,
    cdpPort: null,
    closeCdpBrowser: false,
    noHud: false,
    account: null,
    testnet: null,
    artifactsDir: null,
    team: null,
    domain: null,
    recipesDir: null,
    params: {},
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--recipe':
        result.recipe = args[++i] || '';
        break;
      case '--dry-run':
        result.dryRun = true;
        break;
      case '--step':
        result.stepMode = true;
        break;
      case '--slow': {
        const ms = parseInt(args[++i] || '', 10);
        if (!Number.isNaN(ms) && ms > 0) result.slowMs = ms;
        break;
      }
      case '--skip-manual':
        result.skipManual = true;
        break;
      case '--no-hud':
        result.noHud = true;
        break;
      case '--cdp-port': {
        const port = parseInt(args[++i] || '', 10);
        if (!Number.isNaN(port)) result.cdpPort = port;
        break;
      }
      case '--close-cdp-browser':
        result.closeCdpBrowser = true;
        break;
      case '--account':
        result.account = args[++i] || null;
        break;
      case '--testnet':
        result.testnet = true;
        break;
      case '--artifacts-dir':
        result.artifactsDir = args[++i] || null;
        break;
      case '--team':
        result.team = args[++i] || null;
        break;
      case '--domain':
        result.domain = args[++i] || null;
        break;
      case '--recipes-dir':
        result.recipesDir = args[++i] || null;
        break;
      case '--param': {
        const kv = args[++i] || '';
        const eqIdx = kv.indexOf('=');
        if (eqIdx > 0) result.params[kv.slice(0, eqIdx)] = kv.slice(eqIdx + 1);
        break;
      }
      default:
        if (!result.recipe && !args[i].startsWith('--')) {
          result.recipe = args[i];
        }
    }
  }

  return result;
}

// ── Recipe loading ──────────────────────────────────────────────────

function resolveTaskArtifactsDir(recipePath) {
  const normalized = resolve(recipePath);
  const marker = `${sep}artifacts${sep}`;
  const idx = normalized.lastIndexOf(marker);
  if (idx < 0) return join(dirname(recipePath), '..', '..', 'artifacts');
  return normalized.slice(0, idx + marker.length - 1);
}

function pathRelative(from, to) {
  return relative(from, to);
}

function relativizeArtifactPaths(value, artifactsDir) {
  if (!value) return value;
  if (typeof value === 'string') {
    if (value.startsWith(artifactsDir)) {
      return pathRelative(artifactsDir, value).split(sep).join('/');
    }
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((entry) => relativizeArtifactPaths(entry, artifactsDir));
  }
  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, relativizeArtifactPaths(entry, artifactsDir)]),
    );
  }
  return value;
}

function writeLatestValidRunPointer(taskArtifactsDir, artifactsDir) {
  const relativeArtifactRoot = pathRelative(taskArtifactsDir, artifactsDir) || '.';
  const normalizedRelativeRoot = relativeArtifactRoot.split(sep).join('/');
  const pointer = {
    version: 1,
    runId: normalizedRelativeRoot.startsWith('recipe-runs/')
      ? normalizedRelativeRoot.slice('recipe-runs/'.length).split('/')[0]
      : 'current-artifacts',
    relativeArtifactRoot: normalizedRelativeRoot,
    updatedAt: new Date().toISOString(),
  };
  writeFileSync(
    join(taskArtifactsDir, 'latest-valid-recipe-run.json'),
    `${JSON.stringify(pointer, null, 2)}\n`,
  );
}


function loadRecipe(filePath) {
  if (!existsSync(filePath)) throw new Error(`Recipe file not found: ${filePath}`);
  const raw = JSON.parse(readFileSync(filePath, 'utf-8'));

  if (!raw.title || typeof raw.title !== 'string') {
    throw new Error('Recipe must have a "title" string');
  }

  if (!raw.validate?.workflow || typeof raw.validate.workflow !== 'object') {
    throw new Error('Recipe must have "validate.workflow" object');
  }

  return raw;
}

// ── Reporting ────────────────────────────────────────────────────────

function printNodeResult(nodeId, passed, durationMs, error) {
  const icon = passed ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m';
  process.stdout.write(`  [${icon}] ${nodeId} (${durationMs}ms)\n`);
  if (error) process.stdout.write(`         ${error}\n`);
}

function printSummary(passed, failed, totalMs) {
  const total = passed + failed;
  const color = failed > 0 ? '\x1b[31m' : '\x1b[32m';
  process.stdout.write(`\n${color}${passed}/${total} passed\x1b[0m in ${totalMs}ms\n`);
}

// ── Pre-condition registry loading ──────────────────────────────────

function loadPreConditionRegistries(recipesDir) {
  const registries = [];
  const collectionsDir = existsSync(join(recipesDir, 'domains')) ? 'domains' : 'teams';
  const domainsRoot = join(recipesDir, collectionsDir);
  if (!existsSync(domainsRoot)) return registries;
  for (const entry of readdirSync(domainsRoot)) {
    const dir = join(domainsRoot, entry);
    try {
      if (statSync(dir).isDirectory()) {
        const mod = require(join(dir, 'pre-conditions'));
        if (mod.REGISTRY) registries.push(mod.REGISTRY);
      }
    } catch {}
  }
  return registries;
}

// ── Initial conditions ──────────────────────────────────────────────

async function applyInitialConditions(conditions, ctx) {
  if (!conditions) return;
  process.stdout.write('\nInitial conditions:\n');

  if (conditions.account) {
    await executeNodeAction({ id: 'ic-account', action: 'select_account', address: String(conditions.account) }, ctx);
    process.stdout.write(`  [OK] account -> ${conditions.account}\n`);
  }

  if (conditions.testnet !== undefined) {
    const page = ctx.getPage();
    const current = await page.evaluate(
      '(function(){return stateHooks.store.getState().metamask.isTestnet??false})()',
    );
    if (Boolean(current) !== Boolean(conditions.testnet)) {
      await executeNodeAction({ id: 'ic-testnet', action: 'toggle_testnet' }, ctx);
    }
    process.stdout.write(`  [OK] testnet -> ${conditions.testnet}\n`);
  }

  if (conditions.provider) {
    await executeNodeAction({ id: 'ic-provider', action: 'switch_provider', provider: String(conditions.provider) }, ctx);
    process.stdout.write(`  [OK] provider -> ${conditions.provider}\n`);
  }
}

// ── HUD overlay ────────────────────────────────────────────────────
// Bottom-bar overlay rendered inside the extension's home.html that shows
// the currently-executing recipe node. Self-healing: hudUpdate re-creates
// the element if a navigation wiped it (Page.navigate replaces document.body).

function buildBreadcrumb(nodeId, breadcrumbData) {
  if (!breadcrumbData) return null;
  const { traversal = [], nodes = {} } = breadcrumbData;
  const currentIdx = traversal.lastIndexOf(nodeId);
  const prevCount = Math.min(2, Math.max(0, currentIdx));
  const prev = currentIdx > 0
    ? traversal.slice(currentIdx - prevCount, currentIdx)
    : [];
  const hasEarlier = currentIdx > prevCount;
  const seen = new Set([nodeId, ...prev]);
  const next = [];
  const nextHop = (id) => {
    const nd = nodes[id];
    if (!nd) return null;
    if (nd.action === 'switch') return nd.default || null;
    return nd.next || null;
  };
  let n = nextHop(nodeId);
  while (n && next.length < 2 && nodes[n] && !seen.has(n)) {
    next.push(n);
    seen.add(n);
    n = nextHop(n);
  }
  const hasLater = Boolean(n) && !seen.has(n);
  return { prev, current: nodeId, next, hasEarlier, hasLater };
}

async function hudUpdate(ctx, nodeId, description, breadcrumbData) {
  const page = ctx.getPage();
  if (!page) {
    process.stdout.write('  [hud] no active page — skipping\n');
    return;
  }

  // Self-healing Next-button binding: Playwright persists exposeFunction across
  // navigations, but CDP Runtime.addBinding does not. Re-call on every hudUpdate
  // and swallow the "already registered" error so the binding is robust either way.
  if (ctx.playback?.mode === 'step' && !ctx.noHud) {
    try {
      await page.exposeFunction('__recipeStepNext__', () => {
        const advance = ctx.__stepAdvance;
        if (advance) {
          advance();
        } else {
          ctx.__stepPending = true;
        }
      });
    } catch (_) {
      // Already bound on this page — fine, binding still valid.
    }
  }

  const breadcrumb = buildBreadcrumb(nodeId, breadcrumbData);
  const mode = ctx.playback?.mode || 'off';
  const showButton = mode === 'step' && !ctx.noHud;

  try {
    await page.evaluate(([id, desc, crumb, playbackMode, showBtn]) => {
      const expanded = playbackMode === 'step';
      let el = document.getElementById('recipe-hud');
      if (!el) {
        el = document.createElement('div');
        el.id = 'recipe-hud';
        Object.assign(el.style, {
          position: 'fixed',
          bottom: '0',
          left: '0',
          right: '0',
          zIndex: '2147483647',
          pointerEvents: 'none',
          fontFamily: 'ui-monospace, Menlo, Consolas, monospace',
          boxShadow: '0 -2px 8px rgba(0,0,0,0.4)',
          transition: 'padding 120ms ease, background 120ms ease',
        });
        document.body.appendChild(el);
      }
      // HUD structure differs by mode — rebuild only when mode flips to avoid DOM churn.
      const prevMode = el.dataset.mode;
      if (prevMode !== playbackMode) {
        el.dataset.mode = playbackMode;
        if (expanded) {
          el.innerHTML =
            '<div id="hud-prev" style="color:#888;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:4px"></div>' +
            '<div style="display:flex;align-items:center;gap:10px">' +
              '<span id="hud-id" style="color:#00FF88;font-size:18px;font-weight:700;letter-spacing:0.3px;white-space:nowrap"></span>' +
              '<span id="hud-desc" style="color:#eee;font-size:15px;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"></span>' +
              '<button id="hud-next" style="pointer-events:auto;background:#00FF88;color:#000;border:0;border-radius:4px;padding:8px 18px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit" onclick="window.__recipeStepNext__ && window.__recipeStepNext__()">Next →</button>' +
            '</div>' +
            '<div id="hud-next-list" style="color:#888;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:4px"></div>';
        } else {
          el.innerHTML =
            '<div style="display:flex;align-items:center;gap:10px">' +
              '<span id="hud-id" style="color:#00FF88;font-size:14px;font-weight:700"></span>' +
              '<span id="hud-desc" style="color:#cccccc;font-size:13px;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"></span>' +
            '</div>';
        }
      }
      // Apply mode-specific container styles on every update so navigations with
      // a rebuilt element also get correct sizing.
      if (expanded) {
        el.style.background = 'rgba(0,0,0,0.92)';
        el.style.padding = '12px 20px';
      } else {
        el.style.background = 'rgba(0,0,0,0.85)';
        el.style.padding = '6px 12px';
      }

      const idEl = document.getElementById('hud-id');
      const descEl = document.getElementById('hud-desc');
      const btnEl = document.getElementById('hud-next');
      if (idEl) idEl.textContent = id;
      if (descEl) descEl.textContent = desc;
      if (btnEl) btnEl.style.display = showBtn ? 'inline-block' : 'none';

      if (expanded && crumb) {
        const esc = (s) => String(s)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
        const prevEl = document.getElementById('hud-prev');
        const nextListEl = document.getElementById('hud-next-list');
        if (prevEl) {
          const parts = [];
          if (crumb.hasEarlier) parts.push('…');
          crumb.prev.forEach((p) => parts.push(esc(p)));
          prevEl.innerHTML = parts.length ? '◁ ' + parts.join(' → ') : '&nbsp;';
        }
        if (nextListEl) {
          const parts = [];
          crumb.next.forEach((nx) => parts.push(esc(nx)));
          if (crumb.hasLater) parts.push('…');
          nextListEl.innerHTML = parts.length ? '▷ ' + parts.join(' → ') : '&nbsp;';
        }
      }
    }, [nodeId, description || nodeId, breadcrumb, mode, showButton]);
  } catch (err) {
    process.stdout.write(`  [hud] update failed: ${err.message || err}\n`);
  }
}

async function hudInit(ctx) {
  // Delegates to hudUpdate so we have one source of truth for the element shape.
  await hudUpdate(ctx, 'init', 'recipe starting');
}

async function hudClear(ctx) {
  const page = ctx.getPage();
  if (!page) return;
  try {
    await page.evaluate(() => {
      const el = document.getElementById('recipe-hud');
      if (el) el.remove();
    });
  } catch (err) {
    process.stdout.write(`  [hud] clear failed: ${err.message || err}\n`);
  }
}

// ── Workflow graph execution ────────────────────────────────────────

async function executeWorkflow(doc, ctx) {
  const normalized = normalizeWorkflowDocument(doc, { sourcePath: '' });
  const workflow = normalized.workflow;

  // Vars available to all phases (setup, main, teardown) via renderRuntimeVars
  const trace = [];
  const vars = {};

  // Execute setup hooks (linear)
  if (normalized.hooks.setup.length > 0) {
    process.stdout.write('\nSetup:\n');
    for (const step of normalized.hooks.setup) {
      const start = Date.now();
      const resolved = renderRuntimeVars({ ...step, id: step.id || 'setup' }, vars);
      const result = await executeNodeAction(resolved, ctx);
      printNodeResult(step.id || 'setup', result.ok, Date.now() - start, result.ok ? undefined : result.error);
      if (resolved.save_as && result.ok) {
        vars[resolved.save_as] = parseRaw(result.raw);
      }
      if (!result.ok) {
        return { raw: null, ok: false, error: `Setup failed at "${step.id}": ${result.error}` };
      }
    }
  }

  // Traverse graph
  let currentNodeId = workflow.entry;
  let passed = 0;
  let failed = 0;
  const traversal = [];
  const breadcrumbData = { entry: workflow.entry, traversal, nodes: workflow.nodes };
  if (!ctx.noHud) await hudInit(ctx);

  while (currentNodeId) {
    const node = workflow.nodes[currentNodeId];
    if (!node) {
      failed++;
      printNodeResult(currentNodeId, false, 0, `Node "${currentNodeId}" not found`);
      break;
    }

    // End node
    if (node.action === 'end') {
      const endStatus = node.status || 'pass';
      trace.push({ id: currentNodeId, action: 'end', status: endStatus, durationMs: 0 });
      if (endStatus === 'fail') {
        failed++;
        printNodeResult(currentNodeId, false, 0, node.message || 'Workflow ended with fail');
      }
      break;
    }

    // Switch node
    if (node.action === 'switch') {
      let nextId = node.default || '';
      const execCtx = { env: {}, inputs: ctx.params, vars, last: trace.length > 0 ? trace[trace.length - 1] : null };

      if (Array.isArray(node.cases)) {
        for (const c of node.cases) {
          if (c.when && evaluateAssert(execCtx, c.when)) {
            nextId = c.next || '';
            break;
          }
        }
      }

      trace.push({ id: currentNodeId, action: 'switch', next: nextId, durationMs: 0 });
      currentNodeId = nextId;
      continue;
    }

    // Guard: when / unless
    if (node.when) {
      const execCtx = { env: {}, inputs: ctx.params, vars, last: trace.length > 0 ? trace[trace.length - 1] : null };
      if (!evaluateAssert(execCtx, node.when)) {
        trace.push({ id: currentNodeId, action: node.action, skipped: true, reason: 'when guard', durationMs: 0 });
        currentNodeId = node.next || '';
        continue;
      }
    }

    if (node.unless) {
      const execCtx = { env: {}, inputs: ctx.params, vars, last: trace.length > 0 ? trace[trace.length - 1] : null };
      if (evaluateAssert(execCtx, node.unless)) {
        trace.push({ id: currentNodeId, action: node.action, skipped: true, reason: 'unless guard', durationMs: 0 });
        currentNodeId = node.next || '';
        continue;
      }
    }

    // Execute the node action
    traversal.push(currentNodeId);
    if (!ctx.noHud) await hudUpdate(ctx, currentNodeId, node.action, breadcrumbData);

    // Playback pause — auto-mode delay or step-mode wait. Skip for 'manual' nodes:
    // handleManual has its own stdin wait, so the global pause would cause two
    // Enter-presses per node in step-mode.
    if (node.action !== 'manual' && ctx.playback && ctx.playback.mode !== 'off') {
      await waitForAdvance(ctx);
    }

    const start = Date.now();
    const resolvedNode = renderRuntimeVars(node, vars);
    const result = await executeNodeAction(resolvedNode, ctx);
    const duration = Date.now() - start;
    // Re-inject HUD after the action — navigation-heavy actions (navigate,
    // ext_navigate_hash, call-ing flows that navigate) replace document.body
    // and wipe the HUD. Self-healing hudUpdate re-creates it if missing.
    if (!ctx.noHud) await hudUpdate(ctx, currentNodeId, node.action, breadcrumbData);

    // save_as
    if (resolvedNode.save_as && result.ok) {
      vars[resolvedNode.save_as] = parseRaw(result.raw);
    }

    // Assert
    let nodePassed = result.ok;
    if (node.assert && result.ok) {
      const assertPassed = checkAssert(result.raw, node.assert);
      if (!assertPassed) {
        nodePassed = false;
        result.error = `Assertion failed: ${JSON.stringify(node.assert)} on ${JSON.stringify(result.raw)}`;
      }
    }

    if (nodePassed) {
      passed++;
    } else {
      failed++;
    }
    printNodeResult(currentNodeId, nodePassed, duration, nodePassed ? undefined : result.error);
    trace.push({
      id: currentNodeId,
      action: node.action,
      ok: nodePassed,
      raw: relativizeArtifactPaths(result.raw, ctx.artifactsDir),
      durationMs: duration,
      error: result.error,
    });

    if (!nodePassed) break;

    currentNodeId = node.next || '';
  }

  if (!ctx.noHud) await hudClear(ctx);

  // Execute teardown hooks (always, even on failure)
  if (normalized.hooks.teardown.length > 0) {
    process.stdout.write('\nTeardown:\n');
    for (const step of normalized.hooks.teardown) {
      const start = Date.now();
      const resolved = renderRuntimeVars({ ...step, id: step.id || 'teardown' }, vars);
      const result = await executeNodeAction(resolved, ctx);
      printNodeResult(step.id || 'teardown', result.ok, Date.now() - start, result.ok ? undefined : result.error);
    }
  }

  return { raw: { passed, failed, trace, vars }, ok: failed === 0, trace };
}

// ── Artifacts ────────────────────────────────────────────────────────

function writeArtifacts(artifactsDir, normalized, trace, passed, failed, totalMs, issueReview) {
  mkdirSync(artifactsDir, { recursive: true });

  try {
    const mmd = renderWorkflowMermaid(normalized);
    writeFileSync(join(artifactsDir, 'workflow.mmd'), mmd);
  } catch {}

  writeFileSync(join(artifactsDir, 'trace.json'), JSON.stringify(trace, null, 2));

  const summary = {
    title: normalized.title,
    passed,
    failed,
    total: passed + failed,
    durationMs: totalMs,
    status: failed > 0 ? 'fail' : 'pass',
  };
  if (issueReview) {
    summary.recipeIssues = {
      review: {
        status: issueReview.status,
        note: issueReview.note,
        observed: issueReview.observed,
        gating: issueReview.gating,
        informational: issueReview.informational,
        artifactFiles: issueReview.artifactFiles,
      },
    };
  }
  writeFileSync(join(artifactsDir, 'summary.json'), JSON.stringify(summary, null, 2));

  writeFileSync(join(artifactsDir, 'workflow.json'), JSON.stringify(normalized, null, 2));
}

// ── Dry run ─────────────────────────────────────────────────────────

function dryRun(doc) {
  const normalized = normalizeWorkflowDocument(doc);
  const workflow = normalized.workflow;

  process.stdout.write('\n--- DRY RUN ---\n');
  process.stdout.write(`Entry: ${workflow.entry}\n`);

  for (const [nodeId, node] of Object.entries(workflow.nodes)) {
    const nextStr = node.next ? ` -> ${node.next}` : '';
    const guardStr = node.when ? ' [when]' : node.unless ? ' [unless]' : '';
    process.stdout.write(`  ${nodeId}: ${node.action}${guardStr}${nextStr}\n`);

    if (node.action === 'switch' && Array.isArray(node.cases)) {
      for (const c of node.cases) {
        process.stdout.write(`    case "${c.label || ''}": -> ${c.next}\n`);
      }
      if (node.default) {
        process.stdout.write(`    default: -> ${node.default}\n`);
      }
    }
  }

  const cycles = detectWorkflowCycles(workflow);
  const unreachable = findUnreachableNodes(workflow);
  const missing = findMissingTargets(workflow);

  if (cycles.length > 0) {
    process.stdout.write(`\nWARNING: ${cycles.length} cycle(s) detected\n`);
    for (const cycle of cycles) process.stdout.write(`  ${cycle.join(' -> ')}\n`);
  }
  if (unreachable.length > 0) {
    process.stdout.write(`\nWARNING: ${unreachable.length} unreachable node(s): ${unreachable.join(', ')}\n`);
  }
  if (missing.length > 0) {
    process.stdout.write(`\nWARNING: ${missing.length} missing target(s)\n`);
    for (const edge of missing) process.stdout.write(`  ${edge.from} -> ${edge.to}\n`);
  }

  try {
    const mmd = renderWorkflowMermaid(normalized);
    process.stdout.write(`\nMermaid:\n${mmd}\n`);
  } catch {}

  process.stdout.write('\nDry run complete. No browser actions taken.\n');
}

// ── Main execution ──────────────────────────────────────────────────

async function main() {
  const cli = parseArgs();

  if (!cli.recipe) {
    process.stderr.write(
      'Usage: node validate-recipe.js --recipe <path> [--dry-run] [--step] [--slow <ms>] [--skip-manual] [--cdp-port <port>] [--close-cdp-browser] [--domain <name>] [--team <name>] [--recipes-dir <path>] [--param key=val] [--no-hud] [--account <addr>] [--testnet] [--artifacts-dir <dir>]\n',
    );
    process.exit(1);
  }

  const recipePath = resolve(cli.recipe);
  const pathParts = recipePath.split('/');
  const flowsIdx = pathParts.lastIndexOf('flows');
  const recipesIdx = pathParts.lastIndexOf('recipes');
  const domainsIdx = pathParts.lastIndexOf('domains');
  const teamsIdx = pathParts.lastIndexOf('teams');
  // --recipes-dir overrides auto-detection; fall back to path inference
  const recipesDir = cli.recipesDir
    ? resolve(cli.recipesDir)
    : domainsIdx > 0
      ? pathParts.slice(0, domainsIdx).join('/')
      : teamsIdx > 0
        ? pathParts.slice(0, teamsIdx).join('/')
      : recipesIdx > 0
        ? pathParts.slice(0, recipesIdx + 1).join('/')
        : resolve(__dirname); // fall back to the runner's own directory
  const collectionsDirName = existsSync(join(recipesDir, 'domains')) ? 'domains' : 'teams';
  const selectedDomain = cli.domain || cli.team;
  // --domain/--team overrides auto-detection from the recipe path
  const teamDir = selectedDomain
    ? join(recipesDir, collectionsDirName, selectedDomain)
    : flowsIdx > 0
      ? pathParts.slice(0, flowsIdx).join('/')
      : join(recipesDir, collectionsDirName, 'extension-core'); // safe default

  const rawRecipe = loadRecipe(recipePath);
  process.stdout.write(`\nRecipe: ${rawRecipe.title}\n`);

  // CLI overrides for initial conditions
  if (cli.account) {
    rawRecipe.initial_conditions = rawRecipe.initial_conditions || {};
    rawRecipe.initial_conditions.account = cli.account;
  }
  if (cli.testnet !== null) {
    rawRecipe.initial_conditions = rawRecipe.initial_conditions || {};
    rawRecipe.initial_conditions.testnet = cli.testnet;
  }

  // Template substitution
  const inputs = rawRecipe.inputs || {};
  const mergedParams = { ...Object.fromEntries(
    Object.entries(inputs).filter(([, v]) => v.default != null).map(([k, v]) => [k, String(v.default)])
  ), ...cli.params };
  const recipe = renderTemplate(rawRecipe, mergedParams);

  // Dry run
  if (cli.dryRun) {
    dryRun(recipe);
    process.exit(0);
  }

  // Bootstrap session
  let weLaunched = false;
  let callHandler;
  let sessionManager;

  if (cli.cdpPort !== null) {
    process.stdout.write(`\nConnecting to existing browser via CDP on port ${cli.cdpPort}...\n`);
    const cdpResult = await bootstrapCdpSession(cli.cdpPort);
    callHandler = cdpResult.callHandler;
    sessionManager = cdpResult.sessionManager;
  } else {
    const result = bootstrapSession();
    callHandler = result.callHandler;
    sessionManager = result.sessionManager;

    if (!sessionManager.hasActiveSession()) {
      process.stdout.write('\nLaunching browser session...\n');
      await callHandler('mm_launch', {});
      weLaunched = true;
    }
  }

  // Load eval refs — always load from all teams so recipes work regardless of location
  const teamsRoot = join(recipesDir, collectionsDirName);
  let evalRegistry = {};
  if (existsSync(teamsRoot)) {
    for (const entry of readdirSync(teamsRoot)) {
      const dir = join(teamsRoot, entry);
      try { if (statSync(dir).isDirectory()) Object.assign(evalRegistry, loadEvalRefs(dir)); } catch {}
    }
  }
  // Explicit --domain/--team takes precedence (overrides any same-key ref from other domains)
  if (selectedDomain) {
    Object.assign(evalRegistry, loadEvalRefs(join(recipesDir, collectionsDirName, selectedDomain)));
  }

  const sessionState = sessionManager.getSessionState();
  const extensionId = sessionState?.extensionId || '';

  // Resolve artifactsDir early so per-node handlers (e.g. cdp_probe stop)
  // can write durable artifacts even when the main workflow fails before
  // reaching the final assertion node.
  const taskArtifactsDir = resolveTaskArtifactsDir(recipePath);
  const artifactsDir = cli.artifactsDir || taskArtifactsDir;
  if (typeof sessionManager.setArtifactsDir === 'function') {
    sessionManager.setArtifactsDir(artifactsDir);
  }

  // Resolve playback: CLI overrides recipe defaults. --slow forces auto mode;
  // --step forces step mode. Recipe-level playback supplies the baseline.
  const recipePlayback = normalizePlayback(recipe.validate?.workflow?.playback);
  let playback = recipePlayback;
  if (cli.slowMs != null) {
    playback = { mode: 'auto', slow_ms: cli.slowMs };
  } else if (cli.stepMode) {
    playback = { mode: 'step', slow_ms: recipePlayback.slow_ms };
  }

  // Build context
  const ctx = {
    callHandler,
    extensionId,
    recipesDir,
    teamDir,
    domainsDirName: collectionsDirName,
    evalRegistry,
    params: cli.params,
    inputs,
    skipManual: cli.skipManual,
    noHud: cli.noHud,
    playback,
    callStack: new Set(),
    sessionManager,
    artifactsDir,
    taskArtifactsDir,
    getPage: () => sessionManager.getPage(),
    getContext: () => sessionManager.getContext(),
    executeWorkflow: (doc, subCtx) => executeWorkflow(doc, subCtx),
  };

  // Start always-on issue collector. Captures Runtime.consoleAPICalled and
  // Runtime.exceptionThrown across sw + home for the whole run, including
  // pre-conditions and teardown. Stopped + flushed to artifacts below.
  let autoIssuesStarted = false;
  try {
    await sessionManager.startCdpProbe({ name: AUTO_ISSUES_PROBE, scope: 'both' });
    autoIssuesStarted = true;
  } catch (err) {
    process.stderr.write(`[auto-issues] start failed: ${err?.message || err}\n`);
  }

  // Pre-conditions
  const preConditions = recipe.validate.workflow.pre_conditions;

  if (preConditions && preConditions.length > 0) {
    process.stdout.write('\nPre-conditions:\n');
    const registries = loadPreConditionRegistries(recipesDir);
    const preContext = {
      getPage: () => sessionManager.getPage(),
      getContext: () => sessionManager.getContext(),
      extensionId,
    };
    const preResult = await runPreConditions(preConditions, registries, callHandler, preContext);

    for (const r of preResult.results) {
      const icon = r.pass ? '\x1b[32mOK\x1b[0m' : '\x1b[31mFAIL\x1b[0m';
      process.stdout.write(`  [${icon}] ${r.name} (${r.durationMs}ms)\n`);
      if (!r.pass) process.stdout.write(`         Hint: ${r.hint}\n`);
    }

    if (!preResult.allPassed) {
      process.stdout.write('\nPre-conditions failed. Aborting.\n');
      if (weLaunched) await callHandler('mm_cleanup', {});
      process.exit(1);
    }
  }

  // Apply initial conditions
  await applyInitialConditions(recipe.initial_conditions, ctx);

  // Execute workflow
  process.stdout.write('\nNodes:\n');
  const totalStart = Date.now();

  const result = await executeWorkflow(recipe, ctx);
  const passed = result.raw?.passed || 0;
  let failed = result.raw?.failed || 0;
  const trace = result.raw?.trace || result.trace || [];

  const totalDuration = Date.now() - totalStart;

  // Stop auto-issue probe and synthesize the review. Runs before cleanup
  // so a failed workflow still produces artifacts. Idempotent.
  let issueReview = null;
  if (autoIssuesStarted) {
    try {
      const probeSummary = await sessionManager.stopCdpProbe({ name: AUTO_ISSUES_PROBE });
      const rawMessages = probeSummary?._full?.messages || [];
      const issues = normalizeFromCdpMessages(rawMessages);
      const workflow = recipe.validate?.workflow || {};
      const allowlist = workflow.issue_allowlist || [];
      const failOn = workflow.fail_on_unexpected || null;
      const partitioned = applyIssueAllowlist(issues, allowlist);
      issueReview = computeIssueReview(partitioned.unexpected, partitioned.informational, failOn);
      const paths = writeIssueArtifacts(artifactsDir, { ...partitioned, review: issueReview });
      issueReview.artifactFiles = paths;
      if (issueReview.status === 'review') {
        process.stdout.write(`\n[auto-issues] review — ${issueReview.observed.total} unexpected event(s). See ${paths.reviewMd}\n`);
      } else if (issueReview.status === 'gating') {
        process.stdout.write(`\n[auto-issues] GATING — ${issueReview.gating.total} event(s) matched fail_on_unexpected. See ${paths.reviewMd}\n`);
        failed += 1;
      }
    } catch (err) {
      process.stderr.write(`[auto-issues] stop/write failed: ${err?.message || err}\n`);
    }
  }

  printSummary(passed, failed, totalDuration);

  // Write artifacts
  try {
    const normalized = normalizeWorkflowDocument(recipe);
    writeArtifacts(artifactsDir, normalized, trace, passed, failed, totalDuration, issueReview);
    if (failed === 0) {
      writeLatestValidRunPointer(taskArtifactsDir, artifactsDir);
    }
  } catch {}

  // Cleanup
  if (weLaunched) {
    await callHandler('mm_cleanup', {});
  } else if (cli.cdpPort !== null && cli.closeCdpBrowser) {
    await sessionManager.cleanup();
  }

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
  process.stderr.write(`Fatal error: ${error instanceof Error ? error.message : String(error)}\n`);
  if (error.stack) process.stderr.write(`${error.stack}\n`);
  process.exit(1);
});

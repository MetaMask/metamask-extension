'use strict';

const path = require('node:path');

const EXECUTABLE_ACTIONS = new Set([
  'navigate',
  'wait',
  'wait_for',
  'press',
  'key_press',
  'scroll',
  'set_input',
  'screenshot',
  'call',
  'cdp_probe',
  'eval_ref',
  'eval_sync',
  'eval_async',
  'manual',
  'log_watch',
  'network',
  'emulation',
  'storage',
  'service_worker',
  'target',
  'page',
  'browser',
  'fetch',
  'performance',
  'trace_start',
  'trace_stop',
  'ext_navigate_hash',
  'ext_wait_for_screen',
  'ext_switch_tab',
  'ext_check_dom',
  // MetaMask-specific actions
  'type_keypad',
  'clear_keypad',
  'select_account',
  'toggle_testnet',
  'switch_provider',
]);

const CONTROL_ACTIONS = new Set(['switch', 'end']);
const ALL_WORKFLOW_ACTIONS = new Set([...EXECUTABLE_ACTIONS, ...CONTROL_ACTIONS]);

function deepClone(value) {
  if (value == null) {
    return value;
  }

  return JSON.parse(JSON.stringify(value));
}

function normalizeNodeAction(node) {
  const action = node.action || node.type || '';
  return String(action || '').trim();
}

function normalizeTarget(value) {
  if (typeof value === 'string') {
    return value.trim();
  }

  if (value && typeof value === 'object') {
    return String(value.next || value.node || '').trim();
  }

  return '';
}

function normalizeSwitchCase(rawCase, index) {
  const entry =
    typeof rawCase === 'string'
      ? { next: rawCase }
      : deepClone(rawCase || {});

  return {
    ...entry,
    index,
    label: entry.label || '',
    next: normalizeTarget(entry.next),
  };
}

function normalizeNode(nodeId, rawNode) {
  const node = deepClone(rawNode || {});
  const action = normalizeNodeAction(node);
  const normalized = {
    ...node,
    action,
    id: String(nodeId),
  };

  delete normalized.type;

  if (Object.prototype.hasOwnProperty.call(normalized, 'next')) {
    normalized.next = normalizeTarget(normalized.next);
  }

  if (Object.prototype.hasOwnProperty.call(normalized, 'default')) {
    normalized.default = normalizeTarget(normalized.default);
  }

  if (Array.isArray(normalized.cases)) {
    normalized.cases = normalized.cases.map((entry, index) =>
      normalizeSwitchCase(entry, index)
    );
  }

  return normalized;
}

function normalizeGraphWorkflow(spec = {}) {
  const rawNodes =
    spec.nodes && typeof spec.nodes === 'object' && !Array.isArray(spec.nodes)
      ? spec.nodes
      : {};

  const nodes = Object.fromEntries(
    Object.entries(rawNodes).map(([nodeId, rawNode]) => [
      String(nodeId),
      normalizeNode(nodeId, rawNode),
    ])
  );

  if (Object.keys(nodes).length === 0) {
    nodes.__end__ = normalizeNode('__end__', {
      action: 'end',
      status: 'pass',
      message: '',
    });
  }

  return {
    entry: String(spec.entry || Object.keys(nodes)[0] || '__end__'),
    nodes,
  };
}

const PLAYBACK_MODES = new Set(['off', 'auto', 'step']);

function normalizePlayback(rawPlayback) {
  const raw = rawPlayback && typeof rawPlayback === 'object' && !Array.isArray(rawPlayback)
    ? rawPlayback
    : {};
  const rawMode = typeof raw.mode === 'string' ? raw.mode : 'off';
  const mode = PLAYBACK_MODES.has(rawMode) ? rawMode : 'off';
  const rawSlowMs = raw.slow_ms;
  const slow_ms =
    Number.isFinite(rawSlowMs) && Number.isInteger(rawSlowMs) && rawSlowMs > 0
      ? rawSlowMs
      : 1000;
  return { mode, slow_ms };
}

function normalizeWorkflowDocument(document, options = {}) {
  const validate = document.validate || {};
  const workflowSpec = validate.workflow || null;

  if (!workflowSpec || typeof workflowSpec !== 'object') {
    throw new Error('validate.workflow is required');
  }

  const workflow = normalizeGraphWorkflow(workflowSpec);

  return {
    description: document.description || '',
    hooks: {
      pre_conditions: deepClone(workflowSpec.pre_conditions || []),
      setup: deepClone(workflowSpec.setup || []),
      teardown: deepClone(workflowSpec.teardown || []),
    },
    inputs: deepClone(document.inputs || {}),
    playback: normalizePlayback(workflowSpec.playback),
    sourcePath: options.sourcePath ? path.resolve(options.sourcePath) : '',
    title: document.title || '',
    workflow,
  };
}

function summarizeAssert(assertSpec) {
  if (!assertSpec || typeof assertSpec !== 'object') {
    return '';
  }

  if (Array.isArray(assertSpec.all)) {
    return assertSpec
      .all
      .map((entry) => summarizeAssert(entry))
      .filter(Boolean)
      .join(' & ');
  }

  if (Array.isArray(assertSpec.any)) {
    return assertSpec
      .any
      .map((entry) => summarizeAssert(entry))
      .filter(Boolean)
      .join(' | ');
  }

  if (Array.isArray(assertSpec.none)) {
    return `not(${assertSpec.none
      .map((entry) => summarizeAssert(entry))
      .filter(Boolean)
      .join(' | ')})`;
  }

  const operator = assertSpec.operator || '';
  const field = assertSpec.field || '$';

  if (Object.prototype.hasOwnProperty.call(assertSpec, 'value')) {
    return `${field} ${operator} ${JSON.stringify(assertSpec.value)}`;
  }

  if (Object.prototype.hasOwnProperty.call(assertSpec, 'values')) {
    return `${field} ${operator} ${JSON.stringify(assertSpec.values)}`;
  }

  if (Object.prototype.hasOwnProperty.call(assertSpec, 'pattern')) {
    return `${field} ${operator} ${JSON.stringify(assertSpec.pattern)}`;
  }

  return `${field} ${operator}`.trim();
}

function getNodeTargets(node) {
  if (!node) {
    return [];
  }

  if (node.action === 'switch') {
    const targets = [];

    (node.cases || []).forEach((entry) => {
      if (entry.next) {
        targets.push(entry.next);
      }
    });

    if (node.default) {
      targets.push(node.default);
    }

    return targets;
  }

  if (node.action === 'end') {
    return [];
  }

  return node.next ? [node.next] : [];
}

function listWorkflowEdges(workflow) {
  const edges = [];

  for (const [nodeId, node] of Object.entries(workflow.nodes || {})) {
    if (node.action === 'switch') {
      (node.cases || []).forEach((entry, index) => {
        if (!entry.next) {
          return;
        }

        edges.push({
          from: nodeId,
          label: entry.label || summarizeAssert(entry.when) || `case ${index + 1}`,
          to: entry.next,
        });
      });

      if (node.default) {
        edges.push({
          from: nodeId,
          label: 'default',
          to: node.default,
        });
      }

      continue;
    }

    if (node.next) {
      edges.push({
        from: nodeId,
        label: node.when
          ? `when ${summarizeAssert(node.when)}`
          : node.unless
            ? `unless ${summarizeAssert(node.unless)}`
            : '',
        to: node.next,
      });
    }
  }

  return edges;
}

function findReachableNodes(workflow) {
  const visited = new Set();
  const queue = [workflow.entry];

  while (queue.length > 0) {
    const nodeId = queue.shift();
    if (!nodeId || visited.has(nodeId)) {
      continue;
    }

    visited.add(nodeId);
    const node = workflow.nodes?.[nodeId];
    if (!node) {
      continue;
    }

    getNodeTargets(node).forEach((target) => {
      if (target && !visited.has(target)) {
        queue.push(target);
      }
    });
  }

  return visited;
}

function findUnreachableNodes(workflow) {
  const reachable = findReachableNodes(workflow);
  return Object.keys(workflow.nodes || {}).filter((nodeId) => !reachable.has(nodeId));
}

function findMissingTargets(workflow) {
  return listWorkflowEdges(workflow).filter((edge) => !workflow.nodes?.[edge.to]);
}

function detectWorkflowCycles(workflow) {
  const visited = new Set();
  const active = new Set();
  const stack = [];
  const dedupe = new Set();
  const cycles = [];

  function visit(nodeId) {
    if (!nodeId || !workflow.nodes?.[nodeId]) {
      return;
    }

    if (active.has(nodeId)) {
      const startIndex = stack.indexOf(nodeId);
      const cycle = stack.slice(startIndex).concat(nodeId);
      const key = cycle.join(' -> ');
      if (!dedupe.has(key)) {
        dedupe.add(key);
        cycles.push(cycle);
      }
      return;
    }

    if (visited.has(nodeId)) {
      return;
    }

    visited.add(nodeId);
    active.add(nodeId);
    stack.push(nodeId);

    getNodeTargets(workflow.nodes[nodeId]).forEach((target) => visit(target));

    stack.pop();
    active.delete(nodeId);
  }

  Object.keys(workflow.nodes || {}).forEach((nodeId) => visit(nodeId));
  return cycles;
}

function escapeMermaidLabel(value) {
  return String(value || '')
    .replaceAll('"', '\\"')
    .replaceAll('\n', '<br/>');
}

function buildMermaidIdMap(workflow) {
  const map = {};
  const used = new Set();
  let index = 1;

  for (const nodeId of Object.keys(workflow.nodes || {})) {
    let candidate = `node_${String(nodeId).replaceAll(/[^a-zA-Z0-9_]/g, '_') || index}`;
    while (used.has(candidate)) {
      index += 1;
      candidate = `${candidate}_${index}`;
    }
    used.add(candidate);
    map[nodeId] = candidate;
  }

  return map;
}

function mermaidNodeShape(nodeId, node, mermaidId) {
  const action = node.action || '';
  const title = node.description || node.ref || action || nodeId;
  const label = escapeMermaidLabel(`${nodeId}<br/>${title}`);

  if (action === 'switch') {
    return `${mermaidId}{"${label}"}`;
  }

  if (action === 'end') {
    const status = String(node.status || 'pass').toUpperCase();
    return `${mermaidId}(["${escapeMermaidLabel(`${nodeId}<br/>${status}`)}"])`;
  }

  if (action === 'call') {
    return `${mermaidId}[["${label}"]]`;
  }

  return `${mermaidId}["${label}"]`;
}

function renderWorkflowMermaid(normalizedDocument) {
  const workflow = normalizedDocument.workflow || normalizedDocument;
  const mermaidIds = buildMermaidIdMap(workflow);
  const lines = ['flowchart TD'];

  if (normalizedDocument.title) {
    lines.push(`  %% ${escapeMermaidLabel(normalizedDocument.title)}`);
  }

  lines.push(`  __entry__(["ENTRY"]) --> ${mermaidIds[workflow.entry] || workflow.entry}`);

  for (const [nodeId, node] of Object.entries(workflow.nodes || {})) {
    lines.push(`  ${mermaidNodeShape(nodeId, node, mermaidIds[nodeId] || nodeId)}`);
  }

  for (const edge of listWorkflowEdges(workflow)) {
    const label = edge.label ? `|${escapeMermaidLabel(edge.label)}|` : '';
    lines.push(
      `  ${mermaidIds[edge.from] || edge.from} -->${label} ${mermaidIds[edge.to] || edge.to}`
    );
  }

  return `${lines.join('\n')}\n`;
}

module.exports = {
  ALL_WORKFLOW_ACTIONS,
  CONTROL_ACTIONS,
  EXECUTABLE_ACTIONS,
  PLAYBACK_MODES,
  deepClone,
  detectWorkflowCycles,
  findMissingTargets,
  findReachableNodes,
  findUnreachableNodes,
  getNodeTargets,
  listWorkflowEdges,
  normalizeGraphWorkflow,
  normalizeNode,
  normalizePlayback,
  normalizeWorkflowDocument,
  renderWorkflowMermaid,
  summarizeAssert,
};

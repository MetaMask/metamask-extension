'use strict';

// Automatic issue capture + review for recipe runs.
//
// Extension variant: issues originate from Chrome DevTools Protocol
// Runtime.consoleAPICalled / Runtime.exceptionThrown events collected by
// CdpSessionManager. A reserved probe (name: `__auto_issues`) is started
// at workflow entry and stopped before cleanup, regardless of recipe
// content. Recipes do not need any probe/log_watch nodes to opt in.

const fs = require('node:fs');
const path = require('node:path');

const LEVEL_WARNING = 'warning';
const LEVEL_ERROR = 'error';
const LEVEL_EXCEPTION = 'exception';
const LEVEL_OTHER = 'other';

const REVIEW_LEVELS = new Set([LEVEL_WARNING, LEVEL_ERROR, LEVEL_EXCEPTION]);
const TOP_ISSUES_LIMIT = 4;
const TEXT_MAX = 2000;

function classifyCdpMessage(entry) {
  if (!entry || typeof entry !== 'object') return null;
  if (entry.kind === 'exception') return LEVEL_EXCEPTION;
  const kind = String(entry.kind || '').toLowerCase();
  if (kind === 'warning' || kind === 'warn') return LEVEL_WARNING;
  if (kind === 'error' || kind === 'assert') return LEVEL_ERROR;
  return null;
}

function normalizeFromCdpMessages(entries) {
  if (!Array.isArray(entries)) return [];
  const issues = [];
  for (const entry of entries) {
    const level = classifyCdpMessage(entry);
    if (!level) continue;
    const text = String(entry.text || '').slice(0, TEXT_MAX);
    if (!text) continue;
    issues.push({
      level,
      channel: level === LEVEL_EXCEPTION ? 'exception' : 'console',
      source: entry.source || 'unknown',
      targetRole: entry.source === 'sw' ? 'service-worker' : 'home',
      targetUrl: entry.source === 'sw' ? 'chrome-extension://sw' : 'chrome-extension://home',
      text,
      timestamp: entry.ts ? new Date(Number(entry.ts)).toISOString() : new Date().toISOString(),
      allowlistMatch: null,
    });
  }
  return issues;
}

function dedupeIssues(issues) {
  const seen = new Map();
  for (const issue of issues) {
    const key = `${issue.level}|${issue.channel}|${issue.source}|${issue.text.slice(0, 300)}`;
    const prior = seen.get(key);
    if (prior) prior.count += 1;
    else seen.set(key, { ...issue, count: 1 });
  }
  return Array.from(seen.values());
}

function applyAllowlist(issues, allowlist) {
  const rules = Array.isArray(allowlist) ? allowlist : [];
  const unexpected = [];
  const informational = [];
  for (const issue of issues) {
    let match = null;
    for (const rule of rules) {
      if (rule && rule.level && rule.level !== issue.level) continue;
      if (rule && rule.textMatch) {
        try {
          if (new RegExp(rule.textMatch).test(issue.text)) {
            match = rule.reason || rule.textMatch;
            break;
          }
        } catch {
          if (issue.text.includes(rule.textMatch)) {
            match = rule.reason || rule.textMatch;
            break;
          }
        }
      }
    }
    if (match) informational.push({ ...issue, allowlistMatch: match });
    else if (REVIEW_LEVELS.has(issue.level)) unexpected.push(issue);
    else informational.push(issue);
  }
  return { unexpected, informational };
}

function countByLevel(issues) {
  const counts = { total: 0, warning: 0, error: 0, exception: 0, other: 0 };
  for (const issue of issues) {
    counts.total += 1;
    if (counts[issue.level] !== undefined) counts[issue.level] += 1;
    else counts.other += 1;
  }
  return counts;
}

function matchesFailOn(issue, failOn) {
  if (!failOn || typeof failOn !== 'object') return false;
  const levels = Array.isArray(failOn.levels) ? failOn.levels : [];
  const textMatches = Array.isArray(failOn.textMatches) ? failOn.textMatches : [];
  if (levels.length && !levels.includes(issue.level)) return false;
  if (!textMatches.length) return levels.length > 0;
  for (const pattern of textMatches) {
    try {
      if (new RegExp(pattern).test(issue.text)) return true;
    } catch {
      if (issue.text.includes(pattern)) return true;
    }
  }
  return false;
}

function computeReview(unexpected, informational, failOn, artifactFiles) {
  const observedDeduped = dedupeIssues(unexpected);
  const observed = countByLevel(observedDeduped);
  const gatingIssues = observedDeduped.filter((i) => matchesFailOn(i, failOn));
  const gating = countByLevel(gatingIssues);
  const infoCount = Array.isArray(informational) ? informational.length : 0;

  let status = 'clean';
  let note = 'No unexpected warnings, errors, or exceptions observed.';
  if (gating.total > 0) {
    status = 'gating';
    note = `Observed ${gating.total} unexpected warning/error/exception event(s) matching fail_on_unexpected. Recipe marked as failing.`;
  } else if (observed.total > 0) {
    status = 'review';
    note = `Observed ${observed.total} unexpected warning/error/exception event(s) during validation. Relation to the recipe or current change is not determined; review the artifacts.`;
  }

  const ranked = observedDeduped.slice().sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return (a.text || '').localeCompare(b.text || '');
  });

  const topIssues = ranked.slice(0, TOP_ISSUES_LIMIT).map((i) => ({
    level: i.level,
    channel: i.channel,
    source: i.source,
    targetRole: i.targetRole,
    text: i.text,
    count: i.count,
    allowlistMatch: i.allowlistMatch,
  }));

  return {
    status,
    note,
    observed,
    gating,
    informational: { total: infoCount },
    topIssues,
    artifactFiles: artifactFiles || {},
  };
}

function renderMarkdown(review) {
  const { status, note, observed, gating, informational, topIssues, artifactFiles } = review;
  const lines = [];
  lines.push('# Recipe Issue Review');
  lines.push('');
  lines.push(`Status: ${status}`);
  lines.push('');
  lines.push(note);
  lines.push('');
  lines.push('Observed:');
  lines.push(`- warnings: ${observed.warning || 0}`);
  lines.push(`- errors: ${observed.error || 0}`);
  lines.push(`- exceptions: ${observed.exception || 0}`);
  lines.push(`- total: ${observed.total || 0}`);
  lines.push('');
  lines.push('Gating:');
  lines.push(`- warnings: ${gating.warning || 0}`);
  lines.push(`- errors: ${gating.error || 0}`);
  lines.push(`- exceptions: ${gating.exception || 0}`);
  lines.push(`- total: ${gating.total || 0}`);
  lines.push('');
  lines.push(`Informational-only events: ${(informational && informational.total) || 0}`);
  lines.push('');
  if (topIssues && topIssues.length) {
    lines.push('Top issues (by frequency):');
    for (const issue of topIssues) {
      const label = String(issue.level || 'other').toUpperCase();
      const n = issue.count ? ` x${issue.count}` : '';
      lines.push(`- [${label}${n}] ${issue.source}: ${issue.text}`);
    }
    lines.push('');
  }
  if (artifactFiles && Object.keys(artifactFiles).length) {
    lines.push('Artifacts:');
    for (const key of ['allIssues', 'consoleWarnings', 'consoleErrors', 'runtimeExceptions']) {
      if (artifactFiles[key]) lines.push(`- ${artifactFiles[key]}`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

function writeJsonArtifact(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

function writeArtifacts(runDir, { unexpected, informational, review }) {
  const outDir = path.resolve(runDir);
  fs.mkdirSync(outDir, { recursive: true });

  const all = [...(unexpected || []), ...(informational || [])];

  const paths = {
    allIssues: path.join(outDir, 'recipe-issues.json'),
    consoleWarnings: path.join(outDir, 'console-warnings.json'),
    consoleErrors: path.join(outDir, 'console-errors.json'),
    runtimeExceptions: path.join(outDir, 'runtime-exceptions.json'),
    reviewJson: path.join(outDir, 'recipe-issues-review.json'),
    reviewMd: path.join(outDir, 'recipe-issues-review.md'),
  };

  writeJsonArtifact(paths.allIssues, all);
  writeJsonArtifact(paths.consoleWarnings, all.filter((i) => i.level === LEVEL_WARNING));
  writeJsonArtifact(paths.consoleErrors, all.filter((i) => i.level === LEVEL_ERROR));
  writeJsonArtifact(paths.runtimeExceptions, all.filter((i) => i.level === LEVEL_EXCEPTION));

  const reviewWithPaths = { ...review, artifactFiles: paths };
  writeJsonArtifact(paths.reviewJson, reviewWithPaths);
  fs.writeFileSync(paths.reviewMd, renderMarkdown(reviewWithPaths));

  return paths;
}

module.exports = {
  LEVEL_WARNING,
  LEVEL_ERROR,
  LEVEL_EXCEPTION,
  LEVEL_OTHER,
  TOP_ISSUES_LIMIT,
  applyAllowlist,
  classifyCdpMessage,
  computeReview,
  countByLevel,
  dedupeIssues,
  matchesFailOn,
  normalizeFromCdpMessages,
  renderMarkdown,
  writeArtifacts,
};

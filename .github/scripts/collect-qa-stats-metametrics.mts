/**
 * Static scan of E2E sources for MetaMetrics event display names asserted in tests.
 * Used by collect-qa-stats.ts for the `metametrics` namespace in qa-stats.json.
 */

import { access, readFile } from 'fs/promises';
import { constants as fsConstants } from 'fs';
import { PATTERN_E2E_SPEC_FILE, walkFiles } from './collect-qa-stats-walk-files.mts';

/** Constants files whose string enums are resolved in E2E (imported by specs). */
const METRICS_ENUM_SOURCE_FILES = [
  'shared/constants/metametrics.ts',
  'shared/constants/transaction.ts',
] as const;

/**
 * E2E sources that assert MetaMetrics but are not `*.spec.ts` / `*.spec.js`.
 * Add paths when migrating inline checks out of specs into shared helpers.
 */
export const LEGACY_INLINE_METAMETRICS_PATHS: readonly string[] = [
  'test/e2e/tests/confirmations/signatures/signature-helpers.ts',
];

const SCAN_E2E_ROOT = 'test/e2e';

type EnumMap = Record<string, Record<string, string>>;

/**
 * Parses `enum Name { A = 'x', B = 'y' }` blocks into enumName -> member -> value.
 */
export function parseEnumStringMembers(source: string): EnumMap {
  const enums: EnumMap = {};
  const re = /\benum\s+(\w+)\s*\{/gu;
  let m: RegExpExecArray | null;
  while ((m = re.exec(source)) !== null) {
    const enumName = m[1];
    const start = source.indexOf('{', m.index);
    let depth = 0;
    let i = start;
    for (; i < source.length; i += 1) {
      const c = source[i];
      if (c === '{') depth += 1;
      else if (c === '}') {
        depth -= 1;
        if (depth === 0) break;
      }
    }
    const inner = source.slice(start + 1, i);
    const members: Record<string, string> = {};
    for (const em of inner.matchAll(/\b(\w+)\s*=\s*['"]([^'"]+)['"]\s*,?/gu)) {
      members[em[1]] = em[2];
    }
    if (Object.keys(members).length > 0) {
      enums[enumName] = members;
    }
  }
  return enums;
}

/**
 * Parses `const foo = 'bar';` at statement level.
 */
export function parseConstStringLiterals(source: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of source.matchAll(/\bconst\s+(\w+)\s*=\s*['"]([^'"]+)['"]\s*;/gu)) {
    out[m[1]] = m[2];
  }
  return out;
}

/**
 * Parses `const foo = { a: 'b', ... }` object literals with string values.
 */
export function parseConstObjectStringValues(source: string): EnumMap {
  const maps: EnumMap = {};
  for (const m of source.matchAll(/\bconst\s+(\w+)\s*=\s*\{/gu)) {
    const start = source.indexOf('{', m.index);
    let depth = 0;
    let i = start;
    for (; i < source.length; i += 1) {
      const c = source[i];
      if (c === '{') depth += 1;
      else if (c === '}') {
        depth -= 1;
        if (depth === 0) break;
      }
    }
    const inner = source.slice(start + 1, i);
    const props: Record<string, string> = {};
    for (const km of inner.matchAll(/\b(\w+)\s*:\s*['"]([^'"]+)['"]\s*,?/gu)) {
      props[km[1]] = km[2];
    }
    const varName = m[1];
    if (Object.keys(props).length > 0) {
      maps[varName] = props;
    }
  }
  return maps;
}

/**
 * Merges multiple enum maps; later entries win per enum name and per member.
 */
export function mergeEnumMaps(maps: EnumMap[]): EnumMap {
  const out: EnumMap = {};
  for (const map of maps) {
    for (const [enumName, members] of Object.entries(map)) {
      out[enumName] = { ...(out[enumName] ?? {}), ...members };
    }
  }
  return out;
}

function resolveMetaMetricsToken(
  token: string,
  onboardingMap: Record<string, string>,
  enums: EnumMap,
  objectMaps: EnumMap,
  strConsts: Record<string, string>,
): string | null {
  const t = token.replace(/^\s+|\s+$/gu, '');
  if (!t) return null;
  const lit = t.match(/^['"]([^'"]+)['"]$/u);
  if (lit) return lit[1];
  const onb = t.match(/^onboardingEvents\.(\w+)$/u);
  if (onb && onboardingMap[onb[1]]) return onboardingMap[onb[1]];
  const qual = t.match(/^(\w+)\.(\w+)$/u);
  if (qual) {
    const [, base, mem] = qual;
    if (enums[base]?.[mem]) return enums[base][mem];
    if (objectMaps[base]?.[mem]) return objectMaps[base][mem];
  }
  if (strConsts[t]) return strConsts[t];
  return null;
}

/**
 * Collects event display names from one E2E/helper source file.
 */
export function collectMetametricsFromSource(
  source: string,
  globalEnumMap: EnumMap,
  onboardingMap: Record<string, string>,
  out: Set<string>,
): void {
  const localEnums = parseEnumStringMembers(source);
  const enums: EnumMap = { ...globalEnumMap };
  for (const [name, members] of Object.entries(localEnums)) {
    enums[name] = { ...(enums[name] ?? {}), ...members };
  }
  const strConsts = parseConstStringLiterals(source);
  const objectMaps = parseConstObjectStringValues(source);

  for (const m of source.matchAll(/\bonboardingEvents\.(\w+)/gu)) {
    const v = onboardingMap[m[1]];
    if (v) out.add(v);
  }

  for (const m of source.matchAll(/event\.event\s*===\s*['"]([^'"]+)['"]/gu)) {
    out.add(m[1]);
  }

  for (const m of source.matchAll(/event\.event\s*===\s*(\w+)\.(\w+)/gu)) {
    const v = resolveMetaMetricsToken(
      `${m[1]}.${m[2]}`,
      onboardingMap,
      enums,
      objectMaps,
      strConsts,
    );
    if (v) out.add(v);
  }

  // Segment / MetaMetrics track payloads use `type: 'track'` near `event: '...'`.
  // Skip bare `event:` (e.g. WebSocket mock payloads) to reduce false positives.
  for (const m of source.matchAll(
    /type:\s*['"]track['"][\s\S]{0,200}?\bevent:\s*['"]([^'"]+)['"]/gu,
  )) {
    out.add(m[1]);
  }
  for (const m of source.matchAll(
    /\bevent:\s*['"]([^'"]+)['"][\s\S]{0,120}?type:\s*['"]track['"]/gu,
  )) {
    out.add(m[1]);
  }

  for (const m of source.matchAll(/\bevent:\s*(\w+)\.(\w+)/gu)) {
    const v = resolveMetaMetricsToken(
      `${m[1]}.${m[2]}`,
      onboardingMap,
      enums,
      objectMaps,
      strConsts,
    );
    if (v) out.add(v);
  }

  for (const m of source.matchAll(/findEvent\([^,]+,\s*['"]([^'"]+)['"]/gu)) {
    out.add(m[1]);
  }
  for (const m of source.matchAll(/findEvent\([^,]+,\s*onboardingEvents\.(\w+)/gu)) {
    const v = onboardingMap[m[1]];
    if (v) out.add(v);
  }
  for (const m of source.matchAll(/filterEvents\(\s*[^,]+,\s*['"]([^'"]+)['"]/gu)) {
    out.add(m[1]);
  }
  for (const m of source.matchAll(
    /filterEvents\(\s*[^,]+,\s*onboardingEvents\.(\w+)/gu,
  )) {
    const v = onboardingMap[m[1]];
    if (v) out.add(v);
  }

  for (const m of source.matchAll(/\bevent:\s*([A-Za-z_]\w*)\s*[,}]/gu)) {
    const v = strConsts[m[1]];
    if (v) out.add(v);
  }

  for (const m of source.matchAll(
    /getEventsPayloads\s*\(\s*[^,]+,\s*\[([\s\S]*?)\]\s*(?:,\s*[^)]+)?\s*\)/gu,
  )) {
    const inner = m[1];
    for (const sm of inner.matchAll(/['"]([^'"]+)['"]/gu)) {
      out.add(sm[1]);
    }
    for (const sm of inner.matchAll(/\bonboardingEvents\.(\w+)/gu)) {
      const v = onboardingMap[sm[1]];
      if (v) out.add(v);
    }
    for (const part of inner.split(',')) {
      const v = resolveMetaMetricsToken(
        part,
        onboardingMap,
        enums,
        objectMaps,
        strConsts,
      );
      if (v) out.add(v);
    }
  }

  const reArrays = /\bconst\s+(\w+)\s*=\s*\[([\s\S]*?)\];/gu;
  let am: RegExpExecArray | null;
  while ((am = reArrays.exec(source)) !== null) {
    const varName = am[1];
    const inner = am[2];
    // Avoid `expectedNetworkNames` and similar — they match "Names" but are not analytics events.
    if (/NetworkNames$/u.test(varName)) {
      continue;
    }
    const looksLikeEventList =
      /(?:event|Event|Expected|expectation|analytics)/u.test(varName) ||
      /\bNames\b/u.test(varName) ||
      /\bonboardingEvents\b|\bexpectedEvents\b/u.test(inner);
    if (!looksLikeEventList) continue;
    for (const part of inner.split(',')) {
      const v = resolveMetaMetricsToken(
        part,
        onboardingMap,
        enums,
        objectMaps,
        strConsts,
      );
      if (v) out.add(v);
    }
  }

  for (const m of source.matchAll(
    /assertEventPropertiesMatch\s*\([^,]+,\s*['"]([^'"]+)['"]/gu,
  )) {
    out.add(m[1]);
  }

  for (const m of source.matchAll(
    /mockedTrackedEvent\s*\([^,]+,\s*(\w+)\.(\w+)\s*\)/gu,
  )) {
    const v = resolveMetaMetricsToken(
      `${m[1]}.${m[2]}`,
      onboardingMap,
      enums,
      objectMaps,
      strConsts,
    );
    if (v) out.add(v);
  }

  for (const m of source.matchAll(
    /assert\.(?:equal|deepEqual|strictEqual)\(\s*[^)]*\.event\s*,\s*(\w+)\.(\w+)\s*\)/gu,
  )) {
    const v = resolveMetaMetricsToken(
      `${m[1]}.${m[2]}`,
      onboardingMap,
      enums,
      objectMaps,
      strConsts,
    );
    if (v) out.add(v);
  }
}

async function loadGlobalMetricsEnumMap(): Promise<EnumMap> {
  const parts: EnumMap[] = [];
  for (const rel of METRICS_ENUM_SOURCE_FILES) {
    try {
      const raw = await readFile(rel, 'utf8');
      parts.push(parseEnumStringMembers(raw));
    } catch {
      console.warn(`[metametrics] could not read ${rel}, skipping enum definitions`);
    }
  }
  return mergeEnumMaps(parts);
}

async function gatherMetametricsE2eFilePaths(): Promise<string[]> {
  const paths = new Set<string>();
  const specFiles = await walkFiles(SCAN_E2E_ROOT, (name) =>
    PATTERN_E2E_SPEC_FILE.test(name),
  );
  for (const p of specFiles) {
    if (p.replace(/\\/gu, '/').includes(`${SCAN_E2E_ROOT}/websocket/`)) {
      continue;
    }
    paths.add(p);
  }
  for (const p of LEGACY_INLINE_METAMETRICS_PATHS) {
    try {
      await access(p, fsConstants.F_OK);
      paths.add(p);
    } catch {
      console.warn(
        `[metametrics] legacy path missing (update LEGACY_INLINE_METAMETRICS_PATHS): ${p}`,
      );
    }
  }
  return [...paths].sort((a, b) => a.localeCompare(b));
}

/**
 * Returns stable keys for qa-stats.json `metametrics` namespace (Grafana / TSDB).
 */
export async function collectE2EMetaMetricsEventCoverage(): Promise<
  Record<string, number | string>
> {
  const globalEnumMap = await loadGlobalMetricsEnumMap();
  const onboardingMap: Record<string, string> = {};
  const names = new Set<string>();
  const files = await gatherMetametricsE2eFilePaths();

  console.log(`[metametrics] scanning ${files.length} file(s) for referenced event names`);

  for (const filePath of files) {
    const source = await readFile(filePath, 'utf8');
    collectMetametricsFromSource(source, globalEnumMap, onboardingMap, names);
  }

  const sorted = [...names].sort((a, b) => a.localeCompare(b));
  console.log(
    `[metametrics] ${sorted.length} unique event name(s) referenced in E2E sources`,
  );

  return {
    metametrics_events_checked_unique_count: sorted.length,
    metametrics_events_checked_names_json: JSON.stringify(sorted),
  };
}

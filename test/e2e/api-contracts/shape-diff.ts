/**
 * Structural comparison between live API responses and E2E mock payloads.
 *
 * The consumer-type check answers "can the wallet handle this payload?". This
 * module answers a different question: "do our mocks exercise what the real
 * API sends?" — e.g. `null` values or high-precision numbers that the mocks
 * never contain (both caused production crashes, see #44087).
 */

export type JsonKind =
  | 'array'
  | 'boolean'
  | 'null'
  | 'number'
  | 'object'
  | 'string';

export type ShapeNode = {
  kinds: Set<JsonKind>;
  /** Whether any number seen at this path has more than 15 significant digits. */
  hasHighPrecisionNumber: boolean;
};

/** Normalized path (array indices → `[*]`, wildcard keys → `.*`) → node. */
export type ShapeProfile = Map<string, ShapeNode>;

export type ShapeDiff = {
  /** Paths the live API returns that no mock contains. */
  missingInMocks: string[];
  /** Paths where the live API returns kinds (e.g. `null`) no mock contains. */
  uncoveredKinds: { path: string; live: JsonKind[]; mocks: JsonKind[] }[];
  /** Paths where the live API returns numbers BigNumber.js rejects as plain numbers. */
  uncoveredHighPrecision: string[];
  /** Paths only the mocks contain (the API may have dropped the field). */
  onlyInMocks: string[];
};

export type ShapeOptions = {
  /**
   * Normalized paths whose object keys are data rather than field names
   * (e.g. `$` for `/v3/spot-prices`, keyed by CAIP asset ID). Their keys are
   * collapsed to `.*` so mocks and live responses can be compared.
   */
  wildcardKeyPaths?: string[];
};

export const MAX_SAFE_SIGNIFICANT_DIGITS = 15;

/**
 * Counts the significant digits of the shortest decimal representation of a
 * number, which is what BigNumber.js checks when given a `number`.
 *
 * @param value - A finite number.
 * @returns The number of significant digits.
 */
export function countSignificantDigits(value: number): number {
  if (!Number.isFinite(value) || value === 0) {
    return 1;
  }
  const [mantissa] = Math.abs(value).toExponential().split('e');
  return mantissa.replace('.', '').length;
}

function getKind(value: unknown): JsonKind {
  if (value === null) {
    return 'null';
  }
  if (Array.isArray(value)) {
    return 'array';
  }
  return typeof value as JsonKind;
}

function formatKey(key: string): string {
  return /^[A-Za-z_$][\w$]*$/u.test(key)
    ? `.${key}`
    : `[${JSON.stringify(key)}]`;
}

/**
 * Normalizes a concrete value path (as reported by the type validator) into
 * the form used by shape profiles: array indices become `[*]` and keys under
 * wildcard key paths become `.*`.
 *
 * @param valuePath - A concrete path, e.g. `$.items[3]["eip155:1/slip44:60"]`.
 * @param options - Shape options.
 * @param options.wildcardKeyPaths - Paths whose object keys are collapsed.
 * @returns The normalized path, e.g. `$.items[*].*`.
 */
export function normalizePath(
  valuePath: string,
  { wildcardKeyPaths = [] }: ShapeOptions = {},
): string {
  const wildcards = new Set(wildcardKeyPaths);
  const segmentPattern =
    /\.([A-Za-z_$][\w$]*)|\[(\d+)\]|\[("(?:[^"\\]|\\.)*")\]/gu;
  let normalized = '$';
  for (const [, identifier, index, quotedKey] of valuePath
    .slice(1)
    .matchAll(segmentPattern)) {
    if (index === undefined) {
      const key = identifier ?? (JSON.parse(quotedKey) as string);
      normalized += wildcards.has(normalized) ? '.*' : formatKey(key);
    } else {
      normalized += '[*]';
    }
  }
  return normalized;
}

/**
 * Builds the shape profile of one or more JSON values.
 *
 * @param values - JSON values (e.g. all mock payloads of an endpoint).
 * @param options - Shape options.
 * @param options.wildcardKeyPaths - Paths whose object keys are collapsed.
 * @returns The merged shape profile.
 */
export function buildShapeProfile(
  values: unknown[],
  { wildcardKeyPaths = [] }: ShapeOptions = {},
): ShapeProfile {
  const profile: ShapeProfile = new Map();
  const wildcards = new Set(wildcardKeyPaths);

  const visit = (value: unknown, valuePath: string) => {
    const kind = getKind(value);
    const node = profile.get(valuePath) ?? {
      kinds: new Set<JsonKind>(),
      hasHighPrecisionNumber: false,
    };
    node.kinds.add(kind);
    if (
      kind === 'number' &&
      countSignificantDigits(value as number) > MAX_SAFE_SIGNIFICANT_DIGITS
    ) {
      node.hasHighPrecisionNumber = true;
    }
    profile.set(valuePath, node);

    if (kind === 'array') {
      for (const element of value as unknown[]) {
        visit(element, `${valuePath}[*]`);
      }
    } else if (kind === 'object') {
      for (const [key, child] of Object.entries(
        value as Record<string, unknown>,
      )) {
        visit(
          child,
          `${valuePath}${wildcards.has(valuePath) ? '.*' : formatKey(key)}`,
        );
      }
    }
  };

  for (const value of values) {
    visit(value, '$');
  }
  return profile;
}

function getParentPath(valuePath: string): string | undefined {
  const match = /^(.*?)(\.[^.[]+|\[[^\]]*\])$/u.exec(valuePath);
  return match?.[1] || undefined;
}

/**
 * Keeps only the top-most paths, so a missing object is reported once rather
 * than once per nested field.
 *
 * @param paths - Normalized paths.
 * @returns The paths whose parent is not in the list.
 */
function topMostPaths(paths: string[]): string[] {
  const set = new Set(paths);
  return paths.filter((valuePath) => {
    for (
      let parent = getParentPath(valuePath);
      parent;
      parent = getParentPath(parent)
    ) {
      if (set.has(parent)) {
        return false;
      }
    }
    return true;
  });
}

/**
 * Compares the shape of live responses with the shape of the mocks.
 *
 * @param live - Shape profile of the live response(s).
 * @param mocks - Shape profile of the mock payload(s).
 * @returns The differences, sorted by path.
 */
export function diffShapes(live: ShapeProfile, mocks: ShapeProfile): ShapeDiff {
  const missingInMocks: string[] = [];
  const uncoveredKinds: ShapeDiff['uncoveredKinds'] = [];
  const uncoveredHighPrecision: string[] = [];

  for (const [valuePath, liveNode] of live) {
    const mockNode = mocks.get(valuePath);
    if (!mockNode) {
      missingInMocks.push(valuePath);
      continue;
    }
    const missingKinds = [...liveNode.kinds].filter(
      (kind) => !mockNode.kinds.has(kind),
    );
    if (missingKinds.length > 0) {
      uncoveredKinds.push({
        path: valuePath,
        live: [...liveNode.kinds].sort(),
        mocks: [...mockNode.kinds].sort(),
      });
    }
    if (liveNode.hasHighPrecisionNumber && !mockNode.hasHighPrecisionNumber) {
      uncoveredHighPrecision.push(valuePath);
    }
  }

  const onlyInMocks = [...mocks.keys()].filter(
    (valuePath) => !live.has(valuePath),
  );

  return {
    missingInMocks: topMostPaths(missingInMocks).sort(),
    uncoveredKinds: uncoveredKinds.sort((a, b) => a.path.localeCompare(b.path)),
    uncoveredHighPrecision: uncoveredHighPrecision.sort(),
    onlyInMocks: topMostPaths(onlyInMocks).sort(),
  };
}

export function isShapeDiffEmpty(diff: ShapeDiff): boolean {
  return (
    diff.missingInMocks.length === 0 &&
    diff.uncoveredKinds.length === 0 &&
    diff.uncoveredHighPrecision.length === 0 &&
    diff.onlyInMocks.length === 0
  );
}

import {
  buildShapeProfile,
  diffShapes,
  isShapeDiffEmpty,
  MAX_SAFE_SIGNIFICANT_DIGITS,
  normalizePath,
} from './shape-diff';
import type { ShapeDiff, ShapeOptions } from './shape-diff';
import type { ConsumerTypeValidator, TypeMismatch } from './type-validator';
import type { ApiContract, LiveRequest } from './types';

const LIVE_REQUEST_TIMEOUT_MS = 30_000;
const MAX_MISMATCHES_PER_ITEM_IN_REPORT = 20;

/** Mismatches sharing a normalized path, e.g. every item of an array. */
export type GroupedMismatch = {
  /** Normalized path (`[*]` for array items, `.*` for wildcard keys). */
  path: string;
  /** Message of the first occurrence. */
  message: string;
  /** Concrete path of the first occurrence. */
  example: string;
  occurrences: number;
};

export type AcceptedMismatch = GroupedMismatch & { reason: string };

export type MockResult = {
  name: string;
  source: string;
  mismatches: GroupedMismatch[];
};

export type LiveResult =
  | {
      status: 'checked';
      request: string;
      mismatches: GroupedMismatch[];
      acceptedMismatches: AcceptedMismatch[];
      shapeDiff: ShapeDiff;
    }
  | { status: 'skipped'; request?: string; reason: string }
  | { status: 'error'; request: string; error: string };

export type ContractReport = {
  id: string;
  endpoint: string;
  consumerType: string;
  consumedBy: string;
  relatedIssues: string[];
  mocks: MockResult[];
  live?: LiveResult;
};

export type ReportSummary = {
  /** Mock payloads that do not satisfy the consumer type. */
  invalidMocks: number;
  /** Live responses that do not satisfy the consumer type. */
  liveTypeDrift: number;
  /** Live responses whose shape is not covered by the mocks. */
  liveCoverageGaps: number;
  /** Live requests that failed. */
  liveErrors: number;
};

export type ContractsReport = {
  mode: 'mocks' | 'live';
  generatedAt: string;
  contracts: ContractReport[];
  summary: ReportSummary;
};

export type CheckOptions = {
  contracts: ApiContract[];
  validator: ConsumerTypeValidator;
};

export type LiveCheckOptions = CheckOptions & {
  env: Record<string, string | undefined>;
  fetchImpl?: typeof fetch;
};

export enum ExitCode {
  Ok = 0,
  Drift = 1,
  Failure = 2,
}

/**
 * Groups mismatches by normalized path, so one wrong field in a list of 200
 * items is reported once.
 *
 * @param mismatches - Mismatches reported by the type validator.
 * @param shape - Shape options of the contract.
 * @returns The grouped mismatches, in order of first occurrence.
 */
export function groupMismatches(
  mismatches: TypeMismatch[],
  shape?: ShapeOptions,
): GroupedMismatch[] {
  const groups = new Map<string, GroupedMismatch>();
  for (const { path, message } of mismatches) {
    const normalizedPath = normalizePath(path, shape);
    const group = groups.get(normalizedPath);
    if (group) {
      group.occurrences += 1;
    } else {
      groups.set(normalizedPath, {
        path: normalizedPath,
        message,
        example: path,
        occurrences: 1,
      });
    }
  }
  return [...groups.values()];
}

function checkMocks(
  contract: ApiContract,
  validator: ConsumerTypeValidator,
): MockResult[] {
  return contract.mocks.map((mock) => ({
    name: mock.name,
    source: mock.source,
    mismatches: groupMismatches(
      validator.validate(contract.consumerType, mock.response),
      contract.shape,
    ),
  }));
}

function toContractReport(
  contract: ApiContract,
  validator: ConsumerTypeValidator,
): ContractReport {
  return {
    id: contract.id,
    endpoint: contract.endpoint,
    consumerType: contract.consumerType,
    consumedBy: contract.consumedBy,
    relatedIssues: contract.relatedIssues ?? [],
    mocks: checkMocks(contract, validator),
  };
}

function summarize(contracts: ContractReport[]): ReportSummary {
  const summary: ReportSummary = {
    invalidMocks: 0,
    liveTypeDrift: 0,
    liveCoverageGaps: 0,
    liveErrors: 0,
  };
  for (const contract of contracts) {
    summary.invalidMocks += contract.mocks.filter(
      (mock) => mock.mismatches.length > 0,
    ).length;
    if (contract.live?.status === 'checked') {
      if (contract.live.mismatches.length > 0) {
        summary.liveTypeDrift += 1;
      }
      if (!isShapeDiffEmpty(contract.live.shapeDiff)) {
        summary.liveCoverageGaps += 1;
      }
    } else if (contract.live?.status === 'error') {
      summary.liveErrors += 1;
    }
  }
  return summary;
}

/**
 * Checks every mock payload against the type its consumer expects.
 *
 * @param options - Check options.
 * @param options.contracts - Contracts to check.
 * @param options.validator - Consumer type validator.
 * @returns The report.
 */
export function checkContractMocks({
  contracts,
  validator,
}: CheckOptions): ContractsReport {
  const reports = contracts.map((contract) =>
    toContractReport(contract, validator),
  );
  return {
    mode: 'mocks',
    generatedAt: new Date().toISOString(),
    contracts: reports,
    summary: summarize(reports),
  };
}

async function fetchLiveResponse(
  live: LiveRequest,
  env: Record<string, string>,
  fetchImpl: typeof fetch,
): Promise<unknown> {
  const { url, init } = live.buildRequest(env);
  const response = await fetchImpl(url, {
    ...init,
    signal: AbortSignal.timeout(LIVE_REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText}`.trim());
  }
  return await response.json();
}

async function checkLive(
  contract: ApiContract,
  validator: ConsumerTypeValidator,
  env: Record<string, string | undefined>,
  fetchImpl: typeof fetch,
): Promise<LiveResult> {
  const { live } = contract;
  if ('unavailableReason' in live) {
    return { status: 'skipped', reason: live.unavailableReason };
  }
  const missingEnv = (live.requiredEnv ?? []).filter((name) => !env[name]);
  if (missingEnv.length > 0) {
    return {
      status: 'skipped',
      request: live.description,
      reason: `Missing environment variables: ${missingEnv.join(', ')}`,
    };
  }

  let response: unknown;
  try {
    response = await fetchLiveResponse(
      live,
      env as Record<string, string>,
      fetchImpl,
    );
  } catch (error) {
    return {
      status: 'error',
      request: live.description,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  const accepted = new Map(
    (contract.acceptedLiveMismatches ?? []).map(({ path, reason }) => [
      path,
      reason,
    ]),
  );
  const grouped = groupMismatches(
    validator.validate(contract.consumerType, response),
    contract.shape,
  );

  return {
    status: 'checked',
    request: live.description,
    mismatches: grouped.filter((mismatch) => !accepted.has(mismatch.path)),
    acceptedMismatches: grouped.flatMap((mismatch) => {
      const reason = accepted.get(mismatch.path);
      return reason === undefined ? [] : [{ ...mismatch, reason }];
    }),
    shapeDiff: diffShapes(
      buildShapeProfile([response], contract.shape),
      buildShapeProfile(
        contract.mocks.map((mock) => mock.response),
        contract.shape,
      ),
    ),
  };
}

/**
 * Checks the mocks, then fetches a real response for every contract and
 * compares it with the consumer type (API drift) and with the mocks
 * (coverage gaps).
 *
 * @param options - Check options.
 * @param options.contracts - Contracts to check.
 * @param options.validator - Consumer type validator.
 * @param options.env - Environment used for requests that need credentials.
 * @param options.fetchImpl - Fetch implementation.
 * @returns The report.
 */
export async function checkContractsLive({
  contracts,
  validator,
  env,
  fetchImpl = fetch,
}: LiveCheckOptions): Promise<ContractsReport> {
  const reports = await Promise.all(
    contracts.map(async (contract) => ({
      ...toContractReport(contract, validator),
      live: await checkLive(contract, validator, env, fetchImpl),
    })),
  );
  return {
    mode: 'live',
    generatedAt: new Date().toISOString(),
    contracts: reports,
    summary: summarize(reports),
  };
}

/**
 * Maps a report to the script exit code.
 *
 * @param report - The report.
 * @param strict - Whether live coverage gaps count as drift.
 * @returns 2 when a live request failed, 1 on drift, 0 otherwise.
 */
export function getExitCode(report: ContractsReport, strict = false): ExitCode {
  const { invalidMocks, liveTypeDrift, liveCoverageGaps, liveErrors } =
    report.summary;
  if (liveErrors > 0) {
    return ExitCode.Failure;
  }
  if (
    invalidMocks > 0 ||
    liveTypeDrift > 0 ||
    (strict && liveCoverageGaps > 0)
  ) {
    return ExitCode.Drift;
  }
  return ExitCode.Ok;
}

function formatMismatch(mismatch: GroupedMismatch): string {
  const occurrences =
    mismatch.occurrences > 1
      ? ` (${mismatch.occurrences} occurrences, e.g. \`${mismatch.example}\`)`
      : '';
  return `  - \`${mismatch.path}\`: ${mismatch.message}${occurrences}`;
}

function formatMismatches(mismatches: GroupedMismatch[]): string[] {
  const lines = mismatches
    .slice(0, MAX_MISMATCHES_PER_ITEM_IN_REPORT)
    .map(formatMismatch);
  if (mismatches.length > MAX_MISMATCHES_PER_ITEM_IN_REPORT) {
    lines.push(
      `  - …and ${mismatches.length - MAX_MISMATCHES_PER_ITEM_IN_REPORT} more`,
    );
  }
  return lines;
}

function formatShapeDiff(diff: ShapeDiff): string[] {
  const lines: string[] = [];
  if (diff.uncoveredKinds.length > 0) {
    lines.push('- Value kinds the live API returns but no mock contains:');
    lines.push(
      ...diff.uncoveredKinds.map(
        ({ path, live, mocks }) =>
          `  - \`${path}\`: live ${live.join(' | ')}, mocks ${mocks.join(' | ')}`,
      ),
    );
  }
  if (diff.uncoveredHighPrecision.length > 0) {
    lines.push(
      `- Numbers with more than ${MAX_SAFE_SIGNIFICANT_DIGITS} significant digits that no mock contains (BigNumber.js throws on these when passed as numbers):`,
    );
    lines.push(...diff.uncoveredHighPrecision.map((path) => `  - \`${path}\``));
  }
  if (diff.missingInMocks.length > 0) {
    lines.push('- Fields the live API returns but no mock contains:');
    lines.push(...diff.missingInMocks.map((path) => `  - \`${path}\``));
  }
  if (diff.onlyInMocks.length > 0) {
    lines.push(
      '- Fields only the mocks contain (absent from the sampled live response):',
    );
    lines.push(...diff.onlyInMocks.map((path) => `  - \`${path}\``));
  }
  return lines;
}

function formatLive(live: LiveResult): string[] {
  const request = live.request ? ` — \`${live.request}\`` : '';
  switch (live.status) {
    case 'skipped':
      return [`**Live:** skipped${request}. ${live.reason}`];
    case 'error':
      return [`**Live:** ❌ request failed${request}: ${live.error}`];
    case 'checked': {
      const lines: string[] = [];
      if (live.mismatches.length > 0) {
        lines.push(
          `**Live:** ❌ the API response does not match the consumer type${request}`,
          ...formatMismatches(live.mismatches),
        );
      } else {
        lines.push(`**Live:** ✅ matches the consumer type${request}`);
      }
      if (live.acceptedMismatches.length > 0) {
        lines.push(
          '',
          '**Accepted live mismatches** (known, not failing the check):',
          ...live.acceptedMismatches.map(
            (mismatch) => `${formatMismatch(mismatch)} — ${mismatch.reason}`,
          ),
        );
      }
      if (!isShapeDiffEmpty(live.shapeDiff)) {
        lines.push(
          '',
          '**Mock coverage gaps** (live response vs. mocks):',
          ...formatShapeDiff(live.shapeDiff),
        );
      }
      return lines;
    }
    default:
      return [];
  }
}

/**
 * Renders a report as Markdown (used for the CI job summary).
 *
 * @param report - The report.
 * @returns Markdown.
 */
export function formatReportMarkdown(report: ContractsReport): string {
  const { summary } = report;
  const lines = [
    `# E2E API mock contracts (${report.mode})`,
    '',
    `Generated at ${report.generatedAt}. See \`test/e2e/api-contracts/README.md\`.`,
    '',
    '| Check | Result |',
    '| --- | --- |',
    `| Mocks not matching the consumer type | ${summary.invalidMocks} |`,
  ];
  if (report.mode === 'live') {
    lines.push(
      `| Live responses not matching the consumer type | ${summary.liveTypeDrift} |`,
      `| Live responses with mock coverage gaps | ${summary.liveCoverageGaps} |`,
      `| Live requests that failed | ${summary.liveErrors} |`,
    );
  }

  for (const contract of report.contracts) {
    lines.push(
      '',
      `## \`${contract.id}\``,
      '',
      `\`${contract.endpoint}\` → \`${contract.consumerType}\`, consumed by ${contract.consumedBy}`,
    );
    if (contract.relatedIssues.length > 0) {
      lines.push('', `Related: ${contract.relatedIssues.join(', ')}`);
    }
    lines.push('');
    for (const mock of contract.mocks) {
      if (mock.mismatches.length === 0) {
        lines.push(`- ✅ mock \`${mock.name}\` (${mock.source})`);
      } else {
        lines.push(
          `- ❌ mock \`${mock.name}\` (${mock.source})`,
          ...formatMismatches(mock.mismatches),
        );
      }
    }
    if (contract.live) {
      lines.push('', ...formatLive(contract.live));
    }
  }
  return `${lines.join('\n')}\n`;
}

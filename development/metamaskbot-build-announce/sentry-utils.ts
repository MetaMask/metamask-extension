/** Parsed DSN for Sentry Logs Explorer URLs. */
export type ParsedSentryDsn = {
  projectId: string;
  organization: string;
  useRootSentryHost: boolean;
};

function projectIdFromPathname(pathname: string): string | null {
  const id = pathname.replace(/^\//u, '').split('/')[0]?.trim() ?? '';
  return id || null;
}

/**
 * Maps DSN hostname to org subdomain + whether to use `https://sentry.io/explore/logs/`.
 * Returns null if the host is not a supported Sentry cloud shape.
 * @param hostname
 */
function sentryHostForExplorer(hostname: string): {
  organization: string;
  useRootSentryHost: boolean;
} | null {
  const lower = hostname.toLowerCase();
  if (lower === 'sentry.io') {
    return { organization: '', useRootSentryHost: true };
  }
  if (!lower.endsWith('.sentry.io')) {
    return null;
  }
  const organization = hostname.split('.')[0];
  return organization ? { organization, useRootSentryHost: false } : null;
}

/**
 * Parses a Sentry DSN string for use with {@link buildPerformanceSentryLogsUrl}.
 * @param dsn
 */
export function parseSentryDSN(dsn: string): ParsedSentryDsn | null {
  try {
    const url = new URL(dsn);
    const projectId = projectIdFromPathname(url.pathname);
    if (!projectId) {
      return null;
    }
    const host = sentryHostForExplorer(url.hostname);
    if (!host) {
      return null;
    }
    return { projectId, ...host };
  } catch {
    return null;
  }
}

/**
 * Branch token for `ci.branch:` in Logs Explorer (quote if `/` or spaces).
 * @param branch
 */
function formatCiBranchFilterToken(branch: string): string {
  const trimmed = branch.trim();
  if (!trimmed) {
    return trimmed;
  }
  return /[/\s]/u.test(trimmed)
    ? `"${trimmed.replace(/\\/gu, '\\\\').replace(/"/gu, '\\"')}"`
    : trimmed;
}

/**
 * Sentry Logs Explorer URL for the performance project (`SENTRY_DSN_PERFORMANCE`), with branch and optional CI filters.
 *
 * @param branchName
 * @param options
 * @param options.browser
 * @param options.buildType
 * @param options.logMessage - Exact log message string to match (same as send-to-sentry: `${benchmarkType}.${jsonKey}`).
 * @param options.orBranches - Extra `ci.branch` values OR'd with `branchName` (deduped).
 * @returns `null` if DSN is missing/invalid or if no non-empty branch remains after trim/dedupe.
 */
export function buildPerformanceSentryLogsUrl(
  branchName: string,
  options?: {
    browser?: string;
    buildType?: string;
    logMessage?: string;
    orBranches?: string[];
  },
): string | null {
  const dsn = process.env.SENTRY_DSN_PERFORMANCE;
  if (!dsn) {
    return null;
  }

  const parsed = parseSentryDSN(dsn);
  if (!parsed) {
    return null;
  }

  const { organization, projectId, useRootSentryHost } = parsed;

  const branchParts = [
    branchName.trim(),
    ...(options?.orBranches ?? []).map((b) => b.trim()),
  ].filter((b) => b.length > 0);
  const uniqueBranches = [...new Set(branchParts)];

  if (uniqueBranches.length === 0) {
    return null;
  }

  const branchFilter =
    uniqueBranches.length === 1
      ? `ci.branch:${formatCiBranchFilterToken(uniqueBranches[0])}`
      : `(${uniqueBranches
          .map((b) => `ci.branch:${formatCiBranchFilterToken(b)}`)
          .join(' OR ')})`;

  const filters: string[] = [branchFilter];
  if (options?.browser) {
    filters.push(`ci.browser:${options.browser}`);
  }
  if (options?.buildType) {
    filters.push(`ci.buildType:${options.buildType}`);
  }
  if (options?.logMessage) {
    filters.push(`message:${options.logMessage}`);
  }

  const params = new URLSearchParams({
    logsQuery: filters.join(' '),
    logsSortBys: '-timestamp',
    project: projectId,
    statsPeriod: '2w',
  });
  params.append('logsFields', 'timestamp');
  params.append('logsFields', 'message');

  const base = useRootSentryHost
    ? 'https://sentry.io/explore/logs/'
    : `https://${organization}.sentry.io/explore/logs/`;

  return `${base}?${params.toString()}`;
}

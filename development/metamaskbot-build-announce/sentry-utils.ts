/**
 * Parses a Sentry DSN and extracts the organization and project ID.
 *
 * @param dsn - Sentry DSN URL
 * @returns Object containing organization and projectId, or null if parsing fails
 */
export function parseSentryDSN(
  dsn: string,
): { organization: string; projectId: string } | null {
  try {
    const url = new URL(dsn);
    const { hostname } = url;

    const orgMatch = hostname.match(/^([^.]+)\.(?:ingest\.)?sentry\.io$/u);
    if (!orgMatch) {
      return null;
    }

    const projectId = url.pathname.replace(/^\//u, '');
    if (!projectId) {
      return null;
    }

    return {
      organization: orgMatch[1],
      projectId,
    };
  } catch {
    return null;
  }
}

/**
 * Generates a Sentry Logs Explorer URL pre-filtered for a specific branch.
 *
 * @param branchName - Git branch name to filter logs by
 * @param [sentryDsn] - Optional Sentry DSN to extract org/project from (defaults to SENTRY_DSN_PERFORMANCE env var)
 * @param [options] - Additional filter options
 * @param [options.browser] - Browser platform (e.g., 'chrome', 'firefox')
 * @param [options.buildType] - Build type (e.g., 'browserify', 'webpack')
 * @param [options.benchmarkName] - Specific benchmark name to filter by (uses message:Contains filter)
 * @returns Sentry Logs Explorer URL with filters, or null if DSN is not available or invalid
 */
export function buildSentryLogsUrl(
  branchName: string,
  sentryDsn?: string,
  options?: {
    browser?: string;
    buildType?: string;
    benchmarkName?: string;
  },
): string | null {
  const dsn = sentryDsn || process.env.SENTRY_DSN_PERFORMANCE;

  if (!dsn) {
    return null;
  }

  const parsed = parseSentryDSN(dsn);
  if (!parsed) {
    return null;
  }

  const { organization, projectId } = parsed;

  const filters: string[] = [`ci.branch:${branchName}`];

  if (options?.browser) {
    filters.push(`ci.browser:${options.browser}`);
  }

  if (options?.buildType) {
    filters.push(`ci.buildType:${options.buildType}`);
  }

  if (options?.benchmarkName) {
    filters.push(`message:Contains benchmark.${options.benchmarkName}`);
  }

  const params = new URLSearchParams({
    logsQuery: filters.join(' '),
    logsSortBys: '-timestamp',
    project: projectId,
    statsPeriod: '2w',
  });

  params.append('logsFields', 'timestamp');
  params.append('logsFields', 'message');

  return `https://${organization}.sentry.io/explore/logs/?${params.toString()}`;
}

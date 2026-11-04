import { strict as assert } from 'assert';
import { promises as fs } from 'fs';
import path from 'path';
import { CompletedRequest, Mockttp } from 'mockttp';
import {
  browserAPIRequestDomains,
  SENTRY_PERFORMANCE_ENVELOPE_URL,
} from '../../mock-e2e';

const KNOWN_VIOLATIONS_FILE_NAME =
  'basic-functionality-off-known-violations.json';

const ONBOARDING_ALLOWLIST_FILE_NAME = 'onboarding-allowlist.json';

type OnboardingAllowlist = {
  /**
   * Hosts allowed during onboarding: every request from the moment the test
   * starts until just before clicking "Done" on the onboarding complete page.
   */
  duringOnboarding: string[];
  /**
   * Hosts allowed on top of `duringOnboarding` when the user opts in to
   * MetaMetrics during onboarding.
   */
  additionalDuringOnboardingWithMetaMetrics: string[];
};

/**
 * Records the host of every request made through the mock server.
 *
 * @param server - The mock server proxying all extension traffic.
 * @returns The set of requested hosts, updated as requests come in.
 */
export function recordRequestedHosts(server: Mockttp): Set<string> {
  const requestedHosts = new Set<string>();
  server.on('request-initiated', (request) => {
    const { host } = request.headers;
    if (host) {
      requestedHosts.add(host);
    }
  });
  return requestedHosts;
}

/**
 * Asserts that every requested host is in the `duringOnboarding` list of
 * onboarding-allowlist.json, plus the `additionalDuringOnboardingWithMetaMetrics` list
 * when the user opted in to MetaMetrics.
 *
 * @param requestedHosts - The set returned by `recordRequestedHosts`.
 * @param options - The options object.
 * @param options.withMetaMetrics - Whether the user opted in to MetaMetrics during onboarding.
 */
export async function assertOnlyOnboardingAllowlistedHosts(
  requestedHosts: Set<string>,
  { withMetaMetrics = false }: { withMetaMetrics?: boolean } = {},
): Promise<void> {
  const allowlistRaw = await fs.readFile(
    path.join(__dirname, ONBOARDING_ALLOWLIST_FILE_NAME),
    'utf8',
  );
  const allowlist: OnboardingAllowlist = JSON.parse(allowlistRaw);
  const duringOnboarding = withMetaMetrics
    ? [
        ...allowlist.duringOnboarding,
        ...allowlist.additionalDuringOnboardingWithMetaMetrics,
      ]
    : allowlist.duringOnboarding;

  console.log(
    'Hosts requested during onboarding:',
    JSON.stringify([...requestedHosts].sort(), null, 2),
  );

  const unexpectedHosts = [...requestedHosts].filter(
    (host) => !duringOnboarding.includes(host),
  );

  assert.equal(
    unexpectedHosts.length,
    0,
    `Unexpected network calls during onboarding:\n${unexpectedHosts
      .map((host) => `  - ${host}`)
      .join(
        '\n',
      )}\n\nThese hosts are NOT in the ${withMetaMetrics ? 'duringOnboarding or additionalDuringOnboardingWithMetaMetrics allowlists' : 'duringOnboarding allowlist'}.\nIf these are expected, add them to ${ONBOARDING_ALLOWLIST_FILE_NAME}`,
  );
}

/**
 * Hosts that are still contacted with basic functionality off. Every entry is
 * a bug: with the toggle off, only JSON-RPC requests to nodes are allowed.
 * Remove an entry once the underlying bug is fixed.
 */
type BasicFunctionalityOffKnownViolations = {
  knownViolations: string[];
};

/** Map of host to the set of `METHOD /pathname` requests seen for that host. */
export type NonRpcRequests = Map<string, Set<string>>;

async function loadKnownViolations(): Promise<BasicFunctionalityOffKnownViolations> {
  const knownViolationsRaw = await fs.readFile(
    path.join(__dirname, KNOWN_VIOLATIONS_FILE_NAME),
    'utf8',
  );
  return JSON.parse(knownViolationsRaw);
}

function isJsonRpcPayload(payload: unknown): boolean {
  const entries = Array.isArray(payload) ? payload : [payload];
  return (
    entries.length > 0 &&
    entries.every(
      (entry) =>
        typeof entry === 'object' &&
        entry !== null &&
        'jsonrpc' in entry &&
        'method' in entry,
    )
  );
}

/**
 * Records every request that is not a JSON-RPC call, ignoring requests the
 * browser itself makes and CI-only Sentry performance tracing.
 *
 * @param server - The mock server proxying all extension traffic.
 * @returns A function resolving to the recorded non-RPC requests.
 */
export function recordNonRpcRequests(
  server: Mockttp,
): () => Promise<NonRpcRequests> {
  const nonRpcRequests: NonRpcRequests = new Map();
  const pendingClassifications: Promise<void>[] = [];

  server.on('request', (request: CompletedRequest) => {
    pendingClassifications.push(
      (async () => {
        const { host } = request.headers;
        if (
          !host ||
          browserAPIRequestDomains.test(host) ||
          request.url.startsWith(SENTRY_PERFORMANCE_ENVELOPE_URL)
        ) {
          return;
        }
        if (
          request.method === 'POST' &&
          isJsonRpcPayload(await request.body.getJson())
        ) {
          return;
        }
        const requestsForHost = nonRpcRequests.get(host) ?? new Set<string>();
        requestsForHost.add(
          `${request.method} ${new URL(request.url).pathname}`,
        );
        nonRpcRequests.set(host, requestsForHost);
      })(),
    );
  });

  return async () => {
    await Promise.all(pendingClassifications);
    return nonRpcRequests;
  };
}

/**
 * Asserts that every recorded non-RPC request goes to a host listed in
 * basic-functionality-off-known-violations.json.
 *
 * @param getNonRpcRequests - The getter returned by `recordNonRpcRequests`.
 */
export async function assertNoNewNonRpcRequests(
  getNonRpcRequests: () => Promise<NonRpcRequests>,
): Promise<void> {
  const { knownViolations } = await loadKnownViolations();
  const nonRpcRequests = await getNonRpcRequests();

  console.log(
    'Non-RPC requests made with basic functionality off:',
    JSON.stringify(
      Object.fromEntries(
        [...nonRpcRequests].map(([host, requests]) => [host, [...requests]]),
      ),
      null,
      2,
    ),
  );

  const unexpectedRequests = [...nonRpcRequests].filter(
    ([host]) => !knownViolations.includes(host),
  );

  assert.equal(
    unexpectedRequests.length,
    0,
    `Unexpected non-RPC requests with basic functionality off:\n${unexpectedRequests
      .map(
        ([host, requests]) =>
          `  - ${host}\n${[...requests].map((request) => `      ${request}`).join('\n')}`,
      )
      .join(
        '\n',
      )}\n\nOnly JSON-RPC requests to nodes are allowed when basic functionality is off.\nIf this is a known bug that cannot be fixed yet, add the host to ${KNOWN_VIOLATIONS_FILE_NAME}.`,
  );
}

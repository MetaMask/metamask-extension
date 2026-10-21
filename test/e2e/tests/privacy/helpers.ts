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

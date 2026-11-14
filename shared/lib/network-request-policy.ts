import browser, { type DeclarativeNetRequest } from 'webextension-polyfill';

export type NetworkRequestRuleApi = Pick<
  DeclarativeNetRequest.Static,
  'updateSessionRules'
> & {
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Native Chrome API spelling.
  RuleConditionKeys?: Partial<Record<'TOP_DOMAINS', string>>;
};

// Reserved across UI and background contexts; startup clears abandoned grants.
export const TEMPORARY_RULE_PAIRS = Array.from({ length: 32 }, (_, index) => [
  1000100 + index * 2,
  1000101 + index * 2,
]);

/**
 * Detect native top-frame matching without submitting unsupported conditions.
 * @param dnr - Native DNR API.
 */
export function supportsTopDomains(dnr: NetworkRequestRuleApi): boolean {
  return dnr.RuleConditionKeys?.TOP_DOMAINS === 'topDomains';
}

/**
 * Build extension-scoped allowances for the supported request scopes.
 * @param options - API, extension identity, reserved IDs and request condition.
 * @param options.extensionId
 * @param options.dnr
 * @param options.ruleIds
 * @param options.condition
 */
export function createAllowRules({
  extensionId,
  dnr,
  ruleIds,
  condition,
}: {
  extensionId: string;
  dnr: NetworkRequestRuleApi;
  ruleIds: number[];
  condition: DeclarativeNetRequest.Rule['condition'];
}): DeclarativeNetRequest.Rule[] {
  const scopes = [
    'initiatorDomains',
    ...(supportsTopDomains(dnr) ? ['topDomains'] : []),
  ];
  return scopes.map((scope, index) => ({
    id: ruleIds[index],
    priority: 2,
    action: { type: 'allow' },
    condition: { ...condition, [scope]: [extensionId] },
  }));
}

/**
 * Temporarily allow an exact HTTP(S) URL in UI/background, including startup failure.
 * Awaits installation and revocation; Firefox calls the callback directly.
 * Other matching requests share the grant. Await all work: abandoned grants
 * persist until background initialization or browser-session end.
 *
 * @param url - Absolute HTTP(S) URL; no credentials, fragment ignored.
 * @param callback - Work to run while the allowance is active.
 * @param options - Cancellation options.
 * @param options.signal - Cancels acquisition; pass to fetch to cancel the request.
 * @returns The callback result after revocation.
 */
export async function withTemporaryAllowance<Result>(
  url: string,
  callback: () => Result | Promise<Result>,
  { signal }: { signal?: AbortSignal } = {},
): Promise<Result> {
  const endpoint = new URL(url);
  if (
    !['http:', 'https:'].includes(endpoint.protocol) ||
    endpoint.username ||
    endpoint.password
  ) {
    throw new Error(
      'Temporary network allowances require an HTTP(S) URL without credentials',
    );
  }
  endpoint.hash = '';
  signal?.throwIfAborted();
  if (browser.runtime.getManifest().manifest_version !== 3) {
    return await callback();
  }

  const dnr = browser.declarativeNetRequest;
  // Hold the cross-context lock only while allocating/installing rules. The
  // callback runs outside it, allowing concurrent and nested operations.
  const ruleIds = await navigator.locks.request(
    'network-request-policy-allocation',
    { signal },
    async () => {
      const occupiedIds = new Set(
        (await dnr.getSessionRules()).map(({ id }) => id),
      );
      signal?.throwIfAborted();
      const availablePair = TEMPORARY_RULE_PAIRS.find((pair) =>
        pair.every((id) => !occupiedIds.has(id)),
      );
      if (!availablePair) {
        throw new Error('Too many concurrent temporary network allowances');
      }
      const regexFilter = `^${endpoint.href.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')}$`;
      await dnr.updateSessionRules({
        addRules: createAllowRules({
          extensionId: browser.runtime.id,
          dnr,
          ruleIds: availablePair,
          condition: { regexFilter, isUrlFilterCaseSensitive: true },
        }),
      });
      return availablePair;
    },
  );
  try {
    // Native DNR updates cannot be cancelled. If installation finished after
    // cancellation, revoke the grant without starting the callback.
    signal?.throwIfAborted();
    return await callback();
  } finally {
    await dnr.updateSessionRules({ removeRuleIds: ruleIds });
  }
}

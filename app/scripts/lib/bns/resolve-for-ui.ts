/**
 * [BNES] H1.4 — Development / UI resolve entry.
 *
 * Returns a display DTO only. Callers must:
 *   - never render gateway HTML inside chrome-extension://
 *   - open gatewayUrl only in a normal browser tab if the user consents
 *   - treat renderInExtension === false as mandatory
 */

import {
  toBnsResolveDisplay,
  toBnsResolveError,
} from '../../../../shared/bns/display';
import type { BnsResolveDisplay } from '../../../../shared/bns/display';
import type { BnsResolverApi } from './create-bns-resolver';
import { getBnsResolver } from './setup';

export type ResolveBnesForUiOptions = {
  name: string;
  path?: string;
  /** Injectable resolver for tests; defaults to getBnsResolver(). */
  resolver?: BnsResolverApi | null;
};

/**
 * Resolve a .bnes name for UI/dev tools without navigating or embedding content.
 *
 * @param options - Name and optional path / resolver inject.
 * @returns Structured ok/error DTO with renderInExtension always false.
 */
export async function resolveBnesForUi(
  options: ResolveBnesForUiOptions,
): Promise<BnsResolveDisplay> {
  const active =
    options.resolver === undefined ? getBnsResolver() : options.resolver;

  if (active === null || active === undefined) {
    return toBnsResolveError(
      new Error('BNS resolver is not installed in background'),
      options.name,
    );
  }

  if (active.isConfigured() !== true) {
    return toBnsResolveError(
      new Error(
        'BNS registry address is not configured (fail closed until seeded)',
      ),
      options.name,
    );
  }

  try {
    const config = active.getConfig();
    const result = await active.resolve(options.name, options.path ?? '');
    return toBnsResolveDisplay(result, config.gatewayHost);
  } catch (error: unknown) {
    return toBnsResolveError(error, options.name);
  }
}

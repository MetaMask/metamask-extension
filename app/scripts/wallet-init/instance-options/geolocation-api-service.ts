import { Env } from '@metamask/geolocation-controller';
import type { WalletOptions } from '@metamask/wallet';
import { isProduction } from '../../../../shared/lib/environment';
import { TraceName } from '../../../../shared/lib/trace';
import { withOwnTraceWithoutCaller } from '../../lib/trace-without-caller';

type GeolocationApiServiceInstanceOptions = NonNullable<
  WalletOptions['instanceOptions']['geolocationApiService']
>;

/**
 * Builds the service options for the wallet-owned GeolocationApiService.
 *
 * @returns The GeolocationApiService instance options.
 */
export function getGeolocationApiServiceInstanceOptions(): GeolocationApiServiceInstanceOptions {
  return {
    env: isProduction() ? Env.PRD : Env.DEV,
    // Perps eligibility asks for the location at worker start, with no caller.
    fetch: withOwnTraceWithoutCaller(
      TraceName.GeolocationFetch,
      fetch.bind(globalThis),
    ),
  };
}

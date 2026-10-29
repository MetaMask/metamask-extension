import { Env } from '@metamask/geolocation-controller';
import type { WalletOptions } from '@metamask/wallet';
import { isProduction } from '../../../../shared/lib/environment';

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
    fetch: fetch.bind(globalThis),
  };
}

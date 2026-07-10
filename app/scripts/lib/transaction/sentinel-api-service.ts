import { Messenger } from '@metamask/messenger';
import {
  SentinelApiService,
  type SentinelApiServiceMessenger,
} from '@metamask/sentinel-api-service';

const CLIENT_ID = 'extension';

/**
 * Structural type for the `AuthenticationController:getBearerToken` action the
 * {@link SentinelApiService} calls to authenticate Sentinel requests. Declared
 * locally to avoid importing the full messenger surface here.
 */
type GetBearerTokenAction = {
  type: 'AuthenticationController:getBearerToken';
  handler: (entropySourceId?: string) => Promise<string>;
};

/**
 * Optional bearer token getter, set by the extension at init to authenticate
 * Sentinel and Transaction API calls via core-backend (AuthenticationController).
 */
let getBearerTokenForSentinel: (() => Promise<string | undefined>) | undefined;

/**
 * Lazily-constructed singleton {@link SentinelApiService}. The extension's
 * Sentinel and relay (gas station) helpers are module-level free functions with
 * no messenger context, so the service is owned here as a module singleton with
 * its own internal messenger tree.
 */
let sentinelApiService: SentinelApiService | undefined;

/**
 * Sets the bearer token getter for authenticating Sentinel and Transaction API
 * calls. Called once at extension init (e.g. from MetaMaskController) with
 * AuthenticationController.getBearerToken.
 *
 * @param getter - Async function that returns the current bearer token, or
 * undefined to clear.
 */
export function setSentinelApiAuth(
  getter: (() => Promise<string | undefined>) | undefined,
): void {
  getBearerTokenForSentinel = getter;
}

/**
 * Returns the shared {@link SentinelApiService}, constructing it on first use.
 * The service is wired with an `AuthenticationController:getBearerToken` handler
 * that delegates to the getter registered via {@link setSentinelApiAuth}, so
 * outbound Sentinel requests include an `Authorization` header when a token is
 * available.
 *
 * @returns The Sentinel API service.
 */
export function getSentinelApiService(): SentinelApiService {
  if (!sentinelApiService) {
    // The service authenticates via an `AuthenticationController:getBearerToken`
    // action. This module owns a standalone messenger tree, so the root
    // messenger is namespaced to `AuthenticationController` to register that
    // action, then delegates it to the service's child messenger.
    const rootMessenger = new Messenger<
      'AuthenticationController',
      GetBearerTokenAction,
      never
    >({
      namespace: 'AuthenticationController',
    });

    rootMessenger.registerActionHandler(
      'AuthenticationController:getBearerToken',
      async () => (await getBearerTokenForSentinel?.()) ?? '',
    );

    const messenger = new Messenger({
      namespace: 'SentinelApiService',
      parent: rootMessenger,
    }) as unknown as SentinelApiServiceMessenger;

    rootMessenger.delegate({
      messenger,
      actions: ['AuthenticationController:getBearerToken'],
    });

    sentinelApiService = new SentinelApiService({
      messenger,
      clientId: CLIENT_ID,
      clientVersion: process.env.METAMASK_VERSION,
    });
  }

  return sentinelApiService;
}

/**
 * Resets the shared {@link SentinelApiService} singleton. Intended for use in
 * tests so that the cached network registry and auth wiring do not leak between
 * cases.
 */
export function resetSentinelApiService(): void {
  sentinelApiService?.destroy();
  sentinelApiService = undefined;
}

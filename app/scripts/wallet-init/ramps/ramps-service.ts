import {
  Messenger,
  type MessengerActions,
  type MessengerEvents,
} from '@metamask/messenger';
import {
  RampsService,
  RampsServiceMessenger,
} from '@metamask/ramps-controller';
import type { RootMessenger, WalletOptions } from '@metamask/wallet';

import type { RampsServiceInstanceOptions } from './types';

/**
 * The element type of the wallet's `initializationConfigurations` array. The
 * `InitializationConfiguration<unknown, unknown>` type is not exported from
 * `@metamask/wallet` directly, so we recover it from the public `WalletOptions`
 * type. Typing the config as this exact type guarantees assignability when it is
 * passed to `new Wallet(...)`.
 */
type WalletInitializationConfiguration = NonNullable<
  WalletOptions['initializationConfigurations']
>[number];

/**
 * The root messenger widened to the actions and events this service's messenger
 * needs. The wallet types the `getMessenger` parent with only the default
 * actions/events, but the live root messenger also carries the authentication
 * action delegated below. This matches the pattern used by the extension's
 * other restricted messengers (e.g. `getNameControllerMessenger`).
 */
type RampsServiceRootMessenger = RootMessenger<
  MessengerActions<RampsServiceMessenger>,
  MessengerEvents<RampsServiceMessenger>
>;

export const rampsService: WalletInitializationConfiguration = {
  name: 'RampsService',
  init: ({ messenger, options }) =>
    new RampsService({
      messenger: messenger as RampsServiceMessenger,
      environment: (options as RampsServiceInstanceOptions).environment,
      context: (options as RampsServiceInstanceOptions).context,
      fetch: (options as RampsServiceInstanceOptions).fetch,
      policyOptions: (options as RampsServiceInstanceOptions).policyOptions,
      baseUrlOverride: (options as RampsServiceInstanceOptions).baseUrlOverride,
    }),
  getMessenger: (parent) => {
    const rootMessenger = parent as unknown as RampsServiceRootMessenger;
    const messenger: RampsServiceMessenger = new Messenger({
      namespace: 'RampsService',
      parent: rootMessenger,
    });

    rootMessenger.delegate({
      messenger,
      actions: ['AuthenticationController:getBearerToken'],
      events: [],
    });

    return messenger;
  },
};

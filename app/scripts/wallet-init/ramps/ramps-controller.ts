import {
  Messenger,
  type MessengerActions,
  type MessengerEvents,
} from '@metamask/messenger';
import {
  RampsController,
  RampsControllerMessenger,
  RAMPS_CONTROLLER_REQUIRED_SERVICE_ACTIONS,
} from '@metamask/ramps-controller';
import type { Json } from '@metamask/utils';
import type { RootMessenger, WalletOptions } from '@metamask/wallet';

import type { RampsControllerInstanceOptions } from './types';

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
 * The root messenger widened to the actions and events this controller's
 * messenger needs. The wallet types the `getMessenger` parent with only the
 * default actions/events, but the live root messenger also carries the ramps
 * service actions delegated below. This matches the pattern used by the
 * extension's other restricted messengers (e.g. `getNameControllerMessenger`).
 */
type RampsControllerRootMessenger = RootMessenger<
  MessengerActions<RampsControllerMessenger>,
  MessengerEvents<RampsControllerMessenger>
>;

export const rampsController: WalletInitializationConfiguration = {
  name: 'RampsController',
  init: ({ state, messenger, options }) =>
    new RampsController({
      messenger: messenger as RampsControllerMessenger,
      state: (state as Record<string, Json> | undefined) ?? {},
      requestCacheTTL: (options as RampsControllerInstanceOptions)
        .requestCacheTTL,
      requestCacheMaxSize: (options as RampsControllerInstanceOptions)
        .requestCacheMaxSize,
    }),
  getMessenger: (parent) => {
    const rootMessenger = parent as unknown as RampsControllerRootMessenger;
    const messenger: RampsControllerMessenger = new Messenger({
      namespace: 'RampsController',
      parent: rootMessenger,
    });

    rootMessenger.delegate({
      messenger,
      actions: [...RAMPS_CONTROLLER_REQUIRED_SERVICE_ACTIONS],
      events: [],
    });

    return messenger;
  },
};

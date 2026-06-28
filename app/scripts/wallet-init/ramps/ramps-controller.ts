import { Messenger } from '@metamask/messenger';
import {
  RampsController,
  RampsControllerMessenger,
  RAMPS_CONTROLLER_REQUIRED_SERVICE_ACTIONS,
} from '@metamask/ramps-controller';
import type { Json } from '@metamask/utils';

import type { RampsControllerInstanceOptions } from './types';

// Method shorthand (not arrow property) is required so this type is bivariant
// and assignable to InitializationConfiguration<unknown, unknown>[].
export type RampsControllerInitializationConfiguration = {
  name: 'RampsController';
  init(args: {
    messenger: RampsControllerMessenger;
    state?: Record<string, Json>;
    options: RampsControllerInstanceOptions;
  }): RampsController;
  getMessenger(parent: any): RampsControllerMessenger;
};

export const rampsController: RampsControllerInitializationConfiguration = {
  name: 'RampsController',
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  init: ({ state, messenger, options }: any): RampsController =>
    new RampsController({
      messenger: messenger as RampsControllerMessenger,
      state: (state as Record<string, Json> | undefined) ?? {},
      requestCacheTTL: (options as RampsControllerInstanceOptions)
        .requestCacheTTL,
      requestCacheMaxSize: (options as RampsControllerInstanceOptions)
        .requestCacheMaxSize,
    }),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getMessenger: (parent: any): RampsControllerMessenger => {
    const messenger: RampsControllerMessenger = new Messenger({
      namespace: 'RampsController',
      parent,
    });

    parent.delegate({
      messenger,
      actions: [...RAMPS_CONTROLLER_REQUIRED_SERVICE_ACTIONS],
      events: [],
    });

    return messenger;
  },
};

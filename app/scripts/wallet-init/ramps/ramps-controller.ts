import { Messenger } from '@metamask/messenger';
import {
  RampsController,
  RampsControllerMessenger,
  RAMPS_CONTROLLER_REQUIRED_SERVICE_ACTIONS,
} from '@metamask/ramps-controller';
import type { Json } from '@metamask/utils';
import type {
  DefaultActions,
  DefaultEvents,
  RootMessenger,
} from '@metamask/wallet';

import type { RampsControllerInstanceOptions } from './types';

export type RampsControllerInitializationConfiguration = {
  name: 'RampsController';
  init(args: {
    messenger: RampsControllerMessenger;
    state?: Record<string, Json>;
    options: RampsControllerInstanceOptions;
  }): RampsController;
  getMessenger(
    parent: RootMessenger<DefaultActions, DefaultEvents>,
  ): RampsControllerMessenger;
};

export const rampsController: RampsControllerInitializationConfiguration = {
  name: 'RampsController',
  init: ({ state, messenger, options }) =>
    new RampsController({
      messenger,
      state: state ?? {},
      requestCacheTTL: options.requestCacheTTL,
      requestCacheMaxSize: options.requestCacheMaxSize,
    }),
  getMessenger: (parent) => {
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

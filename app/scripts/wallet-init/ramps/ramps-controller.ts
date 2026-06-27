import { Messenger } from '@metamask/messenger';
import {
  RampsController,
  RampsControllerMessenger,
  RAMPS_CONTROLLER_REQUIRED_SERVICE_ACTIONS,
} from '@metamask/ramps-controller';
import type { Json } from '@metamask/utils';

import type { RampsControllerInstanceOptions } from './types';

export const rampsController = {
  name: 'RampsController' as const,
  init: ({
    state,
    messenger,
    options,
  }: {
    messenger: RampsControllerMessenger;
    state?: Record<string, Json>;
    options: RampsControllerInstanceOptions;
  }): RampsController =>
    new RampsController({
      messenger,
      state: state ?? {},
      requestCacheTTL: options.requestCacheTTL,
      requestCacheMaxSize: options.requestCacheMaxSize,
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

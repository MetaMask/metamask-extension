import { Messenger } from '@metamask/messenger';
import {
  RampsService,
  RampsServiceMessenger,
} from '@metamask/ramps-controller';

import type { RampsServiceInstanceOptions } from './types';

// Method shorthand (not arrow property) is required so this type is bivariant
// and assignable to InitializationConfiguration<unknown, unknown>[].
export type RampsServiceInitializationConfiguration = {
  name: 'RampsService';
  init(args: {
    messenger: RampsServiceMessenger;
    options: RampsServiceInstanceOptions;
  }): RampsService;
  getMessenger(parent: any): RampsServiceMessenger;
};

export const rampsService: RampsServiceInitializationConfiguration = {
  name: 'RampsService',
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  init: ({ messenger, options }: any): RampsService =>
    new RampsService({
      messenger: messenger as RampsServiceMessenger,
      environment: (options as RampsServiceInstanceOptions).environment,
      context: (options as RampsServiceInstanceOptions).context,
      fetch: (options as RampsServiceInstanceOptions).fetch,
      policyOptions: (options as RampsServiceInstanceOptions).policyOptions,
      baseUrlOverride: (options as RampsServiceInstanceOptions).baseUrlOverride,
    }),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getMessenger: (parent: any): RampsServiceMessenger => {
    const messenger: RampsServiceMessenger = new Messenger({
      namespace: 'RampsService',
      parent,
    });

    parent.delegate({
      messenger,
      actions: ['AuthenticationController:getBearerToken'],
      events: [],
    });

    return messenger;
  },
};

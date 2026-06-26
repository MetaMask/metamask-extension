import { Messenger } from '@metamask/messenger';
import {
  RampsService,
  RampsServiceMessenger,
} from '@metamask/ramps-controller';

import type { RampsServiceInstanceOptions } from './types';

export type RampsServiceInitializationConfiguration = {
  name: 'RampsService';
  init: (args: {
    messenger: RampsServiceMessenger;
    options: RampsServiceInstanceOptions;
  }) => RampsService;
  getMessenger: (parent: Messenger) => RampsServiceMessenger;
};

export const rampsService: RampsServiceInitializationConfiguration = {
  name: 'RampsService',
  init: ({ messenger, options }) =>
    new RampsService({
      messenger,
      environment: options.environment,
      context: options.context,
      fetch: options.fetch,
      policyOptions: options.policyOptions,
      baseUrlOverride: options.baseUrlOverride,
    }),
  getMessenger: (parent) => {
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

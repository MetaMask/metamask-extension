import { Messenger } from '@metamask/messenger';
import {
  RampsService,
  RampsServiceMessenger,
} from '@metamask/ramps-controller';

import type { RampsServiceInstanceOptions } from './types';

export const rampsService = {
  name: 'RampsService' as const,
  init: ({
    messenger,
    options,
  }: {
    messenger: RampsServiceMessenger;
    options: RampsServiceInstanceOptions;
  }): RampsService =>
    new RampsService({
      messenger,
      environment: options.environment,
      context: options.context,
      fetch: options.fetch,
      policyOptions: options.policyOptions,
      baseUrlOverride: options.baseUrlOverride,
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

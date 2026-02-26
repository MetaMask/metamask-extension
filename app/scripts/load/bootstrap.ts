/* eslint-disable @typescript-eslint/no-require-imports */
// WARNING: This code runs outside of LavaMoat

import { getBooleanFlag } from '../../../shared/lib/common-utils';

// The root compartment will populate this with hooks
global.stateHooks = {} as typeof stateHooks;

if (getBooleanFlag(process.env.ENABLE_SENTRY)) {
  require('../sentry-install');
}

require('../init-globals');

export {};

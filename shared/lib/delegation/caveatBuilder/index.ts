import type { DeleGatorEnvironment } from '..';

import { allowedMethods, allowedMethodsBuilder } from './allowedMethodsBuilder';
import { allowedTargets, allowedTargetsBuilder } from './allowedTargetsBuilder';
import { CaveatBuilder, CaveatBuilderConfig } from './caveatBuilder';
import {
  allowedCalldata,
  allowedCalldataBuilder,
} from './allowedCalldataBuilder';
import { limitedCalls, limitedCallsBuilder } from './limitedCallsBuilder';

export { resolveCaveats } from './caveatBuilder';
export type { Caveats, CaveatBuilderConfig } from './caveatBuilder';
export { CaveatBuilder } from './caveatBuilder';

export const createCaveatBuilder = (
  environment: DeleGatorEnvironment,
  config?: CaveatBuilderConfig,
) => {
  const caveatBuilder = new CaveatBuilder(environment, config)
    .extend(allowedMethods, allowedMethodsBuilder)
    .extend(allowedTargets, allowedTargetsBuilder)
    .extend(allowedCalldata, allowedCalldataBuilder)
    .extend(limitedCalls, limitedCallsBuilder);
  return caveatBuilder;
};

export type CoreCaveatBuilder = ReturnType<typeof createCaveatBuilder>;

import type { DeleGatorEnvironment } from '..';

import {
  allowedCalldata,
  allowedCalldataBuilder,
} from './allowedCalldataBuilder';
import { allowedMethods, allowedMethodsBuilder } from './allowedMethodsBuilder';
import { allowedTargets, allowedTargetsBuilder } from './allowedTargetsBuilder';
import { CaveatBuilder, CaveatBuilderConfig } from './caveatBuilder';
import { limitedCalls, limitedCallsBuilder } from './limitedCallsBuilder';
import { redeemer, redeemerBuilder } from './redeemerBuilder';

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
    .extend(limitedCalls, limitedCallsBuilder)
    .extend(redeemer, redeemerBuilder);
  return caveatBuilder;
};

export type CoreCaveatBuilder = ReturnType<typeof createCaveatBuilder>;

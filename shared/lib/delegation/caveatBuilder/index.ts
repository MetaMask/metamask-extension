import type { DeleGatorEnvironment } from '..';
import {
  allowedCalldata,
  allowedCalldataBuilder,
} from './allowedCalldataBuilder';
import { allowedMethods, allowedMethodsBuilder } from './allowedMethodsBuilder';
import { allowedTargets, allowedTargetsBuilder } from './allowedTargetsBuilder';
import { CaveatBuilder, CaveatBuilderConfig } from './caveatBuilder';
import {
  erc1155BalanceChange,
  erc1155BalanceChangeBuilder,
} from './erc1155BalanceChangeBuilder';
import {
  erc20BalanceChange,
  erc20BalanceChangeBuilder,
} from './erc20BalanceChangeBuilder';
import {
  erc721BalanceChange,
  erc721BalanceChangeBuilder,
} from './erc721BalanceChangeBuilder';
import { exactExecution, exactExecutionBuilder } from './exactExecutionBuilder';
import { limitedCalls, limitedCallsBuilder } from './limitedCallsBuilder';
import {
  nativeBalanceChange,
  nativeBalanceChangeBuilder,
} from './nativeBalanceChangeBuilder';
import { redeemer, redeemerBuilder } from './redeemerBuilder';
import {
  specificActionERC20TransferBatch,
  specificActionERC20TransferBatchBuilder,
} from './specificActionERC20TransferBatchBuilder';

export { CaveatBuilder, resolveCaveats } from './caveatBuilder';
export type { CaveatBuilderConfig, Caveats } from './caveatBuilder';

export const createCaveatBuilder = (
  environment: DeleGatorEnvironment,
  config?: CaveatBuilderConfig,
) => {
  const caveatBuilder = new CaveatBuilder(environment, config)
    .extend(allowedMethods, allowedMethodsBuilder)
    .extend(allowedTargets, allowedTargetsBuilder)
    .extend(allowedCalldata, allowedCalldataBuilder)
    .extend(erc1155BalanceChange, erc1155BalanceChangeBuilder)
    .extend(erc20BalanceChange, erc20BalanceChangeBuilder)
    .extend(erc721BalanceChange, erc721BalanceChangeBuilder)
    .extend(exactExecution, exactExecutionBuilder)
    .extend(limitedCalls, limitedCallsBuilder)
    .extend(nativeBalanceChange, nativeBalanceChangeBuilder)
    .extend(
      specificActionERC20TransferBatch,
      specificActionERC20TransferBatchBuilder,
    )
    .extend(redeemer, redeemerBuilder);
  return caveatBuilder;
};

export type CoreCaveatBuilder = ReturnType<typeof createCaveatBuilder>;

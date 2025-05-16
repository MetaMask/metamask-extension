import { DELEGATOR_CONTRACTS } from '@metamask/delegation-deployments';
import type { Hex } from './utils';

/**
 * A version agnostic blob of contract addresses required for the DeleGator system to function.
 */
export type DeleGatorEnvironment = {
  DelegationManager: Hex;
  EIP7702StatelessDeleGatorImpl: Hex;
  EntryPoint: Hex;
  SimpleFactory: Hex;
  implementations: {
    [implementation: string]: Hex;
  };
  caveatEnforcers: {
    [enforcer: string]: Hex;
  };
};

type SupportedVersion = '1.0.0' | '1.1.0' | '1.2.0' | '1.3.0';
export const PREFERRED_VERSION: SupportedVersion = '1.3.0';

export function getDeleGatorEnvironment(
  chainId: number,
  version: SupportedVersion = PREFERRED_VERSION,
) {
  const c = DELEGATOR_CONTRACTS[version]?.[chainId];
  if (!c) {
    throw new Error(
      `No contracts found for version ${version} chain ${chainId}`,
    );
  }
  return {
    EIP7702StatelessDeleGatorImpl: c.EIP7702StatelessDeleGatorImpl,
    DelegationManager: c.DelegationManager,
    EntryPoint: c.EntryPoint,
    SimpleFactory: c.SimpleFactory,
    implementations: {
      MultiSigDeleGatorImpl: c.MultiSigDeleGatorImpl,
      HybridDeleGatorImpl: c.HybridDeleGatorImpl,
    },
    caveatEnforcers: {
      AllowedCalldataEnforcer: c.AllowedCalldataEnforcer,
      AllowedMethodsEnforcer: c.AllowedMethodsEnforcer,
      AllowedTargetsEnforcer: c.AllowedTargetsEnforcer,
      ArgsEqualityCheckEnforcer: c.ArgsEqualityCheckEnforcer,
      BlockNumberEnforcer: c.BlockNumberEnforcer,
      DeployedEnforcer: c.DeployedEnforcer,
      ERC20BalanceGteEnforcer: c.ERC20BalanceGteEnforcer,
      ERC20TransferAmountEnforcer: c.ERC20TransferAmountEnforcer,
      ERC20StreamingEnforcer: c.ERC20StreamingEnforcer,
      ERC721BalanceGteEnforcer: c.ERC721BalanceGteEnforcer,
      ERC721TransferEnforcer: c.ERC721TransferEnforcer,
      ERC1155BalanceGteEnforcer: c.ERC1155BalanceGteEnforcer,
      IdEnforcer: c.IdEnforcer,
      LimitedCallsEnforcer: c.LimitedCallsEnforcer,
      NonceEnforcer: c.NonceEnforcer,
      TimestampEnforcer: c.TimestampEnforcer,
      ValueLteEnforcer: c.ValueLteEnforcer,
      NativeTokenTransferAmountEnforcer: c.NativeTokenTransferAmountEnforcer,
      NativeBalanceGteEnforcer: c.NativeBalanceGteEnforcer,
      NativeTokenStreamingEnforcer: c.NativeTokenStreamingEnforcer,
      NativeTokenPaymentEnforcer: c.NativeTokenPaymentEnforcer,
      OwnershipTransferEnforcer: c.OwnershipTransferEnforcer,
      RedeemerEnforcer: c.RedeemerEnforcer,
      SpecificActionERC20TransferBatchEnforcer:
        c.SpecificActionERC20TransferBatchEnforcer,
      ERC20PeriodTransferEnforcer: c.ERC20PeriodTransferEnforcer,
      NativeTokenPeriodTransferEnforcer: c.NativeTokenPeriodTransferEnforcer,
      ExactCalldataBatchEnforcer: c.ExactCalldataBatchEnforcer,
      ExactCalldataEnforcer: c.ExactCalldataEnforcer,
      ExactExecutionEnforcer: c.ExactExecutionEnforcer,
      ExactExecutionBatchEnforcer: c.ExactExecutionBatchEnforcer,
    },
  } as DeleGatorEnvironment;
}

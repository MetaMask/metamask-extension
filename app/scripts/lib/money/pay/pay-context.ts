import { Web3Provider, type ExternalProvider } from '@ethersproject/providers';
import type { AccountsControllerGetSelectedAccountAction } from '@metamask/accounts-controller';
import type { DelegationControllerSignDelegationAction } from '@metamask/delegation-controller';
import type { KeyringControllerSignEip7702AuthorizationAction } from '@metamask/keyring-controller';
import type { Messenger } from '@metamask/messenger';
import type { MoneyAccountControllerGetMoneyAccountAction } from '@metamask/money-account-controller';
import type {
  NetworkControllerFindNetworkClientIdByChainIdAction,
  NetworkControllerGetNetworkClientByIdAction,
} from '@metamask/network-controller';
import type { RemoteFeatureFlagControllerGetStateAction } from '@metamask/remote-feature-flag-controller';
import type {
  TransactionControllerAddTransactionBatchAction,
  TransactionControllerGetNonceLockAction,
  TransactionControllerGetStateAction,
  TransactionControllerIsAtomicBatchSupportedAction,
  TransactionControllerUpdateTransactionMetadataAction,
} from '@metamask/transaction-controller';
import type { Hex } from '@metamask/utils';
import {
  getMoneyAccountVaultConfig,
  type MoneyAccountVaultConfig,
} from '../../../../../shared/lib/money/vault-config';
import { applyManifestFlagOverrides } from '../../../../../shared/lib/remote-feature-flag-utils';

type MoneyPayActions =
  // The delegation actions, for the atomic wrap
  // (`app/scripts/lib/transaction/delegation.ts` requires exactly these four).
  | DelegationControllerSignDelegationAction
  | KeyringControllerSignEip7702AuthorizationAction
  | TransactionControllerGetNonceLockAction
  | TransactionControllerIsAtomicBatchSupportedAction
  // The vault config, the network client for the vault reads, and the money
  // account the calls execute from.
  | RemoteFeatureFlagControllerGetStateAction
  | NetworkControllerFindNetworkClientIdByChainIdAction
  | NetworkControllerGetNetworkClientByIdAction
  | MoneyAccountControllerGetMoneyAccountAction
  // The deposit-amount commit path resolves the transaction and writes the
  // re-encoded calldata back (`update-deposit-amount.ts`).
  | TransactionControllerGetStateAction
  | TransactionControllerUpdateTransactionMetadataAction
  // Deposit initiation submits the placeholder batch
  // (`create-deposit-transaction.ts`).
  | TransactionControllerAddTransactionBatchAction
  // The withdraw commit path resolves the recipient from the selected
  // account (`update-withdraw-amount.ts`).
  | AccountsControllerGetSelectedAccountAction;

/**
 * The messenger surface the Money Pay callbacks need.
 */
export type MoneyPayMessenger = Messenger<string, MoneyPayActions, never>;

/**
 * Everything a Money Pay callback needs before it can build calldata. Resolved
 * as a unit because the guards are identical at every call site: any missing
 * piece means "not available yet", and the caller returns its no-op shape
 * rather than throwing.
 */
export type MoneyPayContext = {
  moneyAccountAddress: Hex;
  vaultConfig: MoneyAccountVaultConfig;
  networkClientId: string;
  provider: Web3Provider;
};

/**
 * Reads and parses the Money Account vault config from remote feature flags.
 *
 * `RemoteFeatureFlagController:getState` returns controller state only, so the
 * manifest overrides the UI gets for free must be applied here — the same rule
 * the availability gate and `MoneyAccountControllerInit` follow, so all
 * background readers of the flag agree with the UI.
 *
 * @param messenger - The messenger to read the flags through.
 * @returns The parsed vault config, or `undefined` while the flag is unserved
 * or malformed.
 */
export function getVaultConfig(
  messenger: MoneyPayMessenger,
): MoneyAccountVaultConfig | undefined {
  const { remoteFeatureFlags } = messenger.call(
    'RemoteFeatureFlagController:getState',
  );
  return getMoneyAccountVaultConfig(
    applyManifestFlagOverrides(remoteFeatureFlags),
  );
}

/**
 * Resolves the full context a Money Pay callback needs, or `undefined` when
 * any part is unavailable: the flag unserved, no money account created yet, or
 * the money chain not configured in the wallet. All three are expected
 * pre-launch states, not errors.
 *
 * The chain comes from the vault config, never a hardcoded default, so the
 * calldata targets and the balance service cannot disagree about which chain
 * the vault lives on.
 *
 * @param messenger - The messenger to resolve the context through.
 * @param chainId - Optional chain override; defaults to the vault config's
 * chain. Callers re-encoding an existing transaction pass its chain so the
 * calldata matches the transaction it is written into.
 * @returns The resolved context, or `undefined` when unavailable.
 */
export function getMoneyPayContext(
  messenger: MoneyPayMessenger,
  chainId?: Hex,
): MoneyPayContext | undefined {
  const vaultConfig = getVaultConfig(messenger);
  if (!vaultConfig) {
    return undefined;
  }

  const moneyAccountAddress = messenger.call(
    'MoneyAccountController:getMoneyAccount',
  )?.address as Hex | undefined;
  if (!moneyAccountAddress) {
    return undefined;
  }

  const targetChainId = chainId ?? vaultConfig.chainId;

  let networkClientId: string;
  try {
    networkClientId = messenger.call(
      'NetworkController:findNetworkClientIdByChainId',
      targetChainId,
    );
  } catch {
    // The money chain is not configured in this wallet.
    return undefined;
  }

  const { provider } = messenger.call(
    'NetworkController:getNetworkClientById',
    networkClientId,
  );

  return {
    moneyAccountAddress,
    vaultConfig,
    networkClientId,
    provider: new Web3Provider(provider as unknown as ExternalProvider),
  };
}

/**
 * Prefixes an error's message, preserving the original as `cause`. Matches
 * mobile's `prefixError` contract: the prefix identifies which Money flow
 * failed when the error surfaces in logs several layers up.
 *
 * @param error - The error to prefix.
 * @param prefix - The prefix naming the flow.
 * @returns A new error with the prefixed message.
 */
export function prefixError(error: unknown, prefix: string): Error {
  const message = error instanceof Error ? error.message : String(error);
  return new Error(`${prefix}${message}`, { cause: error });
}

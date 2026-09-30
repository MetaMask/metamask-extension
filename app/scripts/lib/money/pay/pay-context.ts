import { Web3Provider, type ExternalProvider } from '@ethersproject/providers';
import type { AccountsControllerGetSelectedAccountAction } from '@metamask/accounts-controller';
import type { MoneyAccountControllerGetMoneyAccountAction } from '@metamask/money-account-controller';
import type { Messenger } from '@metamask/messenger';
import type {
  NetworkControllerFindNetworkClientIdByChainIdAction,
  NetworkControllerGetNetworkClientByIdAction,
} from '@metamask/network-controller';
import type { RemoteFeatureFlagControllerGetStateAction } from '@metamask/remote-feature-flag-controller';
import type {
  TransactionControllerAddTransactionBatchAction,
  TransactionControllerGetStateAction,
  TransactionControllerUnapprovedTransactionAddedEvent,
  TransactionControllerUpdateTransactionAction,
} from '@metamask/transaction-controller';
import { isStrictHexString, type Hex } from '@metamask/utils';
import {
  getMoneyAccountVaultConfig,
  type MoneyAccountVaultConfig,
} from '../../../../../shared/lib/money/vault-config';
import type { DelegationMessengerActions } from '../../transaction/delegation';

export type MoneyPayActions =
  | AccountsControllerGetSelectedAccountAction
  | RemoteFeatureFlagControllerGetStateAction
  | NetworkControllerFindNetworkClientIdByChainIdAction
  | NetworkControllerGetNetworkClientByIdAction
  | MoneyAccountControllerGetMoneyAccountAction
  | TransactionControllerAddTransactionBatchAction
  | TransactionControllerGetStateAction
  | TransactionControllerUpdateTransactionAction;

type MoneyPayEvents = TransactionControllerUnapprovedTransactionAddedEvent;

/**
 * The messenger surface Money Account batch initiation and amount commits need.
 */
export type MoneyPayMessenger = Messenger<
  string,
  MoneyPayActions,
  MoneyPayEvents
>;

/**
 * Messenger required by `getPaymentOverrideData`: Money Pay context actions
 * plus the delegation / EIP-7702 signing capabilities used when wrapping
 * vault calls for Relay.
 */
export type PaymentOverrideMessenger = Messenger<
  string,
  MoneyPayActions | DelegationMessengerActions,
  MoneyPayEvents
>;

/**
 * Vault + money-account context used to submit a placeholder batch.
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
  return getMoneyAccountVaultConfig(remoteFeatureFlags);
}

/**
 * Resolves the context needed to submit a Money Account placeholder batch, or
 * `undefined` when any part is unavailable: the flag unserved, no money
 * account created yet, or the money chain not configured in the wallet.
 *
 * @param messenger - The messenger to resolve the context through.
 * @param chainId - Optional chain override; defaults to the vault config's
 * chain.
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
  )?.address;
  if (!isStrictHexString(moneyAccountAddress)) {
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

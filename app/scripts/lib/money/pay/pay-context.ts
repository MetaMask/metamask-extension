import { Web3Provider, type ExternalProvider } from '@ethersproject/providers';
import type { AccountsControllerGetSelectedAccountAction } from '@metamask/accounts-controller';
import type { DelegationControllerSignDelegationAction } from '@metamask/delegation-controller';
import type { InternalAccount } from '@metamask/keyring-internal-api';
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
  TransactionControllerUnapprovedTransactionAddedEvent,
  TransactionControllerUpdateTransactionMetadataAction,
  TransactionControllerState,
  TransactionMeta,
} from '@metamask/transaction-controller';
import { isStrictHexString, type Hex } from '@metamask/utils';
import {
  getMoneyAccountVaultConfig,
  type MoneyAccountVaultConfig,
} from '../../../../../shared/lib/money/vault-config';

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

// Initiation resolves the created transaction's id from the added transaction
// rather than the batch result (`submit-placeholder-batch.ts`).
type MoneyPayEvents = TransactionControllerUnapprovedTransactionAddedEvent;

/**
 * The messenger surface the Money Pay callbacks need.
 */
export type MoneyPayMessenger = Messenger<
  string,
  MoneyPayActions,
  MoneyPayEvents
>;

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

/**
 * Resolves the globally selected account.
 *
 * `AccountsController:getSelectedAccount`'s return type cannot be narrowed out
 * of the messenger union, so every Money Pay call site needs this cast — kept
 * here once rather than repeated at each site, so a signature change only
 * needs updating in one place.
 *
 * @param messenger - The messenger to resolve the account through.
 * @returns The selected account, or `undefined` if none is selected.
 */
export function getSelectedAccount(
  messenger: MoneyPayMessenger,
): InternalAccount | undefined {
  return messenger.call('AccountsController:getSelectedAccount') as
    | InternalAccount
    | undefined;
}

/**
 * Resolves a transaction from `TransactionController` state.
 *
 * `TransactionController:getState`'s return type cannot be narrowed out of the
 * messenger union, so every Money Pay call site needs this cast — kept here
 * once rather than repeated at each site.
 *
 * @param messenger - The messenger to resolve the transaction through.
 * @param predicate - Selects the transaction out of controller state.
 * @returns The matching transaction, or `undefined` if none matches.
 */
export function findTransaction(
  messenger: MoneyPayMessenger,
  predicate: (transaction: TransactionMeta) => boolean,
): TransactionMeta | undefined {
  const { transactions } = messenger.call(
    'TransactionController:getState',
  ) as TransactionControllerState;
  return transactions.find(predicate);
}

/**
 * Tracks the in-flight amount-commit for a single transaction, so an amount
 * updater can coalesce identical concurrent intents and drop a superseded one
 * instead of letting it commit stale calldata over a newer intent's result.
 */
export type AmountUpdateIntent<Result> = {
  intentKey: string;
  promise: Promise<Result>;
  token: symbol;
};

/**
 * Runs `work` as the current in-flight amount-commit for `transactionId`,
 * sharing the promise with an identical concurrent intent and letting `work`
 * check `isCurrentIntent()` to bail out if a newer intent supersedes it before
 * it finishes.
 *
 * Shared by `updateMoneyAccountDepositAmount` and
 * `updateMoneyAccountWithdrawAmount`, whose concurrency contract is otherwise
 * identical: both re-encode calldata against a vault read that can resolve
 * out of order, so only the newest intent for a transaction may commit.
 *
 * @param intentsByTransactionId - The map tracking in-flight intents. Callers
 * keep their own map so a deposit intent and a withdrawal intent can never be
 * mistaken for each other even if they somehow shared a transaction id.
 * @param transactionId - The transaction the intent is for.
 * @param intentKey - Identifies this intent; an identical key for the same
 * transaction id is treated as the same intent and shares its promise.
 * @param work - Does the work, given a callback to check whether this intent
 * is still the current one for the transaction.
 * @returns The intent's result, resolved once for identical concurrent calls.
 */
export function runSingleFlightAmountUpdate<Result>(
  intentsByTransactionId: Map<string, AmountUpdateIntent<Result>>,
  transactionId: string,
  intentKey: string,
  work: (isCurrentIntent: () => boolean) => Promise<Result>,
): Promise<Result> {
  const existing = intentsByTransactionId.get(transactionId);
  if (existing?.intentKey === intentKey) {
    return existing.promise;
  }

  const token = Symbol(intentKey);
  const isCurrentIntent = (): boolean =>
    intentsByTransactionId.get(transactionId)?.token === token;

  const trackedPromise = work(isCurrentIntent).finally(() => {
    if (isCurrentIntent()) {
      intentsByTransactionId.delete(transactionId);
    }
  });

  intentsByTransactionId.set(transactionId, {
    intentKey,
    promise: trackedPromise,
    token,
  });

  return trackedPromise;
}

/**
 * Clears the estimates an amount re-encode invalidates, so the transaction
 * re-estimates against its new calldata instead of keeping the previous
 * amount's gas, simulation and revert data.
 *
 * Shared by the deposit and withdrawal amount-commit paths' `updateTransactionMetadata`
 * callbacks, which both write new calldata into an existing transaction and
 * must invalidate the same set of derived fields.
 *
 * @param transactionMeta - The transaction whose estimates to clear.
 */
export function resetTransactionEstimates(
  transactionMeta: TransactionMeta,
): void {
  transactionMeta.txParams.gas = undefined;
  transactionMeta.gasLimitNoBuffer = undefined;
  transactionMeta.gasUsed = undefined;
  transactionMeta.securityAlertResponse = undefined;
  transactionMeta.simulationData = undefined;
  transactionMeta.simulationFails = undefined;

  if (transactionMeta.revert) {
    delete transactionMeta.revert.gas;
    delete transactionMeta.revert.simulation;

    if (!transactionMeta.revert.receipt) {
      transactionMeta.revert = undefined;
    }
  }
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

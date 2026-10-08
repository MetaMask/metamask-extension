import {
  AuthorizationList,
  TransactionEnvelopeType,
  TransactionMeta,
  decodeAuthorizationSignature,
} from '@metamask/transaction-controller';
import type {
  TransactionControllerIsAtomicBatchSupportedAction,
  TransactionControllerGetNonceLockAction,
} from '@metamask/transaction-controller';
import { Hex, bytesToHex, createProjectLogger } from '@metamask/utils';
import { toHex } from '@metamask/controller-utils';
import type { Messenger } from '@metamask/messenger';
import type { DelegationControllerSignDelegationAction } from '@metamask/delegation-controller';
import type { KeyringControllerSignEip7702AuthorizationAction } from '@metamask/keyring-controller';
import type { RemoteFeatureFlagControllerGetStateAction } from '@metamask/remote-feature-flag-controller';
import { ROOT_AUTHORITY, ANY_BENEFICIARY } from '@metamask/delegation-core';
import {
  ExecutionMode,
  getDeleGatorEnvironment,
  encodeRedeemDelegations,
  BATCH_DEFAULT_MODE,
  SINGLE_DEFAULT_MODE,
  type ExecutionStruct,
  type Caveat,
  type Delegation,
  type UnsignedDelegation,
} from '../../../../shared/lib/delegation';
import { getDelegationCaveats, normalizeCallData } from './caveats';

const log = createProjectLogger('transaction-delegation');

export const PRIMARY_TYPE_DELEGATION = 'Delegation';

export type DelegationMessengerActions =
  | DelegationControllerSignDelegationAction
  | KeyringControllerSignEip7702AuthorizationAction
  | RemoteFeatureFlagControllerGetStateAction
  | TransactionControllerGetNonceLockAction
  | TransactionControllerIsAtomicBatchSupportedAction;

export type DelegationMessenger = Messenger<
  string,
  DelegationMessengerActions,
  never
>;

type AuthorizationRequest = {
  minimal?: boolean;

  upgradeContractAddress?: Hex;

  /**
   * When false, throws if the account is already upgraded to a
   * different delegation address. Defaults to true.
   */
  upgradeExistingDelegation?: boolean;
};

type ConvertTransactionToRedeemDelegationsRequest = {
  transaction: TransactionMeta;
  messenger: DelegationMessenger;

  /**
   * Override default caveats derived from the transaction.
   * When provided, these caveats are used directly instead of
   * building from nestedTransactions / txParams.
   */
  caveats?: Caveat[];

  /**
   * Extra executions appended to the default execution batch.
   * The default execution is derived from nestedTransactions
   * (or txParams as fallback).
   */
  additionalExecutions?: ExecutionStruct[];

  /**
   * The delegation target address.
   * Defaults to ANY_BENEFICIARY.
   */
  delegatee?: Hex;

  /**
   * Pre-computed delegation signature. When provided, the messenger
   * is not called to sign the delegation. Useful for simulations
   * that use a mock signature.
   */
  delegationSignature?: Hex;

  /**
   * When provided, builds an EIP-7702 authorization list for the transaction.
   * Omit to skip authorization list building entirely.
   */
  authorization?: AuthorizationRequest;

  /**
   * Addresses allowed to submit the `redeemDelegations` call.
   * When non-empty, a RedeemerEnforcer caveat is added restricting redemption
   * to these addresses, plus the `delegatee` if provided.
   */
  redeemers?: Hex[];

  /**
   * When true, build the Relay-execute subsidized shape: a single execution
   * of the 7702 batch and caveats that leave the order-id placeholder free.
   */
  isSubsidized?: boolean;

  /**
   * When true, build a single execution from the parent `txParams` (`to` /
   * `data`) even when `nestedTransactions` exist. Matches the mobile publish
   * hook: for 7702 batches the parent `execute()` calldata is the canonical
   * payload — redeeming the nested calls directly is a shape mobile never
   * publishes and it does not move funds on-chain (e.g. sponsored Money
   * Account withdrawals on Monad).
   */
  useParentExecution?: boolean;
};

type ConvertTransactionToRedeemDelegationsResult = {
  authorizationList?: AuthorizationList;
  data: Hex;
  to: Hex;
  type: TransactionEnvelopeType;
};

type GetDelegationTransactionRequest = {
  /**
   * Messenger that can perform at least the delegation / EIP-7702 signing
   * actions. Callers may pass a wider messenger (e.g. payment-override init).
   */
  messenger: Messenger<string, DelegationMessengerActions, never>;
  isSubsidized?: boolean;
};

type DelegationTransactionResult = {
  authorizationList?: AuthorizationList;
  data: Hex;
  to: Hex;
  type: TransactionEnvelopeType;
  value: Hex;
};

/**
 * Converts a transaction into a redeemDelegations call.
 *
 * By default, caveats, executions, and modes are derived from the
 * transaction's nestedTransactions (or txParams as fallback).
 * Callers can override caveats and append additional executions
 * to customise the delegation (e.g. gas-fee-token flows).
 *
 * @param request - The conversion request.
 * @returns The encoded calldata, delegation manager address, and optional authorization list.
 */
export async function convertTransactionToRedeemDelegations(
  request: ConvertTransactionToRedeemDelegationsRequest,
): Promise<ConvertTransactionToRedeemDelegationsResult> {
  const { transaction, messenger, isSubsidized = false } = request;
  const { chainId } = transaction;
  const environment = getDeleGatorEnvironment(parseInt(chainId, 16));

  const defaultExecutions = isSubsidized
    ? buildSubsidizedExecutions(transaction)
    : getDefaultTransactionExecutions(transaction, request.useParentExecution);

  const additionalExecutions = isSubsidized
    ? []
    : (request.additionalExecutions ?? []);
  const executions: ExecutionStruct[][] = [
    [...defaultExecutions, ...additionalExecutions],
  ];

  const caveats = getDelegationCaveats({
    caveats: request.caveats,
    delegatee: request.delegatee,
    environment,
    executions: executions[0],
    isSubsidized,
    messenger,
    redeemers: request.redeemers,
    transaction,
  });

  const modes: ExecutionMode[] = [
    isSubsidized || executions[0].length <= 1
      ? SINGLE_DEFAULT_MODE
      : BATCH_DEFAULT_MODE,
  ];

  const delegations = await signAndWrapDelegation({
    caveats,
    delegatee: request.delegatee,
    delegationSignature: request.delegationSignature,
    messenger,
    transaction,
  });

  log('Built delegations', { delegations, modes, executions });

  const data = encodeRedeemDelegations({
    delegations,
    modes,
    executions,
  });

  const authorizationList = request.authorization
    ? await buildAuthorizationList(
        transaction,
        messenger,
        request.authorization,
      )
    : undefined;

  return {
    authorizationList,
    data,
    to: environment.DelegationManager,
    type: authorizationList
      ? TransactionEnvelopeType.setCode
      : (transaction.txParams.type as TransactionEnvelopeType),
  };
}

export async function getDelegationTransaction(
  request: GetDelegationTransactionRequest,
  transaction: TransactionMeta,
): Promise<DelegationTransactionResult> {
  const { authorizationList, data, to, type } =
    await convertTransactionToRedeemDelegations({
      transaction,
      messenger: request.messenger,
      authorization: {},
      isSubsidized: request.isSubsidized,
    });

  return {
    authorizationList,
    data,
    to,
    type,
    value: '0x0',
  };
}

function hasExecutableNestedTransactions(
  transactionMeta: TransactionMeta,
): boolean {
  const { nestedTransactions } = transactionMeta;
  return Boolean(nestedTransactions?.length && nestedTransactions[0].to);
}

function getDefaultTransactionExecutions(
  transactionMeta: TransactionMeta,
  useParentExecution = false,
): ExecutionStruct[] {
  const { nestedTransactions, txParams } = transactionMeta;

  if (
    !useParentExecution &&
    nestedTransactions?.length &&
    hasExecutableNestedTransactions(transactionMeta)
  ) {
    return nestedTransactions.map((tx) => ({
      target: tx.to as Hex,
      value: BigInt(tx.value ?? '0x0'),
      callData: normalizeCallData(tx.data),
    }));
  }

  return [
    {
      target: txParams.to as Hex,
      value: BigInt((txParams.value as Hex) ?? '0x0'),
      callData: normalizeCallData(txParams.data),
    },
  ];
}

/**
 * Builds the single batch execution for a subsidized Relay redeem.
 *
 * The execution target and value come from `txParams`; calldata is normalized
 * via {@link normalizeCallData} so odd-length hex cannot shift byte offsets
 * used by the AllowedCalldata caveats below.
 *
 * @param transactionMeta - Transaction whose batch calldata will be redeemed.
 * @returns A one-element execution list for the Relay redeem path.
 */
function buildSubsidizedExecutions(
  transactionMeta: TransactionMeta,
): ExecutionStruct[] {
  try {
    const { txParams } = transactionMeta;
    const target = txParams.to as Hex | undefined;
    const callData = txParams.data as Hex | undefined;

    if (!target || !callData) {
      throw new Error('Missing batch target or calldata');
    }

    return [
      {
        target,
        value: BigInt(txParams.value ?? '0x0'),
        callData: normalizeCallData(callData),
      },
    ];
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Subsidized Caveats: ${message}`, { cause: error });
  }
}

async function signAndWrapDelegation({
  transaction,
  caveats,
  messenger,
  delegatee,
  delegationSignature,
}: {
  transaction: TransactionMeta;
  caveats: Caveat[];
  messenger: DelegationMessenger;
  delegatee?: Hex;
  delegationSignature?: Hex;
}): Promise<Delegation[][]> {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const salt = bytesToHex(bytes);

  const unsignedDelegation: UnsignedDelegation = {
    delegator: transaction.txParams.from as Hex,
    delegate: delegatee ?? ANY_BENEFICIARY,
    authority: ROOT_AUTHORITY,
    salt,
    caveats,
  };

  log('Signing delegation', unsignedDelegation);

  const signature =
    delegationSignature ??
    ((await messenger.call('DelegationController:signDelegation', {
      chainId: transaction.chainId,
      delegation: unsignedDelegation,
    })) as Hex);

  log('Delegation signature', signature);

  return [[{ ...unsignedDelegation, signature }]];
}

async function getNextNonce(
  messenger: DelegationMessenger,
  address: string,
  networkClientId: string,
): Promise<Hex> {
  const nonceLock = await messenger.call(
    'TransactionController:getNonceLock',
    address,
    networkClientId,
  );

  nonceLock.releaseLock();
  return toHex(nonceLock.nextNonce);
}

async function resolveUpgradeContractAddress(
  transaction: TransactionMeta,
  messenger: DelegationMessenger,
  authorization: AuthorizationRequest,
): Promise<Hex | undefined> {
  if (authorization.upgradeContractAddress) {
    return authorization.upgradeContractAddress;
  }

  const { chainId, txParams } = transaction;

  const atomicBatchResult = await messenger.call(
    'TransactionController:isAtomicBatchSupported',
    {
      address: txParams.from as Hex,
      chainIds: [chainId],
    },
  );

  const chainResult = atomicBatchResult.find(
    (r) => r.chainId.toLowerCase() === chainId.toLowerCase(),
  );

  if (!chainResult) {
    throw new Error('Chain does not support EIP-7702');
  }

  const { delegationAddress, isSupported, upgradeContractAddress } =
    chainResult;

  if (isSupported) {
    log('Skipping authorization as already upgraded');
    return undefined;
  }

  if (delegationAddress && authorization.upgradeExistingDelegation === false) {
    throw new Error(
      `Account is already upgraded to a different delegation address: ${delegationAddress}`,
    );
  }

  if (!upgradeContractAddress) {
    throw new Error('Upgrade contract address not found');
  }

  if (delegationAddress) {
    log('Overwriting existing delegation', {
      current: delegationAddress,
      new: upgradeContractAddress,
    });
  }

  return upgradeContractAddress;
}

async function buildAuthorizationList(
  transaction: TransactionMeta,
  messenger: DelegationMessenger,
  authorization: AuthorizationRequest,
): Promise<AuthorizationList | undefined> {
  const upgradeContractAddress = await resolveUpgradeContractAddress(
    transaction,
    messenger,
    authorization,
  );

  if (!upgradeContractAddress) {
    return undefined;
  }

  if (authorization.minimal) {
    return [{ address: upgradeContractAddress }];
  }

  const { chainId, txParams, networkClientId } = transaction;
  const { from } = txParams;

  log('Upgrading account to EIP-7702', { from, upgradeContractAddress });

  const nonce = await getNextNonce(messenger, from, networkClientId);

  const authorizationSignature = (await messenger.call(
    'KeyringController:signEip7702Authorization',
    {
      chainId: parseInt(chainId, 16),
      contractAddress: upgradeContractAddress,
      from,
      nonce: parseInt(nonce, 16),
    },
  )) as Hex;

  const { r, s, yParity } = decodeAuthorizationSignature(
    authorizationSignature,
  );

  log('Authorization signature', {
    authorizationSignature,
    r,
    s,
    yParity,
    nonce,
  });

  return [
    {
      address: upgradeContractAddress,
      chainId,
      nonce,
      r,
      s,
      yParity,
    },
  ];
}

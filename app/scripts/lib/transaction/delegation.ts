import {
  AuthorizationList,
  IsAtomicBatchSupportedRequest,
  IsAtomicBatchSupportedResult,
  TransactionMeta,
} from '@metamask/transaction-controller';
import { Hex, add0x, createProjectLogger } from '@metamask/utils';
import { toHex } from '@metamask/controller-utils';
import type { Messenger } from '@metamask/messenger';
import type { DelegationControllerSignDelegationAction } from '@metamask/delegation-controller';
import type { KeyringControllerSignEip7702AuthorizationAction } from '@metamask/keyring-controller';
import type { TransactionControllerGetNonceLockAction } from '@metamask/transaction-controller';
import {
  BATCH_DEFAULT_MODE,
  Caveat,
  ExecutionMode,
  ExecutionStruct,
  SINGLE_DEFAULT_MODE,
  createCaveatBuilder,
  getDeleGatorEnvironment,
} from '../../../../shared/lib/delegation';
import {
  ANY_BENEFICIARY,
  type Delegation,
  encodeRedeemDelegations,
  createDelegation,
  type UnsignedDelegation,
} from '../../../../shared/lib/delegation/delegation';
import { limitedCalls } from '../../../../shared/lib/delegation/caveatBuilder/limitedCallsBuilder';
import { exactExecutionBatch } from '../../../../shared/lib/delegation/caveatBuilder/exactExecutionBatchBuilder';
import { exactExecution } from '../../../../shared/lib/delegation/caveatBuilder/exactExecutionBuilder';
import {
  findAtomicBatchSupportForChain,
  checkEip7702Support,
} from '../../../../shared/lib/eip7702-support-utils';
import { stripSingleLeadingZero } from './util';

const log = createProjectLogger('transaction-delegation');

export const PRIMARY_TYPE_DELEGATION = 'Delegation';

type DelegationMessengerActions =
  | DelegationControllerSignDelegationAction
  | KeyringControllerSignEip7702AuthorizationAction
  | TransactionControllerGetNonceLockAction;

export type DelegationMessenger = Messenger<
  string,
  DelegationMessengerActions,
  never
>;

type AuthorizationRequest =
  | {
      /**
       * Resolve upgrade support automatically via isAtomicBatchSupported.
       * Used when the caller has not already checked upgrade status.
       */
      isAtomicBatchSupported: (
        request: IsAtomicBatchSupportedRequest,
      ) => Promise<IsAtomicBatchSupportedResult>;
      upgradeContractAddress?: never;
    }
  | {
      /**
       * Pre-resolved upgrade contract address.
       * Used when the caller has already determined the account needs upgrading.
       * Pass undefined to skip authorization (account already upgraded).
       */
      isAtomicBatchSupported?: never;
      upgradeContractAddress: Hex | undefined;
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
   * When provided, builds an EIP-7702 authorization list for the transaction.
   * Omit to skip authorization list building entirely.
   */
  authorization?: AuthorizationRequest;
};

type ConvertTransactionToRedeemDelegationsResult = {
  authorizationList?: AuthorizationList;
  data: Hex;
  to: Hex;
};

type GetDelegationTransactionRequest = {
  isAtomicBatchSupported: (
    request: IsAtomicBatchSupportedRequest,
  ) => Promise<IsAtomicBatchSupportedResult>;

  messenger: DelegationMessenger;
};

type DelegationTransactionResult = {
  authorizationList?: AuthorizationList;
  data: Hex;
  to: Hex;
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
  const { transaction, messenger } = request;
  const { chainId } = transaction;
  const environment = getDeleGatorEnvironment(parseInt(chainId, 16));

  const baseExecutions = buildDefaultExecutions(transaction);
  const additionalExecutions = request.additionalExecutions ?? [];
  const executions: ExecutionStruct[][] = [
    [...baseExecutions[0], ...additionalExecutions],
  ];

  const caveats =
    request.caveats ?? buildDefaultCaveats(environment, transaction);

  const modes: ExecutionMode[] = [
    executions[0].length > 1 ? BATCH_DEFAULT_MODE : SINGLE_DEFAULT_MODE,
  ];

  const delegations = await signAndWrapDelegation(
    transaction,
    caveats,
    messenger,
  );

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
    to: environment.DelegationManager as Hex,
  };
}

export async function getDelegationTransaction(
  request: GetDelegationTransactionRequest,
  transaction: TransactionMeta,
): Promise<DelegationTransactionResult> {
  const { data, to, authorizationList } =
    await convertTransactionToRedeemDelegations({
      transaction,
      messenger: request.messenger,
      authorization: {
        isAtomicBatchSupported: request.isAtomicBatchSupported,
      },
    });

  return {
    authorizationList,
    data,
    to,
    value: '0x0',
  };
}

export function normalizeCallData(data: unknown): Hex {
  if (typeof data !== 'string' || data.length === 0) {
    return '0x';
  }

  const hasHexPrefix = data.slice(0, 2).toLowerCase() === '0x';
  const lower = data.toLowerCase();
  const prefixed = hasHexPrefix ? `0x${lower.slice(2)}` : `0x${lower}`;
  const hexBody = prefixed.slice(2);

  if (hexBody.length === 0) {
    return '0x';
  }

  if (hexBody.length % 2 !== 0) {
    return normalizeCallData(`0x0${hexBody}`);
  }

  return prefixed as Hex;
}

function hasExecutableNestedTransactions(
  transactionMeta: TransactionMeta,
): boolean {
  const { nestedTransactions } = transactionMeta;
  return Boolean(nestedTransactions?.length && nestedTransactions[0].to);
}

function buildDefaultExecutions(
  transactionMeta: TransactionMeta,
): ExecutionStruct[][] {
  const { nestedTransactions, txParams } = transactionMeta;

  if (
    nestedTransactions?.length &&
    hasExecutableNestedTransactions(transactionMeta)
  ) {
    return [
      nestedTransactions.map((tx) => ({
        target: tx.to as Hex,
        value: BigInt(tx.value ?? '0x0'),
        callData: tx.data as Hex,
      })),
    ];
  }

  return [
    [
      {
        target: txParams.to as Hex,
        value: BigInt((txParams.value as Hex) ?? '0x0'),
        callData: normalizeCallData(txParams.data),
      },
    ],
  ];
}

function buildDefaultCaveats(
  environment: ReturnType<typeof getDeleGatorEnvironment>,
  transaction: TransactionMeta,
): Caveat[] {
  const caveatBuilder = createCaveatBuilder(environment);
  const { nestedTransactions, txParams } = transaction;

  let executions;

  if (
    nestedTransactions?.length &&
    hasExecutableNestedTransactions(transaction)
  ) {
    executions = nestedTransactions.map((tx) => ({
      to: tx.to as string,
      value: tx.value ?? '0x0',
      data: tx.data as string | undefined,
    }));
  } else {
    executions = [
      {
        to: txParams.to as string,
        value: (txParams.value as string) ?? '0x0',
        data: txParams.data as string | undefined,
      },
    ];
  }

  if (executions.length > 1) {
    caveatBuilder.addCaveat(exactExecutionBatch, executions);
  } else {
    caveatBuilder.addCaveat(
      exactExecution,
      executions[0].to,
      executions[0].value,
      executions[0].data,
    );
  }

  caveatBuilder.addCaveat(limitedCalls, 1);

  return caveatBuilder.build();
}

async function signAndWrapDelegation(
  transaction: TransactionMeta,
  caveats: Caveat[],
  messenger: DelegationMessenger,
): Promise<Delegation[][]> {
  const unsignedDelegation: UnsignedDelegation = createDelegation({
    from: transaction.txParams.from as Hex,
    to: ANY_BENEFICIARY,
    caveats,
  });

  log('Signing delegation', unsignedDelegation);

  const signature = (await messenger.call(
    'DelegationController:signDelegation',
    { chainId: transaction.chainId, delegation: unsignedDelegation },
  )) as Hex;

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

function decodeAuthorizationSignature(signature: Hex) {
  const r = stripSingleLeadingZero(signature.slice(0, 66)) as Hex;
  const s = stripSingleLeadingZero(add0x(signature.slice(66, 130))) as Hex;
  const v = parseInt(signature.slice(130, 132), 16);
  const yParity = toHex(v - 27 === 0 ? 0 : 1);

  return {
    r,
    s,
    yParity,
  };
}

async function resolveUpgradeContractAddress(
  transaction: TransactionMeta,
  authorization: AuthorizationRequest,
): Promise<{ upgradeContractAddress: Hex | undefined; skipAuth: boolean }> {
  if (authorization.upgradeContractAddress !== undefined) {
    return {
      upgradeContractAddress: authorization.upgradeContractAddress,
      skipAuth: false,
    };
  }

  if (!authorization.isAtomicBatchSupported) {
    return { upgradeContractAddress: undefined, skipAuth: true };
  }

  const { chainId, txParams } = transaction;
  const atomicBatchResult = await authorization.isAtomicBatchSupported({
    address: txParams.from as Hex,
    chainIds: [chainId],
  });

  const chainResult = findAtomicBatchSupportForChain(
    atomicBatchResult,
    chainId,
  );

  const { isSupported, delegationAddress, upgradeContractAddress } =
    checkEip7702Support(chainResult);

  if (!isSupported) {
    throw new Error('Chain does not support EIP-7702');
  }

  if (delegationAddress) {
    log('Skipping authorization as already upgraded');
    return { upgradeContractAddress: undefined, skipAuth: true };
  }

  return {
    upgradeContractAddress: upgradeContractAddress ?? undefined,
    skipAuth: false,
  };
}

async function buildAuthorizationList(
  transaction: TransactionMeta,
  messenger: DelegationMessenger,
  authorization: AuthorizationRequest,
): Promise<AuthorizationList | undefined> {
  const { upgradeContractAddress, skipAuth } =
    await resolveUpgradeContractAddress(transaction, authorization);

  if (skipAuth || !upgradeContractAddress) {
    return undefined;
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

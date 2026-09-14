import { Buffer } from 'buffer';
import type { InternalAccount } from '@metamask/keyring-internal-api';
import {
  FeeType,
  TransactionStatus as MultichainTransactionStatus,
} from '@metamask/keyring-api';
import {
  type GetSolanaPayFollowUpStatusRequest,
  type GetSolanaPayPreflightRequest,
  type GetSolanaPayTransactionStatusRequest,
  type SolanaPayCallbacks,
  type SolanaPayFollowUpRequest,
  type SolanaPaySignAndSendTransactionRequest,
  type SolanaPaySubmissionResult,
} from '@metamask/transaction-pay-controller';
import {
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import {
  AddressLookupTableAccount,
  Connection,
  PublicKey,
  SystemInstruction,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';
import { HandlerType } from '@metamask/snaps-utils';
import {
  hasProperty,
  isObject,
  parseCaipAccountId,
  parseCaipAssetType,
  type CaipAccountId,
  type Hex,
  type Json,
} from '@metamask/utils';
import { BigNumber } from 'bignumber.js';
import { errorCodes } from '@metamask/rpc-errors';
import { ORIGIN_METAMASK } from '@metamask/controller-utils';
import { sha256 } from '../../../../../shared/lib/hash.utils';
import { SOLANA_WALLET_SNAP_ID } from '../../../../../shared/lib/accounts';
import type { TransactionPayControllerInitMessenger } from '../../../messenger-client-init/messengers';
import { getMoneyAccountAmountData } from './update-deposit-amount';
import type { MoneyPayMessenger } from './pay-context';

const LAMPORTS_PER_SOL = 1_000_000_000;
const ASSOCIATED_TOKEN_PROGRAM = 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL';
const SOLANA_RPC_URL = 'https://solana-mainnet.infura.io/v3/';
const INVALID_REQUEST_CODES = new Set([-32600, -32601, -32602]);

type SnapFee = {
  type: FeeType;
  asset: { amount: string };
};

type SnapTransactionResponse = { transactionId: string };

/**
 * Creates the Extension-owned Solana mechanics used by TransactionPayController.
 * Core owns lifecycle and affordability policy; this adapter owns RPC preparation,
 * account lookup, Snap submission, and local source/follow-up observations.
 *
 * @param messenger - Restricted initialization messenger.
 * @param infuraProjectId - Infura project ID used for Solana mainnet RPC.
 * @param connectionOverride - Optional RPC connection used by unit tests.
 * @returns Typed Solana Pay callbacks for TransactionPayController.
 */
export function createSolanaPayCallbacks(
  messenger: TransactionPayControllerInitMessenger,
  infuraProjectId: string,
  connectionOverride?: Connection,
): SolanaPayCallbacks {
  const connection =
    connectionOverride ??
    new Connection(`${SOLANA_RPC_URL}${infuraProjectId}`, 'confirmed');

  return {
    getPreflight: (request) => getPreflight(request, messenger, connection),
    signAndSendTransaction: (request) =>
      signAndSendTransaction(request, messenger),
    getTransactionStatus: (request) => getTransactionStatus(request, messenger),
    submitNonAtomicFollowUp: (request) =>
      submitNonAtomicFollowUp(request, messenger),
    getNonAtomicFollowUpStatus: (request) =>
      getNonAtomicFollowUpStatus(request, messenger),
  };
}

async function getPreflight(
  request: GetSolanaPayPreflightRequest,
  messenger: TransactionPayControllerInitMessenger,
  connection: Connection,
) {
  const account = getInternalAccount(request.accountId, messenger);
  const payer = new PublicKey(account.address);
  const instructions = request.transaction.instructions.map(
    ({ programId, keys, data }) =>
      new TransactionInstruction({
        programId: new PublicKey(programId),
        keys: keys.map(({ pubkey, isSigner, isWritable }) => ({
          pubkey: new PublicKey(pubkey),
          isSigner,
          isWritable,
        })),
        data: Buffer.from(data, 'hex'),
      }),
  );
  const lookupTables = await getLookupTables(
    request.transaction.addressLookupTableAddresses ?? [],
    connection,
  );
  const { blockhash } = await connection.getLatestBlockhash('confirmed');
  const message = new TransactionMessage({
    payerKey: payer,
    recentBlockhash: blockhash,
    instructions,
  }).compileToV0Message(lookupTables);
  const preparedTransaction = Buffer.from(
    new VersionedTransaction(message).serialize(),
  ).toString('base64');
  const fees = await getSnapFees(
    preparedTransaction,
    account.id,
    request.scope,
    messenger,
  );
  const [nativeBalance, sourceBalance, rentExemptionRequirement, rentDebit] =
    await Promise.all([
      connection.getBalance(payer, 'confirmed'),
      getSourceBalance(request, payer, connection),
      connection.getMinimumBalanceForRentExemption(0, 'confirmed'),
      getRentDebit(instructions, connection),
    ]);
  const preparationId = await getPreparationId({
    accountId: request.accountId,
    preparedTransaction,
    requestId: request.requestId,
    scope: request.scope,
  });

  return {
    preparedTransaction,
    preparationId,
    nativeBalanceRaw: String(nativeBalance),
    networkFeeRaw: fees.base,
    priorityFeeRaw: fees.priority,
    rentDebitRaw: String(rentDebit),
    rentExemptionRequirementRaw: String(rentExemptionRequirement),
    sourceBalanceRaw: sourceBalance,
  };
}

async function getLookupTables(
  addresses: string[],
  connection: Connection,
): Promise<AddressLookupTableAccount[]> {
  return await Promise.all(
    addresses.map(async (address) => {
      const { value } = await connection.getAddressLookupTable(
        new PublicKey(address),
        { commitment: 'confirmed' },
      );
      if (!value) {
        throw new Error(`Solana address lookup table unavailable: ${address}`);
      }
      return value;
    }),
  );
}

async function getSourceBalance(
  request: GetSolanaPayPreflightRequest,
  owner: PublicKey,
  connection: Connection,
): Promise<string> {
  const { assetNamespace, assetReference } = parseCaipAssetType(
    request.sourceAssetId,
  );
  if (assetNamespace === 'slip44') {
    return String(await connection.getBalance(owner, 'confirmed'));
  }

  const accounts = await connection.getParsedTokenAccountsByOwner(
    owner,
    { mint: new PublicKey(assetReference) },
    'confirmed',
  );

  return accounts.value
    .reduce(
      (total, { account }) =>
        total.plus(String(account.data.parsed.info.tokenAmount.amount)),
      new BigNumber(0),
    )
    .toFixed(0);
}

async function getSnapFees(
  preparedTransaction: string,
  accountId: string,
  scope: string,
  messenger: TransactionPayControllerInitMessenger,
): Promise<{ base: string; priority: string }> {
  const result = await messenger.call('SnapController:handleRequest', {
    origin: ORIGIN_METAMASK,
    snapId: SOLANA_WALLET_SNAP_ID,
    handler: HandlerType.OnClientRequest,
    request: {
      id: crypto.randomUUID(),
      jsonrpc: '2.0',
      method: 'computeFee',
      params: { accountId, scope, transaction: preparedTransaction },
    },
  });
  const fees = getSnapFeeResult(result as Json);
  return {
    base: toLamports(
      fees.find(({ type }) => type === FeeType.Base)?.asset.amount ?? '0',
    ),
    priority: toLamports(
      fees.find(({ type }) => type === FeeType.Priority)?.asset.amount ?? '0',
    ),
  };
}

function getSnapFeeResult(result: Json): SnapFee[] {
  if (!Array.isArray(result)) {
    throw new Error('Invalid Solana fee response');
  }
  return result.map((fee) => {
    if (
      !isObject(fee) ||
      !hasProperty(fee, 'type') ||
      !Object.values(FeeType).includes(fee.type as FeeType) ||
      !hasProperty(fee, 'asset') ||
      !isObject(fee.asset) ||
      !hasProperty(fee.asset, 'amount') ||
      typeof fee.asset.amount !== 'string'
    ) {
      throw new Error('Invalid Solana fee response');
    }
    return { type: fee.type as FeeType, asset: { amount: fee.asset.amount } };
  });
}

function toLamports(sol: string): string {
  return new BigNumber(sol)
    .times(LAMPORTS_PER_SOL)
    .toFixed(0, BigNumber.ROUND_CEIL);
}

async function getRentDebit(
  instructions: TransactionInstruction[],
  connection: Connection,
): Promise<number> {
  let rentDebit = 0;
  for (const instruction of instructions) {
    if (instruction.programId.equals(new PublicKey(ASSOCIATED_TOKEN_PROGRAM))) {
      const associatedAccount = instruction.keys[1]?.pubkey;
      if (
        associatedAccount &&
        !(await connection.getAccountInfo(associatedAccount, 'confirmed'))
      ) {
        rentDebit += await connection.getMinimumBalanceForRentExemption(
          165,
          'confirmed',
        );
      }
      continue;
    }

    try {
      if (SystemInstruction.decodeInstructionType(instruction) === 'Create') {
        rentDebit += Number(
          SystemInstruction.decodeCreateAccount(instruction).lamports,
        );
      }
    } catch {
      // Other programs and System instructions do not encode a rent debit here.
    }
  }
  return rentDebit;
}

async function signAndSendTransaction(
  request: SolanaPaySignAndSendTransactionRequest,
  messenger: TransactionPayControllerInitMessenger,
): Promise<SolanaPaySubmissionResult> {
  const expectedPreparationId = await getPreparationId(request);
  if (expectedPreparationId !== request.preparationId) {
    return { outcome: 'not-submitted', reason: 'preparation-mismatch' };
  }

  const account = getInternalAccount(request.accountId, messenger);
  try {
    const result = await messenger.call('SnapController:handleRequest', {
      origin: ORIGIN_METAMASK,
      snapId: SOLANA_WALLET_SNAP_ID,
      handler: HandlerType.OnClientRequest,
      request: {
        id: crypto.randomUUID(),
        jsonrpc: '2.0',
        method: 'signAndSendTransaction',
        params: {
          accountId: account.id,
          options: { commitment: 'confirmed', skipPreflight: false },
          scope: request.scope,
          transaction: request.preparedTransaction,
        },
      },
    });
    const response = getSnapTransactionResponse(result as Json);
    return { outcome: 'submitted', transactionId: response.transactionId };
  } catch (error) {
    return getSubmissionFailure(error);
  }
}

function getSnapTransactionResponse(result: Json): SnapTransactionResponse {
  if (
    !isObject(result) ||
    !hasProperty(result, 'transactionId') ||
    typeof result.transactionId !== 'string' ||
    !result.transactionId
  ) {
    throw new Error('Invalid Solana submission response');
  }
  return { transactionId: result.transactionId };
}

function getSubmissionFailure(error: unknown): SolanaPaySubmissionResult {
  if (getErrorCode(error) === errorCodes.provider.userRejectedRequest) {
    return { outcome: 'user-rejected' };
  }
  const code = getErrorCode(error);
  if (code !== undefined && INVALID_REQUEST_CODES.has(code)) {
    return { outcome: 'not-submitted', reason: `snap-rpc-${code}` };
  }
  return { outcome: 'ambiguous', reason: 'snap-completion-unknown' };
}

function getErrorCode(error: unknown): number | undefined {
  return isObject(error) &&
    hasProperty(error, 'code') &&
    typeof error.code === 'number'
    ? error.code
    : undefined;
}

async function getTransactionStatus(
  request: GetSolanaPayTransactionStatusRequest,
  messenger: TransactionPayControllerInitMessenger,
): Promise<'pending' | 'confirmed' | 'failed' | 'unknown'> {
  const account = getInternalAccount(request.accountId, messenger);
  await messenger.call(
    'MultichainTransactionsController:updateTransactionsForAccount',
    account.id,
  );
  const transactions = messenger.call(
    'MultichainTransactionsController:getState',
  ).nonEvmTransactions[account.id]?.[request.scope]?.transactions;
  const transaction = transactions?.find(
    ({ id }) => id === request.transactionId,
  );
  if (!transaction) {
    return 'unknown';
  }
  if (transaction.status === MultichainTransactionStatus.Confirmed) {
    return 'confirmed';
  }
  if (transaction.status === MultichainTransactionStatus.Failed) {
    return 'failed';
  }
  return 'pending';
}

async function submitNonAtomicFollowUp(
  request: SolanaPayFollowUpRequest,
  messenger: TransactionPayControllerInitMessenger,
): Promise<SolanaPaySubmissionResult> {
  if (!request.relayTransactionId) {
    return { outcome: 'not-submitted', reason: 'missing-relay-transaction' };
  }
  const amount = await getSettledAmount(request, messenger);
  const { updates } = await getMoneyAccountAmountData(
    messenger as MoneyPayMessenger,
    {
      amount,
      transaction: request.transaction,
    },
  );
  const nestedTransactions = request.transaction.nestedTransactions?.map(
    (transaction) => ({ ...transaction }),
  );
  if (!nestedTransactions?.length || !updates.length) {
    return { outcome: 'not-submitted', reason: 'missing-follow-up-calls' };
  }
  updates.forEach(({ nestedTransactionIndex, data }) => {
    const transaction = nestedTransactions[nestedTransactionIndex];
    if (transaction) {
      transaction.data = data;
    }
  });
  const { from } = request.transaction.txParams;
  if (!from) {
    return { outcome: 'not-submitted', reason: 'missing-follow-up-account' };
  }
  try {
    const { batchId } = await messenger.call(
      'TransactionController:addTransactionBatch',
      {
        disableHook: true,
        disableSequential: true,
        disableUpgrade: true,
        from: from as Hex,
        isGasFeeSponsored: true,
        isInternal: true,
        networkClientId: request.transaction.networkClientId,
        origin: ORIGIN_METAMASK,
        requireApproval: false,
        skipInitialGasEstimate: true,
        transactions: nestedTransactions.map((transaction, index) => ({
          params: {
            data: transaction.data as Hex,
            to: transaction.to,
            value: transaction.value ?? '0x0',
          },
          type:
            index === 0
              ? (transaction.type ?? TransactionType.tokenMethodApprove)
              : TransactionType.contractInteraction,
        })),
      },
    );
    return { outcome: 'submitted', transactionId: batchId };
  } catch (error) {
    return getSubmissionFailure(error);
  }
}

async function getSettledAmount(
  request: SolanaPayFollowUpRequest,
  messenger: TransactionPayControllerInitMessenger,
): Promise<string> {
  const targetAddress = request.transaction.requiredAssets?.[0]?.address;
  const account = request.transaction.txParams.from;
  if (!targetAddress || !account) {
    throw new Error('Unable to resolve Solana Pay settlement amount');
  }
  const { provider } = messenger.call(
    'NetworkController:getNetworkClientById',
    request.transaction.networkClientId,
  );
  const receipt = await provider.request({
    method: 'eth_getTransactionReceipt',
    params: [request.relayTransactionId ?? ''],
  });
  const logs = getReceiptLogs(receipt);
  const transferTopic =
    '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
  const recipientTopic = `0x${account.toLowerCase().replace(/^0x/u, '').padStart(64, '0')}`;
  return logs
    .filter(
      (log) =>
        log.address.toLowerCase() === targetAddress.toLowerCase() &&
        log.topics[0]?.toLowerCase() === transferTopic &&
        log.topics[2]?.toLowerCase() === recipientTopic,
    )
    .reduce(
      (total, log) =>
        total.plus(new BigNumber(log.data.replace(/^0x/u, ''), 16)),
      new BigNumber(0),
    )
    .toFixed(0);
}

function getReceiptLogs(
  receipt: unknown,
): { address: string; data: string; topics: string[] }[] {
  if (
    !isObject(receipt) ||
    !hasProperty(receipt, 'logs') ||
    !Array.isArray(receipt.logs)
  ) {
    throw new Error('Unable to resolve Solana Pay settlement amount');
  }
  return receipt.logs.map((log) => {
    if (
      !isObject(log) ||
      !hasProperty(log, 'address') ||
      typeof log.address !== 'string' ||
      !hasProperty(log, 'data') ||
      typeof log.data !== 'string' ||
      !hasProperty(log, 'topics') ||
      !Array.isArray(log.topics) ||
      !log.topics.every((topic) => typeof topic === 'string')
    ) {
      throw new Error('Unable to resolve Solana Pay settlement amount');
    }
    return {
      address: log.address,
      data: log.data,
      topics: log.topics.filter(
        (topic): topic is string => typeof topic === 'string',
      ),
    };
  });
}

async function getNonAtomicFollowUpStatus(
  request: GetSolanaPayFollowUpStatusRequest,
  messenger: TransactionPayControllerInitMessenger,
): Promise<'pending' | 'confirmed' | 'failed' | 'unknown'> {
  const transactions = messenger
    .call('TransactionController:getState')
    .transactions.filter(({ batchId }) => batchId === request.transactionId);
  if (!transactions.length) {
    return 'unknown';
  }
  if (transactions.some(({ status }) => status === TransactionStatus.failed)) {
    return 'failed';
  }
  if (
    transactions.every(({ status }) => status === TransactionStatus.confirmed)
  ) {
    return 'confirmed';
  }
  return 'pending';
}

function getInternalAccount(
  accountId: string,
  messenger: TransactionPayControllerInitMessenger,
): InternalAccount {
  const { address } = parseCaipAccountId(accountId as CaipAccountId);
  const accounts = Object.values(
    messenger.call('AccountsController:getState').internalAccounts.accounts,
  );
  const account = accounts.find(
    (candidate) =>
      candidate.address === address &&
      candidate.scopes.some((scope) => accountId.startsWith(`${scope}:`)),
  );
  if (!account) {
    throw new Error('Solana Pay source account unavailable');
  }
  return account;
}

async function getPreparationId({
  accountId,
  preparedTransaction,
  requestId,
  scope,
}: {
  accountId: string;
  preparedTransaction: string;
  requestId: string;
  scope: string;
}): Promise<string> {
  return await sha256(
    `${accountId}:${scope}:${requestId}:${preparedTransaction}`,
  );
}

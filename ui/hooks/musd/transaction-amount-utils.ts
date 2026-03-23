import type { TransactionMeta } from '@metamask/transaction-controller';
import type { Hex } from '@metamask/utils';
import { BigNumber } from 'bignumber.js';
import { Interface } from '@ethersproject/abi';
import { parseStandardTokenTransactionData } from '../../../shared/lib/transaction.utils';
import {
  DISTRIBUTOR_CLAIM_ABI,
  MERKL_DISTRIBUTOR_ADDRESS,
  MUSD_TOKEN_ADDRESS,
} from '../../components/app/musd/constants';
import { getClaimedAmountFromContract } from '../../components/app/musd/merkl-client';

// ERC-20 Transfer(address,address,uint256) event topic
const ERC20_TRANSFER_TOPIC =
  '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

// ---------------------------------------------------------------------------
// Generic ERC-20 / native-value extraction
// ---------------------------------------------------------------------------

/**
 * Extract the transfer/claim amount from a transaction as a decimal string.
 *
 * Tries to parse `txParams.data` as a standard token transfer and reads
 * `args._value` (the ERC-20 amount). Falls back to `txParams.value` for
 * native-token transfers. Returns `undefined` when neither source yields
 * an amount.
 *
 * @param tx - The transaction metadata to extract from.
 * @returns The amount as a base-10 decimal string, or `undefined`.
 */
export function extractTransactionAmount(
  tx: TransactionMeta,
): string | undefined {
  const txData = tx.txParams?.data;
  if (txData) {
    try {
      const parsedData = parseStandardTokenTransactionData(txData);
      const amountValue = parsedData?.args?._value;
      if (amountValue) {
        return new BigNumber(amountValue.toString()).toString(10);
      }
    } catch (e) {
      console.error('Failed to parse amount from transaction data:', e);
    }
  }

  if (tx.txParams?.value) {
    try {
      return new BigNumber(tx.txParams.value).toString(10);
    } catch (e) {
      console.error('Failed to parse amount from txParams.value:', e);
    }
  }

  return undefined;
}

// ---------------------------------------------------------------------------
// Merkl claim-specific amount utilities
// ---------------------------------------------------------------------------

/**
 * Decoded Merkl claim transaction parameters.
 */
export type MerklClaimParams = {
  /** Total cumulative reward amount (raw, in base units) */
  totalAmount: string;
  /** User address */
  userAddress: string;
  /** Reward token address */
  tokenAddress: string;
};

/**
 * Decode Merkl claim parameters from transaction calldata.
 * claim(address[] users, address[] tokens, uint256[] amounts, bytes32[][] proofs)
 *
 * @param data - The transaction data hex string
 * @returns Decoded claim parameters, or null if decoding fails
 */
export function decodeMerklClaimParams(
  data: string | undefined,
): MerklClaimParams | null {
  if (!data || typeof data !== 'string') {
    return null;
  }

  try {
    const contractInterface = new Interface(DISTRIBUTOR_CLAIM_ABI);
    const decoded = contractInterface.decodeFunctionData('claim', data);
    const [users, tokens, amounts] = decoded;

    if (!users?.length || !tokens?.length || !amounts?.length) {
      return null;
    }

    return {
      totalAmount: amounts[0].toString(),
      userAddress: users[0],
      tokenAddress: tokens[0],
    };
  } catch {
    return null;
  }
}

/**
 * Result of resolving the unclaimed amount for a Merkl claim transaction.
 */
export type GetUnclaimedAmountResult = {
  /** Total cumulative reward (raw base units) from tx calldata */
  totalAmountRaw: string;
  /** Unclaimed amount (total - claimed from contract) in raw base units */
  unclaimedRaw: string;
  /** True if the contract call succeeded */
  contractCallSucceeded: boolean;
};

/**
 * Resolve the unclaimed amount for a Merkl mUSD claim transaction.
 * Decodes tx calldata, reads already-claimed from the Merkl distributor contract,
 * and returns total and unclaimed raw amounts.
 *
 * @param txData - Transaction data hex string (txParams.data)
 * @returns Result with totalAmountRaw, unclaimedRaw, and contractCallSucceeded, or null if decoding fails
 */
export async function getUnclaimedAmountForMerklClaimTx(
  txData: string | undefined,
): Promise<GetUnclaimedAmountResult | null> {
  const claimParams = decodeMerklClaimParams(txData);
  if (!claimParams) {
    return null;
  }

  const totalAmountRaw = claimParams.totalAmount;
  const totalBigInt = BigInt(totalAmountRaw);

  try {
    const claimedAmount = await getClaimedAmountFromContract(
      claimParams.userAddress,
      claimParams.tokenAddress as Hex,
    );
    const claimedBigInt = BigInt(claimedAmount ?? '0');
    const unclaimedRaw =
      totalBigInt > claimedBigInt
        ? (totalBigInt - claimedBigInt).toString()
        : '0';
    return {
      totalAmountRaw,
      unclaimedRaw,
      contractCallSucceeded: true,
    };
  } catch {
    return {
      totalAmountRaw,
      unclaimedRaw: totalAmountRaw,
      contractCallSucceeded: false,
    };
  }
}

/**
 * Log entry from a transaction receipt.
 * The `topics` field is typed as `string` in TransactionController types,
 * but at runtime it's `string[]` (raw JSON-RPC response).
 */
type ReceiptLog = {
  address?: string;
  data?: string;
  topics?: string | string[];
};

function normalizeTopics(
  topics: string | string[] | undefined,
): string[] | null {
  if (!topics) {
    return null;
  }
  if (Array.isArray(topics)) {
    return topics;
  }
  return null;
}

function addressFromTopic(topic: string | undefined): string | undefined {
  if (!topic || topic.length < 42) {
    return undefined;
  }
  return `0x${topic.slice(-40)}`.toLowerCase();
}

/**
 * Extract the actual mUSD payout from a confirmed claim transaction's receipt logs.
 *
 * The Merkl distributor calls the mUSD token's `transfer`, which emits an
 * ERC-20 `Transfer(from=distributor, to=user, amount)` event. The `amount`
 * in this event is the real per-transaction payout (not the cumulative total
 * stored in calldata).
 *
 * @param logs - Receipt logs from txReceipt.logs
 * @param userAddress - The claiming user's address (to match the Transfer `to` field)
 * @returns The payout amount as a raw decimal string, or null if not found
 */
export function getClaimPayoutFromReceipt(
  logs: ReceiptLog[] | undefined,
  userAddress: string | undefined,
): string | null {
  if (!logs?.length || !userAddress) {
    return null;
  }

  for (const log of logs) {
    const topics = normalizeTopics(log.topics);
    if (!topics || topics.length < 3) {
      continue;
    }

    const isTransferEvent = topics[0]?.toLowerCase() === ERC20_TRANSFER_TOPIC;
    const isFromDistributor =
      addressFromTopic(topics[1]) === MERKL_DISTRIBUTOR_ADDRESS.toLowerCase();
    const isToUser = addressFromTopic(topics[2]) === userAddress.toLowerCase();
    const isMuSDToken =
      log.address?.toLowerCase() === MUSD_TOKEN_ADDRESS.toLowerCase();

    if (isTransferEvent && isFromDistributor && isToUser && isMuSDToken) {
      const amount = log.data;
      if (!amount) {
        continue;
      }
      return BigInt(amount).toString();
    }
  }

  return null;
}

/**
 * Resolve the claim payout amount for a Merkl claim transaction.
 *
 * For confirmed txs, tries receipt logs first (exact per-tx payout) then falls back to
 * contract call (total minus claimed). For non-confirmed txs, uses the contract call directly.
 *
 * @param tx - The transaction metadata
 * @returns The claim amount as a raw base-unit decimal string, or undefined
 */
export async function resolveClaimAmount(
  tx: TransactionMeta,
): Promise<string | undefined> {
  const claimParams = decodeMerklClaimParams(tx.txParams?.data);
  if (!claimParams) {
    return undefined;
  }

  // For confirmed transactions, try receipt logs first (most accurate)
  const receipt = (tx as Record<string, unknown>).txReceipt as
    | { logs?: ReceiptLog[] }
    | undefined;
  if (receipt?.logs) {
    const receiptAmount = getClaimPayoutFromReceipt(
      receipt.logs,
      claimParams.userAddress,
    );
    if (receiptAmount) {
      return receiptAmount;
    }
  }

  // Fall back to contract call: total from calldata minus already-claimed
  const result = await getUnclaimedAmountForMerklClaimTx(tx.txParams?.data);
  return result?.unclaimedRaw;
}

/**
 * mUSD Conversion Transaction Utilities
 *
 * Handles the creation and manipulation of mUSD conversion transactions.
 * These utilities build ERC-20 transfer transactions for converting stablecoins to mUSD.
 *
 * Ported from metamask-mobile:
 * app/components/UI/Earn/utils/musdConversionTransaction.ts
 */

import { Interface } from '@ethersproject/abi';
import { ORIGIN_METAMASK } from '@metamask/controller-utils';
import {
  TransactionMeta,
  TransactionParams,
  TransactionType,
} from '@metamask/transaction-controller';
import type { Hex } from '@metamask/utils';

import { NetworkClientId } from '@metamask/network-controller';
import { getMusdTokenAddressForChain } from '../constants';
import { parseStandardTokenTransactionData } from '../../../../../shared/modules/transaction.utils';

// ============================================================================
// Types
// ============================================================================

/**
 * Payment token selection for chain switching
 */
export type PayTokenSelection = {
  address: Hex;
  chainId: Hex;
};

/**
 * Parameters for creating an mUSD conversion transaction
 */
export type CreateMusdConversionTransactionParams = {
  /**
   * Chain ID of the selected payment token.
   * For mUSD conversions we MUST keep swaps same-chain (no bridging), so this
   * chain is also used as the mUSD output chain.
   */
  chainId: Hex;
  /** Address initiating the conversion */
  fromAddress: Hex;
  /** Recipient address for the mUSD (usually same as fromAddress) */
  recipientAddress: Hex;
  /**
   * ERC-20 transfer amount in hex.
   * Note: Can be either prefixed (`0x...`) or unprefixed (`...`).
   */
  amountHex: string;
  /** Network client ID for the target chain */
  networkClientId: NetworkClientId;
};

/**
 * Result of creating an mUSD conversion transaction
 */
export type CreateMusdConversionTransactionResult = {
  /** Transaction parameters for addTransaction */
  txParams: TransactionParams;
  /** Options to pass to addTransaction */
  addTxOptions: {
    skipInitialGasEstimate: boolean;
    networkClientId: NetworkClientId;
    origin: typeof ORIGIN_METAMASK;
    type: TransactionType.musdConversion;
  };
};

/**
 * Extracted transfer details from a transaction
 */
export type MusdTransferDetails = {
  recipientAddress: Hex;
  amountHex: string;
};

// ============================================================================
// Constants
// ============================================================================

const ERC20_TRANSFER_ABI = ['function transfer(address to, uint256 amount)'];
const erc20Interface = new Interface(ERC20_TRANSFER_ABI);

// ============================================================================
// Internal Helpers
// ============================================================================

/**
 * Generates ERC-20 transfer data for mUSD conversion.
 * Uses ethers.js Interface to encode the transfer function call.
 *
 * @param recipient - The recipient address
 * @param amountHex - The amount in hex format
 * @returns Encoded transfer data
 */
export function generateERC20TransferData(
  recipient: Hex,
  amountHex: string,
): Hex {
  // Ensure the amount has 0x prefix
  const normalizedAmount = amountHex.startsWith('0x')
    ? amountHex
    : `0x${amountHex}`;

  return erc20Interface.encodeFunctionData('transfer', [
    recipient,
    normalizedAmount,
  ]) as Hex;
}

/**
 * Extracts a hex value from an ethers BigNumber-like object.
 * This handles the different ways BigNumber values can be represented.
 *
 * @param value - The value to extract hex from
 * @returns Hex string or undefined if not a BigNumber-like value
 */
function getHexFromEthersBigNumberLike(value: unknown): string | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  // Check for _hex property (ethers.js BigNumber internal format)
  const maybeHex = (value as { _hex?: unknown })._hex;
  if (typeof maybeHex === 'string') {
    return maybeHex;
  }

  // Check for toHexString method
  const { toHexString } = value as { toHexString?: unknown };
  if (typeof toHexString === 'function') {
    return (toHexString as () => string).call(value) as string;
  }

  return undefined;
}

// ============================================================================
// Transaction Building Functions
// ============================================================================

/**
 * Builds the transaction parameters and options for an mUSD conversion.
 * This is a pure function that doesn't interact with any controllers.
 *
 * @param params - Transaction build parameters
 * @param params.chainId
 * @param params.fromAddress
 * @param params.recipientAddress
 * @param params.amountHex
 * @param params.networkClientId
 * @returns Transaction params and addTransaction options
 * @throws Error if mUSD is not deployed on the specified chain
 */
export function buildMusdConversionTx(params: {
  chainId: Hex;
  fromAddress: Hex;
  recipientAddress: Hex;
  amountHex: string;
  networkClientId: NetworkClientId;
}): CreateMusdConversionTransactionResult {
  const { chainId, fromAddress, recipientAddress, amountHex, networkClientId } =
    params;

  const musdTokenAddress = getMusdTokenAddressForChain(chainId);
  if (!musdTokenAddress) {
    throw new Error(`mUSD token address not found for chain ID: ${chainId}`);
  }

  // Generate ERC-20 transfer data
  const transferData = generateERC20TransferData(recipientAddress, amountHex);

  return {
    txParams: {
      to: musdTokenAddress,
      from: fromAddress,
      data: transferData,
      value: '0x0',
    },
    addTxOptions: {
      // Calculate gas estimate asynchronously to reduce first paint time
      skipInitialGasEstimate: true,
      networkClientId,
      origin: ORIGIN_METAMASK,
      type: TransactionType.musdConversion,
    },
  };
}

/**
 * Extracts transfer details (recipient and amount) from an existing mUSD conversion transaction.
 * Used when replacing a transaction after the user changes payment token/chain.
 *
 * @param transactionMeta - The transaction metadata to extract details from
 * @returns The extracted recipient address and amount
 * @throws Error if required data is missing from the transaction
 */
export function extractMusdConversionTransferDetails(
  transactionMeta: TransactionMeta,
): MusdTransferDetails {
  const data = transactionMeta?.txParams?.data;

  if (!data) {
    throw new Error('[mUSD Conversion] Missing transaction data');
  }

  // Parse the ERC-20 transfer data
  const parsedTokenTransferData = parseStandardTokenTransactionData(data);

  const fromAddress = transactionMeta?.txParams?.from as Hex | undefined;

  // Extract recipient address from parsed data, fallback to sender address
  const recipientAddress =
    (parsedTokenTransferData?.args?._to?.toString() as Hex | undefined) ??
    (parsedTokenTransferData?.args?.to?.toString() as Hex | undefined) ??
    (parsedTokenTransferData?.args?.[0]?.toString() as Hex | undefined) ??
    fromAddress;

  // Extract amount from parsed data
  const amountHex =
    getHexFromEthersBigNumberLike(parsedTokenTransferData?.args?._value) ??
    getHexFromEthersBigNumberLike(parsedTokenTransferData?.args?.amount) ??
    getHexFromEthersBigNumberLike(parsedTokenTransferData?.args?.[1]) ??
    '0x0';

  if (!recipientAddress) {
    throw new Error('[mUSD Conversion] Missing transaction txParams.from');
  }

  return { recipientAddress, amountHex };
}

/**
 * Validates that a transaction is an mUSD conversion transaction.
 *
 * @param transactionMeta - The transaction to validate
 * @returns true if this is a valid mUSD conversion transaction
 */
export function isMusdConversionTransaction(
  transactionMeta: TransactionMeta,
): boolean {
  return transactionMeta?.type === TransactionType.musdConversion;
}

/**
 * Checks if a transaction matches the given account and chain for mUSD conversion.
 *
 * @param transactionMeta - The transaction to check
 * @param selectedAddress - The selected account address
 * @param chainId - The chain ID to match
 * @returns true if the transaction matches
 */
export function isMatchingMusdConversion(
  transactionMeta: TransactionMeta,
  selectedAddress: string,
  chainId: Hex,
): boolean {
  if (!isMusdConversionTransaction(transactionMeta)) {
    return false;
  }

  if (transactionMeta?.chainId?.toLowerCase() !== chainId.toLowerCase()) {
    return false;
  }

  return (
    transactionMeta?.txParams?.from?.toLowerCase() ===
    selectedAddress.toLowerCase()
  );
}

// ============================================================================
// Transaction Orchestration Types
// ============================================================================

/**
 * Callbacks for transaction controller operations.
 * These are passed in to avoid direct dependency on extension-specific modules.
 */
export type TransactionControllerCallbacks = {
  /** Add a new transaction */
  addTransaction: (
    txParams: TransactionParams,
    options: CreateMusdConversionTransactionResult['addTxOptions'],
  ) => Promise<TransactionMeta>;

  /** Find network client ID by chain ID */
  findNetworkClientIdByChainId: (chainId: Hex) => Promise<NetworkClientId>;

  /** Fetch gas fee estimates (optional, fire-and-forget) */
  fetchGasFeeEstimates?: (networkClientId: NetworkClientId) => Promise<void>;

  /** Update payment token selection in TransactionPayController */
  updatePaymentToken?: (params: {
    transactionId: string;
    tokenAddress: Hex;
    chainId: Hex;
  }) => void;

  /** Reject an approval */
  rejectApproval?: (id: string, error: Error) => void;
};

/**
 * Creates an mUSD conversion transaction using the provided callbacks.
 * This is a higher-level function that orchestrates the transaction creation.
 *
 * @param params - Transaction creation parameters
 * @param callbacks - Controller callbacks for transaction operations
 * @returns Transaction ID and network client ID
 */
export async function createMusdConversionTransaction(
  params: CreateMusdConversionTransactionParams,
  callbacks: TransactionControllerCallbacks,
): Promise<{ transactionId: string; networkClientId: NetworkClientId }> {
  const { chainId, fromAddress, recipientAddress, amountHex, networkClientId } =
    params;

  // Build transaction params
  const { txParams, addTxOptions } = buildMusdConversionTx({
    chainId,
    fromAddress,
    recipientAddress,
    amountHex,
    networkClientId,
  });

  // Add the transaction
  const transactionMeta = await callbacks.addTransaction(
    txParams,
    addTxOptions,
  );

  return {
    transactionId: transactionMeta.id,
    networkClientId,
  };
}

/**
 * Replaces an mUSD conversion transaction when the user selects a payment token
 * on a different chain. This ensures same-chain conversions (no bridging).
 *
 * @param transactionMeta - The current transaction to replace
 * @param newPayToken - The selected payment token (on a different chain)
 * @param callbacks - Controller callbacks for transaction operations
 * @returns The new transaction ID, or undefined if replacement failed
 */
export async function replaceMusdConversionTransactionForPayToken(
  transactionMeta: TransactionMeta,
  newPayToken: PayTokenSelection,
  callbacks: TransactionControllerCallbacks,
): Promise<string | undefined> {
  if (!transactionMeta?.id || !transactionMeta?.txParams?.from) {
    throw new Error(
      '[mUSD Conversion] Missing transaction metadata for replacement',
    );
  }

  try {
    const { recipientAddress, amountHex } =
      extractMusdConversionTransferDetails(transactionMeta);

    // Find network client for the new chain
    const networkClientId = await callbacks.findNetworkClientIdByChainId(
      newPayToken.chainId,
    );

    // Create the replacement transaction
    const { transactionId: newTransactionId } =
      await createMusdConversionTransaction(
        {
          chainId: newPayToken.chainId,
          fromAddress: transactionMeta.txParams.from as Hex,
          recipientAddress,
          amountHex,
          networkClientId,
        },
        callbacks,
      );

    // Fetch gas fee estimates in background (fire and forget)
    callbacks.fetchGasFeeEstimates?.(networkClientId)?.catch(() => undefined);

    // Update payment token if callback is provided
    callbacks.updatePaymentToken?.({
      transactionId: newTransactionId,
      tokenAddress: newPayToken.address,
      chainId: newPayToken.chainId,
    });

    // Reject the previous approval (automatic rejection, not user-initiated)
    try {
      callbacks.rejectApproval?.(
        transactionMeta.id,
        new Error(
          'Automatically rejected previous transaction due to same-chain enforcement for mUSD conversions',
        ),
      );
    } catch (rejectError) {
      // This can throw if the approval doesn't exist or has already been resolved
      console.warn(
        '[mUSD Conversion] Failed to reject previous transaction approval during replacement',
        rejectError,
      );
    }

    return newTransactionId;
  } catch (error) {
    console.error(
      '[mUSD Conversion] Failed to replace transaction on chain change',
      error,
    );
    return undefined;
  }
}

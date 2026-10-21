import {
  TransactionMeta,
  TransactionType,
  type NestedTransactionMetadata,
} from '@metamask/transaction-controller';
import type { Hex } from '@metamask/utils';
import { SolScope } from '@metamask/keyring-api';
import {
  isNonEvmPaymentToken,
  PaymentOverride,
  type EvmPaymentToken,
  type TransactionPayRequiredToken,
  type TransactionPaymentToken,
} from '@metamask/transaction-pay-controller';
import { BigNumber } from 'bignumber.js';
import { isTestNetwork } from '../../../helpers/utils/network-helper';
import {
  hasTransactionType,
  isPostQuoteWithdrawTransaction,
} from '../../../../shared/lib/transactions.utils';
import { updateAtomicBatchData } from '../../../store/controller-actions/transaction-controller';
import { setPaymentOverride } from '../../../store/controller-actions/transaction-pay-controller';
import type { BlockedPayTokensListConfig } from '../selectors/feature-flags';
import { Asset, AssetStandard } from '../types/send';

const FOUR_BYTE_TOKEN_TRANSFER = '0xa9059cbb';

function toAddressWord(address: string): string {
  return address.toLowerCase().replace(/^0x/u, '').padStart(64, '0');
}

/**
 * Replace every occurrence of `oldAddress` (encoded as a 32-byte ABI word)
 * inside the `data` of each nested transaction with `newAddress`, and persist
 * the change via `updateAtomicBatchData`. No-ops when there are no nested
 * transactions or no old address to replace.
 *
 * Mirrors mobile `replaceAccountInNestedTransactions`. Used when the From-row
 * changes the withdraw recipient so the transfer calldata is rewritten
 * immediately, not only on the next amount encode.
 *
 * @param params - Replacement inputs.
 * @param params.transactionId - Id of the parent batch transaction.
 * @param params.nestedTransactions - Nested calls to scan.
 * @param params.oldAddress - Address currently encoded in calldata.
 * @param params.newAddress - Address to write in its place.
 * @returns Resolves when all nested rewrites have persisted.
 */
export async function replaceAccountInNestedTransactions({
  transactionId,
  nestedTransactions,
  oldAddress,
  newAddress,
}: {
  transactionId: string;
  nestedTransactions: NestedTransactionMetadata[] | undefined;
  oldAddress: string | undefined;
  newAddress: string;
}): Promise<void> {
  if (!oldAddress || !nestedTransactions?.length) {
    return;
  }

  const oldWord = toAddressWord(oldAddress);
  const newWord = toAddressWord(newAddress);

  if (oldWord === newWord) {
    return;
  }

  const updates: Promise<void>[] = [];

  nestedTransactions.forEach((nested, index) => {
    const { data } = nested;
    if (!data) {
      return;
    }

    const lowerData = data.toLowerCase();
    if (!lowerData.includes(oldWord)) {
      return;
    }

    const newData = lowerData.split(oldWord).join(newWord) as Hex;

    updates.push(
      updateAtomicBatchData({
        transactionId,
        transactionIndex: index,
        transactionData: newData,
      }).catch((error) => {
        console.error('Failed to update account in nested transaction', error);
        throw error;
      }),
    );
  });

  await Promise.all(updates);
}

export function getTokenTransferData(
  transactionMeta: TransactionMeta | undefined,
):
  | {
      data: Hex;
      to: Hex;
      index?: number;
    }
  | undefined {
  const { nestedTransactions, txParams } = transactionMeta ?? {};
  const { data: singleData } = txParams ?? {};
  const singleTo = txParams?.to as Hex | undefined;

  if (singleData?.startsWith(FOUR_BYTE_TOKEN_TRANSFER) && singleTo) {
    return { data: singleData as Hex, to: singleTo, index: undefined };
  }

  const nestedCallIndex = nestedTransactions?.findIndex((call) =>
    call.data?.startsWith(FOUR_BYTE_TOKEN_TRANSFER),
  );

  const nestedCall =
    nestedCallIndex === undefined
      ? undefined
      : nestedTransactions?.[nestedCallIndex];

  if (nestedCall?.data && nestedCall.to) {
    return {
      data: nestedCall.data,
      to: nestedCall.to,
      index: nestedCallIndex,
    };
  }

  return undefined;
}

export function getTokenAddress(
  transactionMeta: TransactionMeta | undefined,
): Hex {
  const nestedCall = transactionMeta && getTokenTransferData(transactionMeta);

  if (nestedCall) {
    return nestedCall.to;
  }

  // Money Account deposit batches target the vault in `txParams.to` and keep
  // the approve/deposit calls in `nestedTransactions`, so the parent `to` is
  // never the destination token. Fall back to the required asset (mUSD)
  // before the parent address. Matches mobile.
  const requiredAssetAddress = transactionMeta?.requiredAssets?.[0]?.address;
  if (requiredAssetAddress) {
    return requiredAssetAddress;
  }

  return transactionMeta?.txParams?.to as Hex;
}

export function getAvailableTokens({
  payToken,
  requiredTokens,
  tokens,
  blockedTokens,
  isSolanaPayEnabled = false,
}: {
  payToken?: TransactionPaymentToken;
  requiredTokens?: TransactionPayRequiredToken[];
  tokens: Asset[];
  blockedTokens?: BlockedPayTokensListConfig;
  isSolanaPayEnabled?: boolean;
}): Asset[] {
  return tokens
    .filter((token) => {
      if (
        token.standard !== AssetStandard.ERC20 &&
        token.standard !== AssetStandard.Native
      ) {
        return false;
      }

      const isSelected = isPaymentTokenSelected(token, payToken);

      // A selected Solana source stays listed after the flag is turned off so
      // the confirmation can still show what the user picked.
      if (isSolanaPaySource(token)) {
        return (
          isSelected ||
          (isSolanaPayEnabled && new BigNumber(token.balance ?? 0).gt(0))
        );
      }

      if (!token.accountType?.includes('eip155')) {
        return false;
      }

      // MetaMask Pay can't source funds from testnets (quotes route through
      // bridges/swaps that don't support them), so exclude testnet tokens
      // from both the Pay-with list and the auto-selected default.
      if (token.chainId && isTestNetwork(token.chainId as Hex)) {
        return false;
      }

      if (isSelected) {
        return true;
      }

      const isRequiredToken = (requiredTokens ?? []).some(
        (t) =>
          t.address.toLowerCase() === token.address?.toLowerCase() &&
          t.chainId === token.chainId &&
          !t.skipIfBalance,
      );

      if (isRequiredToken) {
        return true;
      }

      return new BigNumber(token.balance ?? 0).gt(0);
    })
    .map((token) => {
      const blocked = isTokenBlocked(token, blockedTokens);
      const isSelected = isPaymentTokenSelected(token, payToken);

      return {
        ...token,
        disabled: blocked,
        isSelected,
      };
    })
    .sort((a, b) => Number(a.disabled) - Number(b.disabled));
}

/**
 * Narrows a payment token to its EVM member. Hex address and chain lookups
 * (market data, gas, no-fee routes) only apply to EVM payment tokens.
 *
 * @param payToken - Selected payment token, if any.
 * @returns The EVM payment token, or `undefined` for none or a non-EVM token.
 */
export function getEvmPaymentToken(
  payToken?: TransactionPaymentToken,
): EvmPaymentToken | undefined {
  return payToken && !isNonEvmPaymentToken(payToken) ? payToken : undefined;
}

/**
 * Stable identity of the selected payment token, used to detect a switch.
 * Non-EVM tokens are keyed by `InternalAccount` and CAIP-19 asset; EVM tokens
 * by address and chain.
 *
 * @param payToken - Selected payment token, if any.
 * @returns Identity key, or an empty-token key when none is selected.
 */
export function getPaymentTokenKey(payToken?: TransactionPaymentToken): string {
  if (payToken && isNonEvmPaymentToken(payToken)) {
    return `${payToken.walletAccountId}:${payToken.assetId}`;
  }

  return `${payToken?.address ?? ''}:${payToken?.chainId ?? ''}`;
}

/**
 * Whether the confirmation is funded from the Money Account. A Money Account
 * deposit funded from Solana also carries the Money Account override so Core
 * runs the vault deposit as a second leg, but the funds come from the Solana
 * account.
 *
 * @param options - Options.
 * @param options.paymentOverride - Payment override on the transaction.
 * @param options.payToken - Selected payment token, if any.
 * @param options.transactionMeta - Current confirmation metadata.
 * @returns True if the Money Account funds the confirmation.
 */
export function isMoneyAccountFunding({
  paymentOverride,
  payToken,
  transactionMeta,
}: {
  paymentOverride?: PaymentOverride;
  payToken?: TransactionPaymentToken;
  transactionMeta?: TransactionMeta;
}): boolean {
  if (paymentOverride !== PaymentOverride.MoneyAccount) {
    return false;
  }

  const isSolanaPayDeposit =
    payToken !== undefined &&
    isNonEvmPaymentToken(payToken) &&
    hasTransactionType(transactionMeta, [TransactionType.moneyAccountDeposit]);

  return !isSolanaPayDeposit;
}

/**
 * Whether a send-flow asset is a Solana mainnet SOL or SPL balance that
 * MetaMask Pay can quote from. Such assets are identified by their CAIP-19
 * `assetId` and the `InternalAccount` that holds them.
 *
 * @param token - Send-flow asset.
 * @returns True for Solana mainnet assets held by a Solana account.
 */
export function isSolanaPaySource(token: Asset): boolean {
  return Boolean(
    token.accountType?.startsWith('solana:') &&
    String(token.chainId) === SolScope.Mainnet &&
    token.assetId &&
    token.accountId,
  );
}

/**
 * Whether a send-flow asset is the selected payment token. Non-EVM payment
 * tokens match on CAIP-19 asset and `InternalAccount` ID; EVM tokens match on
 * address and chain.
 *
 * @param token - Send-flow asset.
 * @param payToken - Selected payment token, if any.
 * @returns True if the asset is the selected payment token.
 */
export function isPaymentTokenSelected(
  token: Asset,
  payToken?: TransactionPaymentToken,
): boolean {
  if (!payToken) {
    return false;
  }

  if (isNonEvmPaymentToken(payToken)) {
    return (
      token.assetId === payToken.assetId &&
      token.accountId === payToken.walletAccountId
    );
  }

  return (
    payToken.address.toLowerCase() === token.address?.toLowerCase() &&
    payToken.chainId === token.chainId
  );
}

/**
 * Whether a token is blocked by the MM Pay LD blocklist
 * (`confirmations_pay_tokens.blockedTokens`).
 *
 * @param token - Token address/chain to check.
 * @param token.address - Token contract address.
 * @param token.chainId - Token chain id.
 * @param blockedConfig - Resolved blocklist for the current transaction type.
 */
export function isTokenBlocked(
  token: { address?: string; chainId?: string | number },
  blockedConfig?: BlockedPayTokensListConfig,
): boolean {
  if (!blockedConfig) {
    return false;
  }

  const { address, chainId: tokenChainId } = token;
  const chainId = tokenChainId ? String(tokenChainId) : undefined;

  if (
    chainId &&
    (blockedConfig.chainIds ?? []).some(
      (id) => id.toLowerCase() === chainId.toLowerCase(),
    )
  ) {
    return true;
  }

  if (!address || !chainId) {
    return false;
  }

  return (blockedConfig.tokens ?? []).some(
    (blocked) =>
      blocked.address.toLowerCase() === address.toLowerCase() &&
      blocked.chainId.toLowerCase() === chainId.toLowerCase(),
  );
}

/**
 * Selects Money Account as the payment method for a confirmation.
 * Sets `paymentOverride` and, for deposit flows, refunds leftover funds to the
 * money account address. Perps/Predict withdraws to Money Account run
 * non-atomically so the post-Relay transfer is submitted after the quote.
 *
 * @param transactionId - Confirmation transaction id.
 * @param moneyAccountAddress - Derived money account address, when known.
 * @param transactionMeta - Current confirmation metadata.
 */
export function applyMoneyAccountOverride(
  transactionId: string,
  moneyAccountAddress: string | undefined,
  transactionMeta: TransactionMeta | undefined,
): void {
  const isPerpsOrPredictWithdraw = hasTransactionType(transactionMeta, [
    TransactionType.perpsWithdraw,
    TransactionType.predictWithdraw,
  ]);
  const isPostQuoteWithdraw = isPostQuoteWithdrawTransaction(transactionMeta);

  setPaymentOverride(transactionId, {
    ...(isPerpsOrPredictWithdraw ? { atomic: false } : {}),
    paymentOverride: PaymentOverride.MoneyAccount,
    ...(!isPostQuoteWithdraw && moneyAccountAddress
      ? { refundTo: moneyAccountAddress as Hex }
      : {}),
  }).catch((error) => {
    console.error('Failed to apply money account payment override', error);
  });
}

/**
 * Clears a Money Account (or other) payment override on the confirmation.
 *
 * @param transactionId - Confirmation transaction id.
 */
export function clearPaymentOverride(transactionId: string): void {
  setPaymentOverride(transactionId, {
    paymentOverride: undefined,
  }).catch((error) => {
    console.error('Failed to clear payment override', error);
  });
}

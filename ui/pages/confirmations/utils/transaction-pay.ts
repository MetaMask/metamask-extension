import { TransactionMeta } from '@metamask/transaction-controller';
import type { Hex } from '@metamask/utils';
import {
  PaymentOverride,
  type TransactionPayRequiredToken,
  type TransactionPaymentToken,
} from '@metamask/transaction-pay-controller';
import { BigNumber } from 'bignumber.js';
import { isTestNetwork } from '../../../helpers/utils/network-helper';
import { isPostQuoteWithdrawTransaction } from '../../../../shared/lib/transactions.utils';
import { setPaymentOverride } from '../../../store/controller-actions/transaction-pay-controller';
import type { BlockedPayTokensListConfig } from '../selectors/feature-flags';
import { Asset, AssetStandard } from '../types/send';

const FOUR_BYTE_TOKEN_TRANSFER = '0xa9059cbb';

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

  return transactionMeta?.txParams?.to as Hex;
}

export function getAvailableTokens({
  payToken,
  requiredTokens,
  tokens,
  blockedTokens,
}: {
  payToken?: TransactionPaymentToken;
  requiredTokens?: TransactionPayRequiredToken[];
  tokens: Asset[];
  blockedTokens?: BlockedPayTokensListConfig;
}): Asset[] {
  return tokens
    .filter((token) => {
      if (
        (token.standard !== AssetStandard.ERC20 &&
          token.standard !== AssetStandard.Native) ||
        !token.accountType?.includes('eip155')
      ) {
        return false;
      }

      // MetaMask Pay can't source funds from testnets (quotes route through
      // bridges/swaps that don't support them), so exclude testnet tokens
      // from both the Pay-with list and the auto-selected default.
      if (token.chainId && isTestNetwork(token.chainId as Hex)) {
        return false;
      }

      const isSelected =
        payToken?.address.toLowerCase() === token.address?.toLowerCase() &&
        payToken?.chainId === token.chainId;

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
      const isSelected =
        payToken?.address.toLowerCase() === token.address?.toLowerCase() &&
        payToken?.chainId === token.chainId;

      return {
        ...token,
        disabled: blocked,
        isSelected,
      };
    })
    .sort((a, b) => Number(a.disabled) - Number(b.disabled));
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
 * money account address.
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
  const isWithdraw = isPostQuoteWithdrawTransaction(transactionMeta);

  setPaymentOverride(transactionId, {
    paymentOverride: PaymentOverride.MoneyAccount,
    ...(!isWithdraw && moneyAccountAddress
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

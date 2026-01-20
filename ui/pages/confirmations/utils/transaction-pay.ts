import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import type { Hex } from '@metamask/utils';
import type {
  TransactionPayRequiredToken,
  TransactionPaymentToken,
} from '@metamask/transaction-pay-controller';
import { getNativeTokenAddress } from '@metamask/assets-controllers';
import { BigNumber } from 'bignumber.js';
import { Asset, AssetStandard } from '../types/send';

const FOUR_BYTE_TOKEN_TRANSFER = '0xa9059cbb';

export function hasTransactionType(
  transactionMeta: TransactionMeta | undefined,
  types: TransactionType[],
): boolean {
  return types.includes(transactionMeta?.type as TransactionType);
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

  return transactionMeta?.txParams?.to as Hex;
}

export function getAvailableTokens({
  payToken,
  requiredTokens,
  tokens,
}: {
  payToken?: TransactionPaymentToken;
  requiredTokens?: TransactionPayRequiredToken[];
  tokens: Asset[];
}): Asset[] {
  return tokens
    .filter((token) => {
      if (
        token.standard !== AssetStandard.ERC20 ||
        !token.accountType?.includes('eip155')
      ) {
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
      const chainId = (token.chainId as Hex) ?? '0x0';

      const nativeToken = tokens.find(
        (t) =>
          t.chainId === chainId && t.address === getNativeTokenAddress(chainId),
      );

      const noNativeBalance =
        !nativeToken || new BigNumber(nativeToken.balance ?? 0).isZero();

      const disabled = noNativeBalance;

      const isSelected =
        payToken?.address.toLowerCase() === token.address?.toLowerCase() &&
        payToken?.chainId === token.chainId;

      return {
        ...token,
        disabled,
        isSelected,
      };
    });
}

import { useLayoutEffect, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import type { TransactionMeta } from '@metamask/transaction-controller';
import type { Hex } from '@metamask/utils';
import { getHardwareWalletType } from '../../../../../shared/lib/selectors/keyring';
import { isPostQuoteWithdrawTransaction } from '../../../../../shared/lib/transactions.utils';
import { Asset } from '../../types/send';
import { useConfirmContext } from '../../context/confirm';
import { useTransactionPayToken } from './useTransactionPayToken';
import { useTransactionPayRequiredTokens } from './useTransactionPayData';
import { useTransactionPayAvailableTokens } from './useTransactionPayAvailableTokens';
import type { SetPayTokenRequest } from './types';
import { usePostQuoteWithdrawTokenFilter } from './useWithdrawTokenFilter';

export function useAutomaticTransactionPayToken({
  disable = false,
  preferredToken,
}: {
  disable?: boolean;
  preferredToken?: SetPayTokenRequest;
} = {}) {
  // Per-id guard: don't re-dispatch on revisit, do dispatch for new tx.
  const isUpdated = useRef<string | undefined>(undefined);
  const { payToken, setPayToken } = useTransactionPayToken();
  const requiredTokens = useTransactionPayRequiredTokens();
  const availableTokens = useTransactionPayAvailableTokens();

  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const transactionId = currentConfirmation?.id;
  const isPostQuoteWithdraw =
    isPostQuoteWithdrawTransaction(currentConfirmation);
  const {
    filterTokens: postQuoteWithdrawTokenFilter,
    isFilterApplied: isPostQuoteWithdrawTokenFilterApplied,
    isTokenAllowed: isPostQuoteWithdrawTokenAllowed,
  } = usePostQuoteWithdrawTokenFilter();

  const tokens = useMemo(
    () =>
      isPostQuoteWithdrawTokenFilterApplied
        ? postQuoteWithdrawTokenFilter(availableTokens)
        : availableTokens,
    [
      availableTokens,
      isPostQuoteWithdrawTokenFilterApplied,
      postQuoteWithdrawTokenFilter,
    ],
  );

  const tokensWithBalance = useMemo(
    () => tokens.filter((t) => !t.disabled),
    [tokens],
  );

  const hardwareWalletType = useSelector(getHardwareWalletType);
  const isHardwareWallet = useMemo(
    () => Boolean(hardwareWalletType),
    [hardwareWalletType],
  );

  const targetToken = useMemo(
    () => requiredTokens.find((token) => !token.allowUnderMinimum),
    [requiredTokens],
  );

  useLayoutEffect(() => {
    if (
      disable ||
      payToken ||
      !transactionId ||
      isUpdated.current === transactionId
    ) {
      return;
    }

    const automaticToken = getBestToken({
      isHardwareWallet,
      isPostQuoteWithdraw,
      isPostQuoteWithdrawTokenFilterApplied,
      isPostQuoteWithdrawTokenAllowed,
      targetToken,
      tokens: tokensWithBalance,
      preferredToken,
    });

    if (!automaticToken) {
      return;
    }

    setPayToken({
      address: automaticToken.address,
      chainId: automaticToken.chainId,
    });

    isUpdated.current = transactionId;
  }, [
    disable,
    isHardwareWallet,
    isPostQuoteWithdraw,
    isPostQuoteWithdrawTokenFilterApplied,
    isPostQuoteWithdrawTokenAllowed,
    payToken,
    preferredToken,
    requiredTokens,
    setPayToken,
    targetToken,
    tokensWithBalance,
    transactionId,
  ]);
}

function getBestToken({
  isHardwareWallet,
  isPostQuoteWithdraw,
  isPostQuoteWithdrawTokenFilterApplied,
  isPostQuoteWithdrawTokenAllowed,
  preferredToken,
  targetToken,
  tokens,
}: {
  isHardwareWallet: boolean;
  isPostQuoteWithdraw: boolean;
  isPostQuoteWithdrawTokenFilterApplied: boolean;
  isPostQuoteWithdrawTokenAllowed: (
    chainId: string,
    address: string,
  ) => boolean;
  preferredToken?: SetPayTokenRequest;
  targetToken?: { address: Hex; chainId: Hex };
  tokens: Asset[];
}): { address: Hex; chainId: Hex } | undefined {
  const targetTokenFallback = targetToken
    ? {
        address: targetToken.address,
        chainId: targetToken.chainId,
      }
    : undefined;

  if (isHardwareWallet) {
    return targetTokenFallback;
  }

  // Without a post-quote withdraw allowlist, `preferredToken` is the
  // destination: honor it even if the user has no wallet balance of it.
  if (isPostQuoteWithdraw && preferredToken) {
    if (!isPostQuoteWithdrawTokenFilterApplied) {
      return preferredToken;
    }

    if (
      isPostQuoteWithdrawTokenAllowed(
        preferredToken.chainId,
        preferredToken.address,
      )
    ) {
      return preferredToken;
    }
  } else if (preferredToken) {
    const preferredTokenAvailable = tokens.some(
      (token) =>
        token.address?.toLowerCase() === preferredToken.address.toLowerCase() &&
        String(token.chainId)?.toLowerCase() ===
          preferredToken.chainId.toLowerCase(),
    );

    if (preferredTokenAvailable) {
      return preferredToken;
    }
  }

  if (isPostQuoteWithdrawTokenFilterApplied && tokens.length === 0) {
    return undefined;
  }

  if (tokens?.length) {
    return {
      address: tokens[0].address as Hex,
      chainId: tokens[0].chainId as Hex,
    };
  }

  return targetTokenFallback;
}

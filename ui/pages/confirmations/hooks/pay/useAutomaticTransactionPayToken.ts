import { useLayoutEffect, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import type { TransactionMeta } from '@metamask/transaction-controller';
import type { Hex } from '@metamask/utils';
import { getHardwareWalletType } from '../../../../selectors';
import { isPerpsWithdrawTransaction } from '../../../../../shared/lib/transactions.utils';
import { Asset } from '../../types/send';
import { useConfirmContext } from '../../context/confirm';
import { useTransactionPayToken } from './useTransactionPayToken';
import { useTransactionPayRequiredTokens } from './useTransactionPayData';
import { useTransactionPayAvailableTokens } from './useTransactionPayAvailableTokens';
import type { SetPayTokenRequest } from './types';

export function useAutomaticTransactionPayToken({
  disable = false,
  preferredToken,
}: {
  disable?: boolean;
  preferredToken?: SetPayTokenRequest;
} = {}) {
  // Track which transactionId we already auto-selected for so navigating away
  // and back to the same confirmation doesn't dispatch again, but a new
  // confirmation gets a fresh selection. Mirrors mobile's per-id guard.
  const isUpdated = useRef<string | undefined>(undefined);
  const { payToken, setPayToken } = useTransactionPayToken();
  const requiredTokens = useTransactionPayRequiredTokens();
  const tokens = useTransactionPayAvailableTokens();

  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const transactionId = currentConfirmation?.id;
  const isWithdraw = isPerpsWithdrawTransaction(currentConfirmation);

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

  // `useLayoutEffect` so the dispatch lands before the browser paints the
  // first frame. Without this, perpsWithdraw briefly shows the required token
  // (USDC) and then flashes to the auto-picked highest-balance token (e.g.
  // ETH) on the next commit. Layout effects + Redux's batched updates collapse
  // both renders into a single paint.
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
      isWithdraw,
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
    isWithdraw,
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
  isWithdraw,
  preferredToken,
  targetToken,
  tokens,
}: {
  isHardwareWallet: boolean;
  isWithdraw: boolean;
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

  // For withdraws the preferred token is the DESTINATION (where funds arrive),
  // not the source — the user usually has no wallet balance of it. Honour the
  // explicit selection regardless of `availableTokens`. Mirrors mobile's
  // `isWithdraw && lastWithdrawToken` branch in
  // `useAutomaticTransactionPayToken`.
  if (isWithdraw && preferredToken) {
    return preferredToken;
  }

  if (preferredToken) {
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

  if (tokens?.length) {
    return {
      address: tokens[0].address as Hex,
      chainId: tokens[0].chainId as Hex,
    };
  }

  return targetTokenFallback;
}

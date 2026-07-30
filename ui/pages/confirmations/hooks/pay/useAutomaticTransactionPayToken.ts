import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import type { TransactionMeta } from '@metamask/transaction-controller';
import type { Hex } from '@metamask/utils';
import { getHardwareWalletType } from '../../../../../shared/lib/selectors/keyring';
import { isPostQuoteWithdrawTransaction } from '../../../../../shared/lib/transactions.utils';
import { Asset } from '../../types/send';
import { useConfirmContext } from '../../context/confirm';
import {
  selectMinimumRequiredTokenBalance,
  selectPreferredPayTokens,
  type PreferredPayToken,
} from '../../selectors/feature-flags';
import { useTransactionAccountOverride } from '../transactions/useTransactionAccountOverride';
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
  const accountOverride = useTransactionAccountOverride();

  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const transactionId = currentConfirmation?.id;
  const transactionType = currentConfirmation?.type;
  const from = currentConfirmation?.txParams?.from;
  const isPostQuoteWithdraw =
    isPostQuoteWithdrawTransaction(currentConfirmation);
  const {
    filterTokens: postQuoteWithdrawTokenFilter,
    isFilterApplied: isPostQuoteWithdrawTokenFilterApplied,
    isTokenAllowed: isPostQuoteWithdrawTokenAllowed,
  } = usePostQuoteWithdrawTokenFilter();

  const preferredTokensFromFlags = useSelector((state) =>
    selectPreferredPayTokens(state, transactionType),
  );
  const minimumRequiredTokenBalance = useSelector(
    selectMinimumRequiredTokenBalance,
  );

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

  const automaticToken = useMemo(
    () =>
      getBestToken({
        isHardwareWallet,
        isPostQuoteWithdraw,
        isPostQuoteWithdrawTokenFilterApplied,
        isPostQuoteWithdrawTokenAllowed,
        minimumRequiredTokenBalance,
        preferredToken,
        preferredTokensFromFlags,
        targetToken,
        tokens: tokensWithBalance,
      }),
    [
      isHardwareWallet,
      isPostQuoteWithdraw,
      isPostQuoteWithdrawTokenFilterApplied,
      isPostQuoteWithdrawTokenAllowed,
      minimumRequiredTokenBalance,
      preferredToken,
      preferredTokensFromFlags,
      targetToken,
      tokensWithBalance,
    ],
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

    if (!automaticToken) {
      return;
    }

    setPayToken({
      address: automaticToken.address,
      chainId: automaticToken.chainId,
    });

    isUpdated.current = transactionId;
  }, [
    automaticToken,
    disable,
    payToken,
    requiredTokens,
    setPayToken,
    transactionId,
  ]);

  // Re-select the pay token whenever the signer address (`from`) or the
  // account selected in the From account row (`accountOverride`) changes.
  // `accountOverride` switches money-account deposit to a different funding
  // account without touching `txParams.from`.
  const prevAccountKeyRef = useRef(`${from ?? ''}:${accountOverride ?? ''}`);
  const pendingAccountReselectRef = useRef(false);
  useEffect(() => {
    const accountKey = `${from ?? ''}:${accountOverride ?? ''}`;
    if (disable || !from || isPostQuoteWithdraw) {
      return;
    }

    if (prevAccountKeyRef.current !== accountKey) {
      prevAccountKeyRef.current = accountKey;
      pendingAccountReselectRef.current = true;
    }

    if (!pendingAccountReselectRef.current) {
      return;
    }

    // Wait for the new account's funding tokens before selecting. Otherwise
    // getBestToken falls back to the required destination token (mUSD on
    // Monad) and the Pay-with row briefly shows that instead of a loader.
    if (tokensWithBalance.length === 0 || !automaticToken) {
      return;
    }

    setPayToken({
      address: automaticToken.address,
      chainId: automaticToken.chainId,
    });
    pendingAccountReselectRef.current = false;
  }, [
    accountOverride,
    automaticToken,
    disable,
    from,
    isPostQuoteWithdraw,
    setPayToken,
    tokensWithBalance.length,
  ]);
}

function getBestToken({
  isHardwareWallet,
  isPostQuoteWithdraw,
  isPostQuoteWithdrawTokenFilterApplied,
  isPostQuoteWithdrawTokenAllowed,
  minimumRequiredTokenBalance,
  preferredToken,
  preferredTokensFromFlags,
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
  minimumRequiredTokenBalance: number;
  preferredToken?: SetPayTokenRequest;
  preferredTokensFromFlags: PreferredPayToken[];
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

  if (preferredTokensFromFlags.length) {
    const candidates: Asset[] = [];
    for (const preferred of preferredTokensFromFlags) {
      const matchingToken = tokens.find(
        (token) =>
          token.address?.toLowerCase() === preferred.address.toLowerCase() &&
          String(token.chainId)?.toLowerCase() ===
            preferred.chainId.toLowerCase(),
      );
      if (matchingToken) {
        candidates.push(matchingToken);
      }
    }

    // Post-quote withdraws: first held preferred token (no fiat floor).
    if (isPostQuoteWithdraw && candidates.length) {
      return {
        address: candidates[0].address as Hex,
        chainId: candidates[0].chainId as Hex,
      };
    }

    const eligible = candidates
      .filter(
        (token) => (token.fiat?.balance ?? 0) >= minimumRequiredTokenBalance,
      )
      .sort((a, b) => (b.fiat?.balance ?? 0) - (a.fiat?.balance ?? 0));

    if (eligible.length) {
      return {
        address: eligible[0].address as Hex,
        chainId: eligible[0].chainId as Hex,
      };
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

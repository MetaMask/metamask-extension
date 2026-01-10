import { useEffect, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import type { Hex } from '@metamask/utils';
import type { TransactionMeta } from '@metamask/transaction-controller';
import { useTransactionPayToken } from './useTransactionPayToken';
import { useTransactionPayRequiredTokens } from './useTransactionPayData';
import { useTransactionPayAvailableTokens } from './useTransactionPayAvailableTokens';
import { useConfirmContext } from '../../context/confirm';
import { getHardwareWalletType } from '../../../../selectors';
import type { TransactionPayAsset, SetPayTokenRequest } from './types';

export function useAutomaticTransactionPayToken({
  disable = false,
  preferredToken,
}: {
  disable?: boolean;
  preferredToken?: SetPayTokenRequest;
} = {}) {
  const isUpdated = useRef(false);
  const { setPayToken } = useTransactionPayToken();
  const requiredTokens = useTransactionPayRequiredTokens();
  const tokens = useTransactionPayAvailableTokens();

  const tokensWithBalance = useMemo(
    () => tokens.filter((t) => !t.disabled),
    [tokens],
  );

  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();

  const {
    txParams: { from },
  } = transactionMeta ?? { txParams: {} };

  const hardwareWalletType = useSelector(getHardwareWalletType);
  const isHardwareWallet = useMemo(
    () => Boolean(hardwareWalletType),
    [hardwareWalletType],
  );

  const targetToken = useMemo(
    () => requiredTokens.find((token) => !token.allowUnderMinimum),
    [requiredTokens],
  );

  useEffect(() => {
    if (disable || isUpdated.current) {
      return;
    }

    const automaticToken = getBestToken({
      isHardwareWallet,
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

    isUpdated.current = true;
  }, [
    disable,
    isHardwareWallet,
    preferredToken,
    requiredTokens,
    setPayToken,
    targetToken,
    tokensWithBalance,
  ]);
}

function getBestToken({
  isHardwareWallet,
  preferredToken,
  targetToken,
  tokens,
}: {
  isHardwareWallet: boolean;
  preferredToken?: SetPayTokenRequest;
  targetToken?: { address: Hex; chainId: Hex };
  tokens: TransactionPayAsset[];
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


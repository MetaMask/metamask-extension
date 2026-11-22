import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { getNativeTokenAddress } from '@metamask/assets-controllers';
import { isMusdToken } from '@metamask/money-account-utils';
import type { Hex } from '@metamask/utils';
import { CHAIN_ID_TO_CURRENCY_SYMBOL_MAP } from '../../../shared/constants/network';
import { useI18nContext } from '../useI18nContext';
import { selectSingleTokenByAddressAndChainId } from '../../selectors/assets';
import type { MoneyActivityItem } from '../../pages/money/types/money-activity';
import {
  getAccountsApiActivityDisplayInfo,
  getMoneyActivityDisplayInfo,
  resolvePayTokenSymbol,
  type MoneyActivityTranslate,
  type MoneyTransactionDisplayInfo,
} from '../../pages/money/utils/money-activity-display';

/**
 * Resolves display strings for a Money activity row, including pay-token
 * metadata for on-chain conversion/send/deposit subtitles.
 *
 * @param item - Source-tagged activity item.
 * @returns Label, subtitle, amounts, icon, and status.
 */
export function useMoneyActivityDisplayInfo(
  item: MoneyActivityItem,
): MoneyTransactionDisplayInfo {
  const t = useI18nContext() as MoneyActivityTranslate;
  const payTokenAddress =
    item.kind === 'onchain'
      ? (item.tx.metamaskPay?.tokenAddress as Hex | undefined)
      : undefined;
  const payTokenChainId =
    item.kind === 'onchain'
      ? (item.tx.metamaskPay?.chainId as Hex | undefined)
      : undefined;

  const payToken = useSelector((state) =>
    payTokenAddress && payTokenChainId && !isMusdToken(payTokenAddress)
      ? selectSingleTokenByAddressAndChainId(
          state,
          payTokenAddress,
          payTokenChainId,
        )
      : undefined,
  );

  const nativeTicker = useSelector(() => {
    if (payToken || !payTokenAddress || !payTokenChainId) {
      return undefined;
    }
    try {
      if (
        getNativeTokenAddress(payTokenChainId).toLowerCase() !==
        payTokenAddress.toLowerCase()
      ) {
        return undefined;
      }
    } catch {
      return undefined;
    }
    return CHAIN_ID_TO_CURRENCY_SYMBOL_MAP[
      payTokenChainId as keyof typeof CHAIN_ID_TO_CURRENCY_SYMBOL_MAP
    ];
  });

  return useMemo(() => {
    if (item.kind === 'accountsApi') {
      return getAccountsApiActivityDisplayInfo(item.tx, t);
    }

    const sourceTokenSymbol = resolvePayTokenSymbol(
      payTokenAddress,
      payToken?.symbol,
      nativeTicker,
    );
    return getMoneyActivityDisplayInfo(item.tx, t, sourceTokenSymbol);
  }, [item, t, payTokenAddress, payToken?.symbol, nativeTicker]);
}

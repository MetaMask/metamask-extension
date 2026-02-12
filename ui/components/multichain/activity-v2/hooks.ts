import { useSelector } from 'react-redux';
import { formatIconUrlWithProxy } from '@metamask/assets-controllers';
import { Hex } from '@metamask/utils';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getTokenList, selectERC20TokensByChain } from '../../../selectors';
import type { TransactionViewModel } from '../../../../shared/acme-controller/types';
import { TransactionGroupCategory } from '../../../../shared/constants/transaction';

const ETH_ICON =
  'https://raw.githubusercontent.com/MetaMask/metamask-extension/main/app/images/eth_logo.svg';

const nonEvmTypeMap: Record<string, string> = {
  send: 'sent',
  receive: 'received',
  swap: 'swap',
  'stake:deposit': 'stakingDeposit',
  'stake:withdraw': 'stakingWithdrawal',
  unknown: 'interaction',
};

export function useGetTitle(transaction: TransactionViewModel): string {
  const t = useI18nContext();

  // This should be server-side
  if (transaction.category === TransactionGroupCategory.swap) {
    const fromSymbol = transaction.amounts?.from?.symbol;
    const toSymbol = transaction.amounts?.to?.symbol;

    if (fromSymbol && toSymbol) {
      return t('swapTokenToToken', [fromSymbol, toSymbol]);
    }

    // return t('swap');
  }

  if (transaction.readable) {
    return transaction.readable;
  }

  const key = nonEvmTypeMap[transaction.transactionType];
  return key ? t(key) : '';
}

/**
 * EVM only: token avatar icon URL from TransactionViewModel-style data.
 * Pass chainId + symbol; optional tokenAddress when available (e.g. transferInformation.contractAddress).
 */
export function useEvmTokenIconUrl(
  chainId: Hex,
  symbol: string | undefined,
  tokenAddress?: string,
): string | undefined {
  const tokenList = useSelector(getTokenList) ?? {};
  const erc20ByChain = useSelector(selectERC20TokensByChain);
  const hexChainId = typeof chainId === 'string' && chainId.startsWith('0x') ? chainId : `0x${Number(chainId).toString(16)}`;
  const address = tokenAddress?.toLowerCase();
  const isNative = !address || address === '0x0000000000000000000000000000000000000000';

  if (!symbol) return undefined;
  if (isNative || !address) {
    if (symbol === 'ETH') return ETH_ICON;
    const byChain = erc20ByChain?.[hexChainId]?.data;
    const bySymbol = byChain && (Object.values(byChain) as { symbol?: string; iconUrl?: string }[]).find((x) => x.symbol?.toLowerCase() === symbol.toLowerCase());
    if (bySymbol?.iconUrl) return bySymbol.iconUrl;
    const fromList = Object.values(tokenList as Record<string, { symbol?: string; iconUrl?: string }>).find(
      (x) => x.symbol?.toLowerCase() === symbol.toLowerCase(),
    );
    return fromList?.iconUrl;
  }

  const fromList = (tokenList as Record<string, { iconUrl?: string }>)[address]?.iconUrl;
  if (fromList) return fromList;
  const fromChain = erc20ByChain?.[hexChainId]?.data?.[address]?.iconUrl;
  if (fromChain) return fromChain;
  try {
    return formatIconUrlWithProxy({ chainId: hexChainId as `0x${string}`, tokenAddress: address });
  } catch {
    return undefined;
  }
}

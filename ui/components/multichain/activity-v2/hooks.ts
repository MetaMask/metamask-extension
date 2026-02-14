import { useSelector } from 'react-redux';
import { formatIconUrlWithProxy } from '@metamask/assets-controllers';
import { Hex } from '@metamask/utils';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  getMemoizedMetadataContract,
  getTokenList,
  selectERC20TokensByChain,
} from '../../../selectors';
import type { TransactionViewModel } from '../../../../shared/lib/multichain/types';
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
  }

  if (transaction.readable) {
    return transaction.readable;
  }

  const key = nonEvmTypeMap[transaction.transactionType];
  return key ? t(key) : '';
}

type TokenListEntry = {
  symbol?: string;
  iconUrl?: string;
  address?: string;
};

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

function toHexChainId(chainId: Hex): `0x${string}` {
  return (
    typeof chainId === 'string' && chainId.startsWith('0x')
      ? chainId
      : `0x${Number(chainId).toString(16)}`
  ) as `0x${string}`;
}

function resolveIconUrl(
  existing: string | undefined,
  chainId: `0x${string}`,
  tokenAddress: string,
): string | undefined {
  if (existing) {
    return existing;
  }
  try {
    return formatIconUrlWithProxy({ chainId, tokenAddress });
  } catch {
    return undefined;
  }
}

// EVM only: token symbol and icon URL by chainId + token contract address.
// Useful when the transaction only has the contract address (e.g. ERC20 approve).
// Lookup order: global token list → chain cache (erc20ByChain) → icon via formatIconUrlWithProxy only.
export function useEvmTokenInfo(
  chainId: Hex,
  tokenAddress?: string,
): { symbol?: string; iconUrl?: string } {
  const address = tokenAddress?.toLowerCase();
  const hexChainId = toHexChainId(chainId);

  const listEntry = useSelector((state) =>
    address ? getMemoizedMetadataContract(state, address) : undefined,
  ) as TokenListEntry | undefined;
  const erc20ByChain = useSelector(selectERC20TokensByChain);

  if (!address || address === ZERO_ADDRESS) {
    return {};
  }

  if (listEntry?.symbol) {
    return {
      symbol: listEntry.symbol,
      iconUrl: resolveIconUrl(listEntry.iconUrl, hexChainId, address),
    };
  }

  const chainData = erc20ByChain?.[hexChainId]?.data?.[address] as
    | TokenListEntry
    | undefined;

  if (chainData?.symbol) {
    return {
      symbol: chainData.symbol,
      iconUrl: resolveIconUrl(chainData.iconUrl, hexChainId, address),
    };
  }

  const iconUrl = resolveIconUrl(undefined, hexChainId, address);
  return iconUrl ? { iconUrl } : {};
}

// EVM only: token avatar icon URL from TransactionViewModel-style data.
// Pass chainId + symbol; optional tokenAddress when available (e.g. transferInformation.contractAddress).
// When only tokenAddress is provided (e.g. approval tx), useEvmTokenInfo is preferred for symbol + icon.
// Lookup order:
// - If tokenAddress (non-native): token list → chain cache → proxy.
// - If symbol only (native or no address): ETH_ICON for 'ETH' → chain by symbol → token list by symbol.
export function useEvmTokenIconUrl(
  chainId: Hex,
  symbol: string | undefined,
  tokenAddress?: string,
): string | undefined {
  const address = tokenAddress?.toLowerCase();
  const hexChainId = toHexChainId(chainId);
  const isNative = !address || address === ZERO_ADDRESS;

  const listEntryByAddress = useSelector((state) =>
    address ? getMemoizedMetadataContract(state, address) : undefined,
  ) as TokenListEntry | undefined;
  const tokenList = useSelector(getTokenList) ?? {};
  const erc20ByChain = useSelector(selectERC20TokensByChain);

  // Path 1: we have a contract address (non-native)
  if (address && !isNative) {
    const iconUrl = resolveIconUrl(
      listEntryByAddress?.iconUrl ??
        erc20ByChain?.[hexChainId]?.data?.[address]?.iconUrl,
      hexChainId,
      address,
    );
    if (iconUrl) {
      return iconUrl;
    }
  }

  // Path 2: we only have symbol (native token or no address)
  if (!symbol) {
    return undefined;
  }

  if (symbol === 'ETH') {
    return ETH_ICON;
  }

  const chainData = erc20ByChain?.[hexChainId]?.data;
  const entryBySymbol =
    chainData &&
    (Object.values(chainData) as TokenListEntry[]).find(
      (entry) => entry.symbol?.toLowerCase() === symbol.toLowerCase(),
    );

  if (entryBySymbol?.iconUrl) {
    return entryBySymbol.iconUrl;
  }
  if (entryBySymbol?.address) {
    const iconUrl = resolveIconUrl(
      undefined,
      hexChainId,
      entryBySymbol.address.toLowerCase(),
    );
    if (iconUrl) {
      return iconUrl;
    }
  }

  const listEntryBySymbol = (Object.values(tokenList) as TokenListEntry[]).find(
    (entry) => entry.symbol?.toLowerCase() === symbol.toLowerCase(),
  );
  return listEntryBySymbol?.iconUrl;
}

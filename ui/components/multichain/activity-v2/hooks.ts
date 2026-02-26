import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useI18nContext } from '../../../hooks/useI18nContext';
import type {
  Token,
  TransactionViewModel,
} from '../../../../shared/lib/multichain/types';
import { NETWORK_TO_NAME_MAP } from '../../../../shared/constants/network';
import { selectMarketRates } from '../../../selectors/activity';
import { selectEvmAddress } from '../../../selectors/accounts';
import { getUseExternalServices } from '../../../selectors';
import { parseApprovalTransactionData } from '../../../../shared/modules/transaction.utils';
import { SET_APPROVAL_FOR_ALL } from '../../../../shared/constants/transaction';
import { selectEnabledNetworksAsCaipChainIds } from '../../../selectors/multichain/networks';
import { queries } from '../../../helpers/queries';
import { calculateFiatFromMarketRates } from './helpers';

function useTransactionParams() {
  const evmAddress = (useSelector(selectEvmAddress) || '').toLowerCase();
  const enabledNetworks = useSelector(selectEnabledNetworksAsCaipChainIds);

  const evmNetworks = useMemo(
    () => enabledNetworks.filter((id: string) => id.startsWith('eip155:')),
    [enabledNetworks],
  );

  const accountAddresses = useMemo(
    () => (evmAddress ? [`eip155:0:${evmAddress}`] : []),
    [evmAddress],
  );

  return useMemo(
    () => ({
      evmAddress,
      accountAddresses,
      networks: evmNetworks,
    }),
    [evmAddress, accountAddresses, evmNetworks],
  );
}

export function useTransactionsQuery() {
  const useExternalServices = useSelector(getUseExternalServices);
  const { evmAddress, accountAddresses, networks } = useTransactionParams();

  const queryOptions = useMemo(
    () =>
      queries.transactions(
        { accountAddresses, evmAddress, networks },
        { enabled: Boolean(useExternalServices), keepPreviousData: true },
      ),
    [evmAddress, accountAddresses, networks, useExternalServices],
  );

  return useInfiniteQuery(queryOptions);
}

export function usePrefetchTransactions() {
  const queryClient = useQueryClient();
  const useExternalServices = useSelector(getUseExternalServices);
  const { evmAddress, accountAddresses, networks } = useTransactionParams();

  const queryOptions = useMemo(
    () => queries.transactions({ accountAddresses, evmAddress, networks }),
    [evmAddress, accountAddresses, networks],
  );

  return useCallback(() => {
    if (!useExternalServices || !evmAddress) {
      return;
    }

    const { queryKey } = queryOptions;
    if (!queryKey || queryClient.getQueryData(queryKey)) {
      return;
    }

    if (queryClient.isFetching({ queryKey }) > 0) {
      return;
    }

    queryClient.prefetchInfiniteQuery(queryOptions).catch(() => {
      // Prefetch is opportunistic
    });
  }, [evmAddress, queryOptions, queryClient, useExternalServices]);
}

function classifyNft(
  valueTransfers: TransactionViewModel['valueTransfers'],
  address: string,
): 'mint' | 'bought' | 'received' | 'sent' | null {
  const incoming = valueTransfers?.find(
    (vt) =>
      (vt.transferType === 'erc721' || vt.transferType === 'erc1155') &&
      vt.to?.toLowerCase() === address,
  );

  if (incoming) {
    const isMint =
      incoming.from?.toLowerCase() ===
      '0x0000000000000000000000000000000000000000';
    if (isMint) {
      return 'mint';
    }
    const hasPaid = valueTransfers?.some(
      (vt) =>
        vt.transferType === 'normal' && vt.from?.toLowerCase() === address,
    );
    return hasPaid ? 'bought' : 'received';
  }

  const outgoing = valueTransfers?.find(
    (vt) =>
      (vt.transferType === 'erc721' || vt.transferType === 'erc1155') &&
      vt.from?.toLowerCase() === address,
  );

  if (outgoing) {
    return 'sent';
  }

  return null;
}

export function useGetTitle(transaction: TransactionViewModel): string {
  const t = useI18nContext();
  const evmAddress = useSelector(selectEvmAddress)?.toLowerCase();
  const { transactionCategory, transactionType, transactionProtocol } =
    transaction;

  const rawMethodId = (transaction as unknown as { methodId?: string })
    .methodId;

  const isNftTransfer =
    transactionType === 'ERC_721_TRANSFER' ||
    transactionType === 'ERC_1155_TRANSFER';

  if (isNftTransfer) {
    const nftTransfer = transaction.valueTransfers?.find(
      (vt) => vt.transferType === 'erc721' || vt.transferType === 'erc1155',
    );

    if (nftTransfer) {
      const nftFrom = nftTransfer.from?.toLowerCase();
      const isMint = nftFrom === '0x0000000000000000000000000000000000000000';
      const isIncoming =
        nftTransfer.to?.toLowerCase() === evmAddress &&
        nftFrom !== evmAddress &&
        !isMint;
      const isOutgoing = nftFrom === evmAddress;
      if (isIncoming) {
        return t('received');
      }
      if (isOutgoing) {
        return t('sentSpecifiedTokens', ['NFT']);
      }
    } else {
      return t('sentSpecifiedTokens', ['NFT']);
    }
  }

  if (transactionType === 'DEPLOY_CONTRACT') {
    return t('contractDeployment');
  }

  // This should be server-side
  if (transactionCategory === 'APPROVE') {
    const data = transaction.txParams?.data;
    const selectorFromData =
      typeof data === 'string' ? data.slice(0, 10) : undefined;
    const selector = rawMethodId ?? selectorFromData;
    const isSetApprovalForAll = selector === SET_APPROVAL_FOR_ALL;

    const parsedApprovalData =
      typeof data === 'string'
        ? parseApprovalTransactionData(data as `0x${string}`)
        : undefined;

    // Revoke token/NFT approval (approve(..., 0x0) or approve(..., 0))
    if (parsedApprovalData?.name === 'approve') {
      const { spender } = parsedApprovalData;
      const isZeroSpender =
        typeof spender === 'string' &&
        spender.toLowerCase() === '0x0000000000000000000000000000000000000000';
      const isZeroAmount = Boolean(
        parsedApprovalData.amountOrTokenId?.isZero?.(),
      );

      if (isZeroSpender || isZeroAmount) {
        return t('confirmTitleRevokeApproveTransaction');
      }
    }

    // setApprovalForAll for ERC-721 / ERC-1155
    if (isSetApprovalForAll) {
      // If the API doesn't provide calldata, we can't distinguish approve vs revoke.
      // Default to the safer "remove permission" title.
      if (!parsedApprovalData) {
        return t('revokePermissionTitle', [t('token')]);
      }

      if (parsedApprovalData?.isRevokeAll) {
        return t('revokePermissionTitle', [t('token')]);
      }
      return t('setApprovalForAllRedesignedTitle');
    }

    // Single NFT approval (approve(tokenId))
    const isNftProtocol =
      transactionProtocol === 'ERC_721' || transactionProtocol === 'ERC_1155';
    if (isNftProtocol && transactionType?.includes('APPROVE')) {
      return t('confirmTitleApproveTransactionNFT');
    }

    const symbol = transaction.amounts?.from?.token?.symbol;
    return symbol ? t('approveSpendingCap', [symbol]) : t('approve');
  }

  // This should be server-side
  if (transactionCategory === 'BRIDGE_OUT') {
    const chainName =
      NETWORK_TO_NAME_MAP[
        transaction.chainId as keyof typeof NETWORK_TO_NAME_MAP
      ];
    return chainName ? t('bridgedToChain', [chainName]) : t('bridged');
  }

  if (transactionCategory === 'BRIDGE_IN') {
    return t('bridge');
  }

  // This should be server-side
  if (transactionCategory === 'SWAP' || transactionCategory === 'EXCHANGE') {
    const fromSymbol = transaction.amounts?.from?.token.symbol;
    const toSymbol = transaction.amounts?.to?.token.symbol;
    if (fromSymbol && toSymbol && fromSymbol !== toSymbol) {
      return t('swapTokenToToken', [fromSymbol, toSymbol]);
    }
    return t('swap');
  }

  if (transactionCategory === 'TRANSFER') {
    const nft = classifyNft(transaction.valueTransfers, evmAddress ?? '');
    if (nft) {
      switch (nft) {
        case 'mint':
          return t('nftMinted', ['NFT']);
        case 'bought':
          return t('nftBought', ['NFT']);
        case 'received':
          return t('received');
        case 'sent':
          return t('sentSpecifiedTokens', ['NFT']);
        default:
          break;
      }
    }

    if (transaction.amounts?.to && !transaction.amounts?.from) {
      return t('received');
    }
    if (transaction.amounts?.from) {
      const { symbol } = transaction.amounts.from.token;
      return symbol ? t('sentSpecifiedTokens', [symbol]) : t('sent');
    }
  }

  // API can classify native sends/receives as STANDARD
  if (transactionCategory === 'STANDARD') {
    const hasValueTransfers = (transaction.valueTransfers?.length ?? 0) > 0;
    const value = transaction.txParams?.value;
    const hasNativeValue = value && value !== '0x0' && value !== '0x';

    if (hasValueTransfers || hasNativeValue) {
      if (transaction.amounts?.to && !transaction.amounts?.from) {
        return t('received');
      }
      if (transaction.amounts?.from) {
        const { symbol } = transaction.amounts.from.token;
        return symbol ? t('sentSpecifiedTokens', [symbol]) : t('sent');
      }
    }
  }

  if (transactionCategory === 'CONTRACT_CALL') {
    const from = transaction.txParams?.from?.toLowerCase();
    const to = transaction.txParams?.to?.toLowerCase();
    const isIncoming = evmAddress && to === evmAddress && from !== evmAddress;

    // Swap-like transactions currently classified as CONTRACT_CALL
    const fromSymbol = transaction.amounts?.from?.token.symbol;
    const toSymbol = transaction.amounts?.to?.token.symbol;
    if (fromSymbol && toSymbol && fromSymbol !== toSymbol) {
      return t('swapTokenToToken', [fromSymbol, toSymbol]);
    }

    if (isIncoming && transaction.amounts?.to) {
      return t('received');
    }

    const nft = classifyNft(transaction.valueTransfers, evmAddress ?? '');
    if (nft) {
      switch (nft) {
        case 'mint':
          return t('nftMinted', ['NFT']);
        case 'bought':
          return t('nftBought', ['NFT']);
        case 'received':
          return t('received');
        case 'sent':
          return t('sentSpecifiedTokens', ['NFT']);
        default:
          break;
      }
    }
  }

  // TODO: Use enriched .readable field once ready
  return t('contractInteraction');
}

export function useFiatAmount(amount?: string, token?: Token) {
  const marketRates = useSelector(selectMarketRates);
  return calculateFiatFromMarketRates(amount, token, marketRates);
}

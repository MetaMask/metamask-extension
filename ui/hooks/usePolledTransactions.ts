/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo } from 'react';
import { useQuery } from 'react-query';
import { useSelector } from 'react-redux';
import { TransactionType } from '@metamask/transaction-controller';
import { TransactionKind } from '../helpers/constants/transactions';
import { getSelectedAccount, getEnabledNetworks } from '../selectors';
import { formatDateWithYearContext } from '../helpers/utils/util';

type ValueTransfer = {
  from: string;
  to: string;
  amount: string;
  decimal?: number;
  contractAddress?: string;
  symbol?: string;
  name?: string;
  transferType: 'erc20' | 'normal' | 'erc721' | 'erc1155';
  tokenId?: string;
};

type ApiTransaction = {
  hash: string;
  timestamp: string;
  chainId: number;
  blockNumber: number;
  gas: number;
  gasPrice: string;
  nonce: number;
  value: string;
  to: string;
  from: string;
  isError: boolean;
  valueTransfers: ValueTransfer[];
  transactionType: string;
  transactionCategory: string;
  readable: string;
  methodId?: string;
};

type ApiResponse = {
  data: ApiTransaction[];
};

type TransformationResult = {
  kind: string;
  transactionGroup: {
    nonce: number;
    initialTransaction: any;
    primaryTransaction: any;
    transactions: any[];
  };
  timeMs: number;
  id: string;
};

const groupTransactionsByDate = (
  transactionGroups: any[],
  getTransactionTimestamp: (item: any) => number,
  shouldSort = true,
) => {
  const groupedTransactions: any[] = [];

  if (!transactionGroups) {
    return groupedTransactions;
  }

  transactionGroups.forEach((transactionGroup) => {
    const timestamp = getTransactionTimestamp(transactionGroup);
    const date = formatDateWithYearContext(timestamp, 'MMM d, y', 'MMM d');

    const existingGroup = groupedTransactions.find(
      (group) => group.date === date,
    );

    if (existingGroup) {
      existingGroup.transactionGroups.push(transactionGroup);
      if (shouldSort) {
        // Sort transactions within the group by timestamp (newest first)
        existingGroup.transactionGroups.sort((a: any, b: any) => {
          const aTime = getTransactionTimestamp(a);
          const bTime = getTransactionTimestamp(b);
          return bTime - aTime; // Descending order (newest first)
        });
      }
    } else {
      groupedTransactions.push({
        date,
        dateMillis: timestamp,
        transactionGroups: [transactionGroup],
      });
    }
    if (shouldSort) {
      // Sort date groups by timestamp (newest first)
      groupedTransactions.sort((a, b) => b.dateMillis - a.dateMillis);
    }
  });

  return groupedTransactions;
};

// Group EVM transaction groups, non‑EVM transactions, or unified items by date alike
const groupAnyTransactionsByDate = (items: any[]) =>
  groupTransactionsByDate(
    items,
    (item) => {
      // Prefer precomputed timeMs (unified items)
      if (typeof item?.timeMs === 'number') {
        return item.timeMs;
      }
      // EVM transactionGroup
      if (item?.primaryTransaction?.time) {
        return item.primaryTransaction.time;
      }
      // Non‑EVM transaction
      if (item?.timestamp) {
        return item.timestamp * 1000;
      }
      return 0;
    },
    true,
  );

const fetchTransactions = async (
  address: string,
  enabledNetworks: any,
): Promise<ApiResponse> => {
  // Build the networks parameter from already filtered enabled networks
  const networkChainIds = Object.keys(enabledNetworks?.eip155 || {});
  const networksParam = networkChainIds.join(',');

  // Build URL with search parameters, using unencoded networks value
  const url = new URL(
    `https://accounts.api.cx.metamask.io/v1/accounts/${address}/transactions`,
  );
  // Manually append networks parameter to avoid encoding commas
  url.search = `?networks=${networksParam}&sortDirection=DESC`;

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error('Failed to fetch transactions');
  }
  return response.json();
};

const transformTransactionsToUnified = (
  apiTx: ApiTransaction,
  userAddress: string,
): TransformationResult => {
  // Extract primary value transfer for display - find the one involving the user's address
  const primaryTransfer =
    apiTx.valueTransfers?.find(
      (transfer) =>
        transfer.to?.toLowerCase() === userAddress ||
        transfer.from?.toLowerCase() === userAddress,
    ) || apiTx.valueTransfers?.[0]; // Fallback to first transfer if none match

  const isIncoming = primaryTransfer?.to?.toLowerCase() === userAddress;

  // Determine transaction type based on API data
  let transactionType = 'incoming';

  // First check the specific transaction type from API
  if (apiTx.transactionType === 'ERC_20_TRANSFER') {
    transactionType = TransactionType.tokenMethodTransfer;
  } else if (apiTx.transactionType === 'ERC_20_APPROVE') {
    transactionType = TransactionType.tokenMethodApprove;
  } else if (apiTx.transactionType === 'SPAM_TOKEN_TRANSFER') {
    transactionType = TransactionType.tokenMethodTransfer;
  } else if (apiTx.transactionCategory === 'APPROVE') {
    transactionType = TransactionType.tokenMethodApprove;
  } else if (apiTx.transactionCategory === 'TRANSFER') {
    if (primaryTransfer?.transferType === 'erc20') {
      // For ERC20 transfers, use more specific types
      transactionType = TransactionType.tokenMethodTransfer;
    } else {
      transactionType = isIncoming ? 'incoming' : 'contractInteraction';
    }
  } else if (apiTx.transactionCategory === 'STANDARD') {
    transactionType = isIncoming ? 'incoming' : 'simpleSend';
  }

  // Set transaction value - for ERC20, this should usually be 0 in txParams.value
  let transactionValue = '0x0'; // Default to 0

  if (primaryTransfer && primaryTransfer.transferType === 'normal') {
    // For native currency transfers (ETH, etc), use the transfer amount
    const amount = primaryTransfer.amount || '0';
    transactionValue = `0x${BigInt(amount).toString(16)}`;
  } else if (apiTx.value && apiTx.value !== '0') {
    // If there's a native value in the transaction, use it
    const amount = apiTx.value;
    transactionValue = `0x${BigInt(amount).toString(16)}`;
  }

  return {
    kind: TransactionKind.EVM,
    transactionGroup: {
      nonce: apiTx.nonce,
      initialTransaction: {
        id: apiTx.hash,
        time: new Date(apiTx.timestamp).getTime(),
        chainId: `0x${apiTx.chainId.toString(16)}`, // Convert to hex string
        txParams: {
          from: apiTx.from,
          to: apiTx.to,
          value: transactionValue,
          data: apiTx.methodId || '0x',
          gasPrice: apiTx.gasPrice,
          gas: apiTx.gas.toString(),
          nonce: apiTx.nonce,
        },
        type: transactionType,
        status: apiTx.isError ? 'failed' : 'confirmed',
        hash: apiTx.hash,
        // Add transferInformation for token amount display
        ...(primaryTransfer &&
          primaryTransfer.transferType === 'erc20' && {
            transferInformation: {
              amount: primaryTransfer.amount,
              decimals: primaryTransfer.decimal,
              symbol: primaryTransfer.symbol,
              contractAddress: primaryTransfer.contractAddress,
            },
          }),
        // Add value transfer data for proper display
        valueTransfers: apiTx.valueTransfers || [],
        transactionCategory: apiTx.transactionCategory,
        readable: apiTx.readable,
      },
      primaryTransaction: {
        id: apiTx.hash,
        time: new Date(apiTx.timestamp).getTime(),
        chainId: `0x${apiTx.chainId.toString(16)}`,
        hash: apiTx.hash,
        status: apiTx.isError ? 'failed' : 'confirmed',
        type: transactionType,
        // Add token data to primary transaction too
        ...(primaryTransfer &&
          primaryTransfer.transferType === 'erc20' && {
            symbol: primaryTransfer.symbol,
            decimals: primaryTransfer.decimal,
          }),
      },
      transactions: [
        {
          id: apiTx.hash,
          time: new Date(apiTx.timestamp).getTime(),
          chainId: `0x${apiTx.chainId.toString(16)}`,
          txParams: {
            from: apiTx.from,
            to: apiTx.to,
            value: transactionValue,
            data: apiTx.methodId || '0x',
            gasPrice: apiTx.gasPrice,
            gas: apiTx.gas.toString(),
            nonce: apiTx.nonce,
          },
          type: transactionType,
          status: apiTx.isError ? 'failed' : 'confirmed',
          hash: apiTx.hash,
          ...(primaryTransfer &&
            primaryTransfer.transferType === 'erc20' && {
              transferInformation: {
                amount: primaryTransfer.amount,
                decimals: primaryTransfer.decimal,
                symbol: primaryTransfer.symbol,
                contractAddress: primaryTransfer.contractAddress,
              },
            }),
          valueTransfers: apiTx.valueTransfers || [],
          transactionCategory: apiTx.transactionCategory,
          readable: apiTx.readable,
        },
      ],
    },
    timeMs: new Date(apiTx.timestamp).getTime(),
    id: apiTx.hash,
  };
};

export const usePolledTransactions = () => {
  const selectedAccount = useSelector(getSelectedAccount);
  const enabledNetworks = useSelector(getEnabledNetworks);

  const address = selectedAccount?.address;

  const filteredNetworks = useMemo(() => {
    const networkChainIds = Object.keys(enabledNetworks?.eip155 || {});
    const supportedNetworks = [
      '0x1',
      '0x89',
      '0x38',
      '0xe708',
      '0x2105',
      '0xa',
      '0xa4b1',
      '0x82750',
      '0x531',
    ];
    const filteredChainIds = networkChainIds.filter((chainId) =>
      supportedNetworks.includes(chainId),
    );

    return {
      ...enabledNetworks,
      eip155: filteredChainIds.reduce((acc: any, chainId) => {
        acc[chainId] = enabledNetworks.eip155?.[chainId];
        return acc;
      }, {}),
    };
  }, [enabledNetworks]);

  const {
    data: transactions,
    isLoading,
    error,
  } = useQuery(
    ['transactions', address, filteredNetworks],
    () => fetchTransactions(address, filteredNetworks),
    {
      enabled: Boolean(address),
      refetchInterval: 5 * 60 * 1000, // Poll every 5 minutes
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
    },
  );

  // Transform transactions to match the expected data structure
  const processedTransactions = useMemo(() => {
    if (!transactions?.data || transactions.data.length === 0) {
      return [];
    }

    const userAddress = address.toLowerCase();

    // Transform API response to unified activity items format
    const transformedItems = transactions.data.map((apiTx) =>
      transformTransactionsToUnified(apiTx, userAddress),
    );

    // Group by date
    const groupedItems = groupAnyTransactionsByDate(transformedItems);

    return groupedItems;
  }, [transactions, address]);

  return {
    processedTransactions,
    isLoading,
    error,
  };
};

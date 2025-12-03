import React, {
  useMemo,
  useState,
  useCallback,
  Fragment,
  useEffect,
} from 'react';
import { isCrossChain } from '@metamask/bridge-controller';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { TransactionType } from '@metamask/transaction-controller';
///: BEGIN:ONLY_INCLUDE_IF(multichain)
import { TransactionType as KeyringTransactionType } from '@metamask/keyring-api';
///: END:ONLY_INCLUDE_IF
import {
  nonceSortedCompletedTransactionsSelectorAllChains,
  nonceSortedPendingTransactionsSelectorAllChains,
  getAllNetworkTransactions,
  groupAndSortTransactionsByNonce,
  smartTransactionsListSelector,
} from '../../../selectors/transactions';
import { getInternalAccountBySelectedAccountGroupAndCaip } from '../../../selectors/multichain-accounts/account-tree';
import {
  getSelectedAccount,
  getSelectedMultichainNetworkChainId,
  getEnabledNetworks,
} from '../../../selectors';
///: BEGIN:ONLY_INCLUDE_IF(multichain)
import MultichainBridgeTransactionListItem from '../multichain-bridge-transaction-list-item/multichain-bridge-transaction-list-item';
import MultichainBridgeTransactionDetailsModal from '../multichain-bridge-transaction-details-modal/multichain-bridge-transaction-details-modal';
///: END:ONLY_INCLUDE_IF
import { useI18nContext } from '../../../hooks/useI18nContext';
import TransactionListItem from '../transaction-list-item';
import SmartTransactionListItem from '../transaction-list-item/smart-transaction-list-item.component';
import {
  TOKEN_CATEGORY_HASH,
  TransactionKind,
  PENDING_STATUS_HASH,
} from '../../../helpers/constants/transactions';
import {
  SmartTransactionStatus,
  TransactionGroupCategory,
} from '../../../../shared/constants/transaction';
import { SWAPS_CHAINID_CONTRACT_ADDRESS_MAP } from '../../../../shared/constants/swaps';
import { isEqualCaseInsensitive } from '../../../../shared/modules/string-utils';
import {
  getAllEnabledNetworksForAllNamespaces,
  ///: BEGIN:ONLY_INCLUDE_IF(multichain)
  getSelectedMultichainNetworkConfiguration,
  ///: END:ONLY_INCLUDE_IF
} from '../../../selectors/multichain/networks';

import {
  Box,
  Button,
  ButtonVariant,
  Text,
  ///: BEGIN:ONLY_INCLUDE_IF(multichain)
  BadgeWrapper,
  AvatarNetwork,
  AvatarNetworkSize,
  ///: END:ONLY_INCLUDE_IF
} from '../../component-library';
///: BEGIN:ONLY_INCLUDE_IF(multichain)
import TransactionIcon from '../transaction-icon';
import TransactionStatusLabel from '../transaction-status-label/transaction-status-label';
import { MultichainTransactionDetailsModal } from '../multichain-transaction-details-modal';
import { formatTimestamp } from '../multichain-transaction-details-modal/helpers';
///: END:ONLY_INCLUDE_IF
import {
  AlignItems,
  ///: BEGIN:ONLY_INCLUDE_IF(multichain)
  BackgroundColor,
  Display,
  JustifyContent,
  ///: END:ONLY_INCLUDE_IF
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { formatDateWithYearContext } from '../../../helpers/utils/util';
///: BEGIN:ONLY_INCLUDE_IF(multichain)
import { ActivityListItem } from '../../multichain/activity-list-item';
import {
  KEYRING_TRANSACTION_STATUS_KEY,
  useMultichainTransactionDisplay,
} from '../../../hooks/useMultichainTransactionDisplay';
///: END:ONLY_INCLUDE_IF

import { endTrace, TraceName } from '../../../../shared/lib/trace';
///: BEGIN:ONLY_INCLUDE_IF(multichain)
import { MULTICHAIN_TOKEN_IMAGE_MAP } from '../../../../shared/constants/multichain/networks';
///: END:ONLY_INCLUDE_IF
// eslint-disable-next-line import/no-restricted-paths
import AssetListControlBar from '../assets/asset-list/asset-list-control-bar';
import {
  startIncomingTransactionPolling,
  stopIncomingTransactionPolling,
} from '../../../store/controller-actions/transaction-controller';
import {
  selectBridgeHistoryForAccountGroup,
  selectBridgeHistoryItemForTxMetaId,
} from '../../../ducks/bridge-status/selectors';
import { getSelectedAccountGroupMultichainTransactions } from '../../../selectors/multichain-transactions';
import { TransactionActivityEmptyState } from '../transaction-activity-empty-state';

const PAGE_DAYS_INCREMENT = 10;

// When we are on a token page, we only want to show transactions that involve that token.
// In the case of token transfers or approvals, these will be transactions sent to the
// token contract. In the case of swaps, these will be transactions sent to the swaps contract
// and which have the token address in the transaction data.
//
// getTransactionGroupRecipientAddressFilter is used to determine whether a transaction matches
// either of those criteria
const getTransactionGroupRecipientAddressFilter = (
  recipientAddress,
  chainIds,
) => {
  return ({ initialTransaction: { txParams } }) => {
    return (
      isEqualCaseInsensitive(txParams?.to, recipientAddress) ||
      (chainIds.some(
        (chainId) =>
          txParams?.to === SWAPS_CHAINID_CONTRACT_ADDRESS_MAP[chainId],
      ) &&
        txParams.data.match(recipientAddress.slice(2)))
    );
  };
};

const getTransactionGroupRecipientAddressFilterAllChain = (
  recipientAddress,
  chainIds,
) => {
  return ({ initialTransaction: { txParams } }) => {
    const isNativeAssetActivityFilter =
      recipientAddress === '0x0000000000000000000000000000000000000000';
    const isSimpleSendTx =
      !txParams.data ||
      txParams?.data === '' ||
      txParams?.data === '0x' ||
      txParams?.data === '0x0';
    const isOnSameChain = chainIds.includes(txParams?.chainId);
    if (isNativeAssetActivityFilter && isSimpleSendTx && isOnSameChain) {
      return true;
    }
    return (
      isEqualCaseInsensitive(txParams?.to, recipientAddress) ||
      (chainIds.some(
        (chainId) =>
          txParams?.to === SWAPS_CHAINID_CONTRACT_ADDRESS_MAP[chainId],
      ) &&
        txParams.data.match(recipientAddress.slice(2)))
    );
  };
};

const tokenTransactionFilter = ({
  initialTransaction: { type, destinationTokenSymbol, sourceTokenSymbol },
}) => {
  if (TOKEN_CATEGORY_HASH[type]) {
    return false;
  } else if (
    [TransactionType.swap, TransactionType.swapAndSend].includes(type)
  ) {
    return destinationTokenSymbol === 'ETH' || sourceTokenSymbol === 'ETH';
  }
  return true;
};

const getFilteredTransactionGroups = (
  transactionGroups,
  hideTokenTransactions,
  tokenAddress,
  chainIds,
) => {
  if (hideTokenTransactions) {
    return transactionGroups.filter(tokenTransactionFilter);
  } else if (tokenAddress) {
    return transactionGroups.filter(
      getTransactionGroupRecipientAddressFilter(tokenAddress, chainIds),
    );
  }
  return transactionGroups;
};

const getFilteredTransactionGroupsAllChains = (
  transactionGroups,
  hideTokenTransactions,
  tokenAddress,
  tokenChainIds,
) => {
  if (hideTokenTransactions) {
    return transactionGroups.filter(tokenTransactionFilter);
  } else if (tokenAddress) {
    return transactionGroups.filter(
      getTransactionGroupRecipientAddressFilterAllChain(
        tokenAddress,
        tokenChainIds,
      ),
    );
  }
  return transactionGroups;
};

const groupTransactionsByDate = (
  transactionGroups,
  getTransactionTimestamp,
  shouldSort = true,
) => {
  const groupedTransactions = [];

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
        existingGroup.transactionGroups.sort((a, b) => {
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

///: BEGIN:ONLY_INCLUDE_IF(multichain)
/**
 * Returns a copy of the nonEvmTransactions object with only the transactions that involve the tokenAddress.
 *
 * @param nonEvmTransactions - The nonEvmTransactions object.
 * @param tokenAddress - [Optional] The address of the token to filter for. Returns all transactions if not provided.
 * @returns A copy of the nonEvmTransactions object with only the transactions
 * that involve the tokenAddress.
 */
export const filterNonEvmTxByToken = (
  nonEvmTransactions = { transactions: [] },
  tokenAddress,
) => {
  if (!tokenAddress) {
    return nonEvmTransactions;
  }

  const isBitcoinNetwork = tokenAddress.startsWith('bip122');

  const transactionForToken = (nonEvmTransactions.transactions || []).filter(
    (transaction) => {
      const isRedeposit =
        isBitcoinNetwork &&
        transaction.to.length === 0 &&
        transaction.type === KeyringTransactionType.Send;

      if (isRedeposit) {
        return true;
      }

      return [...transaction.to, ...transaction.from].some(
        (item) => item.asset.type === tokenAddress,
      );
    },
  );

  return {
    ...nonEvmTransactions,
    transactions: transactionForToken,
  };
};

function filterNonEvmTxByChainIds(nonEvmTransactions, chainIds) {
  if (!chainIds || chainIds.length === 0) {
    return { transactions: [] };
  }

  const transactionForChainIds = (nonEvmTransactions.transactions || []).filter(
    (transaction) => chainIds.includes(transaction.chain),
  );

  return {
    ...nonEvmTransactions,
    transactions: transactionForChainIds,
  };
}
///: END:ONLY_INCLUDE_IF

export const buildUnifiedActivityItems = (
  unfilteredPendingTransactions = [],
  enabledNetworksFilteredCompletedTransactions = [],
  nonEvmTransactions,
  { hideTokenTransactions, tokenAddress, evmChainIds, nonEvmChainIds },
) => {
  // Apply existing token filters to EVM groups (all chains)
  const filteredPending = getFilteredTransactionGroups(
    unfilteredPendingTransactions,
    hideTokenTransactions,
    tokenAddress,
    evmChainIds,
  );

  const filteredCompleted = getFilteredTransactionGroupsAllChains(
    enabledNetworksFilteredCompletedTransactions,
    hideTokenTransactions,
    tokenAddress,
    evmChainIds,
  );

  // Apply token filter to non‑EVM like nonEvmTransactionsForToken
  const filteredNonEvm = filterNonEvmTxByChainIds(
    filterNonEvmTxByToken(nonEvmTransactions, tokenAddress),
    nonEvmChainIds,
  );

  // Normalize to a common shape for final sorting and grouping
  const evmItems = [...filteredPending, ...filteredCompleted].map((group) => ({
    kind: TransactionKind.EVM,
    transactionGroup: group,
    timeMs: group?.primaryTransaction?.time ?? 0,
    id: group?.primaryTransaction?.id ?? group?.id,
  }));

  const nonEvmItems = (filteredNonEvm?.transactions || []).map((tx) => ({
    kind: TransactionKind.NON_EVM,
    transaction: tx,
    timeMs: (tx?.timestamp ?? 0) * 1000,
    id: tx?.id,
  }));

  const sortedUnifiedItems = [...evmItems, ...nonEvmItems].sort(
    (a, b) => b.timeMs - a.timeMs,
  );

  return sortedUnifiedItems;
};

// Group EVM transaction groups, non‑EVM transactions, or unified items by date alike
export const groupAnyTransactionsByDate = (items) =>
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

function getFilteredChainIds(enabledNetworks, tokenChainIdOverride) {
  if (tokenChainIdOverride) {
    const isNonEvm =
      tokenChainIdOverride.startsWith('solana') ||
      tokenChainIdOverride.startsWith('bip122') ||
      tokenChainIdOverride.startsWith('tron');

    return {
      evmChainIds: isNonEvm ? [] : [tokenChainIdOverride],
      nonEvmChainIds: isNonEvm ? [tokenChainIdOverride] : [],
    };
  }

  const filteredUniqueEVMChainIds = Object.keys(enabledNetworks?.eip155) ?? [];
  const filteredUniqueNonEvmChainIds = [
    ...new Set(
      Object.keys(enabledNetworks)
        .filter((namespace) => namespace !== 'eip155')
        .reduce((acc, namespace) => {
          return [...acc, ...Object.keys(enabledNetworks[namespace])];
        }, []),
    ),
  ];

  return {
    evmChainIds: filteredUniqueEVMChainIds,
    nonEvmChainIds: filteredUniqueNonEvmChainIds,
  };
}

export default function UnifiedTransactionList({
  hideTokenTransactions,
  tokenAddress,
  boxProps,
  hideNetworkFilter,
  tokenChainIdOverride,
}) {
  const [daysLimit, setDaysLimit] = useState(PAGE_DAYS_INCREMENT);
  const t = useI18nContext();
  const selectedAccount = useSelector(getSelectedAccount);
  const enabledNetworks = useSelector(getEnabledNetworks);

  const { evmChainIds, nonEvmChainIds } = getFilteredChainIds(
    enabledNetworks,
    tokenChainIdOverride,
  );

  ///: BEGIN:ONLY_INCLUDE_IF(multichain)
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const nonEvmTransactions = useSelector((state) =>
    getSelectedAccountGroupMultichainTransactions(state, nonEvmChainIds),
  );

  const nonEvmTransactionsForToken = useMemo(
    () => filterNonEvmTxByToken(nonEvmTransactions, tokenAddress),
    [nonEvmTransactions, tokenAddress],
  );
  ///: END:ONLY_INCLUDE_IF

  const accountGroupEvmAccount = useSelector((state) =>
    getInternalAccountBySelectedAccountGroupAndCaip(state, 'eip155:1'),
  );
  const groupEvmAddress = accountGroupEvmAccount?.address?.toLowerCase();

  const bridgeHistoryItems = useSelector(selectBridgeHistoryForAccountGroup);

  const pendingFromSelectedAccount = useSelector(
    nonceSortedPendingTransactionsSelectorAllChains,
  );
  const completedFromSelectedAccount = useSelector(
    nonceSortedCompletedTransactionsSelectorAllChains,
  );

  const needsGroupEvmTransactions =
    groupEvmAddress &&
    groupEvmAddress !== selectedAccount?.address?.toLowerCase();

  const allTransactions = useSelector(getAllNetworkTransactions);

  const allSmartTransactionsState = useSelector(
    (state) => state.metamask.smartTransactionsState?.smartTransactions,
  );
  const smartTransactionsForSelected = useSelector(
    smartTransactionsListSelector,
  );

  const smartTransactions = useMemo(() => {
    if (!needsGroupEvmTransactions) {
      return smartTransactionsForSelected ?? [];
    }

    if (!allSmartTransactionsState || !groupEvmAddress) {
      return [];
    }

    const allSmartTxs = Object.values(allSmartTransactionsState).flat();

    const filtered = allSmartTxs.filter((stx) => {
      const fromAddress = stx?.txParams?.from?.toLowerCase();
      const isSwapType =
        stx.type === TransactionType.swap ||
        stx.type === TransactionType.swapApproval;

      return fromAddress === groupEvmAddress && isSwapType;
    });

    return filtered.map((stx) => ({
      ...stx,
      id: stx.uuid,
      isSmartTransaction: true,
      status: stx.status?.startsWith('cancelled')
        ? SmartTransactionStatus.cancelled
        : stx.status,
    }));
  }, [
    needsGroupEvmTransactions,
    smartTransactionsForSelected,
    allSmartTransactionsState,
    groupEvmAddress,
  ]);

  const unfilteredPendingTransactions = useMemo(() => {
    if (needsGroupEvmTransactions) {
      const evmTxs = [...allTransactions, ...(smartTransactions ?? [])]
        .filter((tx) => tx.txParams?.from?.toLowerCase() === groupEvmAddress)
        .filter((tx) => tx.type !== TransactionType.incoming)
        .filter((tx) => tx.status in PENDING_STATUS_HASH);

      return groupAndSortTransactionsByNonce(evmTxs);
    }

    return pendingFromSelectedAccount;
  }, [
    needsGroupEvmTransactions,
    pendingFromSelectedAccount,
    allTransactions,
    smartTransactions,
    groupEvmAddress,
  ]);

  const unfilteredCompletedTransactionsAllChains = useMemo(() => {
    if (needsGroupEvmTransactions) {
      const smartTxs = smartTransactions ?? [];
      const smartTxNonces = new Set(
        smartTxs.map((tx) => tx.txParams?.nonce).filter((n) => n !== undefined),
      );

      const evmTxs = [...allTransactions, ...smartTxs]
        .filter((tx) => tx.txParams?.from?.toLowerCase() === groupEvmAddress)
        .filter((tx) => tx.type !== TransactionType.incoming)
        .filter((tx) => !(tx.status in PENDING_STATUS_HASH))
        .filter(
          (tx) =>
            tx.isSmartTransaction || !smartTxNonces.has(tx.txParams?.nonce),
        );

      return groupAndSortTransactionsByNonce(evmTxs);
    }

    return completedFromSelectedAccount;
  }, [
    needsGroupEvmTransactions,
    completedFromSelectedAccount,
    allTransactions,
    smartTransactions,
    groupEvmAddress,
  ]);

  const enabledNetworksForAllNamespaces = useSelector(
    getAllEnabledNetworksForAllNamespaces,
  );
  const currentMultichainChainId = useSelector(
    getSelectedMultichainNetworkChainId,
  );

  const enabledNetworksFilteredCompletedTransactions = useMemo(() => {
    if (!currentMultichainChainId) {
      return unfilteredCompletedTransactionsAllChains;
    }

    // If no networks are enabled for this namespace, return empty array
    if (enabledNetworksForAllNamespaces.length === 0) {
      return [];
    }

    const transactionsToFilter = unfilteredCompletedTransactionsAllChains;

    // Filter transactions to only include those from enabled networks
    const filteredTransactions = transactionsToFilter.filter(
      (transactionGroup) => {
        const transactionChainId = transactionGroup.initialTransaction?.chainId;
        const isIncluded =
          enabledNetworksForAllNamespaces.includes(transactionChainId);
        return isIncluded;
      },
    );

    return filteredTransactions;
  }, [
    enabledNetworksForAllNamespaces,
    currentMultichainChainId,
    unfilteredCompletedTransactionsAllChains,
  ]);

  const enabledNonEvmChainIds = useMemo(() => {
    return nonEvmChainIds.filter((chainId) =>
      enabledNetworksForAllNamespaces.includes(chainId),
    );
  }, [nonEvmChainIds, enabledNetworksForAllNamespaces]);

  const unifiedActivityItems = useMemo(() => {
    return buildUnifiedActivityItems(
      unfilteredPendingTransactions,
      enabledNetworksFilteredCompletedTransactions,
      nonEvmTransactionsForToken,
      {
        hideTokenTransactions,
        tokenAddress,
        evmChainIds,
        nonEvmChainIds: enabledNonEvmChainIds,
      },
    );
  }, [
    unfilteredPendingTransactions,
    enabledNetworksFilteredCompletedTransactions,
    nonEvmTransactionsForToken,
    hideTokenTransactions,
    tokenAddress,
    evmChainIds,
    enabledNonEvmChainIds,
  ]);
  const groupedUnifiedActivityItems =
    groupAnyTransactionsByDate(unifiedActivityItems);

  useEffect(() => {
    stopIncomingTransactionPolling();
    startIncomingTransactionPolling();

    return () => {
      stopIncomingTransactionPolling();
    };
  }, [
    // Required to restart polling on new account
    selectedAccount,
  ]);

  const viewMore = useCallback(
    () => setDaysLimit((prev) => prev + PAGE_DAYS_INCREMENT),
    [],
  );

  useEffect(() => {
    endTrace({ name: TraceName.AccountOverviewActivityTab });
  }, []);

  ///: BEGIN:ONLY_INCLUDE_IF(multichain)
  const toggleShowDetails = useCallback((transaction = null) => {
    setSelectedTransaction(transaction);
  }, []);

  const multichainNetworkConfig = useSelector(
    getSelectedMultichainNetworkConfiguration,
  );

  const selectedBridgeHistoryItem = useSelector((state) =>
    selectBridgeHistoryItemForTxMetaId(state, selectedTransaction?.id),
  );

  ///: END:ONLY_INCLUDE_IF

  // Unified item renderer (handles both EVM and non‑EVM unified items)
  const renderTransaction = useCallback(
    (item, index) => {
      if (item.kind === TransactionKind.NON_EVM) {
        const matchedBridgeHistoryItem = bridgeHistoryItems[item.id];
        if (
          matchedBridgeHistoryItem &&
          isCrossChain(
            matchedBridgeHistoryItem.quote?.srcChainId,
            matchedBridgeHistoryItem.quote?.destChainId,
          )
        ) {
          return (
            <MultichainBridgeTransactionListItem
              key={`bridge-${item.id}`}
              transaction={item.transaction}
              bridgeHistoryItem={matchedBridgeHistoryItem}
              toggleShowDetails={toggleShowDetails}
            />
          );
        }
        return (
          <MultichainTransactionListItem
            key={`non-evm-${item.id ?? index}`}
            transaction={item.transaction}
            networkConfig={multichainNetworkConfig}
            toggleShowDetails={toggleShowDetails}
          />
        );
      }

      // evm transaction
      const { transactionGroup } = item;
      if (transactionGroup.initialTransaction?.isSmartTransaction) {
        return (
          <SmartTransactionListItem
            key={`${transactionGroup.nonce}:${index}`}
            isEarliestNonce={index === 0}
            smartTransaction={transactionGroup.initialTransaction}
            transactionGroup={transactionGroup}
            chainId={transactionGroup.initialTransaction.chainId}
          />
        );
      }
      return (
        <TransactionListItem
          key={`${transactionGroup.nonce}:${index}`}
          isEarliestNonce={index === 0}
          transactionGroup={transactionGroup}
          chainId={transactionGroup.initialTransaction.chainId}
        />
      );
    },
    [bridgeHistoryItems, multichainNetworkConfig, toggleShowDetails],
  );

  // Remove transactions within each date group that are incoming transactions
  // to a user that not the current one.
  const removeIncomingTxsButToAnotherAddressUnified = useCallback(
    (dateGroup) => {
      const isIncomingTxsButToAnotherAddress = (transaction) =>
        transaction.type === TransactionType.incoming &&
        transaction.txParams.to.toLowerCase() !==
          selectedAccount.address.toLowerCase();

      dateGroup.transactionGroups = dateGroup.transactionGroups.map((item) => {
        if (item?.kind !== TransactionKind.EVM) {
          return item;
        }
        const { transactionGroup } = item;
        transactionGroup.transactions = transactionGroup.transactions.filter(
          (transaction) => !isIncomingTxsButToAnotherAddress(transaction),
        );
        return item;
      });

      return dateGroup;
    },
    [selectedAccount],
  );

  const removeEmptyEvmItemsFromUnifiedDateGroup = useCallback((dateGroup) => {
    dateGroup.transactionGroups = dateGroup.transactionGroups.filter((item) => {
      if (item?.kind !== TransactionKind.EVM) {
        return true;
      }
      return item.transactionGroup.transactions.length > 0;
    });
    return dateGroup;
  }, []);

  const dateGroupsWithItems = (dateGroup) =>
    dateGroup.transactionGroups.length > 0;

  const processedUnifiedActivityItems = useMemo(
    () =>
      groupedUnifiedActivityItems
        .map(removeIncomingTxsButToAnotherAddressUnified)
        .map(removeEmptyEvmItemsFromUnifiedDateGroup)
        .filter(dateGroupsWithItems),
    [
      groupedUnifiedActivityItems,
      removeIncomingTxsButToAnotherAddressUnified,
      removeEmptyEvmItemsFromUnifiedDateGroup,
    ],
  );

  return (
    <>
      {selectedTransaction &&
        (selectedBridgeHistoryItem &&
        isCrossChain(
          selectedBridgeHistoryItem.quote.srcChainId,
          selectedBridgeHistoryItem.quote.destChainId,
        ) ? (
          <MultichainBridgeTransactionDetailsModal
            transaction={selectedTransaction}
            bridgeHistoryItem={selectedBridgeHistoryItem}
            onClose={() => toggleShowDetails(null)}
          />
        ) : (
          <MultichainTransactionDetailsModal
            transaction={selectedTransaction}
            onClose={() => toggleShowDetails(null)}
            userAddress={selectedAccount.address}
            networkConfig={multichainNetworkConfig}
          />
        ))}

      <Box className="transaction-list" {...boxProps}>
        {!hideNetworkFilter && (
          <AssetListControlBar
            showSortControl={false}
            showTokenFiatBalance={false}
            showImportTokenButton={false}
          />
        )}
        {processedUnifiedActivityItems.length === 0 ? (
          <TransactionActivityEmptyState
            className="mx-auto mt-5 mb-6"
            account={selectedAccount}
          />
        ) : (
          <Box className="transaction-list__transactions">
            {processedUnifiedActivityItems
              .slice(0, daysLimit)
              .map((dateGroup) => (
                <Fragment key={dateGroup.date}>
                  <Text
                    paddingTop={3}
                    paddingInline={4}
                    variant={TextVariant.bodyMdMedium}
                    color={TextColor.textAlternative}
                  >
                    {dateGroup.date}
                  </Text>
                  {dateGroup.transactionGroups.map((item, index) => (
                    <Fragment key={item.id ?? index}>
                      {renderTransaction(item, index)}
                    </Fragment>
                  ))}
                </Fragment>
              ))}
            {processedUnifiedActivityItems.length > daysLimit && (
              <Box
                display={Display.Flex}
                justifyContent={JustifyContent.center}
                alignItems={AlignItems.center}
                paddingInline={4}
                paddingBottom={4}
              >
                <Button
                  className="transaction-list__view-more"
                  variant={ButtonVariant.Secondary}
                  onClick={viewMore}
                >
                  {t('viewMore')}
                </Button>
              </Box>
            )}
          </Box>
        )}
      </Box>
    </>
  );
}

///: BEGIN:ONLY_INCLUDE_IF(multichain)

// Regular transaction list item for non-bridge transactions
const MultichainTransactionListItem = ({
  transaction,
  networkConfig,
  toggleShowDetails,
}) => {
  const t = useI18nContext();
  const { from, to, type, timestamp, isRedeposit, title } =
    useMultichainTransactionDisplay(transaction, networkConfig);
  const networkLogo = MULTICHAIN_TOKEN_IMAGE_MAP[transaction.chain];
  const statusKey = KEYRING_TRANSACTION_STATUS_KEY[transaction.status];

  // A redeposit transaction is a special case where the outputs list is empty because we are sending to ourselves and only pay the fees
  // Mainly used for consolidation transactions
  if (isRedeposit) {
    return (
      <ActivityListItem
        className="custom-class"
        data-testid="activity-list-item"
        onClick={() => toggleShowDetails(transaction)}
        icon={
          <BadgeWrapper
            display={Display.Block}
            badge={
              <AvatarNetwork
                className="activity-tx__network-badge"
                data-testid="activity-tx-network-badge"
                size={AvatarNetworkSize.Xs}
                name={transaction.chain}
                src={networkLogo}
                borderColor={BackgroundColor.backgroundDefault}
                borderWidth={2}
              />
            }
          >
            <TransactionIcon
              category={TransactionGroupCategory.redeposit}
              status={statusKey}
            />
          </BadgeWrapper>
        }
        title={t('redeposit')}
        subtitle={
          <TransactionStatusLabel
            date={formatTimestamp(timestamp)}
            error={{}}
            status={statusKey}
            statusOnly
          />
        }
      />
    );
  }

  let { amount, unit } = to ?? {};
  let category = type;
  if (type === KeyringTransactionType.Swap) {
    amount = from.amount;
    unit = from.unit;
  }

  if (type === KeyringTransactionType.Unknown) {
    category = TransactionGroupCategory.interaction;
  }

  return (
    <ActivityListItem
      className="custom-class"
      data-testid="activity-list-item"
      onClick={() => toggleShowDetails(transaction)}
      icon={
        <BadgeWrapper
          display={Display.Block}
          badge={
            <AvatarNetwork
              className="activity-tx__network-badge"
              data-testid="activity-tx-network-badge"
              size={AvatarNetworkSize.Xs}
              name={transaction.chain}
              src={networkLogo}
              borderColor={BackgroundColor.backgroundDefault}
              borderWidth={2}
            />
          }
        >
          <TransactionIcon category={category} status={statusKey} />
        </BadgeWrapper>
      }
      rightContent={
        <Text
          className="activity-list-item__primary-currency"
          data-testid="transaction-list-item-primary-currency"
          color={TextColor.textDefault}
          variant={TextVariant.bodyMdMedium}
          ellipsis
          textAlign="right"
          title="Primary Currency"
        >
          {amount} {unit}
        </Text>
      }
      title={title}
      subtitle={
        <TransactionStatusLabel
          date={formatTimestamp(transaction.timestamp)}
          error={{}}
          status={statusKey}
          statusOnly
        />
      }
    />
  );
};

MultichainTransactionListItem.propTypes = {
  transaction: PropTypes.object.isRequired,
  networkConfig: PropTypes.object.isRequired,
  toggleShowDetails: PropTypes.func.isRequired,
};

///: END:ONLY_INCLUDE_IF

UnifiedTransactionList.propTypes = {
  hideTokenTransactions: PropTypes.bool,
  tokenAddress: PropTypes.string,
  boxProps: PropTypes.object,
  tokenChainIdOverride: PropTypes.string,
  hideNetworkFilter: PropTypes.bool,
};

UnifiedTransactionList.defaultProps = {
  hideTokenTransactions: false,
  tokenAddress: undefined,
  boxProps: undefined,
  tokenChainIdOverride: null,
};

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
import { TransactionType as KeyringTransactionType } from '@metamask/keyring-api';
import {
  nonceSortedCompletedTransactionsSelectorAllChains,
  nonceSortedPendingTransactionsSelectorAllChains,
} from '../../../selectors/transactions';
import { getEnabledNetworks, getSelectedAccount } from '../../../selectors';
import MultichainBridgeTransactionListItem from '../multichain-bridge-transaction-list-item/multichain-bridge-transaction-list-item';
import MultichainBridgeTransactionDetailsModal from '../multichain-bridge-transaction-details-modal/multichain-bridge-transaction-details-modal';
import { useI18nContext } from '../../../hooks/useI18nContext';
import TransactionListItem from '../transaction-list-item';
import SmartTransactionListItem from '../transaction-list-item/smart-transaction-list-item.component';
import {
  TOKEN_CATEGORY_HASH,
  TransactionKind,
} from '../../../helpers/constants/transactions';
import { SWAPS_CHAINID_CONTRACT_ADDRESS_MAP } from '../../../../shared/constants/swaps';
import { isEqualCaseInsensitive } from '../../../../shared/modules/string-utils';
import { getSelectedMultichainNetworkConfiguration } from '../../../selectors/multichain/networks';
import {
  Box,
  Button,
  Text,
  BadgeWrapper,
  AvatarNetwork,
  AvatarNetworkSize,
  BadgeWrapperAnchorElementShape,
} from '../../component-library';
import TransactionIcon from '../transaction-icon';
import TransactionStatusLabel from '../transaction-status-label/transaction-status-label';
import { MultichainTransactionDetailsModal } from '../multichain-transaction-details-modal';
import { formatTimestamp } from '../multichain-transaction-details-modal/helpers';
import {
  AlignItems,
  BackgroundColor,
  BorderColor,
  Display,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { formatDateWithYearContext } from '../../../helpers/utils/util';
import { ActivityListItem } from '../../multichain/activity-list-item';
import {
  KEYRING_TRANSACTION_STATUS_KEY,
  useMultichainTransactionDisplay,
} from '../../../hooks/useMultichainTransactionDisplay';
import { TransactionGroupCategory } from '../../../../shared/constants/transaction';
import { endTrace, TraceName } from '../../../../shared/lib/trace';
import { MULTICHAIN_TOKEN_IMAGE_MAP } from '../../../../shared/constants/multichain/networks';
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
import { getAllNetworkConfigurationsByCaipChainId } from '../../../../shared/modules/selectors/networks';
import { NetworkFilter } from '../../../pages/confirmations/components/network-filter';
import { ButtonBaseSize } from '../../component-library/button-base/button-base.types';

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

  const transactionForToken = (nonEvmTransactions.transactions || []).filter(
    (transaction) => {
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
  {
    hideTokenTransactions,
    tokenAddress,
    evmChainIds,
    nonEvmChainIds,
    selectedNetworkFilterChainId,
  },
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

  if (selectedNetworkFilterChainId) {
    const filteredUnifiedItems = sortedUnifiedItems.filter((item) => {
      if (item.kind === TransactionKind.EVM) {
        return item.transactionGroup.transactions.some(
          (transaction) => transaction.chainId === selectedNetworkFilterChainId,
        );
      } else if (item.kind === TransactionKind.NON_EVM) {
        return item.transaction.chain === selectedNetworkFilterChainId;
      }
      return false;
    });

    return filteredUnifiedItems;
  }

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

function getFilteredChainIds(enabledNetworks) {
  const filteredEVMChainIds = Object.keys(enabledNetworks?.eip155) ?? [];
  const filteredNonEvmChainIds =
    Object.keys(enabledNetworks)
      .filter((namespace) => namespace !== 'eip155')
      .reduce((acc, namespace) => {
        const newAcc = [...acc, ...Object.keys(enabledNetworks[namespace])];
        return newAcc;
      }, []) ?? [];

  return {
    evmChainIds: filteredEVMChainIds,
    nonEvmChainIds: filteredNonEvmChainIds,
  };
}
export default function UnifiedTransactionList({
  hideTokenTransactions,
  hideNetworkFilter,
  tokenAddress,
  tokenChainIdOverride,
}) {
  const [daysLimit, setDaysLimit] = useState(PAGE_DAYS_INCREMENT);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [selectedNetworkFilterChainId, setSelectedNetworkFilterChainId] =
    useState(tokenChainIdOverride);

  const t = useI18nContext();
  const selectedAccount = useSelector(getSelectedAccount);
  const networks = useSelector(getAllNetworkConfigurationsByCaipChainId);
  const enabledNetworks = useSelector(getEnabledNetworks);
  const unfilteredPendingTransactions = useSelector(
    nonceSortedPendingTransactionsSelectorAllChains,
  );
  const unfilteredCompletedTransactionsAllChains = useSelector(
    nonceSortedCompletedTransactionsSelectorAllChains,
  );
  const { evmChainIds, nonEvmChainIds } = getFilteredChainIds(enabledNetworks);
  const nonEvmTransactions = useSelector((state) =>
    getSelectedAccountGroupMultichainTransactions(state, nonEvmChainIds),
  );
  const nonEvmTransactionsForToken = useMemo(
    () => filterNonEvmTxByToken(nonEvmTransactions, tokenAddress),
    [nonEvmTransactions, tokenAddress],
  );

  const enabledNetworksFilteredCompletedTransactions = useMemo(() => {
    // Get the list of enabled chain IDs for this namespace
    const chainIds = Object.values(networks).map((network) => network.chainId);

    const transactionsToFilter = unfilteredCompletedTransactionsAllChains;

    // Filter transactions to only include those from enabled networks
    const filteredTransactions = transactionsToFilter.filter(
      (transactionGroup) => {
        const transactionChainId = transactionGroup.initialTransaction?.chainId;
        const isIncluded = chainIds.includes(transactionChainId);
        return isIncluded;
      },
    );

    return filteredTransactions;
  }, [networks, unfilteredCompletedTransactionsAllChains]);

  const unifiedActivityItems = useMemo(() => {
    return buildUnifiedActivityItems(
      unfilteredPendingTransactions,
      enabledNetworksFilteredCompletedTransactions,
      nonEvmTransactionsForToken,
      {
        hideTokenTransactions,
        tokenAddress,
        evmChainIds,
        nonEvmChainIds,
        selectedNetworkFilterChainId,
      },
    );
  }, [
    unfilteredPendingTransactions,
    enabledNetworksFilteredCompletedTransactions,
    nonEvmTransactionsForToken,
    hideTokenTransactions,
    tokenAddress,
    evmChainIds,
    nonEvmChainIds,
    selectedNetworkFilterChainId,
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

  const activityChainIds = useMemo(() => {
    const allTransactions = [
      ...nonEvmTransactionsForToken.transactions,
      ...unfilteredPendingTransactions,
      ...enabledNetworksFilteredCompletedTransactions,
    ];
    const chainIds = new Set();
    allTransactions.forEach((item) => {
      if (item.chain) {
        chainIds.add(item.chain);
        return;
      }
      if (item.transactions) {
        item.transactions.forEach((transaction) => {
          chainIds.add(transaction.chainId);
        });
        return;
      }
      if (item.chainId) {
        chainIds.add(item.chainId);
      }
    });
    return Array.from(chainIds);
  }, [
    nonEvmTransactionsForToken,
    unfilteredPendingTransactions,
    enabledNetworksFilteredCompletedTransactions,
  ]);

  useEffect(() => {
    endTrace({ name: TraceName.AccountOverviewActivityTab });
  }, []);

  const toggleShowDetails = useCallback((transaction = null) => {
    setSelectedTransaction(transaction);
  }, []);

  const multichainNetworkConfig = useSelector(
    getSelectedMultichainNetworkConfiguration,
  );

  const bridgeHistoryItems = useSelector(selectBridgeHistoryForAccountGroup);
  const selectedBridgeHistoryItem = useSelector((state) =>
    selectBridgeHistoryItemForTxMetaId(state, selectedTransaction?.id),
  );

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

      <Box className="transaction-list">
        {!hideNetworkFilter && (
          <NetworkFilter
            buttonBaseProps={{
              size: ButtonBaseSize.Sm,
              borderColor: BorderColor.borderMuted,
            }}
            boxProps={{
              marginLeft: 2,
              marginTop: 4,
              marginBottom: 2,
            }}
            textProps={{
              variant: TextVariant.bodySmMedium,
            }}
            selectedAvatarProps={{
              size: AvatarNetworkSize.Xs,
            }}
            chainIds={activityChainIds}
            selectedChainId={selectedNetworkFilterChainId}
            onChainIdChange={setSelectedNetworkFilterChainId}
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
                    paddingTop={4}
                    paddingInline={4}
                    variant={TextVariant.bodyMd}
                    color={TextColor.textDefault}
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
                padding={4}
              >
                <Button
                  className="transaction-list__view-more"
                  type="secondary"
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
            anchorElementShape={BadgeWrapperAnchorElementShape.circular}
            display={Display.Block}
            badge={
              <AvatarNetwork
                className="activity-tx__network-badge"
                data-testid="activity-tx-network-badge"
                size={AvatarNetworkSize.Xs}
                name={transaction.chain}
                src={networkLogo}
                borderColor={BackgroundColor.backgroundDefault}
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
          anchorElementShape={BadgeWrapperAnchorElementShape.circular}
          display={Display.Block}
          badge={
            <AvatarNetwork
              className="activity-tx__network-badge"
              data-testid="activity-tx-network-badge"
              size={AvatarNetworkSize.Xs}
              name={transaction.chain}
              src={networkLogo}
              borderColor={BackgroundColor.backgroundDefault}
            />
          }
        >
          <TransactionIcon category={category} status={statusKey} />
        </BadgeWrapper>
      }
      rightContent={
        <Text
          className="activity-list-item__primary-currency"
          color="text-default"
          data-testid="transaction-list-item-primary-currency"
          ellipsis
          fontWeight="medium"
          textAlign="right"
          title="Primary Currency"
          variant="body-lg-medium"
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
  tokenChainIdOverride: PropTypes.string,
  hideNetworkFilter: PropTypes.bool,
};

UnifiedTransactionList.defaultProps = {
  hideTokenTransactions: false,
  tokenAddress: undefined,
  tokenChainIdOverride: null,
};

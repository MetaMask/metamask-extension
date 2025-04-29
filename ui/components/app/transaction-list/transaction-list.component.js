import React, {
  useMemo,
  useState,
  useCallback,
  Fragment,
  ///: BEGIN:ONLY_INCLUDE_IF(multichain)
  useContext,
  ///: END:ONLY_INCLUDE_IF
  useEffect,
} from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { TransactionType } from '@metamask/transaction-controller';
///: BEGIN:ONLY_INCLUDE_IF(multichain)
import {
  isEvmAccountType,
  TransactionType as KeyringTransactionType,
} from '@metamask/keyring-api';
///: END:ONLY_INCLUDE_IF
import {
  nonceSortedCompletedTransactionsSelector,
  nonceSortedCompletedTransactionsSelectorAllChains,
  nonceSortedPendingTransactionsSelector,
  nonceSortedPendingTransactionsSelectorAllChains,
} from '../../../selectors/transactions';
import { getCurrentChainId } from '../../../../shared/modules/selectors/networks';
import {
  getCurrentNetwork,
  getIsTokenNetworkFilterEqualCurrentNetwork,
  getSelectedAccount,
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  getShouldHideZeroBalanceTokens,
  ///: END:ONLY_INCLUDE_IF
} from '../../../selectors';
///: BEGIN:ONLY_INCLUDE_IF(multichain)
import useSolanaBridgeTransactionMapping from '../../../hooks/bridge/useSolanaBridgeTransactionMapping';
import MultichainBridgeTransactionListItem from '../multichain-bridge-transaction-list-item/multichain-bridge-transaction-list-item';
import MultichainBridgeTransactionDetailsModal from '../multichain-bridge-transaction-details-modal/multichain-bridge-transaction-details-modal';
///: END:ONLY_INCLUDE_IF
import { useI18nContext } from '../../../hooks/useI18nContext';
import TransactionListItem from '../transaction-list-item';
import SmartTransactionListItem from '../transaction-list-item/smart-transaction-list-item.component';
import { TOKEN_CATEGORY_HASH } from '../../../helpers/constants/transactions';
import { SWAPS_CHAINID_CONTRACT_ADDRESS_MAP } from '../../../../shared/constants/swaps';
import { isEqualCaseInsensitive } from '../../../../shared/modules/string-utils';
///: BEGIN:ONLY_INCLUDE_IF(multichain)
import { useMultichainSelector } from '../../../hooks/useMultichainSelector';
import {
  getMultichainNetwork,
  getSelectedAccountMultichainTransactions,
} from '../../../selectors/multichain';
///: END:ONLY_INCLUDE_IF
import {
  getIsEvmMultichainNetworkSelected,
  ///: BEGIN:ONLY_INCLUDE_IF(multichain)
  getSelectedMultichainNetworkConfiguration,
  ///: END:ONLY_INCLUDE_IF
} from '../../../selectors/multichain/networks';

import {
  Box,
  Button,
  Text,
  ///: BEGIN:ONLY_INCLUDE_IF(multichain)
  ButtonSize,
  ButtonVariant,
  IconName,
  BadgeWrapper,
  AvatarNetwork,
  AvatarNetworkSize,
  BadgeWrapperAnchorElementShape,
  ///: END:ONLY_INCLUDE_IF
} from '../../component-library';
///: BEGIN:ONLY_INCLUDE_IF(multichain)
import TransactionIcon from '../transaction-icon';
import TransactionStatusLabel from '../transaction-status-label/transaction-status-label';
import { MultichainTransactionDetailsModal } from '../multichain-transaction-details-modal';
import { formatTimestamp } from '../multichain-transaction-details-modal/helpers';
///: END:ONLY_INCLUDE_IF
import {
  ///: BEGIN:ONLY_INCLUDE_IF(multichain)
  BackgroundColor,
  Display,
  ///: END:ONLY_INCLUDE_IF
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { formatDateWithYearContext } from '../../../helpers/utils/util';
///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
import { useAccountTotalFiatBalance } from '../../../hooks/useAccountTotalFiatBalance';
import {
  RAMPS_CARD_VARIANT_TYPES,
  RampsCard,
} from '../../multichain/ramps-card/ramps-card';
import { getIsNativeTokenBuyable } from '../../../ducks/ramps';
///: END:ONLY_INCLUDE_IF
///: BEGIN:ONLY_INCLUDE_IF(multichain)
import { openBlockExplorer } from '../../multichain/menu-items/view-explorer-menu-item';
import { getMultichainAccountUrl } from '../../../helpers/utils/multichain/blockExplorer';
import { ActivityListItem } from '../../multichain';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  KEYRING_TRANSACTION_STATUS_KEY,
  useMultichainTransactionDisplay,
} from '../../../hooks/useMultichainTransactionDisplay';
import { TransactionGroupCategory } from '../../../../shared/constants/transaction';
///: END:ONLY_INCLUDE_IF

import { endTrace, TraceName } from '../../../../shared/lib/trace';
import { TEST_CHAINS } from '../../../../shared/constants/network';
///: BEGIN:ONLY_INCLUDE_IF(multichain)
import { MULTICHAIN_TOKEN_IMAGE_MAP } from '../../../../shared/constants/multichain/networks';
///: END:ONLY_INCLUDE_IF
// eslint-disable-next-line import/no-restricted-paths
import { getEnvironmentType } from '../../../../app/scripts/lib/util';
import {
  ENVIRONMENT_TYPE_NOTIFICATION,
  ENVIRONMENT_TYPE_POPUP,
} from '../../../../shared/constants/app';
import { NetworkFilterComponent } from '../../multichain/network-filter-menu';

const PAGE_INCREMENT = 10;

// When we are on a token page, we only want to show transactions that involve that token.
// In the case of token transfers or approvals, these will be transactions sent to the
// token contract. In the case of swaps, these will be transactions sent to the swaps contract
// and which have the token address in the transaction data.
//
// getTransactionGroupRecipientAddressFilter is used to determine whether a transaction matches
// either of those criteria
const getTransactionGroupRecipientAddressFilter = (
  recipientAddress,
  chainId,
) => {
  return ({ initialTransaction: { txParams } }) => {
    return (
      isEqualCaseInsensitive(txParams?.to, recipientAddress) ||
      (txParams?.to === SWAPS_CHAINID_CONTRACT_ADDRESS_MAP[chainId] &&
        txParams.data.match(recipientAddress.slice(2)))
    );
  };
};

const getTransactionGroupRecipientAddressFilterAllChain = (
  recipientAddress,
) => {
  return ({ initialTransaction: { txParams } }) => {
    return (
      isEqualCaseInsensitive(txParams?.to, recipientAddress) ||
      (txParams?.to === SWAPS_CHAINID_CONTRACT_ADDRESS_MAP &&
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
  chainId,
) => {
  if (hideTokenTransactions) {
    return transactionGroups.filter(tokenTransactionFilter);
  } else if (tokenAddress) {
    return transactionGroups.filter(
      getTransactionGroupRecipientAddressFilter(tokenAddress, chainId),
    );
  }
  return transactionGroups;
};

const getFilteredTransactionGroupsAllChains = (
  transactionGroups,
  hideTokenTransactions,
  tokenAddress,
) => {
  if (hideTokenTransactions) {
    return transactionGroups.filter(tokenTransactionFilter);
  } else if (tokenAddress) {
    return transactionGroups.filter(
      getTransactionGroupRecipientAddressFilterAllChain(tokenAddress),
    );
  }
  return transactionGroups;
};

const groupTransactionsByDate = (
  transactionGroups,
  getTransactionTimestamp,
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
      // Sort transactions within the group by timestamp (newest first)
      existingGroup.transactionGroups.sort((a, b) => {
        const aTime = getTransactionTimestamp(a);
        const bTime = getTransactionTimestamp(b);
        return bTime - aTime; // Descending order (newest first)
      });
    } else {
      groupedTransactions.push({
        date,
        dateMillis: timestamp,
        transactionGroups: [transactionGroup],
      });
    }
    // Sort date groups by timestamp (newest first)
    groupedTransactions.sort((a, b) => b.dateMillis - a.dateMillis);
  });

  return groupedTransactions;
};

const groupEvmTransactionsByDate = (transactionGroups) =>
  groupTransactionsByDate(
    transactionGroups,
    (transactionGroup) => transactionGroup.primaryTransaction.time,
  );

///: BEGIN:ONLY_INCLUDE_IF(multichain)
const groupNonEvmTransactionsByDate = (nonEvmTransactions) =>
  groupTransactionsByDate(
    nonEvmTransactions?.transactions,
    (transaction) => transaction.timestamp * 1000,
  );

/**
 * Returns a copy of the nonEvmTransactions object with only the transactions that involve the tokenAddress.
 *
 * @param nonEvmTransactions - The nonEvmTransactions object.
 * @param tokenAddress - [Optional] The address of the token to filter for. Returns all transactions if not provided.
 * @returns A copy of the nonEvmTransactions object with only the transactions
 * that involve the tokenAddress.
 */
export const filterTransactionsByToken = (
  nonEvmTransactions = { transactions: [] },
  tokenAddress,
) => {
  if (!tokenAddress) {
    return nonEvmTransactions;
  }

  const transactionForToken = (nonEvmTransactions.transactions || []).filter(
    (transaction) => {
      return transaction.to.some((item) => item.asset.type === tokenAddress);
    },
  );

  return {
    ...nonEvmTransactions,
    transactions: transactionForToken,
  };
};
///: END:ONLY_INCLUDE_IF

// Remove transaction groups with no transactions
const removeTxGroupsWithNoTx = (dateGroup) => {
  dateGroup.transactionGroups = dateGroup.transactionGroups.filter(
    (transactionGroup) => {
      return transactionGroup.transactions.length > 0;
    },
  );

  return dateGroup;
};

export default function TransactionList({
  hideTokenTransactions,
  tokenAddress,
  boxProps,
  hideNetworkFilter,
}) {
  const [limit, setLimit] = useState(PAGE_INCREMENT);
  const t = useI18nContext();
  const currentNetworkConfig = useSelector(getCurrentNetwork);
  const isTokenNetworkFilterEqualCurrentNetwork = useSelector(
    getIsTokenNetworkFilterEqualCurrentNetwork,
  );
  const selectedAccount = useSelector(getSelectedAccount);

  ///: BEGIN:ONLY_INCLUDE_IF(multichain)
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const nonEvmTransactions = useSelector(
    getSelectedAccountMultichainTransactions,
  );

  const nonEvmTransactionFilteredByToken = filterTransactionsByToken(
    nonEvmTransactions,
    tokenAddress,
  );

  // Use our custom hook to map Solana bridge transactions with destination chain info
  const modifiedNonEvmTransactions = useSolanaBridgeTransactionMapping(
    nonEvmTransactionFilteredByToken,
  );
  ///: END:ONLY_INCLUDE_IF

  const unfilteredPendingTransactionsCurrentChain = useSelector(
    nonceSortedPendingTransactionsSelector,
  );

  const unfilteredPendingTransactionsAllChains = useSelector(
    nonceSortedPendingTransactionsSelectorAllChains,
  );

  const unfilteredPendingTransactions = useMemo(() => {
    return isTokenNetworkFilterEqualCurrentNetwork
      ? unfilteredPendingTransactionsCurrentChain
      : unfilteredPendingTransactionsAllChains;
  }, [
    isTokenNetworkFilterEqualCurrentNetwork,
    unfilteredPendingTransactionsAllChains,
    unfilteredPendingTransactionsCurrentChain,
  ]);

  const isTestNetwork = useMemo(() => {
    return TEST_CHAINS.includes(currentNetworkConfig.chainId);
  }, [currentNetworkConfig.chainId]);

  const unfilteredCompletedTransactionsCurrentChain = useSelector(
    nonceSortedCompletedTransactionsSelector,
  );

  const unfilteredCompletedTransactionsAllChains = useSelector(
    nonceSortedCompletedTransactionsSelectorAllChains,
  );

  const unfilteredCompletedTransactions = useMemo(() => {
    return isTokenNetworkFilterEqualCurrentNetwork
      ? unfilteredCompletedTransactionsCurrentChain
      : unfilteredCompletedTransactionsAllChains;
  }, [
    isTokenNetworkFilterEqualCurrentNetwork,
    unfilteredCompletedTransactionsAllChains,
    unfilteredCompletedTransactionsCurrentChain,
  ]);

  const chainId = useSelector(getCurrentChainId);
  const isEvmNetwork = useSelector(getIsEvmMultichainNetworkSelected);

  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  const shouldHideZeroBalanceTokens = useSelector(
    getShouldHideZeroBalanceTokens,
  );
  const { totalFiatBalance } = useAccountTotalFiatBalance(
    selectedAccount,
    shouldHideZeroBalanceTokens,
  );
  const balanceIsZero = Number(totalFiatBalance) === 0;
  const isBuyableChain = useSelector(getIsNativeTokenBuyable);
  const showRampsCard = isBuyableChain && balanceIsZero;
  ///: END:ONLY_INCLUDE_IF

  const [isNetworkFilterPopoverOpen, setIsNetworkFilterPopoverOpen] =
    useState(false);

  const windowType = getEnvironmentType();
  const isFullScreen =
    windowType !== ENVIRONMENT_TYPE_NOTIFICATION &&
    windowType !== ENVIRONMENT_TYPE_POPUP;

  const renderDateStamp = (index, dateGroup) => {
    return index === 0 ? (
      <Text
        paddingTop={2}
        paddingInline={4}
        variant={TextVariant.bodyMd}
        color={TextColor.textAlternative}
        key={dateGroup.dateMillis}
      >
        {dateGroup.date}
      </Text>
    ) : null;
  };

  const pendingTransactions = useMemo(
    () =>
      groupEvmTransactionsByDate(
        getFilteredTransactionGroups(
          unfilteredPendingTransactions,
          hideTokenTransactions,
          tokenAddress,
          chainId,
        ),
      ),
    [
      hideTokenTransactions,
      tokenAddress,
      unfilteredPendingTransactions,
      chainId,
    ],
  );

  const completedTransactions = useMemo(
    () =>
      groupEvmTransactionsByDate(
        getFilteredTransactionGroupsAllChains(
          unfilteredCompletedTransactions,
          hideTokenTransactions,
          tokenAddress,
        ),
      ),
    [hideTokenTransactions, tokenAddress, unfilteredCompletedTransactions],
  );

  const viewMore = useCallback(
    () => setLimit((prev) => prev + PAGE_INCREMENT),
    [],
  );

  const toggleNetworkFilterPopover = useCallback(() => {
    setIsNetworkFilterPopoverOpen(!isNetworkFilterPopoverOpen);
  }, [isNetworkFilterPopoverOpen]);

  const closePopover = useCallback(() => {
    setIsNetworkFilterPopoverOpen(false);
  }, []);

  // Remove transactions within each date group that are incoming transactions
  // to a user that not the current one.
  const removeIncomingTxsButToAnotherAddress = (dateGroup) => {
    const isIncomingTxsButToAnotherAddress = (transaction) =>
      transaction.type === TransactionType.incoming &&
      transaction.txParams.to.toLowerCase() !==
        selectedAccount.address.toLowerCase();

    dateGroup.transactionGroups = dateGroup.transactionGroups.map(
      (transactionGroup) => {
        transactionGroup.transactions = transactionGroup.transactions.filter(
          (transaction) => !isIncomingTxsButToAnotherAddress(transaction),
        );

        return transactionGroup;
      },
    );

    return dateGroup;
  };

  const renderFilterButton = useCallback(() => {
    if (hideNetworkFilter) {
      return null;
    }
    return isEvmNetwork ? (
      <NetworkFilterComponent
        isFullScreen={isFullScreen}
        toggleNetworkFilterPopover={toggleNetworkFilterPopover}
        isTestNetwork={isTestNetwork}
        currentNetworkConfig={currentNetworkConfig}
        isNetworkFilterPopoverOpen={isNetworkFilterPopoverOpen}
        closePopover={closePopover}
        isTokenNetworkFilterEqualCurrentNetwork={
          isTokenNetworkFilterEqualCurrentNetwork
        }
      />
    ) : null;
  }, [
    hideNetworkFilter,
    isEvmNetwork,
    isFullScreen,
    isNetworkFilterPopoverOpen,
    currentNetworkConfig,
    isTokenNetworkFilterEqualCurrentNetwork,
    toggleNetworkFilterPopover,
    closePopover,
    isTestNetwork,
  ]);

  // Remove date groups with no transaction groups
  const dateGroupsWithTransactionGroups = (dateGroup) =>
    dateGroup.transactionGroups.length > 0;

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
  // We still need this data type which is not compatible with non EVM
  // testnets because of how the previous multichain network selectors work
  // TODO: refactor getMultichainAccountUrl to not rely on legacy data types
  const multichainNetworkForSelectedAccount = useMultichainSelector(
    getMultichainNetwork,
    selectedAccount,
  );

  const trackEvent = useContext(MetaMetricsContext);

  if (!isEvmAccountType(selectedAccount.type)) {
    const addressLink = getMultichainAccountUrl(
      selectedAccount.address,
      multichainNetworkForSelectedAccount,
    );

    const metricsLocation = 'Activity Tab';
    return (
      <>
        {selectedTransaction &&
          (selectedTransaction.isBridgeTx && selectedTransaction.bridgeInfo ? (
            <MultichainBridgeTransactionDetailsModal
              transaction={selectedTransaction}
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
          {/* TODO: Non-EVM transactions are not paginated for now. */}
          <Box className="transaction-list__transactions">
            {nonEvmTransactions?.transactions.length > 0 ? (
              <Box className="transaction-list__completed-transactions">
                {groupNonEvmTransactionsByDate(
                  modifiedNonEvmTransactions ||
                    nonEvmTransactionFilteredByToken,
                ).map((dateGroup) => (
                  <Fragment key={dateGroup.date}>
                    <Text
                      paddingTop={4}
                      paddingInline={4}
                      variant={TextVariant.bodyMd}
                      color={TextColor.textDefault}
                    >
                      {dateGroup.date}
                    </Text>
                    {dateGroup.transactionGroups.map((transaction) => {
                      // Check for bridging transactions
                      if (
                        transaction.isBridgeOriginated ||
                        (transaction.isBridgeTx && transaction.bridgeInfo)
                      ) {
                        return (
                          <MultichainBridgeTransactionListItem
                            key={`bridge-${transaction.id}`}
                            transaction={transaction}
                            toggleShowDetails={toggleShowDetails}
                          />
                        );
                      }

                      // Default: Render standard Multichain list item
                      return (
                        <MultichainTransactionListItem
                          key={`${transaction.id}`}
                          transaction={transaction}
                          networkConfig={multichainNetworkConfig}
                          toggleShowDetails={toggleShowDetails}
                        />
                      );
                    })}
                  </Fragment>
                ))}

                <Box className="transaction-list__view-on-block-explorer">
                  <Button
                    display={Display.Flex}
                    variant={ButtonVariant.Primary}
                    size={ButtonSize.Sm}
                    endIconName={IconName.Export}
                    onClick={() =>
                      openBlockExplorer(
                        addressLink,
                        metricsLocation,
                        trackEvent,
                      )
                    }
                  >
                    {t('viewOnBlockExplorer')}
                  </Button>
                </Box>
              </Box>
            ) : (
              <Box className="transaction-list__empty">
                <Box className="transaction-list__empty-text">
                  {t('noTransactions')}
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      </>
    );
  }
  ///: END:ONLY_INCLUDE_IF

  return (
    <>
      {
        ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
        showRampsCard ? (
          <RampsCard variant={RAMPS_CARD_VARIANT_TYPES.ACTIVITY} />
        ) : null
        ///: END:ONLY_INCLUDE_IF
      }
      <Box className="transaction-list" {...boxProps}>
        {renderFilterButton()}
        <Box className="transaction-list__transactions">
          {pendingTransactions.length > 0 && (
            <Box className="transaction-list__pending-transactions">
              {pendingTransactions.map((dateGroup) => {
                return dateGroup.transactionGroups.map(
                  (transactionGroup, index) => {
                    if (
                      transactionGroup.initialTransaction?.isSmartTransaction
                    ) {
                      return (
                        <Fragment key={`${transactionGroup.nonce}:${index}`}>
                          {renderDateStamp(index, dateGroup)}
                          <SmartTransactionListItem
                            isEarliestNonce={index === 0}
                            smartTransaction={
                              transactionGroup.initialTransaction
                            }
                            transactionGroup={transactionGroup}
                            chainId={
                              transactionGroup.initialTransaction.chainId
                            }
                          />
                        </Fragment>
                      );
                    }
                    return (
                      <Fragment key={`${transactionGroup.nonce}:${index}`}>
                        {renderDateStamp(index, dateGroup)}
                        <TransactionListItem
                          isEarliestNonce={index === 0}
                          transactionGroup={transactionGroup}
                          chainId={transactionGroup.initialTransaction.chainId}
                        />
                      </Fragment>
                    );
                  },
                );
              })}
            </Box>
          )}
          <Box className="transaction-list__completed-transactions">
            {completedTransactions.length > 0
              ? completedTransactions
                  .map(removeIncomingTxsButToAnotherAddress)
                  .map(removeTxGroupsWithNoTx)
                  .filter(dateGroupsWithTransactionGroups)
                  .slice(0, limit)
                  .map((dateGroup) => {
                    return dateGroup.transactionGroups.map(
                      (transactionGroup, index) => {
                        return (
                          <Fragment
                            key={`${transactionGroup.nonce}:${
                              transactionGroup.initialTransaction
                                ? index
                                : limit + index - 10
                            }`}
                          >
                            {renderDateStamp(index, dateGroup)}
                            {transactionGroup.initialTransaction
                              ?.isSmartTransaction ? (
                              <SmartTransactionListItem
                                transactionGroup={transactionGroup}
                                smartTransaction={
                                  transactionGroup.initialTransaction
                                }
                                chainId={
                                  transactionGroup.initialTransaction.chainId
                                }
                              />
                            ) : (
                              <TransactionListItem
                                transactionGroup={transactionGroup}
                                chainId={
                                  transactionGroup.initialTransaction.chainId
                                }
                              />
                            )}
                          </Fragment>
                        );
                      },
                    );
                  })
              : null}
            {completedTransactions.length > limit && (
              <Button
                className="transaction-list__view-more"
                type="secondary"
                onClick={viewMore}
              >
                {t('viewMore')}
              </Button>
            )}
          </Box>
        </Box>
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

TransactionList.propTypes = {
  hideTokenTransactions: PropTypes.bool,
  tokenAddress: PropTypes.string,
  boxProps: PropTypes.object,
  tokenChainId: PropTypes.string,
  hideNetworkFilter: PropTypes.bool,
};

TransactionList.defaultProps = {
  hideTokenTransactions: false,
  tokenAddress: undefined,
  boxProps: undefined,
  tokenChainId: null,
};

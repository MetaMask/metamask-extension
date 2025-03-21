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
import { capitalize } from 'lodash';
import { isEvmAccountType } from '@metamask/keyring-api';
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
///: END:ONLY_INCLUDE_IF
import { useI18nContext } from '../../../hooks/useI18nContext';
import TransactionListItem from '../transaction-list-item';
import SmartTransactionListItem from '../transaction-list-item/smart-transaction-list-item.component';
import { TOKEN_CATEGORY_HASH } from '../../../helpers/constants/transactions';
import { SWAPS_CHAINID_CONTRACT_ADDRESS_MAP } from '../../../../shared/constants/swaps';
import { isEqualCaseInsensitive } from '../../../../shared/modules/string-utils';
import { useMultichainSelector } from '../../../hooks/useMultichainSelector';
import {
  getSelectedInternalAccount,
  ///: BEGIN:ONLY_INCLUDE_IF(multichain)
  isSelectedInternalAccountSolana,
  ///: END:ONLY_INCLUDE_IF
} from '../../../selectors/accounts';
import {
  getMultichainNetwork,
  ///: BEGIN:ONLY_INCLUDE_IF(multichain)
  getSelectedAccountMultichainTransactions,
  ///: END:ONLY_INCLUDE_IF
} from '../../../selectors/multichain';

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
  MULTICHAIN_PROVIDER_CONFIGS,
  MultichainNetworks,
  SOLANA_TOKEN_IMAGE_URL,
  BITCOIN_TOKEN_IMAGE_URL,
} from '../../../../shared/constants/multichain/networks';
import { useMultichainTransactionDisplay } from '../../../hooks/useMultichainTransactionDisplay';
///: END:ONLY_INCLUDE_IF

import { endTrace, TraceName } from '../../../../shared/lib/trace';
import { TEST_CHAINS } from '../../../../shared/constants/network';
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
    } else {
      groupedTransactions.push({
        date,
        dateMillis: timestamp,
        transactionGroups: [transactionGroup],
      });
    }
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
///: END:ONLY_INCLUDE_IF

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

  ///: BEGIN:ONLY_INCLUDE_IF(multichain)
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const nonEvmTransactions = useSelector(
    getSelectedAccountMultichainTransactions,
  );

  // Use our custom hook to map Solana bridge transactions with destination chain info
  const modifiedNonEvmTransactions =
    useSolanaBridgeTransactionMapping(nonEvmTransactions);
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
  const selectedAccount = useSelector(getSelectedAccount);
  const account = useSelector(getSelectedInternalAccount);
  const { isEvmNetwork } = useMultichainSelector(getMultichainNetwork, account);

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

  // Remove transaction groups with no transactions
  const removeTxGroupsWithNoTx = (dateGroup) => {
    dateGroup.transactionGroups = dateGroup.transactionGroups.filter(
      (transactionGroup) => {
        return transactionGroup.transactions.length > 0;
      },
    );

    return dateGroup;
  };

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

  const multichainNetwork = useMultichainSelector(
    getMultichainNetwork,
    selectedAccount,
  );

  const trackEvent = useContext(MetaMetricsContext);

  if (!isEvmAccountType(selectedAccount.type)) {
    const addressLink = getMultichainAccountUrl(
      selectedAccount.address,
      multichainNetwork,
    );

    const metricsLocation = 'Activity Tab';
    return (
      <>
        {selectedTransaction && (
          <MultichainTransactionDetailsModal
            transaction={selectedTransaction}
            onClose={() => toggleShowDetails(null)}
            userAddress={selectedAccount.address}
          />
        )}

        <Box className="transaction-list" {...boxProps}>
          {/* TODO: Non-EVM transactions are not paginated for now. */}
          <Box className="transaction-list__transactions">
            {nonEvmTransactions?.transactions.length > 0 ? (
              <Box className="transaction-list__completed-transactions">
                {groupNonEvmTransactionsByDate(
                  modifiedNonEvmTransactions || nonEvmTransactions,
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
                    {dateGroup.transactionGroups.map((transaction, index) => (
                      <MultichainTransactionListItem
                        key={`${transaction.account}:${index}`}
                        transaction={transaction}
                        userAddress={selectedAccount.address}
                        index={index}
                        toggleShowDetails={toggleShowDetails}
                      />
                    ))}
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
const MultichainTransactionListItem = ({
  transaction,
  userAddress,
  toggleShowDetails,
}) => {
  const t = useI18nContext();
  const isSolanaAccount = useSelector(isSelectedInternalAccountSolana);

  const { type, status, to, from, asset } = useMultichainTransactionDisplay({
    transaction,
    userAddress,
  });

  let title = capitalize(type);

  if (type === TransactionType.swap) {
    title = `${t('swap')} ${from.asset.unit} ${'to'} ${to.asset.unit}`;
  }

  return (
    <ActivityListItem
      className="custom-class"
      data-testid="activity-list-item"
      onClick={() => toggleShowDetails(transaction)}
      icon={
        <BadgeWrapper
          anchorElementShape="circular"
          badge={
            <AvatarNetwork
              borderColor="background-default"
              borderWidth={1}
              className="activity-tx__network-badge"
              data-testid="activity-tx-network-badge"
              name={
                isSolanaAccount
                  ? MULTICHAIN_PROVIDER_CONFIGS[MultichainNetworks.SOLANA]
                      .nickname
                  : MULTICHAIN_PROVIDER_CONFIGS[MultichainNetworks.BITCOIN]
                      .nickname
              }
              size="xs"
              src={
                isSolanaAccount
                  ? SOLANA_TOKEN_IMAGE_URL
                  : BITCOIN_TOKEN_IMAGE_URL
              }
            />
          }
          display="block"
          positionObj={{ right: -4, top: -4 }}
        >
          <TransactionIcon category={type} status={status} />
        </BadgeWrapper>
      }
      rightContent={
        <>
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
            {asset?.amount} {asset?.unit}
          </Text>
        </>
      }
      title={transaction.isBridgeTx ? t('bridge') : title}
      // eslint-disable-next-line react/jsx-no-duplicate-props
      subtitle={
        transaction.isBridgeTx && transaction.bridgeInfo ? (
          <>
            <TransactionStatusLabel
              date={formatTimestamp(transaction.timestamp)}
              error={{}}
              status={transaction.status}
              statusOnly
            />
            <Text
              variant={TextVariant.bodyMd}
              color={TextColor.textAlternative}
            >
              {`${t('to')} ${transaction.bridgeInfo.destAsset?.symbol} ${t(
                'on',
              )} ${
                // Use the pre-computed chain name from our hook, or fall back to chain ID
                transaction.bridgeInfo.destChainName ||
                transaction.bridgeInfo.destChainId
              }`}
            </Text>
          </>
        ) : (
          <TransactionStatusLabel
            date={formatTimestamp(transaction.timestamp)}
            error={{}}
            status={transaction.status}
            statusOnly
          />
        )
      }
    ></ActivityListItem>
  );
};
MultichainTransactionListItem.propTypes = {
  transaction: PropTypes.object.isRequired,
  userAddress: PropTypes.string.isRequired,
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

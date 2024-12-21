import React, {
  useMemo,
  useState,
  useCallback,
  Fragment,
  ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
  useContext,
  ///: END:ONLY_INCLUDE_IF
  useEffect,
} from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { TransactionType } from '@metamask/transaction-controller';
///: BEGIN:ONLY_INCLUDE_IF(build-flask)
import { capitalize } from 'lodash';
import { isEvmAccountType } from '@metamask/keyring-api';
///: END:ONLY_INCLUDE_IF
import {
  nonceSortedCompletedTransactionsSelector,
  nonceSortedPendingTransactionsSelector,
} from '../../../selectors/transactions';
import { getCurrentChainId } from '../../../../shared/modules/selectors/networks';
import {
  getSelectedAccount,
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  getShouldHideZeroBalanceTokens,
  ///: END:ONLY_INCLUDE_IF
} from '../../../selectors';
import { useI18nContext } from '../../../hooks/useI18nContext';
import TransactionListItem from '../transaction-list-item';
import SmartTransactionListItem from '../transaction-list-item/smart-transaction-list-item.component';
import { TOKEN_CATEGORY_HASH } from '../../../helpers/constants/transactions';
import { SWAPS_CHAINID_CONTRACT_ADDRESS_MAP } from '../../../../shared/constants/swaps';
import { isEqualCaseInsensitive } from '../../../../shared/modules/string-utils';
import {
  Box,
  Button,
  Text,
  ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
  ButtonSize,
  ButtonVariant,
  IconName,
  BadgeWrapper,
  AvatarNetwork,
  ///: END:ONLY_INCLUDE_IF
} from '../../component-library';
///: BEGIN:ONLY_INCLUDE_IF(build-flask)
import TransactionIcon from '../transaction-icon';
import TransactionStatusLabel from '../transaction-status-label/transaction-status-label';
///: END:ONLY_INCLUDE_IF

import {
  ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
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
///: BEGIN:ONLY_INCLUDE_IF(build-flask)
import { openBlockExplorer } from '../../multichain/menu-items/view-explorer-menu-item';
import { getMultichainAccountUrl } from '../../../helpers/utils/multichain/blockExplorer';
import { ActivityListItem } from '../../multichain';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { useMultichainSelector } from '../../../hooks/useMultichainSelector';
import {
  getMultichainNetwork,
  getSelectedAccountMultichainTransactions,
} from '../../../selectors/multichain';
///: END:ONLY_INCLUDE_IF

import { endTrace, TraceName } from '../../../../shared/lib/trace';

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

const groupTransactionsByDate = (transactionGroups) => {
  const groupedTransactions = [];

  transactionGroups.forEach((transactionGroup) => {
    const date = formatDateWithYearContext(
      transactionGroup.primaryTransaction.time,
      'MMM d, y',
      'MMM d',
    );

    const existingGroup = groupedTransactions.find(
      (group) => group.date === date,
    );

    if (existingGroup) {
      existingGroup.transactionGroups.push(transactionGroup);
    } else {
      groupedTransactions.push({
        date,
        dateMillis: transactionGroup.primaryTransaction.time,
        transactionGroups: [transactionGroup],
      });
    }
    groupedTransactions.sort((a, b) => b.dateMillis - a.dateMillis);
  });

  return groupedTransactions;
};

export default function TransactionList({
  hideTokenTransactions,
  tokenAddress,
  boxProps,
}) {
  const [limit, setLimit] = useState(PAGE_INCREMENT);
  const t = useI18nContext();

  ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
  const nonEvmTransactions = useSelector(
    getSelectedAccountMultichainTransactions,
  );
  ///: END:ONLY_INCLUDE_IF

  const unfilteredPendingTransactions = useSelector(
    nonceSortedPendingTransactionsSelector,
  );
  const unfilteredCompletedTransactions = useSelector(
    nonceSortedCompletedTransactionsSelector,
  );

  const chainId = useSelector(getCurrentChainId);
  const selectedAccount = useSelector(getSelectedAccount);

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

  const renderDateStamp = (index, dateGroup) => {
    return index === 0 ? (
      <Text
        paddingTop={4}
        paddingInline={4}
        variant={TextVariant.bodyMd}
        color={TextColor.textDefault}
        key={dateGroup.dateMillis}
      >
        {dateGroup.date}
      </Text>
    ) : null;
  };

  const pendingTransactions = useMemo(
    () =>
      groupTransactionsByDate(
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
      groupTransactionsByDate(
        getFilteredTransactionGroups(
          unfilteredCompletedTransactions,
          hideTokenTransactions,
          tokenAddress,
          chainId,
        ),
      ),
    [
      hideTokenTransactions,
      tokenAddress,
      unfilteredCompletedTransactions,
      chainId,
    ],
  );

  const viewMore = useCallback(
    () => setLimit((prev) => prev + PAGE_INCREMENT),
    [],
  );

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

  ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
  const multichainNetwork = useMultichainSelector(
    getMultichainNetwork,
    selectedAccount,
  );

  const trackEvent = useContext(MetaMetricsContext);

  const groupNonEvmTransactionsByDate = (transactions) => {
    const groupedTransactions = [];

    transactions.data.forEach((transaction) => {
      const timestamp = transaction.timestamp * 1000;

      const date = formatDateWithYearContext(timestamp, 'MMM d, y', 'MMM d');

      const existingGroup = groupedTransactions.find(
        (group) => group.date === date,
      );

      if (existingGroup) {
        existingGroup.transactions.push(transaction);
      } else {
        groupedTransactions.push({
          date,
          dateMillis: transaction.timestamp,
          transactions: [transaction],
        });
      }
    });

    groupedTransactions.sort((a, b) => b.dateMillis - a.dateMillis);

    return groupedTransactions;
  };

  if (!isEvmAccountType(selectedAccount.type)) {
    const addressLink = getMultichainAccountUrl(
      selectedAccount.address,
      multichainNetwork,
    );

    const metricsLocation = 'Activity Tab';
    return (
      <Box className="transaction-list" {...boxProps}>
        <Box className="transaction-list__transactions">
          {nonEvmTransactions.data.length > 0 ? (
            <Box className="transaction-list__completed-transactions">
              {groupNonEvmTransactionsByDate(nonEvmTransactions).map(
                (dateGroup) => (
                  <Fragment key={dateGroup.date}>
                    <Text
                      paddingTop={4}
                      paddingInline={4}
                      variant={TextVariant.bodyMd}
                      color={TextColor.textDefault}
                    >
                      {dateGroup.date}
                    </Text>
                    {dateGroup.transactions.map((transaction, index) => (
                      <ActivityListItem
                        key={`${transaction.account}:${index}`}
                        className="custom-class"
                        data-testid="activity-list-item"
                        icon={
                          <BadgeWrapper
                            anchorElementShape="circular"
                            badge={
                              <AvatarNetwork
                                borderColor="background-default"
                                borderWidth={1}
                                className="activity-tx__network-badge"
                                data-testid="activity-tx-network-badge"
                                name="Solana"
                                size="xs"
                                src="./images/solana-logo.svg"
                              />
                            }
                            display="block"
                            positionObj={{ right: -4, top: -4 }}
                          >
                            <TransactionIcon
                              category={transaction.type}
                              status={transaction.status}
                            />
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
                              {`${transaction.from[0]?.asset?.amount} ${transaction.from[0]?.asset?.unit}`}
                            </Text>
                          </>
                        }
                        subtitle={
                          <TransactionStatusLabel
                            date={formatDateWithYearContext(
                              transaction.timestamp,
                              'MMM d, y',
                              'MMM d',
                            )}
                            error={{}}
                            status={transaction.status}
                            statusOnly
                          />
                        }
                        title={capitalize(transaction.type)}
                      ></ActivityListItem>
                    ))}
                  </Fragment>
                ),
              )}
              <Box className="transaction-list__view-on-block-explorer">
                <Button
                  display={Display.Flex}
                  variant={ButtonVariant.Primary}
                  size={ButtonSize.Sm}
                  endIconName={IconName.Export}
                  onClick={() =>
                    openBlockExplorer(addressLink, metricsLocation, trackEvent)
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
                              />
                            ) : (
                              <TransactionListItem
                                transactionGroup={transactionGroup}
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

TransactionList.propTypes = {
  hideTokenTransactions: PropTypes.bool,
  tokenAddress: PropTypes.string,
  boxProps: PropTypes.object,
  tokenChainId: PropTypes.string,
};

TransactionList.defaultProps = {
  hideTokenTransactions: false,
  tokenAddress: undefined,
  boxProps: undefined,
  tokenChainId: null,
};

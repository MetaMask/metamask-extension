import React, {
  useMemo,
  useState,
  useCallback,
  Fragment,
  useContext,
  useEffect,
} from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { TransactionType } from '@metamask/transaction-controller';
import {
  nonceSortedCompletedTransactionsSelector,
  nonceSortedPendingTransactionsSelector,
} from '../../../selectors/transactions';
import {
  getCurrentChainId,
  getNetworkConfigurationsByChainId,
} from '../../../../shared/modules/selectors/networks';
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
  ButtonSize,
  ButtonVariant,
  IconName,
  Text,
} from '../../component-library';
import {
  Display,
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
import { isSelectedInternalAccountBtc } from '../../../selectors/accounts';
import { openBlockExplorer } from '../../multichain/menu-items/view-explorer-menu-item';
import { getMultichainAccountUrl } from '../../../helpers/utils/multichain/blockExplorer';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { useMultichainSelector } from '../../../hooks/useMultichainSelector';
import { getMultichainNetwork } from '../../../selectors/multichain';
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
  tokenChainId,
}) {
  const [limit, setLimit] = useState(PAGE_INCREMENT);
  const t = useI18nContext();

  const unfilteredPendingTransactions = useSelector(
    nonceSortedPendingTransactionsSelector,
  );
  const unfilteredCompletedTransactions = useSelector(
    nonceSortedCompletedTransactionsSelector,
  );
  const chainId = useSelector(getCurrentChainId);
  const networkConfigurationsByChainId = useSelector(
    getNetworkConfigurationsByChainId,
  );
  const networkName = networkConfigurationsByChainId[tokenChainId]?.name;
  const selectedAccount = useSelector(getSelectedAccount);
  const isChainIdMismatch = tokenChainId && tokenChainId !== chainId;

  const noTransactionsMessage = networkName
    ? t('noTransactionsNetworkName', [networkName])
    : t('noTransactionsChainIdMismatch');

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

  // Check if the current account is a bitcoin account
  const isBitcoinAccount = useSelector(isSelectedInternalAccountBtc);
  const trackEvent = useContext(MetaMetricsContext);

  useEffect(() => {
    endTrace({ name: TraceName.AccountOverviewActivityTab });
  }, []);

  const multichainNetwork = useMultichainSelector(
    getMultichainNetwork,
    selectedAccount,
  );
  if (isBitcoinAccount) {
    const addressLink = getMultichainAccountUrl(
      selectedAccount.address,
      multichainNetwork,
    );
    const metricsLocation = 'Activity Tab';
    return (
      <Box className="transaction-list" {...boxProps}>
        <Box className="transaction-list__empty-text">
          {t('bitcoinActivityNotSupported')}
        </Box>
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
    );
  }

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
            {completedTransactions.length > 0 ? (
              completedTransactions
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
            ) : (
              <Box className="transaction-list__empty">
                <Box className="transaction-list__empty-text">
                  {isChainIdMismatch
                    ? noTransactionsMessage
                    : t('noTransactions')}
                </Box>
              </Box>
            )}
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

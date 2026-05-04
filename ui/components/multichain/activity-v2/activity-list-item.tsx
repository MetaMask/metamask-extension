import React from 'react';
import { useSelector } from 'react-redux';
import { Box, Text, TextVariant } from '@metamask/design-system-react';
import { TransactionStatus } from '@metamask/transaction-controller';
import TransactionStatusLabel from '../../app/transaction-status-label/transaction-status-label';
import { useFormatters } from '../../../hooks/useFormatters';
import type { TransactionViewModel } from '../../../../shared/lib/multichain/types';
import { getCurrentCurrency } from '../../../ducks/metamask/metamask';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useBridgeActivityData } from '../../../hooks/bridge/useBridgeActivityData';
import { selectTransactionByHash } from '../../../selectors/transactionController';
import { ChainBadge } from '../../app/chain-badge/chain-badge';
import { getPrimaryAmount } from './helpers';
import { useGetTitle, useFiatAmount } from './hooks';
import { ActivityTxIcon } from './activity-tx-icon';

// DelegationFramework caveat enforcers revert with `Error(string)` messages of
// the form `<EnforcerName>:<reason>` (Solidity convention). Detect any such
// message generically rather than hard-coding the list of enforcer names.
const CAVEAT_ENFORCER_REVERT_PATTERN = /^[A-Z][A-Za-z0-9]*Enforcer:/u;

type Props = {
  transaction: TransactionViewModel;
  onClick?: () => void;
};

export const ActivityListItem = ({ transaction, onClick }: Props) => {
  const t = useI18nContext();
  const { formatTokenAmount, formatCurrencyWithMinThreshold } = useFormatters();
  const currentCurrency = useSelector(getCurrentCurrency);
  const title = useGetTitle(transaction);
  const { amount, token } = getPrimaryAmount(transaction.amounts ?? {});
  const fiatAmount = useFiatAmount(amount, token);
  const { chainId, status } = transaction;

  const { isBridgeFailed, showBridgeTxDetails } = useBridgeActivityData({
    transaction,
  });

  const transactionStatus =
    status === TransactionStatus.failed ||
    // Show local bridge tx status if it's available
    (showBridgeTxDetails && isBridgeFailed)
      ? TransactionStatus.failed
      : TransactionStatus.confirmed;

  const localTransactionMeta = useSelector((state) =>
    selectTransactionByHash(state, transaction.hash),
  );

  const receiptRevertMessage = localTransactionMeta?.revert?.receipt?.message;
  const isProtectedByEnforcedSimulations =
    transactionStatus === TransactionStatus.failed &&
    typeof receiptRevertMessage === 'string' &&
    CAVEAT_ENFORCER_REVERT_PATTERN.test(receiptRevertMessage);

  const failureMessage =
    transactionStatus === TransactionStatus.failed
      ? localTransactionMeta?.error?.message ?? receiptRevertMessage
      : undefined;
  const failureError = failureMessage ? { message: failureMessage } : undefined;

  return (
    <Box
      className="px-4 py-3 bg-background-default cursor-pointer hover:bg-hover activity-list-item"
      onClick={onClick}
      data-testid="activity-list-item"
    >
      <div className="flex gap-4 items-center">
        <div className="flex-shrink-0">
          <ChainBadge chainId={chainId}>
            <ActivityTxIcon transaction={transaction} />
          </ChainBadge>
        </div>

        {/* Left side - Action and Details */}
        <div className="flex-1 min-w-0">
          <Text
            className="font-medium truncate"
            data-testid="activity-list-item-action"
          >
            {title}
          </Text>
          <div className="text-s-body-sm font-medium">
            {isProtectedByEnforcedSimulations ? (
              <Text
                className="text-success-default"
                data-testid="activity-list-item-protected-status"
              >
                {t('cancelled')}
              </Text>
            ) : (
              <TransactionStatusLabel
                status={transactionStatus}
                error={failureError}
                statusOnly
              />
            )}
          </div>
        </div>

        {/* Right side - Value */}
        <div className="flex flex-col items-end">
          {amount && token && (
            <Text
              className="font-medium"
              data-testid="transaction-list-item-primary-currency"
            >
              {formatTokenAmount(amount, token.symbol)}
            </Text>
          )}
          {fiatAmount !== undefined && (
            <Text
              variant={TextVariant.BodySm}
              className="text-text-alternative"
            >
              {formatCurrencyWithMinThreshold(fiatAmount, currentCurrency)}
            </Text>
          )}
        </div>
      </div>
    </Box>
  );
};

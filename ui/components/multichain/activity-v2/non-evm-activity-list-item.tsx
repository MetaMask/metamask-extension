import React from 'react';
import type { Transaction } from '@metamask/keyring-api';
import { TransactionType as KeyringTransactionType } from '@metamask/keyring-api';
import { useSelector } from 'react-redux';
import {
  BackgroundColor,
  Display,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import {
  useMultichainTransactionDisplay,
  KEYRING_TRANSACTION_STATUS_KEY,
} from '../../../hooks/useMultichainTransactionDisplay';
import { TransactionGroupCategory } from '../../../../shared/constants/transaction';
import { MULTICHAIN_TOKEN_IMAGE_MAP } from '../../../../shared/constants/multichain/networks';
import TransactionIcon from '../../app/transaction-icon/transaction-icon';
import TransactionStatusLabel from '../../app/transaction-status-label/transaction-status-label';
import { formatTimestamp } from '../../app/multichain-transaction-details-modal/helpers';
import { ActivityListItem as LegacyActivityListItem } from '../activity-list-item';
import {
  BadgeWrapper,
  AvatarNetwork,
  AvatarNetworkSize,
  Text,
} from '../../component-library';
import { getSelectedMultichainNetworkConfiguration } from '../../../selectors/multichain/networks';

type Props = {
  transaction: Transaction;
  onClick: () => void;
};

export const NonEvmActivityListItem = ({ transaction, onClick }: Props) => {
  const networkConfig = useSelector(getSelectedMultichainNetworkConfiguration);
  const { from, to, type, timestamp, isRedeposit, title } =
    useMultichainTransactionDisplay(transaction, networkConfig);
  const networkLogo = MULTICHAIN_TOKEN_IMAGE_MAP[transaction.chain];
  const statusKey = KEYRING_TRANSACTION_STATUS_KEY[transaction.status];

  if (isRedeposit) {
    return (
      <LegacyActivityListItem
        data-testid="activity-list-item"
        onClick={onClick}
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
              />
            }
          >
            <TransactionIcon
              category={TransactionGroupCategory.redeposit}
              status={statusKey}
            />
          </BadgeWrapper>
        }
        title="Redeposit"
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
    amount = from?.amount;
    unit = from?.unit;
  }

  if (type === KeyringTransactionType.Unknown) {
    category = TransactionGroupCategory.interaction;
  }

  return (
    <LegacyActivityListItem
      data-testid="activity-list-item"
      onClick={onClick}
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
              borderWidth={2}
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

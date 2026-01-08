import React from 'react';
import { NotificationServicesController } from '@metamask/notification-services-controller';
import { type ExtractedNotification, isOfTypeNodeGuard } from '../node-guard';
import {
  NotificationComponentType,
  type NotificationComponent,
} from '../types/notifications/notifications';
import { NotificationListItemIconType } from '../../../../components/multichain/notification-list-item-icon/notification-list-item-icon';

import {
  NotificationDetailAsset,
  NotificationListItem,
  NotificationDetailInfo,
  NotificationDetailBlockExplorerButton,
  NotificationDetailCopyButton,
  NotificationDetailTitle,
  NotificationDetailAddress,
} from '../../../../components/multichain';
import {
  createTextItems,
  getAmount,
  formatIsoDateString,
  getNetworkDetailsByChainId,
  getUsdAmount,
} from '../../../../helpers/utils/notification.util';
import { t } from '../../../../../shared/lib/translate';
import {
  TextVariant,
  BackgroundColor,
  TextColor,
} from '../../../../helpers/constants/design-system';

import {
  BadgeWrapperPosition,
  IconName,
} from '../../../../components/component-library';

const { TRIGGER_TYPES } = NotificationServicesController.Constants;

type LidoWithdrawalRequestedNotification =
  ExtractedNotification<NotificationServicesController.Constants.TRIGGER_TYPES.LIDO_WITHDRAWAL_REQUESTED>;
const isLidoWithdrawalRequestedNotification = isOfTypeNodeGuard([
  TRIGGER_TYPES.LIDO_WITHDRAWAL_REQUESTED,
]);

const getTitle = () => {
  const items = createTextItems(
    [t('notificationItemUnStakingRequested') ?? ''],
    TextVariant.bodySm,
  );
  return items;
};

const getDescription = (n: LidoWithdrawalRequestedNotification) => {
  const amount = getAmount(
    n.payload.data.stake_in.amount,
    n.payload.data.stake_in.decimals,
    {
      shouldEllipse: true,
    },
  );
  const description =
    t(
      'notificationItemLidoWithdrawalRequestedMessage',
      `${amount} ${n.payload.data.stake_in.symbol}`,
    ) ?? '';
  const items = createTextItems([description], TextVariant.bodyMd);
  return items;
};

export const components: NotificationComponent<LidoWithdrawalRequestedNotification> =
  {
    guardFn: isLidoWithdrawalRequestedNotification,
    item: ({ notification, onClick }) => {
      return (
        <NotificationListItem
          id={notification.id}
          isRead={notification.isRead}
          icon={{
            type: NotificationListItemIconType.Token,
            value: notification.payload.data.stake_in.image,
            badge: {
              icon: IconName.Stake,
              position: BadgeWrapperPosition.bottomRight,
            },
          }}
          title={getTitle()}
          description={getDescription(notification)}
          createdAt={new Date(notification.createdAt)}
          amount={`${getAmount(
            notification.payload.data.stake_in.amount,
            notification.payload.data.stake_in.decimals,
            { shouldEllipse: true },
          )} ${notification.payload.data.stake_in.symbol}`}
          onClick={onClick}
        />
      );
    },
    details: {
      title: ({ notification }) => {
        return (
          <NotificationDetailTitle
            title={t('notificationItemUnStakingRequested') ?? ''}
            date={formatIsoDateString(notification.createdAt)}
          />
        );
      },
      body: {
        type: NotificationComponentType.OnChainBody,
        Account: ({ notification }) => {
          if (!notification.payload.address) {
            return null;
          }
          return (
            <NotificationDetailAddress
              side={t('account') ?? ''}
              address={notification.payload.address}
            />
          );
        },
        Status: ({ notification }) => (
          <NotificationDetailInfo
            icon={{
              iconName: IconName.Check,
              color: TextColor.successDefault,
              backgroundColor: BackgroundColor.successMuted,
            }}
            label={t('notificationItemStatus') ?? ''}
            detail={t('notificationItemConfirmed') ?? ''}
            action={
              <NotificationDetailCopyButton
                notification={notification}
                text={notification.payload.tx_hash}
                displayText={t('notificationItemTransactionId') ?? ''}
              />
            }
          />
        ),
        Asset: ({ notification }) => {
          const { nativeCurrencyLogo } = getNetworkDetailsByChainId(
            notification.payload.chain_id,
          );
          return (
            <NotificationDetailAsset
              icon={{
                src: notification.payload.data.stake_in.image,
                badge: {
                  src: nativeCurrencyLogo,
                  position: BadgeWrapperPosition.topRight,
                },
              }}
              label={t('notificationItemUnStakingRequested') ?? ''}
              detail={notification.payload.data.stake_in.symbol}
              fiatValue={`$${getUsdAmount(
                notification.payload.data.stake_in.amount,
                notification.payload.data.stake_in.decimals,
                notification.payload.data.stake_in.usd,
              )}`}
              value={`${getAmount(
                notification.payload.data.stake_in.amount,
                notification.payload.data.stake_in.decimals,
                { shouldEllipse: true },
              )} ${notification.payload.data.stake_in.symbol}`}
            />
          );
        },
        AssetReceived: ({ notification }) => {
          const { nativeCurrencyLogo } = getNetworkDetailsByChainId(
            notification.payload.chain_id,
          );
          return (
            <NotificationDetailAsset
              icon={{
                src: notification.payload.data.stake_in.image,
                badge: {
                  src: nativeCurrencyLogo,
                  position: BadgeWrapperPosition.topRight,
                },
              }}
              label={t('notificationItemStakingProvider') ?? ''}
              detail="Lido-staked ETH"
            />
          );
        },
      },
      footer: {
        type: NotificationComponentType.OnChainFooter,
        ScanLink: ({ notification }) => {
          return (
            <NotificationDetailBlockExplorerButton
              notification={notification}
              chainId={notification.payload.chain_id}
              txHash={notification.payload.tx_hash}
            />
          );
        },
      },
    },
  };

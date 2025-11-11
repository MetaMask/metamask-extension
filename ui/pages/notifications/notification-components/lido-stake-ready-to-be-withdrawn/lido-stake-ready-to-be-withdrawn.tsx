import React from 'react';
import { NotificationServicesController } from '@metamask/notification-services-controller';
import { type ExtractedNotification, isOfTypeNodeGuard } from '../node-guard';
import {
  NotificationComponentType,
  type NotificationComponent,
} from '../types/notifications/notifications';
import {
  NotificationListItem,
  NotificationDetailInfo,
  NotificationDetailTitle,
  NotificationDetailAsset,
  NotificationDetailBlockExplorerButton,
  NotificationDetailAddress,
} from '../../../../components/multichain';
import { t } from '../../../../../shared/lib/translate';
import {
  createTextItems,
  formatAmount,
  formatIsoDateString,
  getNetworkDetailsByChainId,
} from '../../../../helpers/utils/notification.util';
import {
  TextVariant,
  BackgroundColor,
  TextColor,
} from '../../../../helpers/constants/design-system';
import { NotificationListItemIconType } from '../../../../components/multichain/notification-list-item-icon/notification-list-item-icon';
import {
  BadgeWrapperPosition,
  IconName,
} from '../../../../components/component-library';

const { TRIGGER_TYPES } = NotificationServicesController.Constants;

type LidoReadyWithDrawnNotification =
  ExtractedNotification<NotificationServicesController.Constants.TRIGGER_TYPES.LIDO_STAKE_READY_TO_BE_WITHDRAWN>;
const isLidoReadyWithDrawnNotification = isOfTypeNodeGuard([
  TRIGGER_TYPES.LIDO_STAKE_READY_TO_BE_WITHDRAWN,
]);

const getDescription = (n: LidoReadyWithDrawnNotification) => {
  const amount = formatAmount(parseFloat(n.payload.data.staked_eth.amount), {
    shouldEllipse: true,
  });
  const description =
    t(
      'notificationItemLidoStakeReadyToBeWithdrawnMessage',
      `${amount} ${n.payload.data.staked_eth.symbol}`,
    ) ?? '';
  const items = createTextItems([description], TextVariant.bodyMd);
  return items;
};

const getTitle = () => {
  const items = createTextItems(
    [t('notificationItemLidoStakeReadyToBeWithdrawn') ?? ''],
    TextVariant.bodySm,
  );
  return items;
};

export const components: NotificationComponent<LidoReadyWithDrawnNotification> =
  {
    guardFn: isLidoReadyWithDrawnNotification,
    item: ({ notification, onClick }) => {
      return (
        <NotificationListItem
          id={notification.id}
          isRead={notification.isRead}
          icon={{
            type: NotificationListItemIconType.Token,
            value: notification.payload.data.staked_eth.image,
            badge: {
              icon: IconName.Stake,
              position: BadgeWrapperPosition.bottomRight,
            },
          }}
          title={getTitle()}
          description={getDescription(notification)}
          createdAt={new Date(notification.createdAt)}
          onClick={onClick}
        />
      );
    },
    details: {
      title: ({ notification }) => (
        <NotificationDetailTitle
          title={t('notificationItemLidoStakeReadyToBeWithdrawn') ?? ''}
          date={formatIsoDateString(notification.createdAt)}
        />
      ),
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
        Status: () => (
          <NotificationDetailInfo
            icon={{
              iconName: IconName.Check,
              color: TextColor.successDefault,
              backgroundColor: BackgroundColor.successMuted,
            }}
            label={t('notificationItemStatus') ?? ''}
            detail={t('notificationItemConfirmed') ?? ''}
          />
        ),
        Asset: ({ notification }) => {
          const { nativeCurrencyLogo } = getNetworkDetailsByChainId(
            notification.payload.chain_id,
          );
          return (
            <NotificationDetailAsset
              icon={{
                src: notification.payload.data.staked_eth.image,
                badge: {
                  src: nativeCurrencyLogo,
                  position: BadgeWrapperPosition.topRight,
                },
              }}
              label={t('notificationItemLidoStakeReadyToBeWithdrawn') ?? ''}
              detail={notification.payload.data.staked_eth.symbol}
              fiatValue={`$${formatAmount(
                parseFloat(notification.payload.data.staked_eth.usd),
                { shouldEllipse: true },
              )}`}
              value={`${formatAmount(
                parseFloat(notification.payload.data.staked_eth.amount),
                { shouldEllipse: true },
              )} ${notification.payload.data.staked_eth.symbol}`}
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
                src: notification.payload.data.staked_eth.image,
                badge: {
                  src: nativeCurrencyLogo,
                  position: BadgeWrapperPosition.topRight,
                },
              }}
              label={t('notificationItemStakingProvider') ?? ''}
              detail={notification.payload.data.staked_eth.symbol}
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

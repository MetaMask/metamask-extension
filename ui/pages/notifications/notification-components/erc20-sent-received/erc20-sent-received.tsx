import React from 'react';
import { NotificationServicesController } from '@metamask/notification-services-controller';
import { t } from '../../../../../shared/lib/translate';
import { type ExtractedNotification, isOfTypeNodeGuard } from '../node-guard';
import {
  NotificationComponentType,
  type NotificationComponent,
} from '../types/notifications/notifications';
import { NotificationListItemIconType } from '../../../../components/multichain/notification-list-item-icon/notification-list-item-icon';

import { shortenAddress } from '../../../../helpers/utils/util';
import {
  createTextItems,
  getAmount,
  getUsdAmount,
  formatIsoDateString,
  getNetworkDetailsByChainId,
} from '../../../../helpers/utils/notification.util';

import {
  NotificationListItem,
  NotificationDetailTitle,
  NotificationDetailBlockExplorerButton,
  NotificationDetailAddress,
  NotificationDetailInfo,
  NotificationDetailCopyButton,
  NotificationDetailAsset,
  NotificationDetailNetworkFee,
} from '../../../../components/multichain';
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

type ERC20Notification = ExtractedNotification<
  | NotificationServicesController.Constants.TRIGGER_TYPES.ERC20_RECEIVED
  | NotificationServicesController.Constants.TRIGGER_TYPES.ERC20_SENT
>;

const isERC20Notification = isOfTypeNodeGuard([
  TRIGGER_TYPES.ERC20_RECEIVED,
  TRIGGER_TYPES.ERC20_SENT,
]);

const isSent = (n: ERC20Notification) => n.type === TRIGGER_TYPES.ERC20_SENT;

/**
 * Validates that the notification has the required payload structure
 *
 * @param notification - The notification to validate
 * @returns true if the notification has valid payload data
 */
const hasValidPayload = (notification: ERC20Notification): boolean => {
  return Boolean(
    notification?.payload?.data?.token &&
      notification?.payload?.data?.from &&
      notification?.payload?.data?.to,
  );
};

const title = (n: ERC20Notification) =>
  isSent(n) ? t('notificationItemSentTo') : t('notificationItemReceivedFrom');

const getTitle = (n: ERC20Notification) => {
  if (!hasValidPayload(n)) {
    return createTextItems(
      [t('notificationItemInvalid') ?? 'Invalid notification'],
      TextVariant.bodySm,
    );
  }
  const address = shortenAddress(
    isSent(n) ? n.payload.data.to : n.payload.data.from,
  );
  const items = createTextItems([title(n) ?? '', address], TextVariant.bodySm);
  return items;
};

const getDescription = (n: ERC20Notification) => {
  if (!hasValidPayload(n)) {
    return createTextItems([''], TextVariant.bodyMd);
  }
  const items = createTextItems(
    [n.payload.data.token.name],
    TextVariant.bodyMd,
  );
  return items;
};

export const components: NotificationComponent<ERC20Notification> = {
  guardFn: isERC20Notification,
  item: ({ notification, onClick }) => {
    // Validate notification payload before rendering
    if (!hasValidPayload(notification)) {
      // Return a minimal notification item for invalid payloads
      return (
        <NotificationListItem
          id={notification.id}
          isRead={notification.isRead}
          icon={{
            type: NotificationListItemIconType.Token,
            value: '',
          }}
          title={getTitle(notification)}
          description={getDescription(notification)}
          createdAt={new Date(notification.createdAt)}
          amount=""
          onClick={onClick}
        />
      );
    }

    return (
      <NotificationListItem
        id={notification.id}
        isRead={notification.isRead}
        icon={{
          type: NotificationListItemIconType.Token,
          value: notification.payload.data.token.image || '',
          badge: {
            icon: isSent(notification)
              ? IconName.Arrow2UpRight
              : IconName.Received,
            position: BadgeWrapperPosition.bottomRight,
          },
        }}
        title={getTitle(notification)}
        description={getDescription(notification)}
        createdAt={new Date(notification.createdAt)}
        amount={`${getAmount(
          notification.payload.data.token.amount,
          notification.payload.data.token.decimals,
          {
            shouldEllipse: true,
          },
        )} ${notification.payload.data.token.symbol}`}
        onClick={onClick}
      />
    );
  },
  details: {
    title: ({ notification }) => {
      const tokenSymbol = hasValidPayload(notification)
        ? notification.payload.data.token.symbol
        : '';
      return (
        <NotificationDetailTitle
          title={`${
            isSent(notification)
              ? t('notificationItemSent')
              : t('notificationItemReceived')
          } ${tokenSymbol}`}
          date={formatIsoDateString(notification.createdAt)}
        />
      );
    },
    body: {
      type: NotificationComponentType.OnChainBody,
      From: ({ notification }) => {
        if (!hasValidPayload(notification)) {
          return null;
        }
        return (
          <NotificationDetailAddress
            side={`${t('notificationItemFrom')}${
              isSent(notification) ? ` (${t('you')})` : ''
            }`}
            address={notification.payload.data.from}
          />
        );
      },
      To: ({ notification }) => {
        if (!hasValidPayload(notification)) {
          return null;
        }
        return (
          <NotificationDetailAddress
            side={`${t('notificationItemTo')}${
              isSent(notification) ? '' : ` (${t('you')})`
            }`}
            address={notification.payload.data.to}
          />
        );
      },
      Status: ({ notification }) => {
        if (!hasValidPayload(notification)) {
          return null;
        }
        const txHash = notification.payload?.tx_hash || '';
        return (
          <NotificationDetailInfo
            icon={{
              iconName: IconName.Check,
              color: TextColor.successDefault,
              backgroundColor: BackgroundColor.successMuted,
            }}
            label={t('notificationItemStatus') ?? ''}
            detail={t('notificationItemConfirmed') ?? ''}
            action={
              txHash ? (
                <NotificationDetailCopyButton
                  notification={notification}
                  text={txHash}
                  displayText={t('notificationItemTransactionId') ?? ''}
                />
              ) : null
            }
          />
        );
      },
      Asset: ({ notification }) => {
        if (!hasValidPayload(notification)) {
          return null;
        }
        const chainId = notification.payload?.chain_id;
        if (!chainId) {
          return null;
        }
        const { nativeCurrencyLogo } = getNetworkDetailsByChainId(chainId);
        return (
          <NotificationDetailAsset
            icon={{
              src: notification.payload.data.token.image || '',
              badge: {
                src: nativeCurrencyLogo,
                position: BadgeWrapperPosition.topRight,
              },
            }}
            label={t('asset') ?? ''}
            detail={notification.payload.data.token.symbol}
            fiatValue={`$${getUsdAmount(
              notification.payload.data.token.amount,
              notification.payload.data.token.decimals,
              notification.payload.data.token.usd,
            )}`}
            value={`${getAmount(
              notification.payload.data.token.amount,
              notification.payload.data.token.decimals,
              {
                shouldEllipse: true,
              },
            )} ${notification.payload.data.token.symbol}`}
          />
        );
      },
      Network: ({ notification }) => {
        const chainId = notification.payload?.chain_id;
        if (!chainId) {
          return null;
        }
        const { nativeCurrencyLogo, nativeCurrencyName } =
          getNetworkDetailsByChainId(chainId);

        return (
          <NotificationDetailAsset
            icon={{
              src: nativeCurrencyLogo,
            }}
            label={t('notificationDetailNetwork') ?? ''}
            detail={nativeCurrencyName}
          />
        );
      },
      NetworkFee: ({ notification }) => {
        if (!hasValidPayload(notification)) {
          return null;
        }
        return <NotificationDetailNetworkFee notification={notification} />;
      },
    },
    footer: {
      type: NotificationComponentType.OnChainFooter,
      ScanLink: ({ notification }) => {
        const chainId = notification.payload?.chain_id;
        const txHash = notification.payload?.tx_hash;
        if (!chainId || !txHash) {
          return null;
        }
        return (
          <NotificationDetailBlockExplorerButton
            notification={notification}
            chainId={chainId}
            txHash={txHash}
          />
        );
      },
    },
  },
};

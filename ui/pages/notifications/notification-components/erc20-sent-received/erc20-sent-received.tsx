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

const title = (n: ERC20Notification) =>
  isSent(n) ? t('notificationItemSentTo') : t('notificationItemReceivedFrom');

const getTitle = (n: ERC20Notification) => {
  const address = shortenAddress(
    isSent(n) ? n.payload.data.to : n.payload.data.from,
  );
  const items = createTextItems([title(n) ?? '', address], TextVariant.bodySm);
  return items;
};

const getDescription = (n: ERC20Notification) => {
  const items = createTextItems(
    [n.payload.data.token.name],
    TextVariant.bodyMd,
  );
  return items;
};

export const components: NotificationComponent<ERC20Notification> = {
  guardFn: isERC20Notification,
  item: ({ notification, onClick }) => (
    <NotificationListItem
      id={notification.id}
      isRead={notification.isRead}
      icon={{
        type: NotificationListItemIconType.Token,
        value: notification.payload.data.token.image,
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
  ),
  details: {
    title: ({ notification }) => (
      <NotificationDetailTitle
        title={`${
          isSent(notification)
            ? t('notificationItemSent')
            : t('notificationItemReceived')
        } ${notification.payload.data.token.symbol}`}
        date={formatIsoDateString(notification.createdAt)}
      />
    ),
    body: {
      type: NotificationComponentType.OnChainBody,
      From: ({ notification }) => (
        <NotificationDetailAddress
          side={`${t('notificationItemFrom')}${
            isSent(notification) ? ` (${t('you')})` : ''
          }`}
          address={notification.payload.data.from}
        />
      ),
      To: ({ notification }) => (
        <NotificationDetailAddress
          side={`${t('notificationItemTo')}${
            isSent(notification) ? '' : ` (${t('you')})`
          }`}
          address={notification.payload.data.to}
        />
      ),
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
              src: notification.payload.data.token.image,
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
        const { nativeCurrencyLogo, nativeCurrencyName } =
          getNetworkDetailsByChainId(notification.payload.chain_id);

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
        return <NotificationDetailNetworkFee notification={notification} />;
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

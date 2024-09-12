import React from 'react';
import { NotificationServicesController } from '@metamask/notification-services-controller';
import { t } from '../../../../../app/scripts/translate';
import { CHAIN_IDS } from '../../../../../shared/constants/network';
import { type ExtractedNotification, isOfTypeNodeGuard } from '../node-guard';
import type { NotificationComponent } from '../types/notifications/notifications';
import { NotificationListItemIconType } from '../../../../components/multichain/notification-list-item-icon/notification-list-item-icon';

import { shortenAddress } from '../../../../helpers/utils/util';
import { decimalToHex } from '../../../../../shared/modules/conversion.utils';
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
  const address = shortenAddress(isSent(n) ? n.data.to : n.data.from);
  const items = createTextItems([title(n) || '', address], TextVariant.bodySm);
  return items;
};

const getDescription = (n: ERC20Notification) => {
  const items = createTextItems([n.data.token.name], TextVariant.bodyMd);
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
        value: notification.data.token.image,
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
        notification.data.token.amount,
        notification.data.token.decimals,
        {
          shouldEllipse: true,
        },
      )} ${notification.data.token.symbol}`}
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
        } ${notification.data.token.symbol}`}
        date={formatIsoDateString(notification.createdAt)}
      />
    ),
    body: {
      type: 'body_onchain_notification',
      From: ({ notification }) => (
        <NotificationDetailAddress
          side={`${t('notificationItemFrom')}${
            isSent(notification) ? ` (${t('you')})` : ''
          }`}
          address={notification.data.from}
        />
      ),
      To: ({ notification }) => (
        <NotificationDetailAddress
          side={`${t('notificationItemTo')}${
            isSent(notification) ? '' : ` (${t('you')})`
          }`}
          address={notification.data.to}
        />
      ),
      Status: ({ notification }) => (
        <NotificationDetailInfo
          icon={{
            iconName: IconName.Check,
            color: TextColor.successDefault,
            backgroundColor: BackgroundColor.successMuted,
          }}
          label={t('notificationItemStatus') || ''}
          detail={t('notificationItemConfirmed') || ''}
          action={
            <NotificationDetailCopyButton
              notification={notification}
              text={notification.tx_hash}
              displayText={t('notificationItemTransactionId') || ''}
            />
          }
        />
      ),
      Asset: ({ notification }) => {
        const chainId = decimalToHex(notification.chain_id);
        const { nativeCurrencyLogo } = getNetworkDetailsByChainId(
          `0x${chainId}` as keyof typeof CHAIN_IDS,
        );
        return (
          <NotificationDetailAsset
            icon={{
              src: notification.data.token.image,
              badge: {
                src: nativeCurrencyLogo,
                position: BadgeWrapperPosition.topRight,
              },
            }}
            label={t('asset') || ''}
            detail={notification.data.token.symbol}
            fiatValue={`$${getUsdAmount(
              notification.data.token.amount,
              notification.data.token.decimals,
              notification.data.token.usd,
            )}`}
            value={`${getAmount(
              notification.data.token.amount,
              notification.data.token.decimals,
              {
                shouldEllipse: true,
              },
            )} ${notification.data.token.symbol}`}
          />
        );
      },
      Network: ({ notification }) => {
        const chainId = decimalToHex(notification.chain_id);
        const { nativeCurrencyLogo, nativeCurrencyName } =
          getNetworkDetailsByChainId(`0x${chainId}` as keyof typeof CHAIN_IDS);

        return (
          <NotificationDetailAsset
            icon={{
              src: nativeCurrencyLogo,
            }}
            label={t('notificationDetailNetwork') || ''}
            detail={nativeCurrencyName}
          />
        );
      },
      NetworkFee: ({ notification }) => {
        return <NotificationDetailNetworkFee notification={notification} />;
      },
    },
  },
  footer: {
    type: 'footer_onchain_notification',
    ScanLink: ({ notification }) => {
      return (
        <NotificationDetailBlockExplorerButton
          notification={notification}
          chainId={notification.chain_id}
          txHash={notification.tx_hash}
          id={notification.id}
        />
      );
    },
  },
};

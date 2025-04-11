import { NotificationServicesController } from '@metamask/notification-services-controller';
// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import React from 'react';

// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { t } from '../../../../../app/scripts/translate';
import type { CHAIN_IDS } from '../../../../../shared/constants/network';
import { decimalToHex } from '../../../../../shared/modules/conversion.utils';
import {
  BadgeWrapperPosition,
  IconName,
} from '../../../../components/component-library';
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
import { NotificationListItemIconType } from '../../../../components/multichain/notification-list-item-icon/notification-list-item-icon';
import {
  TextVariant,
  BackgroundColor,
  TextColor,
} from '../../../../helpers/constants/design-system';
import {
  createTextItems,
  getAmount,
  getUsdAmount,
  formatIsoDateString,
  getNetworkDetailsByChainId,
} from '../../../../helpers/utils/notification.util';
import { shortenAddress } from '../../../../helpers/utils/util';
import { type ExtractedNotification, isOfTypeNodeGuard } from '../node-guard';
import {
  NotificationComponentType,
  type NotificationComponent,
} from '../types/notifications/notifications';

const { TRIGGER_TYPES } = NotificationServicesController.Constants;

type ERC20Notification = ExtractedNotification<
  | NotificationServicesController.Constants.TRIGGER_TYPES.ERC20_RECEIVED
  | NotificationServicesController.Constants.TRIGGER_TYPES.ERC20_SENT
>;

const isERC20Notification = isOfTypeNodeGuard([
  TRIGGER_TYPES.ERC20_RECEIVED,
  TRIGGER_TYPES.ERC20_SENT,
]);

// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31887
// eslint-disable-next-line id-length
const isSent = (n: ERC20Notification) => n.type === TRIGGER_TYPES.ERC20_SENT;

// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31887
// eslint-disable-next-line id-length
const title = (n: ERC20Notification) =>
  isSent(n) ? t('notificationItemSentTo') : t('notificationItemReceivedFrom');

// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31887
// eslint-disable-next-line id-length
const getTitle = (n: ERC20Notification) => {
  const address = shortenAddress(isSent(n) ? n.data.to : n.data.from);
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31880
  const items = createTextItems([title(n) || '', address], TextVariant.bodySm);
  return items;
};

// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31887
// eslint-disable-next-line id-length
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
      type: NotificationComponentType.OnChainBody,
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
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31880
          label={t('notificationItemStatus') || ''}
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31880
          detail={t('notificationItemConfirmed') || ''}
          action={
            <NotificationDetailCopyButton
              notification={notification}
              text={notification.tx_hash}
              // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31880
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
            // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31880
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
            // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31880
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
    type: NotificationComponentType.OnChainFooter,
    ScanLink: ({ notification }) => {
      return (
        <NotificationDetailBlockExplorerButton
          notification={notification}
          chainId={notification.chain_id}
          txHash={notification.tx_hash}
        />
      );
    },
  },
};

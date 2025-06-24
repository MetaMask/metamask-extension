import React from 'react';
import { NotificationServicesController } from '@metamask/notification-services-controller';
import { t } from '../../../../../shared/lib/translate';
import { type ExtractedNotification, isOfTypeNodeGuard } from '../node-guard';
import {
  NotificationComponentType,
  type NotificationComponent,
} from '../types/notifications/notifications';
import { shortenAddress } from '../../../../helpers/utils/util';
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
  BadgeWrapperPosition,
  IconName,
} from '../../../../components/component-library';

const { TRIGGER_TYPES } = NotificationServicesController.Constants;

type ETHNotification = ExtractedNotification<
  | NotificationServicesController.Constants.TRIGGER_TYPES.ETH_RECEIVED
  | NotificationServicesController.Constants.TRIGGER_TYPES.ETH_SENT
>;
const isETHNotification = isOfTypeNodeGuard([
  TRIGGER_TYPES.ETH_RECEIVED,
  TRIGGER_TYPES.ETH_SENT,
]);

const isSent = (n: ETHNotification) => n.type === TRIGGER_TYPES.ETH_SENT;

const title = (n: ETHNotification) =>
  isSent(n) ? t('notificationItemSentTo') : t('notificationItemReceivedFrom');

const getNativeCurrency = (n: ETHNotification) => {
  const nativeCurrency = getNetworkDetailsByChainId(n.chain_id);
  return nativeCurrency;
};

const getTitle = (n: ETHNotification) => {
  const address = shortenAddress(isSent(n) ? n.data.to : n.data.from);
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  const items = createTextItems([title(n) || '', address], TextVariant.bodySm);
  return items;
};

const getDescription = (n: ETHNotification) => {
  const { nativeCurrencySymbol } = getNativeCurrency(n);
  const items = createTextItems([nativeCurrencySymbol], TextVariant.bodyMd);
  return items;
};

export const components: NotificationComponent<ETHNotification> = {
  guardFn: isETHNotification,
  item: ({ notification, onClick }) => {
    const { nativeCurrencySymbol, nativeCurrencyLogo } =
      getNativeCurrency(notification);
    return (
      <NotificationListItem
        id={notification.id}
        isRead={notification.isRead}
        icon={{
          type: NotificationListItemIconType.Token,
          value: nativeCurrencyLogo,
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
        amount={`${formatAmount(parseFloat(notification.data.amount.eth), {
          shouldEllipse: true,
        })} ${nativeCurrencySymbol}`}
        onClick={onClick}
      />
    );
  },
  details: {
    title: ({ notification }) => {
      const { nativeCurrencySymbol } = getNetworkDetailsByChainId(
        notification.chain_id,
      );
      return (
        <NotificationDetailTitle
          title={`${
            isSent(notification)
              ? t('notificationItemSent')
              : t('notificationItemReceived')
          } ${nativeCurrencySymbol}`}
          date={formatIsoDateString(notification.createdAt)}
        />
      );
    },
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
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
          label={t('notificationItemStatus') || ''}
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
          detail={t('notificationItemConfirmed') || ''}
          action={
            <NotificationDetailCopyButton
              notification={notification}
              text={notification.tx_hash}
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
              // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
              displayText={t('notificationItemTransactionId') || ''}
            />
          }
        />
      ),
      Asset: ({ notification }) => {
        const { nativeCurrencyLogo, nativeCurrencySymbol } =
          getNetworkDetailsByChainId(notification.chain_id);
        return (
          <NotificationDetailAsset
            icon={{
              src: nativeCurrencyLogo,
              badge: {
                src: nativeCurrencyLogo,
                position: BadgeWrapperPosition.topRight,
              },
            }}
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
            // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
            label={t('asset') || ''}
            detail={nativeCurrencySymbol}
            fiatValue={`$${formatAmount(
              parseFloat(notification.data.amount.usd),
              {
                shouldEllipse: true,
              },
            )}`}
            value={`${formatAmount(parseFloat(notification.data.amount.eth), {
              shouldEllipse: true,
            })} ${nativeCurrencySymbol}`}
          />
        );
      },
      Network: ({ notification }) => {
        const { nativeCurrencyLogo, nativeCurrencyName } =
          getNetworkDetailsByChainId(notification.chain_id);

        return (
          <NotificationDetailAsset
            icon={{
              src: nativeCurrencyLogo,
            }}
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
            // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
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

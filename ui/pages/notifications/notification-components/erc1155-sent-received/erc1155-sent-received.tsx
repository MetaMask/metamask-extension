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
  NotificationDetailAddress,
  NotificationDetailInfo,
  NotificationDetailAsset,
  NotificationDetailNetworkFee,
  NotificationDetailBlockExplorerButton,
  NotificationDetailTitle,
  NotificationDetailCollection,
  NotificationDetailNft,
} from '../../../../components/multichain';
import { NotificationListItemIconType } from '../../../../components/multichain/notification-list-item-icon/notification-list-item-icon';
import {
  BadgeWrapperPosition,
  IconName,
} from '../../../../components/component-library';

const { TRIGGER_TYPES } = NotificationServicesController.Constants;

type ERC1155Notification = ExtractedNotification<
  | NotificationServicesController.Constants.TRIGGER_TYPES.ERC1155_RECEIVED
  | NotificationServicesController.Constants.TRIGGER_TYPES.ERC1155_SENT
>;
const isERC1155Notification = isOfTypeNodeGuard([
  TRIGGER_TYPES.ERC1155_RECEIVED,
  TRIGGER_TYPES.ERC1155_SENT,
]);

const isSent = (n: ERC1155Notification) =>
  n.type === TRIGGER_TYPES.ERC1155_SENT;
const title = (n: ERC1155Notification) =>
  isSent(n)
    ? t('notificationItemNFTSentTo')
    : t('notificationItemNFTReceivedFrom');

const getTitle = (n: ERC1155Notification) => {
  const address = shortenAddress(
    isSent(n) ? n.payload.data.to : n.payload.data.from,
  );
  const items = createTextItems([title(n) ?? '', address], TextVariant.bodySm);
  return items;
};

const getDescription = (n: ERC1155Notification) => {
  const items = createTextItems(
    [n.payload.data.nft?.collection.name ?? ''],
    TextVariant.bodyMd,
  );
  return items;
};

export const components: NotificationComponent<ERC1155Notification> = {
  guardFn: isERC1155Notification,
  item: ({ notification, onClick }) => (
    <NotificationListItem
      id={notification.id}
      isRead={notification.isRead}
      icon={{
        type: notification.payload.data.nft?.image
          ? NotificationListItemIconType.Nft
          : NotificationListItemIconType.Token,
        value: notification.payload.data.nft?.image || 'http://foo.com/bar.png',
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
      amount={notification.payload.data.nft?.token_id ?? ''}
      onClick={onClick}
    />
  ),
  details: {
    title: ({ notification }) => {
      return (
        <NotificationDetailTitle
          title={`${
            isSent(notification)
              ? t('notificationItemSent')
              : t('notificationItemReceived')
          } NFT`}
          date={formatIsoDateString(notification.createdAt)}
        />
      );
    },
    body: {
      type: NotificationComponentType.OnChainBody,
      Image: ({ notification }) => {
        const { nativeCurrencyLogo, nativeCurrencyName } =
          getNetworkDetailsByChainId(notification.payload.chain_id);
        return (
          <NotificationDetailNft
            networkSrc={nativeCurrencyLogo}
            tokenId={notification.payload.data.nft?.token_id ?? ''}
            tokenName={notification.payload.data.nft?.name ?? ''}
            tokenSrc={notification.payload.data.nft?.image ?? ''}
            networkName={nativeCurrencyName}
          />
        );
      },
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
          <NotificationDetailCollection
            icon={{
              src: notification.payload.data.nft?.image ?? '',
              badgeSrc: nativeCurrencyLogo,
            }}
            label={t('notificationItemCollection') ?? ''}
            collection={`${notification.payload.data.nft?.collection.name} (${notification.payload.data.nft?.token_id})`}
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

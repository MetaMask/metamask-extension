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
  NotificationDetailNft,
  NotificationDetailCollection,
} from '../../../../components/multichain';
import { NotificationListItemIconType } from '../../../../components/multichain/notification-list-item-icon/notification-list-item-icon';
import {
  BadgeWrapperPosition,
  IconName,
} from '../../../../components/component-library';

const { TRIGGER_TYPES } = NotificationServicesController.Constants;

type ERC721Notification = ExtractedNotification<
  | NotificationServicesController.Constants.TRIGGER_TYPES.ERC721_RECEIVED
  | NotificationServicesController.Constants.TRIGGER_TYPES.ERC721_SENT
>;
const isERC721Notification = isOfTypeNodeGuard([
  TRIGGER_TYPES.ERC721_RECEIVED,
  TRIGGER_TYPES.ERC721_SENT,
]);

const isSent = (n: ERC721Notification) => n.type === TRIGGER_TYPES.ERC721_SENT;
const title = (n: ERC721Notification) =>
  isSent(n)
    ? t('notificationItemNFTSentTo')
    : t('notificationItemNFTReceivedFrom');

const getTitle = (n: ERC721Notification) => {
  const address = shortenAddress(
    isSent(n) ? n.payload.data.to : n.payload.data.from,
  );
  const items = createTextItems([title(n) ?? '', address], TextVariant.bodySm);
  return items;
};

const getDescription = (n: ERC721Notification) => {
  const items = createTextItems(
    [n.payload.data.nft.collection.name],
    TextVariant.bodyMd,
  );
  return items;
};

export const components: NotificationComponent<ERC721Notification> = {
  guardFn: isERC721Notification,
  item: ({ notification, onClick }) => {
    return (
      <NotificationListItem
        id={notification.id}
        isRead={notification.isRead}
        icon={{
          type: NotificationListItemIconType.Nft,
          value: notification.payload.data.nft.image,
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
        amount={`#${notification.payload.data.nft.token_id}`}
        onClick={onClick}
      />
    );
  },
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
            tokenId={notification.payload.data.nft.token_id}
            tokenName={notification.payload.data.nft.name}
            tokenSrc={notification.payload.data.nft.image}
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
              src: notification.payload.data.nft.image,
              badgeSrc: nativeCurrencyLogo,
            }}
            label={t('notificationItemCollection') ?? ''}
            collection={`${notification.payload.data.nft.collection.name} (${notification.payload.data.nft.token_id})`}
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

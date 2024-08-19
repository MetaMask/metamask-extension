import React from 'react';
import { NotificationServicesController } from '@metamask/notification-services-controller';
import { CHAIN_IDS } from '../../../../../shared/constants/network';
import { t } from '../../../../../app/scripts/translate';

import { type ExtractedNotification, isOfTypeNodeGuard } from '../node-guard';
import type { NotificationComponent } from '../types/notifications/notifications';

import { shortenAddress } from '../../../../helpers/utils/util';
import { decimalToHex } from '../../../../../shared/modules/conversion.utils';

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
  const address = shortenAddress(isSent(n) ? n.data.to : n.data.from);
  const items = createTextItems([title(n) || '', address], TextVariant.bodySm);
  return items;
};

const getDescription = (n: ERC1155Notification) => {
  const items = createTextItems(
    [n.data.nft?.collection.name || ''],
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
        type: notification.data.nft?.image
          ? NotificationListItemIconType.Nft
          : NotificationListItemIconType.Token,
        value: notification.data.nft?.image || 'http://foo.com/bar.png',
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
      amount={notification.data.nft?.token_id || ''}
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
      type: 'body_onchain_notification',
      Image: ({ notification }) => {
        const chainId = decimalToHex(notification.chain_id);
        const { nativeCurrencyLogo, nativeCurrencyName } =
          getNetworkDetailsByChainId(`0x${chainId}` as keyof typeof CHAIN_IDS);
        return (
          <NotificationDetailNft
            networkSrc={nativeCurrencyLogo}
            tokenId={notification.data.nft?.token_id || ''}
            tokenName={notification.data.nft?.name || ''}
            tokenSrc={notification.data.nft?.image || ''}
            networkName={nativeCurrencyName}
          />
        );
      },
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
      Status: () => (
        <NotificationDetailInfo
          icon={{
            iconName: IconName.Check,
            color: TextColor.successDefault,
            backgroundColor: BackgroundColor.successMuted,
          }}
          label={t('notificationItemStatus') || ''}
          detail={t('notificationItemConfirmed') || ''}
        />
      ),
      Asset: ({ notification }) => {
        const chainId = decimalToHex(notification.chain_id);
        const { nativeCurrencyLogo } = getNetworkDetailsByChainId(
          `0x${chainId}` as keyof typeof CHAIN_IDS,
        );
        return (
          <NotificationDetailCollection
            icon={{
              src: notification.data.nft?.image || '',
              badgeSrc: nativeCurrencyLogo,
            }}
            label={t('notificationItemCollection') || ''}
            collection={`${notification.data.nft?.collection.name} (${notification.data.nft?.token_id})`}
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

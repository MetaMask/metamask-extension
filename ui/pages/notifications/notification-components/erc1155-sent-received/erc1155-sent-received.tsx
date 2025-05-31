import React from 'react';
import { NotificationServicesController } from '@metamask/notification-services-controller';
import { CHAIN_IDS } from '../../../../../shared/constants/network';
import { t } from '../../../../../shared/lib/translate';

import { type ExtractedNotification, isOfTypeNodeGuard } from '../node-guard';
import {
  NotificationComponentType,
  type NotificationComponent,
} from '../types/notifications/notifications';

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
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  const items = createTextItems([title(n) || '', address], TextVariant.bodySm);
  return items;
};

const getDescription = (n: ERC1155Notification) => {
  const items = createTextItems(
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
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
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
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
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
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
      type: NotificationComponentType.OnChainBody,
      Image: ({ notification }) => {
        const chainId = decimalToHex(notification.chain_id);
        const { nativeCurrencyLogo, nativeCurrencyName } =
          getNetworkDetailsByChainId(`0x${chainId}` as keyof typeof CHAIN_IDS);
        return (
          <NotificationDetailNft
            networkSrc={nativeCurrencyLogo}
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
            // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
            tokenId={notification.data.nft?.token_id || ''}
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
            // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
            tokenName={notification.data.nft?.name || ''}
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
            // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
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
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
          label={t('notificationItemStatus') || ''}
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
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
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
              // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
              src: notification.data.nft?.image || '',
              badgeSrc: nativeCurrencyLogo,
            }}
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
            // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
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

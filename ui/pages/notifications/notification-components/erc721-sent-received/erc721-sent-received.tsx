import React from 'react';
import { NotificationServicesController } from '@metamask/notification-services-controller';
import { AvatarIconSeverity, IconName } from '@metamask/design-system-react';
import { t } from '../../../../../shared/lib/translate';

import { type ExtractedNotification, isOfTypeNodeGuard } from '../node-guard';
import {
  NotificationComponentType,
  type NotificationComponent,
} from '../types/notifications/notifications';

import {
  createTextItems,
  getNativeCurrencyLogoByChainId,
  getNetworkDetailsFromNotifPayload,
} from '../../../../helpers/utils/notification.util';
import { TextVariant } from '../../../../helpers/constants/design-system';

import { NotificationListItem } from '../../../../components/multichain/notification-list-item/notification-list-item';
import { NotificationDetailAddress } from '../../../../components/multichain/notification-detail-address/notification-detail-address';
import { NotificationDetailInfo } from '../../../../components/multichain/notification-detail-info/notification-detail-info';
import { NotificationDetailAsset } from '../../../../components/multichain/notification-detail-asset/notification-detail-asset';
import { NotificationDetailNetworkFee } from '../../../../components/multichain/notification-detail-network-fee/notification-detail-network-fee';
import { NotificationDetailBlockExplorerButton } from '../../../../components/multichain/notification-detail-block-explorer-button/notification-detail-block-explorer-button';
import { NotificationDetailNft } from '../../../../components/multichain/notification-detail-nft/notification-detail-nft';
import { NotificationDetailCollection } from '../../../../components/multichain/notification-detail-collection/notification-detail-collection';
import { NotificationListItemIconType } from '../../../../components/multichain/notification-list-item-icon/notification-list-item-icon';
import { BadgeWrapperPosition } from '../../../../components/component-library/badge-wrapper/badge-wrapper.types';
import { OnChainNotificationDetailsTitle } from '../notification-details-title';

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

const getTitle = (n: ERC721Notification) => {
  const items = createTextItems([n.template?.title ?? ''], TextVariant.bodySm);
  return items;
};

const getDescription = (n: ERC721Notification) => {
  const items = createTextItems([n.template?.body ?? ''], TextVariant.bodyMd);
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
    title: OnChainNotificationDetailsTitle,
    body: {
      type: NotificationComponentType.OnChainBody,
      Image: ({ notification }) => {
        const nativeCurrencyLogo = getNativeCurrencyLogoByChainId(
          notification.payload.chain_id,
        );
        const { networkName } = getNetworkDetailsFromNotifPayload(
          notification.payload.network,
        );
        return (
          <NotificationDetailNft
            networkSrc={nativeCurrencyLogo}
            tokenName={notification.payload.data.nft.name}
            tokenSrc={notification.payload.data.nft.image}
            networkName={networkName}
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
            severity: AvatarIconSeverity.Success,
          }}
          label={t('notificationItemStatus') ?? ''}
          detail={t('notificationItemConfirmed') ?? ''}
        />
      ),
      Asset: ({ notification }) => {
        const nativeCurrencyLogo = getNativeCurrencyLogoByChainId(
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
        const nativeCurrencyLogo = getNativeCurrencyLogoByChainId(
          notification.payload.chain_id,
        );
        const { networkName } = getNetworkDetailsFromNotifPayload(
          notification.payload.network,
        );

        return (
          <NotificationDetailAsset
            icon={{
              src: nativeCurrencyLogo,
            }}
            label={t('notificationDetailNetwork') ?? ''}
            detail={networkName}
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

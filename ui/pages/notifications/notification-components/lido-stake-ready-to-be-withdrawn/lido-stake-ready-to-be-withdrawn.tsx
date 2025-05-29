import React from 'react';
import { NotificationServicesController } from '@metamask/notification-services-controller';
import { CHAIN_IDS } from '../../../../../shared/constants/network';
import { type ExtractedNotification, isOfTypeNodeGuard } from '../node-guard';
import {
  NotificationComponentType,
  type NotificationComponent,
} from '../types/notifications/notifications';
import {
  NotificationListItem,
  NotificationDetailInfo,
  NotificationDetailTitle,
  NotificationDetailAsset,
  NotificationDetailBlockExplorerButton,
  NotificationDetailAddress,
} from '../../../../components/multichain';
import { t } from '../../../../../shared/lib/translate';
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
import { NotificationListItemIconType } from '../../../../components/multichain/notification-list-item-icon/notification-list-item-icon';
import {
  BadgeWrapperPosition,
  IconName,
} from '../../../../components/component-library';
import { decimalToHex } from '../../../../../shared/modules/conversion.utils';

const { TRIGGER_TYPES } = NotificationServicesController.Constants;

type LidoReadyWithDrawnNotification =
  ExtractedNotification<NotificationServicesController.Constants.TRIGGER_TYPES.LIDO_STAKE_READY_TO_BE_WITHDRAWN>;
const isLidoReadyWithDrawnNotification = isOfTypeNodeGuard([
  TRIGGER_TYPES.LIDO_STAKE_READY_TO_BE_WITHDRAWN,
]);

const getDescription = (n: LidoReadyWithDrawnNotification) => {
  const amount = formatAmount(parseFloat(n.data.staked_eth.amount), {
    shouldEllipse: true,
  });
  const description =
    // @ts-expect-error: Expected 0-1 arguments, but got an array
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    t('notificationItemLidoStakeReadyToBeWithdrawnMessage', [
      `${amount} ${n.data.staked_eth.symbol}`,
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    ]) || '';
  const items = createTextItems([description], TextVariant.bodyMd);
  return items;
};

const getTitle = () => {
  const items = createTextItems(
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    [t('notificationItemLidoStakeReadyToBeWithdrawn') || ''],
    TextVariant.bodySm,
  );
  return items;
};

export const components: NotificationComponent<LidoReadyWithDrawnNotification> =
  {
    guardFn: isLidoReadyWithDrawnNotification,
    item: ({ notification, onClick }) => {
      return (
        <NotificationListItem
          id={notification.trigger_id}
          isRead={notification.isRead}
          icon={{
            type: NotificationListItemIconType.Token,
            value: notification.data.staked_eth.image,
            badge: {
              icon: IconName.Stake,
              position: BadgeWrapperPosition.bottomRight,
            },
          }}
          title={getTitle()}
          description={getDescription(notification)}
          createdAt={new Date(notification.createdAt)}
          onClick={onClick}
        />
      );
    },
    details: {
      title: ({ notification }) => (
        <NotificationDetailTitle
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
          title={t('notificationItemLidoStakeReadyToBeWithdrawn') || ''}
          date={formatIsoDateString(notification.createdAt)}
        />
      ),
      body: {
        type: NotificationComponentType.OnChainBody,
        Account: ({ notification }) => {
          if (!notification.address) {
            return null;
          }
          return (
            <NotificationDetailAddress
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
              // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
              side={t('account') || ''}
              address={notification.address}
            />
          );
        },
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
            <NotificationDetailAsset
              icon={{
                src: notification.data.staked_eth.image,
                badge: {
                  src: nativeCurrencyLogo,
                  position: BadgeWrapperPosition.topRight,
                },
              }}
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
              // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
              label={t('notificationItemLidoStakeReadyToBeWithdrawn') || ''}
              detail={notification.data.staked_eth.symbol}
              fiatValue={`$${formatAmount(
                parseFloat(notification.data.staked_eth.usd),
                { shouldEllipse: true },
              )}`}
              value={`${formatAmount(
                parseFloat(notification.data.staked_eth.amount),
                { shouldEllipse: true },
              )} ${notification.data.staked_eth.symbol}`}
            />
          );
        },
        AssetReceived: ({ notification }) => {
          const chainId = decimalToHex(notification.chain_id);
          const { nativeCurrencyLogo } = getNetworkDetailsByChainId(
            `0x${chainId}` as keyof typeof CHAIN_IDS,
          );
          return (
            <NotificationDetailAsset
              icon={{
                src: notification.data.staked_eth.image,
                badge: {
                  src: nativeCurrencyLogo,
                  position: BadgeWrapperPosition.topRight,
                },
              }}
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
              // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
              label={t('notificationItemStakingProvider') || ''}
              detail={notification.data.staked_eth.symbol}
            />
          );
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

import { NotificationServicesController } from '@metamask/notification-services-controller';
// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import React from 'react';

import { t } from '../../../../../app/scripts/translate';
import type { CHAIN_IDS } from '../../../../../shared/constants/network';
import { decimalToHex } from '../../../../../shared/modules/conversion.utils';
import {
  BadgeWrapperPosition,
  IconName,
} from '../../../../components/component-library';
import {
  NotificationListItem,
  NotificationDetailInfo,
  NotificationDetailTitle,
  NotificationDetailAsset,
  NotificationDetailBlockExplorerButton,
  NotificationDetailAddress,
} from '../../../../components/multichain';
import { NotificationListItemIconType } from '../../../../components/multichain/notification-list-item-icon/notification-list-item-icon';
import {
  TextVariant,
  BackgroundColor,
  TextColor,
} from '../../../../helpers/constants/design-system';
import {
  createTextItems,
  formatAmount,
  formatIsoDateString,
  getNetworkDetailsByChainId,
} from '../../../../helpers/utils/notification.util';
import { type ExtractedNotification, isOfTypeNodeGuard } from '../node-guard';
import {
  NotificationComponentType,
  type NotificationComponent,
} from '../types/notifications/notifications';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths

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
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31880
    ]) || '';
  const items = createTextItems([description], TextVariant.bodyMd);
  return items;
};

const getTitle = () => {
  const items = createTextItems(
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31880
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
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31880
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
              // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31880
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
            // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31880
            label={t('notificationItemStatus') || ''}
            // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31880
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
              // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31880
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
              // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31880
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

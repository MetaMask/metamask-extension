import React from 'react';
import { NotificationServicesController } from '@metamask/notification-services-controller';
import { type ExtractedNotification, isOfTypeNodeGuard } from '../node-guard';
import {
  NotificationComponentType,
  type NotificationComponent,
} from '../types/notifications/notifications';
import { NotificationListItemIconType } from '../../../../components/multichain/notification-list-item-icon/notification-list-item-icon';

import {
  NotificationDetailAsset,
  NotificationListItem,
  NotificationDetailInfo,
  NotificationDetailBlockExplorerButton,
  NotificationDetailCopyButton,
  NotificationDetailTitle,
  NotificationDetailAddress,
} from '../../../../components/multichain';
import {
  createTextItems,
  getAmount,
  formatIsoDateString,
  getNetworkDetailsByChainId,
  getUsdAmount,
} from '../../../../helpers/utils/notification.util';
import { t } from '../../../../../shared/lib/translate';
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

type LidoWithdrawalRequestedNotification =
  ExtractedNotification<NotificationServicesController.Constants.TRIGGER_TYPES.LIDO_WITHDRAWAL_REQUESTED>;
const isLidoWithdrawalRequestedNotification = isOfTypeNodeGuard([
  TRIGGER_TYPES.LIDO_WITHDRAWAL_REQUESTED,
]);

const getTitle = () => {
  const items = createTextItems(
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    [t('notificationItemUnStakingRequested') || ''],
    TextVariant.bodySm,
  );
  return items;
};

const getDescription = (n: LidoWithdrawalRequestedNotification) => {
  const amount = getAmount(n.data.stake_in.amount, n.data.stake_in.decimals, {
    shouldEllipse: true,
  });
  const description =
    // @ts-expect-error: Expected 0-1 arguments, but got an array
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    t('notificationItemLidoWithdrawalRequestedMessage', [
      `${amount} ${n.data.stake_in.symbol}`,
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    ]) || '';
  const items = createTextItems([description], TextVariant.bodyMd);
  return items;
};

export const components: NotificationComponent<LidoWithdrawalRequestedNotification> =
  {
    guardFn: isLidoWithdrawalRequestedNotification,
    item: ({ notification, onClick }) => {
      return (
        <NotificationListItem
          id={notification.id}
          isRead={notification.isRead}
          icon={{
            type: NotificationListItemIconType.Token,
            value: notification.data.stake_in.image,
            badge: {
              icon: IconName.Stake,
              position: BadgeWrapperPosition.bottomRight,
            },
          }}
          title={getTitle()}
          description={getDescription(notification)}
          createdAt={new Date(notification.createdAt)}
          amount={`${getAmount(
            notification.data.stake_in.amount,
            notification.data.stake_in.decimals,
            { shouldEllipse: true },
          )} ${notification.data.stake_in.symbol}`}
          onClick={onClick}
        />
      );
    },
    details: {
      title: ({ notification }) => {
        return (
          <NotificationDetailTitle
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
            // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
            title={t('notificationItemUnStakingRequested') || ''}
            date={formatIsoDateString(notification.createdAt)}
          />
        );
      },
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
          const { nativeCurrencyLogo } = getNetworkDetailsByChainId(
            notification.chain_id,
          );
          return (
            <NotificationDetailAsset
              icon={{
                src: notification.data.stake_in.image,
                badge: {
                  src: nativeCurrencyLogo,
                  position: BadgeWrapperPosition.topRight,
                },
              }}
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
              // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
              label={t('notificationItemUnStakingRequested') || ''}
              detail={notification.data.stake_in.symbol}
              fiatValue={`$${getUsdAmount(
                notification.data.stake_in.amount,
                notification.data.stake_in.decimals,
                notification.data.stake_in.usd,
              )}`}
              value={`${getAmount(
                notification.data.stake_in.amount,
                notification.data.stake_in.decimals,
                { shouldEllipse: true },
              )} ${notification.data.stake_in.symbol}`}
            />
          );
        },
        AssetReceived: ({ notification }) => {
          const { nativeCurrencyLogo } = getNetworkDetailsByChainId(
            notification.chain_id,
          );
          return (
            <NotificationDetailAsset
              icon={{
                src: notification.data.stake_in.image,
                badge: {
                  src: nativeCurrencyLogo,
                  position: BadgeWrapperPosition.topRight,
                },
              }}
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
              // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
              label={t('notificationItemStakingProvider') || ''}
              detail="Lido-staked ETH"
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

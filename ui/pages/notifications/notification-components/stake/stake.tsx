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
  NotificationListItem,
  NotificationDetailInfo,
  NotificationDetailNetworkFee,
  NotificationDetailBlockExplorerButton,
  NotificationDetailAsset,
  NotificationDetailCopyButton,
  NotificationDetailAddress,
} from '../../../../components/multichain';
import { NotificationListItemIconType } from '../../../../components/multichain/notification-list-item-icon/notification-list-item-icon';
import { BadgeWrapperPosition } from '../../../../components/component-library';

import {
  createTextItems,
  getAmount,
  getNativeCurrencyLogoByChainId,
  getUsdAmount,
} from '../../../../helpers/utils/notification.util';
import { TextVariant } from '../../../../helpers/constants/design-system';
import { OnChainNotificationDetailsTitle } from '../notification-details-title';

const { TRIGGER_TYPES } = NotificationServicesController.Constants;

type StakeNotification = ExtractedNotification<
  | NotificationServicesController.Constants.TRIGGER_TYPES.ROCKETPOOL_STAKE_COMPLETED
  | NotificationServicesController.Constants.TRIGGER_TYPES.ROCKETPOOL_UNSTAKE_COMPLETED
  | NotificationServicesController.Constants.TRIGGER_TYPES.LIDO_STAKE_COMPLETED
  | NotificationServicesController.Constants.TRIGGER_TYPES.LIDO_WITHDRAWAL_COMPLETED
>;
const isStakeNotification = isOfTypeNodeGuard([
  TRIGGER_TYPES.ROCKETPOOL_STAKE_COMPLETED,
  TRIGGER_TYPES.ROCKETPOOL_UNSTAKE_COMPLETED,
  TRIGGER_TYPES.LIDO_STAKE_COMPLETED,
  TRIGGER_TYPES.LIDO_WITHDRAWAL_COMPLETED,
]);

const DIRECTION_MAP = {
  [TRIGGER_TYPES.ROCKETPOOL_STAKE_COMPLETED]: 'staked',
  [TRIGGER_TYPES.ROCKETPOOL_UNSTAKE_COMPLETED]: 'unstaked',
  [TRIGGER_TYPES.LIDO_STAKE_COMPLETED]: 'staked',
  [TRIGGER_TYPES.LIDO_WITHDRAWAL_COMPLETED]: 'unstaked',
} as const;

const STAKING_PROVIDER_MAP = {
  [TRIGGER_TYPES.LIDO_STAKE_COMPLETED]: 'Lido-staked ETH',
  [TRIGGER_TYPES.LIDO_WITHDRAWAL_COMPLETED]: 'Lido-staked ETH',
  [TRIGGER_TYPES.ROCKETPOOL_STAKE_COMPLETED]: 'Rocket Pool-staked ETH',
  [TRIGGER_TYPES.ROCKETPOOL_UNSTAKE_COMPLETED]: 'Rocket Pool-staked ETH',
};

const getTitle = (n: StakeNotification) => {
  const items = createTextItems([n.template?.title ?? ''], TextVariant.bodySm);
  return items;
};

const getDescription = (n: StakeNotification) => {
  const items = createTextItems([n.template?.body ?? ''], TextVariant.bodyMd);
  return items;
};

export const components: NotificationComponent<StakeNotification> = {
  guardFn: isStakeNotification,
  item: ({ notification, onClick }) => {
    const direction = DIRECTION_MAP[notification.type];
    const stakingProp =
      direction === 'staked'
        ? notification.payload.data.stake_in
        : notification.payload.data.stake_out;

    const amount = getAmount(stakingProp.amount, stakingProp.decimals, {
      shouldEllipse: true,
    });
    return (
      <NotificationListItem
        id={notification.id}
        isRead={notification.isRead}
        icon={{
          type: NotificationListItemIconType.Token,
          value: notification.payload.data.stake_out.image,
          badge: {
            icon: IconName.Stake,
            position: BadgeWrapperPosition.bottomRight,
          },
        }}
        title={getTitle(notification)}
        description={getDescription(notification)}
        createdAt={new Date(notification.createdAt)}
        amount={`${amount} ${
          direction === 'staked'
            ? notification.payload.data.stake_in.symbol
            : notification.payload.data.stake_out.symbol
        }`}
        onClick={onClick}
      />
    );
  },
  details: {
    title: OnChainNotificationDetailsTitle,
    body: {
      type: NotificationComponentType.OnChainBody,
      Account: ({ notification }) => {
        if (!notification.payload.address) {
          return null;
        }
        return (
          <NotificationDetailAddress
            side={t('account') ?? ''}
            address={notification.payload.address}
          />
        );
      },
      Asset: ({ notification }) => {
        const direction = DIRECTION_MAP[notification.type];
        const nativeCurrencyLogo = getNativeCurrencyLogoByChainId(
          notification.payload.chain_id,
        );
        return (
          <NotificationDetailAsset
            icon={{
              src: notification.payload.data.stake_in.image,
              badge: {
                src: nativeCurrencyLogo,
                position: BadgeWrapperPosition.topRight,
              },
            }}
            label={
              direction === 'staked'
                ? (t('notificationItemStaked') ?? '')
                : (t('notificationItemUnStaked') ?? '')
            }
            detail={notification.payload.data.stake_in.symbol}
            fiatValue={`$${getUsdAmount(
              notification.payload.data.stake_in.amount,
              notification.payload.data.stake_in.decimals,
              notification.payload.data.stake_in.usd,
            )}`}
            value={`${getAmount(
              notification.payload.data.stake_in.amount,
              notification.payload.data.stake_in.decimals,
              { shouldEllipse: true },
            )} ${notification.payload.data.stake_in.symbol}`}
          />
        );
      },
      AssetReceived: ({ notification }) => {
        const nativeCurrencyLogo = getNativeCurrencyLogoByChainId(
          notification.payload.chain_id,
        );
        return (
          <NotificationDetailAsset
            icon={{
              src: notification.payload.data.stake_out.image,
              badge: {
                src: nativeCurrencyLogo,
                position: BadgeWrapperPosition.topRight,
              },
            }}
            label={t('notificationItemReceived') ?? ''}
            detail={notification.payload.data.stake_out.symbol}
            fiatValue={`$${getUsdAmount(
              notification.payload.data.stake_out.amount,
              notification.payload.data.stake_out.decimals,
              notification.payload.data.stake_out.usd,
            )}`}
            value={`${getAmount(
              notification.payload.data.stake_out.amount,
              notification.payload.data.stake_out.decimals,
              { shouldEllipse: true },
            )} ${notification.payload.data.stake_out.symbol}`}
          />
        );
      },
      Status: ({ notification }) => (
        <NotificationDetailInfo
          icon={{
            iconName: IconName.Check,
            severity: AvatarIconSeverity.Success,
          }}
          label={t('notificationItemStatus') ?? ''}
          detail={t('notificationItemConfirmed') ?? ''}
          action={
            <NotificationDetailCopyButton
              notification={notification}
              text={notification.payload.tx_hash}
              displayText={t('notificationItemTransactionId') ?? ''}
            />
          }
        />
      ),
      Provider: ({ notification }) => {
        const direction = DIRECTION_MAP[notification.type];
        const provider = STAKING_PROVIDER_MAP[notification.type];

        return (
          <NotificationDetailAsset
            icon={{
              src: notification.payload.data.stake_out.image,
              badge: {
                src:
                  direction === 'staked'
                    ? notification.payload.data.stake_out.image
                    : notification.payload.data.stake_in.image,
              },
            }}
            label={t('notificationItemStakingProvider') ?? ''}
            detail={provider}
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

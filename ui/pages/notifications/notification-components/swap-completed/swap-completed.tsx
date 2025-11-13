import React from 'react';
import { NotificationServicesController } from '@metamask/notification-services-controller';
import { type ExtractedNotification, isOfTypeNodeGuard } from '../node-guard';
import {
  NotificationComponentType,
  type NotificationComponent,
} from '../types/notifications/notifications';
import { t } from '../../../../../shared/lib/translate';

import {
  NotificationListItem,
  NotificationDetailInfo,
  NotificationDetailAsset,
  NotificationDetailNetworkFee,
  NotificationDetailBlockExplorerButton,
  NotificationDetailTitle,
  NotificationDetailCopyButton,
  NotificationDetailAddress,
} from '../../../../components/multichain';
import { NotificationListItemIconType } from '../../../../components/multichain/notification-list-item-icon/notification-list-item-icon';
import {
  BadgeWrapperPosition,
  IconName,
} from '../../../../components/component-library';

import {
  createTextItems,
  getAmount,
  formatIsoDateString,
  getNetworkDetailsByChainId,
  getUsdAmount,
} from '../../../../helpers/utils/notification.util';
import {
  TextVariant,
  BackgroundColor,
  TextColor,
} from '../../../../helpers/constants/design-system';

const { TRIGGER_TYPES } = NotificationServicesController.Constants;

type SwapCompletedNotification =
  ExtractedNotification<NotificationServicesController.Constants.TRIGGER_TYPES.METAMASK_SWAP_COMPLETED>;
const isSwapCompletedNotification = isOfTypeNodeGuard([
  TRIGGER_TYPES.METAMASK_SWAP_COMPLETED,
]);

const getTitle = (n: SwapCompletedNotification) => {
  const items = createTextItems(
    [
      t('notificationItemSwapped') ?? '',
      n.payload.data.token_in.symbol,
      t('notificationItemSwappedFor') ?? '',
    ],
    TextVariant.bodySm,
  );
  return items;
};

const getDescription = (n: SwapCompletedNotification) => {
  const items = createTextItems(
    [n.payload.data.token_out.symbol],
    TextVariant.bodyMd,
  );
  return items;
};

export const components: NotificationComponent<SwapCompletedNotification> = {
  guardFn: isSwapCompletedNotification,
  item: ({ notification, onClick }) => {
    return (
      <NotificationListItem
        id={notification.id}
        isRead={notification.isRead}
        icon={{
          type: NotificationListItemIconType.Token,
          value: notification.payload.data.token_out.image,
          badge: {
            icon: IconName.SwapHorizontal,
            position: BadgeWrapperPosition.bottomRight,
          },
        }}
        title={getTitle(notification)}
        description={getDescription(notification)}
        createdAt={new Date(notification.createdAt)}
        amount={`${getAmount(
          notification.payload.data.token_out.amount,
          notification.payload.data.token_out.decimals,
          {
            shouldEllipse: true,
          },
        )} ${notification.payload.data.token_out.symbol}`}
        onClick={onClick}
      />
    );
  },
  details: {
    title: ({ notification }) => (
      <NotificationDetailTitle
        title={`${t('notificationItemSwapped') ?? ''} ${
          notification.payload.data.token_out.symbol
        }`}
        date={formatIsoDateString(notification.createdAt)}
      />
    ),
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
        const { nativeCurrencyLogo } = getNetworkDetailsByChainId(
          notification.payload.chain_id,
        );
        return (
          <NotificationDetailAsset
            icon={{
              src: notification.payload.data.token_in.image,
              badge: {
                src: nativeCurrencyLogo,
                position: BadgeWrapperPosition.topRight,
              },
            }}
            label={t('notificationItemSwapped') ?? ''}
            detail={notification.payload.data.token_in.symbol}
            fiatValue={`$${getUsdAmount(
              notification.payload.data.token_in.amount,
              notification.payload.data.token_in.decimals,
              notification.payload.data.token_in.usd,
            )}`}
            value={`${getAmount(
              notification.payload.data.token_in.amount,
              notification.payload.data.token_in.decimals,
              { shouldEllipse: true },
            )} ${notification.payload.data.token_in.symbol}`}
          />
        );
      },
      AssetReceived: ({ notification }) => {
        const { nativeCurrencyLogo } = getNetworkDetailsByChainId(
          notification.payload.chain_id,
        );
        return (
          <NotificationDetailAsset
            icon={{
              src: notification.payload.data.token_out.image,
              badge: {
                src: nativeCurrencyLogo,
                position: BadgeWrapperPosition.topRight,
              },
            }}
            label={t('notificationItemTo') ?? ''}
            detail={notification.payload.data.token_out.symbol}
            fiatValue={`$${getUsdAmount(
              notification.payload.data.token_out.amount,
              notification.payload.data.token_out.decimals,
              notification.payload.data.token_out.usd,
            )}`}
            value={`${getAmount(
              notification.payload.data.token_out.amount,
              notification.payload.data.token_out.decimals,
              { shouldEllipse: true },
            )} ${notification.payload.data.token_out.symbol}`}
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
      Network: ({ notification }) => {
        const { nativeCurrencyName, nativeCurrencyLogo } =
          getNetworkDetailsByChainId(notification.payload.chain_id);
        return (
          <NotificationDetailAsset
            icon={{
              src: nativeCurrencyLogo,
            }}
            label={t('notificationItemNetwork') ?? ''}
            detail={nativeCurrencyName}
          />
        );
      },
      Rate: ({ notification }) => {
        return (
          <NotificationDetailInfo
            icon={{
              iconName: IconName.SwapHorizontal,
              color: TextColor.infoDefault,
              backgroundColor: BackgroundColor.infoMuted,
            }}
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
            // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
            label={t('notificationItemRate') || ''}
            detail={`1 ${notification.payload.data.token_out.symbol} ≈ ${(
              1 / parseFloat(notification.payload.data.rate)
            ).toFixed(5)} ${notification.payload.data.token_in.symbol}`}
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

import { NotificationServicesController } from '@metamask/notification-services-controller';
// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import React from 'react';

import { t } from '../../../../../app/scripts/translate';
import type { CHAIN_IDS } from '../../../../../shared/constants/network';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths

import { decimalToHex } from '../../../../../shared/modules/conversion.utils';
import {
  BadgeWrapperPosition,
  IconName,
} from '../../../../components/component-library';
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
  TextVariant,
  BackgroundColor,
  TextColor,
} from '../../../../helpers/constants/design-system';
import {
  createTextItems,
  getAmount,
  formatIsoDateString,
  getNetworkDetailsByChainId,
  getUsdAmount,
} from '../../../../helpers/utils/notification.util';
import { type ExtractedNotification, isOfTypeNodeGuard } from '../node-guard';
import {
  NotificationComponentType,
  type NotificationComponent,
} from '../types/notifications/notifications';

const { TRIGGER_TYPES } = NotificationServicesController.Constants;

type SwapCompletedNotification =
  ExtractedNotification<NotificationServicesController.Constants.TRIGGER_TYPES.METAMASK_SWAP_COMPLETED>;
const isSwapCompletedNotification = isOfTypeNodeGuard([
  TRIGGER_TYPES.METAMASK_SWAP_COMPLETED,
]);

// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31887
// eslint-disable-next-line id-length
const getTitle = (n: SwapCompletedNotification) => {
  const items = createTextItems(
    [
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31880
      t('notificationItemSwapped') || '',
      n.data.token_in.symbol,
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31880
      t('notificationItemSwappedFor') || '',
    ],
    TextVariant.bodySm,
  );
  return items;
};

// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31887
// eslint-disable-next-line id-length
const getDescription = (n: SwapCompletedNotification) => {
  const items = createTextItems([n.data.token_out.symbol], TextVariant.bodyMd);
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
          value: notification.data.token_out.image,
          badge: {
            icon: IconName.SwapHorizontal,
            position: BadgeWrapperPosition.bottomRight,
          },
        }}
        title={getTitle(notification)}
        description={getDescription(notification)}
        createdAt={new Date(notification.createdAt)}
        amount={`${getAmount(
          notification.data.token_out.amount,
          notification.data.token_out.decimals,
          {
            shouldEllipse: true,
          },
        )} ${notification.data.token_out.symbol}`}
        onClick={onClick}
      />
    );
  },
  details: {
    title: ({ notification }) => (
      <NotificationDetailTitle
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31880
        title={`${t('notificationItemSwapped') || ''} ${
          notification.data.token_out.symbol
        }`}
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
      Asset: ({ notification }) => {
        const chainId = decimalToHex(notification.chain_id);
        const { nativeCurrencyLogo } = getNetworkDetailsByChainId(
          `0x${chainId}` as keyof typeof CHAIN_IDS,
        );
        return (
          <NotificationDetailAsset
            icon={{
              src: notification.data.token_in.image,
              badge: {
                src: nativeCurrencyLogo,
                position: BadgeWrapperPosition.topRight,
              },
            }}
            // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31880
            label={t('notificationItemSwapped') || ''}
            detail={notification.data.token_in.symbol}
            fiatValue={`$${getUsdAmount(
              notification.data.token_in.amount,
              notification.data.token_in.decimals,
              notification.data.token_in.usd,
            )}`}
            value={`${getAmount(
              notification.data.token_in.amount,
              notification.data.token_in.decimals,
              { shouldEllipse: true },
            )} ${notification.data.token_in.symbol}`}
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
              src: notification.data.token_out.image,
              badge: {
                src: nativeCurrencyLogo,
                position: BadgeWrapperPosition.topRight,
              },
            }}
            // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31880
            label={t('notificationItemTo') || ''}
            detail={notification.data.token_out.symbol}
            fiatValue={`$${getUsdAmount(
              notification.data.token_out.amount,
              notification.data.token_out.decimals,
              notification.data.token_out.usd,
            )}`}
            value={`${getAmount(
              notification.data.token_out.amount,
              notification.data.token_out.decimals,
              { shouldEllipse: true },
            )} ${notification.data.token_out.symbol}`}
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
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31880
          label={t('notificationItemStatus') || ''}
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31880
          detail={t('notificationItemConfirmed') || ''}
          action={
            <NotificationDetailCopyButton
              notification={notification}
              text={notification.tx_hash}
              // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31880
              displayText={t('notificationItemTransactionId') || ''}
            />
          }
        />
      ),
      Network: ({ notification }) => {
        const chainId = decimalToHex(notification.chain_id);
        const { nativeCurrencyName, nativeCurrencyLogo } =
          getNetworkDetailsByChainId(`0x${chainId}` as keyof typeof CHAIN_IDS);
        return (
          <NotificationDetailAsset
            icon={{
              src: nativeCurrencyLogo,
            }}
            // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31880
            label={t('notificationItemNetwork') || ''}
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
            // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31880
            label={t('notificationItemRate') || ''}
            detail={`1 ${notification.data.token_out.symbol} ≈ ${(
              1 / parseFloat(notification.data.rate)
            ).toFixed(5)} ${notification.data.token_in.symbol}`}
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

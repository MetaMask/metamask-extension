// We are defining that this file uses a webworker global scope.
// eslint-disable-next-line spaced-comment
/// <reference lib="webworker" />

import { NotificationServicesController } from '@metamask/notification-services-controller';
import { t } from '../../../translate';
import ExtensionPlatform from '../../../platforms/extension';
import { getAmount, formatAmount } from './get-notification-data';
import { getNotificationImage } from './get-notification-image';

type Notification = NotificationServicesController.Types.INotification;
type OnChainRawNotification =
  NotificationServicesController.Types.OnChainRawNotification;

const { CHAIN_SYMBOLS } = NotificationServicesController.Constants;

type PushNotificationMessage = {
  title: string;
  description: string;
};

type NotificationMessage<N extends Notification = Notification> = {
  title: string | null;
  defaultDescription: string | null;
  getDescription?: (n: N) => string | null;
};

type NotificationMessageDict = {
  [K in NotificationServicesController.Constants.TRIGGER_TYPES]?: NotificationMessage<
    Extract<Notification, { type: K }>
  >;
};

const sw = self as unknown as ServiceWorkerGlobalScope;
const extensionPlatform = new ExtensionPlatform();

function getChainSymbol(chainId: number) {
  return CHAIN_SYMBOLS[chainId] ?? null;
}

export async function onPushNotificationReceived(
  notification: Notification,
): Promise<void> {
  const notificationMessage = createNotificationMessage(notification);
  if (!notificationMessage) {
    return;
  }

  const registration = sw?.registration;
  if (!registration) {
    return;
  }

  const iconUrl = await getNotificationImage();

  await registration.showNotification(notificationMessage.title, {
    body: notificationMessage.description,
    icon: iconUrl,
    tag: notification?.id,
    data: notification,
  });
}

export async function onNotificationClick(
  event: NotificationEvent,
  emitEvent?: (n: Notification) => void,
) {
  // Close notification
  event.notification.close();

  // Get Data
  const data: Notification = event?.notification?.data;
  emitEvent?.(data);

  // Navigate
  const destination = `${extensionPlatform.getExtensionURL(
    null,
    null,
  )}#notifications/${data.id}`;
  event.waitUntil(sw.clients.openWindow(destination));
}

export function isOnChainNotification(n: unknown): n is OnChainRawNotification {
  const assumed = n as OnChainRawNotification;

  // We don't have a validation/parsing library to check all possible types of an on chain notification
  // It is safe enough just to check "some" fields, and catch any errors down the line if the shape is bad.
  const isValidEnoughToBeOnChainNotification = [
    assumed?.id,
    assumed?.data,
    assumed?.trigger_id,
  ].every((field) => field !== undefined);
  return isValidEnoughToBeOnChainNotification;
}

const notificationMessageDict: NotificationMessageDict = {
  erc20_sent: {
    title: t('pushPlatformNotificationsFundsSentTitle'),
    defaultDescription: t(
      'pushPlatformNotificationsFundsSentDescriptionDefault',
    ),
    getDescription: (n) => {
      const symbol = n?.data?.token?.symbol;
      const tokenAmount = n?.data?.token?.amount;
      const tokenDecimals = n?.data?.token?.decimals;
      if (!symbol || !tokenAmount || !tokenDecimals) {
        return null;
      }

      const amount = getAmount(tokenAmount, tokenDecimals, {
        shouldEllipse: true,
      });
      return t('pushPlatformNotificationsFundsSentDescription', amount, symbol);
    },
  },
  eth_sent: {
    title: t('pushPlatformNotificationsFundsSentTitle'),
    defaultDescription: t(
      'pushPlatformNotificationsFundsSentDescriptionDefault',
    ),
    getDescription: (n) => {
      const symbol = getChainSymbol(n?.chain_id);
      const tokenAmount = n?.data?.amount?.eth;
      if (!symbol || !tokenAmount) {
        return null;
      }

      const amount = formatAmount(parseFloat(tokenAmount), {
        shouldEllipse: true,
      });
      return t('pushPlatformNotificationsFundsSentDescription', amount, symbol);
    },
  },
  erc20_received: {
    title: t('pushPlatformNotificationsFundsReceivedTitle'),
    defaultDescription: t(
      'pushPlatformNotificationsFundsReceivedDescriptionDefault',
    ),
    getDescription: (n) => {
      const symbol = n?.data?.token?.symbol;
      const tokenAmount = n?.data?.token?.amount;
      const tokenDecimals = n?.data?.token?.decimals;
      if (!symbol || !tokenAmount || !tokenDecimals) {
        return null;
      }

      const amount = getAmount(tokenAmount, tokenDecimals, {
        shouldEllipse: true,
      });
      return t(
        'pushPlatformNotificationsFundsReceivedDescription',
        amount,
        symbol,
      );
    },
  },
  eth_received: {
    title: t('pushPlatformNotificationsFundsReceivedTitle'),
    defaultDescription: t(
      'pushPlatformNotificationsFundsReceivedDescriptionDefault',
    ),
    getDescription: (n) => {
      const symbol = getChainSymbol(n?.chain_id);
      const tokenAmount = n?.data?.amount?.eth;
      if (!symbol || !tokenAmount) {
        return null;
      }

      const amount = formatAmount(parseFloat(tokenAmount), {
        shouldEllipse: true,
      });
      return t(
        'pushPlatformNotificationsFundsReceivedDescription',
        amount,
        symbol,
      );
    },
  },
  metamask_swap_completed: {
    title: t('pushPlatformNotificationsSwapCompletedTitle'),
    defaultDescription: t('pushPlatformNotificationsSwapCompletedDescription'),
  },
  erc721_sent: {
    title: t('pushPlatformNotificationsNftSentTitle'),
    defaultDescription: t('pushPlatformNotificationsNftSentDescription'),
  },
  erc1155_sent: {
    title: t('pushPlatformNotificationsNftSentTitle'),
    defaultDescription: t('pushPlatformNotificationsNftSentDescription'),
  },
  erc721_received: {
    title: t('pushPlatformNotificationsNftReceivedTitle'),
    defaultDescription: t('pushPlatformNotificationsNftReceivedDescription'),
  },
  erc1155_received: {
    title: t('pushPlatformNotificationsNftReceivedTitle'),
    defaultDescription: t('pushPlatformNotificationsNftReceivedDescription'),
  },
  rocketpool_stake_completed: {
    title: t('pushPlatformNotificationsStakingRocketpoolStakeCompletedTitle'),
    defaultDescription: t(
      'pushPlatformNotificationsStakingRocketpoolStakeCompletedDescription',
    ),
  },
  rocketpool_unstake_completed: {
    title: t('pushPlatformNotificationsStakingRocketpoolUnstakeCompletedTitle'),
    defaultDescription: t(
      'pushPlatformNotificationsStakingRocketpoolUnstakeCompletedDescription',
    ),
  },
  lido_stake_completed: {
    title: t('pushPlatformNotificationsStakingLidoStakeCompletedTitle'),
    defaultDescription: t(
      'pushPlatformNotificationsStakingLidoStakeCompletedDescription',
    ),
  },
  lido_stake_ready_to_be_withdrawn: {
    title: t(
      'pushPlatformNotificationsStakingLidoStakeReadyToBeWithdrawnTitle',
    ),
    defaultDescription: t(
      'pushPlatformNotificationsStakingLidoStakeReadyToBeWithdrawnDescription',
    ),
  },
  lido_withdrawal_requested: {
    title: t('pushPlatformNotificationsStakingLidoWithdrawalRequestedTitle'),
    defaultDescription: t(
      'pushPlatformNotificationsStakingLidoWithdrawalRequestedDescription',
    ),
  },
  lido_withdrawal_completed: {
    title: t('pushPlatformNotificationsStakingLidoWithdrawalCompletedTitle'),
    defaultDescription: t(
      'pushPlatformNotificationsStakingLidoWithdrawalCompletedDescription',
    ),
  },
};

export function createNotificationMessage(
  n: Notification,
): PushNotificationMessage | null {
  if (!n?.type) {
    return null;
  }
  const notificationMessage = notificationMessageDict[n.type] as
    | NotificationMessage
    | undefined;

  if (!notificationMessage) {
    return null;
  }

  let description: string | null = null;
  try {
    description =
      notificationMessage?.getDescription?.(n) ??
      notificationMessage.defaultDescription ??
      null;
  } catch (e) {
    description = notificationMessage.defaultDescription ?? null;
  }

  return {
    title: notificationMessage.title ?? '', // Ensure title is always a string
    description: description ?? '', // Fallback to empty string if null
  };
}

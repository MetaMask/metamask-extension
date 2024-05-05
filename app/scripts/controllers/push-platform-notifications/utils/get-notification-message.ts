// We are defining that this file uses a webworker global scope.
// eslint-disable-next-line spaced-comment
/// <reference lib="webworker" />

import { CHAIN_SYMBOLS } from '../../metamask-notifications/constants/notification-schema';
import type { TRIGGER_TYPES } from '../../metamask-notifications/constants/notification-schema';
import type { OnChainRawNotification } from '../../metamask-notifications/types/on-chain-notification/on-chain-notification';
import { t } from '../../../translate';
import { getAmount, formatAmount } from './get-notification-data';

type PushNotificationMessage = {
  title: string;
  description: string;
};

type NotificationMessage<
  N extends OnChainRawNotification = OnChainRawNotification,
> = {
  title: string | null;
  defaultDescription: string | null;
  getDescription?: (n: N) => string | null;
};

type NotificationMessageDict = {
  [K in TRIGGER_TYPES]?: NotificationMessage<
    Extract<OnChainRawNotification, { data: { kind: `${K}` } }>
  >;
};

const sw = self as unknown as ServiceWorkerGlobalScope;

function getChainSymbol(chainId: number) {
  return CHAIN_SYMBOLS[chainId] ?? null;
}

export async function onPushNotification(notification: unknown): Promise<void> {
  if (!notification) {
    return;
  }
  if (!isOnChainNotification(notification)) {
    return;
  }

  const notificationMessage = createNotificationMessage(notification);
  if (!notificationMessage) {
    return;
  }

  const registration = sw?.registration;
  if (!registration) {
    return;
  }

  await registration.showNotification(notificationMessage.title, {
    body: notificationMessage.description,
    icon: './images/icon-64.png',
    tag: notification?.id,
    data: notification,
  });
}

function isOnChainNotification(n: unknown): n is OnChainRawNotification {
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
  n: OnChainRawNotification,
): PushNotificationMessage | null {
  if (!n?.data?.kind) {
    return null;
  }
  const notificationMessage = notificationMessageDict[n.data.kind] as
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

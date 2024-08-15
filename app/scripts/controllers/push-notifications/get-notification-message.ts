import { NotificationServicesController } from '@metamask/notification-services-controller';

import { t } from '../../translate';
import { formatAmount, getAmount } from './get-notification-data';

type TRIGGER_TYPES = NotificationServicesController.Constants.TRIGGER_TYPES;
type Notification = NotificationServicesController.Types.INotification;
const CHAIN_SYMBOLS =
  NotificationServicesController.UI.NOTIFICATION_NETWORK_CURRENCY_SYMBOL;
type ValidChainId = keyof typeof CHAIN_SYMBOLS;

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
  [K in TRIGGER_TYPES]?: NotificationMessage<
    Extract<Notification, { type: K }>
  >;
};

function getChainSymbol(chainId: number) {
  return CHAIN_SYMBOLS[chainId as ValidChainId] ?? null;
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

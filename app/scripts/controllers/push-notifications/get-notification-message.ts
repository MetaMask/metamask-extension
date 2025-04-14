import type { NotificationServicesController } from '@metamask/notification-services-controller';
import { NotificationServicesPushController } from '@metamask/notification-services-controller';
import { t as translate } from '../../translate';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
// eslint-disable-next-line id-length
const t = (...args: Parameters<typeof translate>) => translate(...args) ?? '';

const translations: NotificationServicesPushController.Utils.TranslationKeys = {
  pushPlatformNotificationsFundsSentTitle: () =>
    t('pushPlatformNotificationsFundsSentTitle'),
  pushPlatformNotificationsFundsSentDescriptionDefault: () =>
    t('pushPlatformNotificationsFundsSentDescriptionDefault'),
  pushPlatformNotificationsFundsSentDescription: (amount, symbol) =>
    t('pushPlatformNotificationsFundsSentDescription', amount, symbol),
  pushPlatformNotificationsFundsReceivedTitle: () =>
    t('pushPlatformNotificationsFundsReceivedTitle'),
  pushPlatformNotificationsFundsReceivedDescriptionDefault: () =>
    t('pushPlatformNotificationsFundsReceivedDescriptionDefault'),
  pushPlatformNotificationsFundsReceivedDescription: (amount, symbol) =>
    t('pushPlatformNotificationsFundsReceivedDescription', amount, symbol),
  pushPlatformNotificationsSwapCompletedTitle: () =>
    t('pushPlatformNotificationsSwapCompletedTitle'),
  pushPlatformNotificationsSwapCompletedDescription: () =>
    t('pushPlatformNotificationsSwapCompletedDescription'),
  pushPlatformNotificationsNftSentTitle: () =>
    t('pushPlatformNotificationsNftSentTitle'),
  pushPlatformNotificationsNftSentDescription: () =>
    t('pushPlatformNotificationsNftSentDescription'),
  pushPlatformNotificationsNftReceivedTitle: () =>
    t('pushPlatformNotificationsNftReceivedTitle'),
  pushPlatformNotificationsNftReceivedDescription: () =>
    t('pushPlatformNotificationsNftReceivedDescription'),
  pushPlatformNotificationsStakingRocketpoolStakeCompletedTitle: () =>
    t('pushPlatformNotificationsStakingRocketpoolStakeCompletedTitle'),
  pushPlatformNotificationsStakingRocketpoolStakeCompletedDescription: () =>
    t('pushPlatformNotificationsStakingRocketpoolStakeCompletedDescription'),
  pushPlatformNotificationsStakingRocketpoolUnstakeCompletedTitle: () =>
    t('pushPlatformNotificationsStakingRocketpoolUnstakeCompletedTitle'),
  pushPlatformNotificationsStakingRocketpoolUnstakeCompletedDescription: () =>
    t('pushPlatformNotificationsStakingRocketpoolUnstakeCompletedDescription'),
  pushPlatformNotificationsStakingLidoStakeCompletedTitle: () =>
    t('pushPlatformNotificationsStakingLidoStakeCompletedTitle'),
  pushPlatformNotificationsStakingLidoStakeCompletedDescription: () =>
    t('pushPlatformNotificationsStakingLidoStakeCompletedDescription'),
  pushPlatformNotificationsStakingLidoStakeReadyToBeWithdrawnTitle: () =>
    t('pushPlatformNotificationsStakingLidoStakeReadyToBeWithdrawnTitle'),
  pushPlatformNotificationsStakingLidoStakeReadyToBeWithdrawnDescription: () =>
    t('pushPlatformNotificationsStakingLidoStakeReadyToBeWithdrawnDescription'),
  pushPlatformNotificationsStakingLidoWithdrawalRequestedTitle: () =>
    t('pushPlatformNotificationsStakingLidoWithdrawalRequestedTitle'),
  pushPlatformNotificationsStakingLidoWithdrawalRequestedDescription: () =>
    t('pushPlatformNotificationsStakingLidoWithdrawalRequestedDescription'),
  pushPlatformNotificationsStakingLidoWithdrawalCompletedTitle: () =>
    t('pushPlatformNotificationsStakingLidoWithdrawalCompletedTitle'),
  pushPlatformNotificationsStakingLidoWithdrawalCompletedDescription: () =>
    t('pushPlatformNotificationsStakingLidoWithdrawalCompletedDescription'),
};

export function createNotificationMessage(
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
  // eslint-disable-next-line id-length
  n: NotificationServicesController.Types.INotification,
) {
  return NotificationServicesPushController.Utils.createOnChainPushNotificationMessage(
    n,
    translations,
  );
}

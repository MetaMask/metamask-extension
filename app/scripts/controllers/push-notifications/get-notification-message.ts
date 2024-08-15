import type { NotificationServicesController } from '@metamask/notification-services-controller';
import { NotificationsServicesPushController } from '@metamask/notification-services-controller';
import { t as translate } from '../../translate';

const t = (...args: Parameters<typeof translate>) => translate(...args) ?? '';

const translations: NotificationsServicesPushController.Utils.TranslationKeys =
  {
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
      t(
        'pushPlatformNotificationsStakingRocketpoolUnstakeCompletedDescription',
      ),
    pushPlatformNotificationsStakingLidoStakeCompletedTitle: () =>
      t('pushPlatformNotificationsStakingLidoStakeCompletedTitle'),
    pushPlatformNotificationsStakingLidoStakeCompletedDescription: () =>
      t('pushPlatformNotificationsStakingLidoStakeCompletedDescription'),
    pushPlatformNotificationsStakingLidoStakeReadyToBeWithdrawnTitle: () =>
      t('pushPlatformNotificationsStakingLidoStakeReadyToBeWithdrawnTitle'),
    pushPlatformNotificationsStakingLidoStakeReadyToBeWithdrawnDescription:
      () =>
        t(
          'pushPlatformNotificationsStakingLidoStakeReadyToBeWithdrawnDescription',
        ),
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
  n: NotificationServicesController.Types.INotification,
) {
  return NotificationsServicesPushController.Utils.createOnChainPushNotificationMessage(
    n,
    translations,
  );
}

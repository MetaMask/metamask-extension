import type { NotificationServicesController } from '@metamask/notification-services-controller';
import { NotificationServicesPushController } from '@metamask/notification-services-controller';
import { t as translate } from '../../../../shared/lib/translate';

const t = (...args: Parameters<typeof translate>) => translate(...args) ?? '';

const walletNotifTranslations: NotificationServicesPushController.Utils.TranslationKeys =
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

const perpsTranslations = {
  PositionLiquidatedTitle: () => t('pushNotificationPositionLiquidatedTitle'),
  PositionLiquidatedDescriptionLong: (symbol: string) =>
    t('pushNotificationPositionLiquidatedDescriptionLong', symbol),
  PositionLiquidatedDescriptionShort: (symbol: string) =>
    t('pushNotificationPositionLiquidatedDescriptionShort', symbol),
  StopLossTriggeredTitle: () => t('pushNotificationStopLossTriggeredTitle'),
  StopLossTriggeredDescriptionLong: (symbol: string) =>
    t('pushNotificationStopLossTriggeredDescriptionLong', symbol),
  StopLossTriggeredDescriptionShort: (symbol: string) =>
    t('pushNotificationStopLossTriggeredDescriptionShort', symbol),
  TakeProfitTriggeredTitle: () => t('pushNotificationTakeProfitTriggeredTitle'),
  TakeProfitTriggeredDescriptionLong: (symbol: string) =>
    t('pushNotificationTakeProfitTriggeredDescriptionLong', symbol),
  TakeProfitTriggeredDescriptionShort: (symbol: string) =>
    t('pushNotificationTakeProfitTriggeredDescriptionShort', symbol),
  LimitOrderFilledTitle: () => t('pushNotificationLimitOrderFilledTitle'),
  LimitOrderFilledDescriptionLong: (symbol: string) =>
    t('pushNotificationLimitOrderFilledDescriptionLong', symbol),
  LimitOrderFilledDescriptionShort: (symbol: string) =>
    t('pushNotificationLimitOrderFilledDescriptionShort', symbol),
};

const translations = {
  ...walletNotifTranslations,
  ...perpsTranslations,
};

export function createNotificationMessage(
  n: NotificationServicesController.Types.INotification,
) {
  return NotificationServicesPushController.Utils.createOnChainPushNotificationMessage(
    n,
    translations,
  );
}

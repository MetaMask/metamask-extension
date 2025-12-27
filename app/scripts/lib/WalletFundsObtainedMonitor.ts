import { Messenger } from '@metamask/messenger';
import type {
  TokenBalancesControllerGetStateAction,
  MultichainBalancesControllerGetStateAction,
} from '@metamask/assets-controllers';
import type {
  INotification,
  NotificationServicesControllerGetStateAction,
  NotificationListUpdatedEvent,
} from '@metamask/notification-services-controller/notification-services';
import { TRIGGER_TYPES } from '@metamask/notification-services-controller/notification-services';
import log from 'loglevel';
import type { MetaMetricsControllerTrackEventAction } from '../controllers/metametrics-controller';
import type { AppStateControllerSetCanTrackWalletFundsObtainedAction } from '../controllers/app-state-controller';
import type { OnboardingControllerGetStateAction } from '../controllers/onboarding';
import {
  hasNonZeroTokenBalance,
  hasNonZeroMultichainBalance,
  getWalletFundsObtainedEventProperties,
} from '../../../shared/lib/wallet-funds-obtained-metric';
import { FirstTimeFlowType } from '../../../shared/constants/onboarding';

type WalletFundsObtainedMonitorAllowedEvents = NotificationListUpdatedEvent;

type WalletFundsObtainedMonitorAllowedActions =
  | MetaMetricsControllerTrackEventAction
  | TokenBalancesControllerGetStateAction
  | MultichainBalancesControllerGetStateAction
  | OnboardingControllerGetStateAction
  | NotificationServicesControllerGetStateAction
  | AppStateControllerSetCanTrackWalletFundsObtainedAction;

export type WalletFundsObtainedMonitorMessenger = Messenger<
  'WalletFundsObtainedMonitor',
  WalletFundsObtainedMonitorAllowedActions,
  WalletFundsObtainedMonitorAllowedEvents
>;

/**
 * Monitors and tracks when a newly created wallet first receives funds.
 * This class subscribes to notification events and tracks the first time
 * a wallet receives ETH or ERC20 tokens.
 */
export class WalletFundsObtainedMonitor {
  readonly #messenger: WalletFundsObtainedMonitorMessenger;

  #listenerSetup = false;

  #handleWalletFundingNotification:
    | ((notifications: INotification[]) => void)
    | null = null;

  /**
   * @param options - Constructor options
   * @param options.messenger - Restricted messenger for accessing controller actions/events
   */
  constructor({
    messenger,
  }: {
    messenger: WalletFundsObtainedMonitorMessenger;
  }) {
    this.#messenger = messenger;
  }

  /**
   * Checks if user has an existing balance in tokenBalancesState or multichainBalancesState
   *
   * @returns true if an existing balance is found
   */
  #hasExistingFunds(): boolean {
    try {
      const tokenBalancesState = this.#messenger.call(
        'TokenBalancesController:getState',
      );
      const multichainBalancesState = this.#messenger.call(
        'MultichainBalancesController:getState',
      );

      return (
        hasNonZeroTokenBalance(tokenBalancesState.tokenBalances) ||
        hasNonZeroMultichainBalance(multichainBalancesState.balances)
      );
    } catch (error) {
      log.error('Error checking for existing funds: ', error);
      return false;
    }
  }

  /**
   * Detects and tracks the first wallet funding event from ETH/ERC20 received notifications.
   */
  #createWalletFundingNotificationHandler() {
    return (notifications: INotification[]) => {
      // Filter for erc20 or eth received notifications
      const filteredNotifications = notifications.filter(
        (
          n,
        ): n is Extract<
          INotification,
          { type: TRIGGER_TYPES.ERC20_RECEIVED | TRIGGER_TYPES.ETH_RECEIVED }
        > =>
          n.type === TRIGGER_TYPES.ERC20_RECEIVED ||
          n.type === TRIGGER_TYPES.ETH_RECEIVED,
      );

      if (filteredNotifications.length < 1) {
        return;
      }

      // Use the last (oldest) notification
      const lastNotification = filteredNotifications.at(-1);
      if (!lastNotification) {
        return;
      }
      const {
        payload: { chain_id: chainId },
      } = lastNotification;

      // ERC20 transfers have `token` object, native transfers have `amount` object
      const amountUsd =
        lastNotification.type === TRIGGER_TYPES.ERC20_RECEIVED
          ? lastNotification.payload.data.token.usd
          : lastNotification.payload.data.amount.usd;

      if (chainId && amountUsd) {
        this.#messenger.call(
          'MetaMetricsController:trackEvent',
          getWalletFundsObtainedEventProperties({
            chainId,
            amountUsd,
          }),
        );

        this.#messenger.call(
          'AppStateController:setCanTrackWalletFundsObtained',
          false,
        );

        if (this.#handleWalletFundingNotification) {
          this.#messenger.unsubscribe(
            'NotificationServicesController:notificationsListUpdated',
            this.#handleWalletFundingNotification,
          );
          this.#handleWalletFundingNotification = null;
        }
      }
    };
  }

  /**
   * Sets up monitoring to detect and track when a non-imported wallet first receives funds
   * via ERC20 or ETH received events from the notification service.
   */
  setupMonitoring(): void {
    // Avoid setting up the listener multiple times
    if (this.#listenerSetup) {
      return;
    }

    // Only target created wallets (not imported or restored)
    const onboardingState = this.#messenger.call(
      'OnboardingController:getState',
    );
    const { firstTimeFlowType } = onboardingState;

    if (
      firstTimeFlowType !== FirstTimeFlowType.create &&
      firstTimeFlowType !== FirstTimeFlowType.socialCreate
    ) {
      this.#messenger.call(
        'AppStateController:setCanTrackWalletFundsObtained',
        false,
      );
      return;
    }

    // Only target wallets with notifications enabled
    const notificationServicesState = this.#messenger.call(
      'NotificationServicesController:getState',
    );

    if (!notificationServicesState.isNotificationServicesEnabled) {
      this.#messenger.call(
        'AppStateController:setCanTrackWalletFundsObtained',
        false,
      );
      return;
    }

    if (this.#hasExistingFunds()) {
      this.#messenger.call(
        'AppStateController:setCanTrackWalletFundsObtained',
        false,
      );
    } else {
      this.#handleWalletFundingNotification =
        this.#createWalletFundingNotificationHandler();
      this.#messenger.subscribe(
        'NotificationServicesController:notificationsListUpdated',
        this.#handleWalletFundingNotification,
      );
      this.#listenerSetup = true;
    }
  }
}

import { Messenger } from '@metamask/messenger';
import {
  COHORT_NAMES,
  PAYMENT_TYPES,
  PRODUCT_TYPES,
  StartSubscriptionRequest,
  Subscription,
  UpdatePaymentMethodOpts,
} from '@metamask/subscription-controller';
import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import log from 'loglevel';
import { KeyringTypes } from '@metamask/keyring-controller';
import {
  CaipAccountId,
  Json,
  parseCaipChainId,
  toCaipAccountId,
} from '@metamask/utils';
import { isEqualCaseInsensitive } from '@metamask/controller-utils';
import ExtensionPlatform from '../../platforms/extension';
import { WebAuthenticator } from '../oauth/types';
import { isSendBundleSupported } from '../../lib/transaction/sentinel-api';
import { getIsSmartTransaction } from '../../../../shared/modules/selectors';
// TODO: Migrate to shared directory and remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { fetchSwapsFeatureFlags } from '../../../../ui/pages/swaps/swaps.util';
import { SwapsControllerState } from '../../controllers/swaps/swaps.types';
import {
  formatCaptureShieldPaymentMethodChangeEventProps,
  getSubscriptionRequestTrackingProps,
  getUserAccountTypeAndCategory,
  getUserBalanceCategory,
} from '../../../../shared/modules/shield/metrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { SECOND } from '../../../../shared/constants/time';
import {
  getIsShieldSubscriptionActive,
  getIsShieldSubscriptionPaused,
  getShieldSubscription,
} from '../../../../shared/lib/shield';
import { SHIELD_ERROR } from '../../../../shared/modules/shield';
import {
  SubscriptionServiceAction,
  SubscriptionServiceEvent,
  SubscriptionServiceOptions,
  SERVICE_NAME,
  ServiceName,
} from './types';

const SUBSCRIPTION_POLL_INTERVAL = 5 * SECOND;
const SUBSCRIPTION_POLL_TIMEOUT = 60 * SECOND;

export class SubscriptionService {
  // Required for modular initialisation.
  name: ServiceName = SERVICE_NAME;

  state = null;

  #messenger: Messenger<
    typeof SERVICE_NAME,
    SubscriptionServiceAction,
    SubscriptionServiceEvent
  >;

  #platform: ExtensionPlatform;

  #webAuthenticator: WebAuthenticator;

  constructor({
    messenger,
    platform,
    webAuthenticator,
  }: SubscriptionServiceOptions) {
    this.#messenger = messenger;
    this.#platform = platform;
    this.#webAuthenticator = webAuthenticator;

    this.#messenger.registerActionHandler(
      `${SERVICE_NAME}:submitSubscriptionSponsorshipIntent`,
      this.submitSubscriptionSponsorshipIntent.bind(this),
    );
  }

  async updateSubscriptionCardPaymentMethod(
    params: Extract<UpdatePaymentMethodOpts, { paymentType: 'card' }>,
    currentTabId?: number,
  ) {
    const { paymentType } = params;
    if (paymentType !== PAYMENT_TYPES.byCard) {
      throw new Error('Only card payment type is supported');
    }

    const redirectUrl = this.#webAuthenticator.getRedirectURL();

    const { redirectUrl: checkoutSessionUrl } = (await this.#messenger.call(
      'SubscriptionController:updatePaymentMethod',
      {
        ...params,
        successUrl: redirectUrl,
      },
    )) as { redirectUrl: string };

    // skipping redirect and open new tab in test environment
    if (!process.env.IN_TEST) {
      await this.#openAndWaitForTabToClose({
        url: checkoutSessionUrl,
        successUrl: redirectUrl,
      });

      if (!currentTabId) {
        // open extension browser shield settings if open from pop up (no current tab)
        this.#platform.openExtensionInBrowser('/settings/transaction-shield');
      }
    }

    const subscriptions = await this.#messenger.call(
      'SubscriptionController:getSubscriptions',
    );

    return subscriptions;
  }

  async updateSubscriptionCryptoPaymentMethod(
    params: Extract<UpdatePaymentMethodOpts, { paymentType: 'crypto' }>,
  ) {
    const { paymentType } = params;
    if (paymentType !== PAYMENT_TYPES.byCrypto) {
      throw new Error('Only crypto payment type is supported');
    }

    await this.#messenger.call(
      'SubscriptionController:updatePaymentMethod',
      params,
    );

    const subscriptions = await this.#messenger.call(
      'SubscriptionController:getSubscriptions',
    );

    return subscriptions;
  }

  async startSubscriptionWithCard(
    params: StartSubscriptionRequest,
    currentTabId?: number,
    subscriptionPollInterval?: number,
    subscriptionPollTimeout?: number,
  ) {
    const currentShieldSubscription =
      await this.#getCurrentShieldSubscription();
    try {
      const redirectUrl = this.#webAuthenticator.getRedirectURL();

      // check if the account is opted in to rewards
      const rewardAccountId = await this.#getRewardCaipAccountId();

      const { checkoutSessionUrl } = await this.#messenger.call(
        'SubscriptionController:startShieldSubscriptionWithCard',
        {
          ...params,
          successUrl: redirectUrl,
          rewardAccountId,
        },
      );

      // skipping redirect and open new tab in test environment
      if (!process.env.IN_TEST) {
        await this.#openAndWaitForTabToClose({
          url: checkoutSessionUrl,
          successUrl: redirectUrl,
        });

        if (!currentTabId) {
          // open extension browser shield settings if open from pop up (no current tab)
          this.#platform.openExtensionInBrowser(
            // need `waitForSubscriptionCreation` param to wait for subscription creation happen in the background and not redirect to the shield plan page immediately
            '/settings/transaction-shield?waitForSubscriptionCreation=true',
          );
        }
      }

      // Poll subscriptions until active or paused subscription is created (stripe webhook may be delayed)
      const subscriptions = await this.#pollForSubscription(
        subscriptionPollInterval,
        subscriptionPollTimeout,
      );
      this.#trackSubscriptionRequestEvent(
        'completed',
        currentShieldSubscription,
      );

      // Track the shield opt in rewards event if the reward account id and reward points are provided
      if (rewardAccountId) {
        this.#trackShieldOptInRewardsEvent('create_new_subscription');
      }
      return subscriptions;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.#trackSubscriptionRequestEvent(
        'failed',
        currentShieldSubscription,
        undefined,
        {
          error: errorMessage,
        },
      );

      // fetch latest subscriptions to update the state in case subscription already created error (not when polling timed out)
      if (errorMessage.toLocaleLowerCase().includes('already exists')) {
        await this.#messenger.call('SubscriptionController:getSubscriptions');
      }
      throw error;
    }
  }

  /**
   * Handles the shield subscription approval transaction after confirm
   *
   * @param txMeta - The transaction metadata.
   * @returns Promise<void> - resolves when the transaction is submitted successfully.
   */
  async handlePostTransaction(txMeta: TransactionMeta) {
    // Assign the shield eligibility cohort if the conditions are met
    this.#assignPostTxCohort(txMeta);

    if (txMeta.type !== TransactionType.shieldSubscriptionApprove) {
      return;
    }

    // handle shield subscription approval transaction
    await this.#handleShieldSubscriptionApproveTransaction(txMeta);
  }

  async submitSubscriptionSponsorshipIntent(txMeta: TransactionMeta) {
    const { chainId, type, txParams, actionId, id } = txMeta;
    if (type !== TransactionType.shieldSubscriptionApprove) {
      return;
    }

    const transactions =
      this.#messenger.call('TransactionController:getTransactions') || [];
    const existingTxMeta = transactions?.find(
      (tx) => (actionId && tx.actionId === actionId) || tx.id === id,
    );
    // If the transaction already exists, we don't need to submit the sponsorship intent again
    if (existingTxMeta) {
      return;
    }

    const isSmartTransactionEnabled =
      await this.#getIsSmartTransactionEnabled(chainId);
    if (!isSmartTransactionEnabled) {
      return;
    }

    try {
      await this.#messenger.call(
        'SubscriptionController:submitSponsorshipIntents',
        {
          chainId,
          address: txParams.from as `0x${string}`,
          products: [PRODUCT_TYPES.SHIELD],
        },
      );
    } catch (error) {
      log.error('Failed to submit sponsorship intent', error);
    }
  }

  /**
   * Link the reward to the existing shield subscription.
   *
   * @param subscriptionId - Shield subscription ID to link the reward to.
   * @param rewardPoints - The reward points.
   * @returns Promise<void> - The reward subscription ID or undefined if the season is not active or the primary account is not opted in to rewards.
   */
  async linkRewardToExistingSubscription(
    subscriptionId: string,
    rewardPoints: number,
  ) {
    try {
      const rewardAccountId = await this.#getRewardCaipAccountId();
      if (!rewardAccountId) {
        return;
      }

      await this.#messenger.call('SubscriptionController:linkRewards', {
        subscriptionId,
        rewardAccountId,
      });

      if (rewardAccountId && rewardPoints) {
        this.#trackShieldOptInRewardsEvent(
          'link_existing_subscription',
          rewardPoints,
        );
      }
    } catch (error) {
      log.error('Failed to link reward to existing subscription', error);
    }
  }

  async #openAndWaitForTabToClose(params: { url: string; successUrl: string }) {
    const openedTab = await this.#platform.openTab({ url: params.url });

    await new Promise<void>((resolve, reject) => {
      let succeeded = false;
      // Set up a listener to watch for navigation on that specific tab
      const onTabUpdatedListener = (
        tabId: number,
        changeInfo: { url: string },
      ) => {
        // We only care about updates to our specific checkout tab
        if (
          tabId === openedTab.id &&
          changeInfo.url?.startsWith(params.successUrl)
        ) {
          // Payment was successful!
          succeeded = true;

          // Clean up: close the tab
          this.#platform.closeTab(tabId);
        }
        // TODO: handle cancel url ?
      };
      this.#platform.addTabUpdatedListener(onTabUpdatedListener);

      // Set up a listener to watch for tab removal
      const onTabRemovedListener = (tabId: number) => {
        const cleanupListeners = () => {
          this.#platform.removeTabUpdatedListener(onTabUpdatedListener);
          this.#platform.removeTabRemovedListener(onTabRemovedListener);
        };
        if (tabId === openedTab.id) {
          cleanupListeners();
          if (succeeded) {
            resolve();
          } else {
            reject(new Error(SHIELD_ERROR.tabActionFailed));
          }
        }
      };
      this.#platform.addTabRemovedListener(onTabRemovedListener);
    });
  }

  /**
   * Poll for active subscription until one is found or timeout.
   * This is needed because Stripe webhook may be delayed after card payment.
   *
   * @param interval
   * @param timeout
   * @returns Promise<Subscription[]> - The subscriptions when an active one is found.
   */
  async #pollForSubscription(
    interval: number = SUBSCRIPTION_POLL_INTERVAL,
    timeout: number = SUBSCRIPTION_POLL_TIMEOUT,
  ): Promise<Subscription[]> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const subscriptions = await this.#messenger.call(
        'SubscriptionController:getSubscriptions',
      );

      if (
        getIsShieldSubscriptionActive(subscriptions) ||
        getIsShieldSubscriptionPaused(subscriptions)
      ) {
        return subscriptions;
      }

      await new Promise((resolve) => setTimeout(resolve, interval));
    }

    throw new Error(SHIELD_ERROR.subscriptionPollingTimedOut);
  }

  async #handleShieldSubscriptionApproveTransaction(txMeta: TransactionMeta) {
    const { isGasFeeSponsored, chainId } = txMeta;
    const bundlerSupported = await isSendBundleSupported(chainId);
    const isSponsored = Boolean(isGasFeeSponsored && bundlerSupported);
    const currentShieldSubscription =
      await this.#getCurrentShieldSubscription();
    const isCurrentShieldSubscriptionActive = getIsShieldSubscriptionActive(
      currentShieldSubscription ?? [],
    );

    try {
      if (!isCurrentShieldSubscriptionActive) {
        // If there is no active subscription, we can assume this is a new/renew subscription request
        this.#trackSubscriptionRequestEvent(
          'started',
          currentShieldSubscription,
          txMeta,
          {
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            has_sufficient_crypto_balance: true,
          },
        );
      }

      const rewardAccountId = await this.#getRewardCaipAccountId();

      await this.#messenger.call(
        'SubscriptionController:submitShieldSubscriptionCryptoApproval',
        txMeta,
        isSponsored,
        rewardAccountId,
      );

      if (currentShieldSubscription && isCurrentShieldSubscriptionActive) {
        // If there is an active subscription, we can assume this is a Payment Method Change request
        this.#trackPaymentMethodChangeRequestEvent(
          'succeeded',
          currentShieldSubscription,
          txMeta,
        );
      } else {
        // If there is no active subscription, we can assume this is a new/renew subscription request
        this.#trackSubscriptionRequestEvent(
          'completed',
          currentShieldSubscription,
          txMeta,
          {
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            gas_sponsored: isSponsored || false,
          },
        );
      }
    } catch (error) {
      log.error('Error on Shield subscription approval transaction', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      if (currentShieldSubscription && isCurrentShieldSubscriptionActive) {
        // If there is an active subscription, we can assume this is a Payment Method Change request
        this.#trackPaymentMethodChangeRequestEvent(
          'failed',
          currentShieldSubscription,
          txMeta,
          {
            error: errorMessage,
          },
        );
      } else {
        // If there is no active subscription, we can assume this is a new/renew subscription request
        this.#trackSubscriptionRequestEvent(
          'failed',
          currentShieldSubscription,
          txMeta,
          {
            error: errorMessage,
          },
        );
      }
      throw error;
    }
  }

  async #getIsSmartTransactionEnabled(chainId: `0x${string}`) {
    const swapsControllerState = await this.#getSwapsFeatureFlagsFromNetwork();
    const uiState = {
      metamask: {
        ...swapsControllerState,
        ...this.#messenger.call('AccountsController:getState'),
        ...this.#messenger.call('PreferencesController:getState'),
        ...this.#messenger.call('SmartTransactionsController:getState'),
        ...this.#messenger.call('NetworkController:getState'),
      },
    };
    // @ts-expect-error Smart transaction selector types does not match controller state
    const isSmartTransaction = getIsSmartTransaction(uiState, chainId);
    const isSendBundleSupportedChain = await isSendBundleSupported(chainId);

    return isSendBundleSupportedChain && isSmartTransaction;
  }

  async #getSwapsFeatureFlagsFromNetwork(): Promise<
    SwapsControllerState | undefined
  > {
    const swapsControllerState = this.#messenger.call(
      'SwapsController:getState',
    );
    const { swapsFeatureFlags } = swapsControllerState.swapsState;
    try {
      if (!swapsFeatureFlags || Object.keys(swapsFeatureFlags).length === 0) {
        const updatedSwapsFeatureFlags = await fetchSwapsFeatureFlags();
        if (!updatedSwapsFeatureFlags) {
          return swapsControllerState;
        }
        return {
          ...swapsControllerState,
          swapsState: {
            ...swapsControllerState.swapsState,
            swapsFeatureFlags: updatedSwapsFeatureFlags,
          },
        };
      }
    } catch (error) {
      log.error('Failed to fetch swaps feature flags', error);
      return swapsControllerState;
    }
    return swapsControllerState;
  }

  #getAccountTypeAndCategoryForMetrics() {
    const { internalAccounts } = this.#messenger.call(
      'AccountsController:getState',
    );
    const selectedInternalAccount =
      internalAccounts.accounts[internalAccounts.selectedAccount];
    const keyringsMetadata = this.#messenger.call('KeyringController:getState');
    const hdKeyringsMetadata = keyringsMetadata.keyrings.filter(
      (keyring) => keyring.type === KeyringTypes.hd,
    );

    return getUserAccountTypeAndCategory(
      selectedInternalAccount,
      hdKeyringsMetadata,
    );
  }

  /**
   * Get the reward subscription ID for the current season.
   *
   * @returns Promise<string | undefined> - The reward subscription ID or undefined if the season is not active.
   */
  async #getRewardCaipAccountId(): Promise<CaipAccountId | undefined> {
    try {
      const currentSeasonMetadata = await this.#messenger.call(
        'RewardsController:getSeasonMetadata',
        'current',
      );
      const { startDate, endDate } = currentSeasonMetadata;
      const currentTimeStamp = Date.now();
      if (currentTimeStamp < startDate || currentTimeStamp > endDate) {
        return undefined;
      }

      // if payer address is not provided or not opted in to rewards, fallback to use the primary account
      const primaryCaipAccountId = await this.#getPrimaryCaipAccountId();
      if (!primaryCaipAccountId) {
        return undefined;
      }

      const hasAccountOptedIn = await this.#messenger.call(
        'RewardsController:getHasAccountOptedIn',
        primaryCaipAccountId,
      );
      return hasAccountOptedIn ? primaryCaipAccountId : undefined;
    } catch (error) {
      log.warn('Failed to get reward season metadata', error);
      return undefined;
    }
  }

  /**
   * Get the primary CAIP account ID.
   *
   * @returns Promise<CaipAccountId | undefined> - The primary CAIP account ID.
   */
  async #getPrimaryCaipAccountId(): Promise<CaipAccountId | undefined> {
    try {
      const keyringsMetadata = this.#messenger.call(
        'KeyringController:getState',
      );
      const primaryHdKeyring = keyringsMetadata.keyrings.find(
        (keyring) => keyring.type === KeyringTypes.hd,
      );
      if (!primaryHdKeyring) {
        return undefined;
      }

      const { internalAccounts } = this.#messenger.call(
        'AccountsController:getState',
      );
      const primaryInternalAccount = Object.values(
        internalAccounts.accounts,
      ).find((account) => {
        const entropySource = account.options?.entropySource;
        if (typeof entropySource === 'string') {
          return isEqualCaseInsensitive(
            entropySource,
            primaryHdKeyring.metadata.id,
          );
        }
        return false;
      });
      if (!primaryInternalAccount) {
        return undefined;
      }

      const { namespace, reference } = parseCaipChainId(
        primaryInternalAccount.scopes[0],
      );

      return toCaipAccountId(
        namespace,
        reference,
        primaryInternalAccount.address,
      );
    } catch (error) {
      log.warn(
        '[getPrimaryCaipAccountId] Failed to get primary CAIP account ID',
        error,
      );
      return undefined;
    }
  }

  /**
   * Assign the post tx cohort after the transaction is confirmed.
   *
   * @param txMeta - The transaction metadata.
   */
  #assignPostTxCohort(txMeta: TransactionMeta) {
    try {
      if (!txMeta.type) {
        return;
      }

      // Mark send/transfer/swap transactions for Shield post_tx cohort evaluation
      const isPostTxTransaction = [
        TransactionType.simpleSend,
        TransactionType.tokenMethodTransfer,
        TransactionType.swap,
        TransactionType.swapAndSend,
      ].includes(txMeta.type);

      const { pendingShieldCohort, shieldSubscriptionMetricsProps } =
        this.#messenger.call('AppStateController:getState');
      if (isPostTxTransaction && !pendingShieldCohort) {
        this.#messenger.call(
          'AppStateController:setPendingShieldCohort',
          COHORT_NAMES.POST_TX,
          txMeta.type,
        );

        // Track the Shield eligibility cohort assigned event
        this.#messenger.call('MetaMetricsController:trackEvent', {
          event: MetaMetricsEventName.ShieldEligibilityCohortAssigned,
          category: MetaMetricsEventCategory.Shield,
          properties: {
            ...this.#getAccountTypeAndCategoryForMetrics(),
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            multi_chain_balance_category: getUserBalanceCategory(
              shieldSubscriptionMetricsProps?.userBalanceInUSD ?? 0,
            ),
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            assigned_cohort: COHORT_NAMES.POST_TX,
          },
        });
      }
    } catch (error) {
      log.error('Failed to assign post tx cohort', error);
    }
  }

  /**
   * Track the subscription request event.
   *
   * @param requestStatus - The request status.
   * @param currentShieldSubscription - The current Shield subscription (before making new subscription request).
   * @param transactionMeta - The transaction meta (for crypto subscription requests).
   * @param extrasProps - The extra properties.
   */
  #trackSubscriptionRequestEvent(
    requestStatus: 'started' | 'completed' | 'failed',
    currentShieldSubscription?: Subscription,
    transactionMeta?: TransactionMeta,
    extrasProps?: Record<string, Json>,
  ) {
    if (
      transactionMeta &&
      transactionMeta.type !== TransactionType.shieldSubscriptionApprove
    ) {
      return;
    }

    const subscriptionControllerState = this.#messenger.call(
      'SubscriptionController:getState',
    );
    const appStateControllerState = this.#messenger.call(
      'AppStateController:getState',
    );
    const {
      defaultSubscriptionPaymentOptions,
      shieldSubscriptionMetricsProps,
    } = appStateControllerState;

    const accountTypeAndCategory = this.#getAccountTypeAndCategoryForMetrics();

    const trackingProps = getSubscriptionRequestTrackingProps(
      subscriptionControllerState,
      currentShieldSubscription || subscriptionControllerState.lastSubscription,
      defaultSubscriptionPaymentOptions,
      shieldSubscriptionMetricsProps,
      transactionMeta,
    );

    this.#messenger.call('MetaMetricsController:trackEvent', {
      event: MetaMetricsEventName.ShieldSubscriptionRequest,
      category: MetaMetricsEventCategory.Shield,
      properties: {
        ...accountTypeAndCategory,
        ...trackingProps,
        ...extrasProps,
        status: requestStatus,
      },
    });
  }

  /**
   * Track the subscription payment method change request event.
   *
   * @param changeStatus - The change status.
   * @param previousSubscription - The previous active subscription (before the payment method change request).
   * @param transactionMeta - The transaction meta (for crypto subscription requests).
   * @param extrasProps - The extra properties.
   */
  #trackPaymentMethodChangeRequestEvent(
    changeStatus: 'succeeded' | 'failed',
    previousSubscription: Subscription,
    transactionMeta?: TransactionMeta,
    extrasProps?: Record<string, Json>,
  ) {
    if (
      transactionMeta &&
      transactionMeta.type !== TransactionType.shieldSubscriptionApprove
    ) {
      return;
    }

    const subscriptionControllerState = this.#messenger.call(
      'SubscriptionController:getState',
    );

    const accountTypeAndCategory = this.#getAccountTypeAndCategoryForMetrics();
    const trackingProps = formatCaptureShieldPaymentMethodChangeEventProps(
      subscriptionControllerState,
      previousSubscription,
      transactionMeta,
    );

    this.#messenger.call('MetaMetricsController:trackEvent', {
      event: MetaMetricsEventName.ShieldPaymentMethodChange,
      category: MetaMetricsEventCategory.Shield,
      properties: {
        ...accountTypeAndCategory,
        ...trackingProps,
        ...extrasProps,
        status: changeStatus,
      },
    });
  }

  #trackShieldOptInRewardsEvent(
    rewardsOptInType: 'create_new_subscription' | 'link_existing_subscription',
    rewardPoints?: number,
  ) {
    const accountTypeAndCategory = this.#getAccountTypeAndCategoryForMetrics();

    const { shieldSubscriptionMetricsProps } = this.#messenger.call(
      'AppStateController:getState',
    );

    const claimedRewardPoints =
      rewardPoints ?? shieldSubscriptionMetricsProps?.rewardPoints;
    if (!claimedRewardPoints) {
      return;
    }

    this.#messenger.call('MetaMetricsController:trackEvent', {
      event: MetaMetricsEventName.ShieldOptInRewards,
      category: MetaMetricsEventCategory.Shield,
      properties: {
        ...accountTypeAndCategory,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        multi_chain_balance_category: getUserBalanceCategory(
          shieldSubscriptionMetricsProps?.userBalanceInUSD ?? 0,
        ),
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        rewards_point: claimedRewardPoints,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        rewards_opt_in_type: rewardsOptInType,
      },
    });
  }

  async #getCurrentShieldSubscription(): Promise<Subscription | undefined> {
    const subscriptions = await this.#messenger.call(
      'SubscriptionController:getSubscriptions',
    );
    return getShieldSubscription(subscriptions);
  }
}

import { Messenger } from '@metamask/messenger';
import {
  PAYMENT_TYPES,
  PRODUCT_TYPES,
  StartSubscriptionRequest,
  UpdatePaymentMethodOpts,
} from '@metamask/subscription-controller';
import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import log from 'loglevel';
import ExtensionPlatform from '../../platforms/extension';
import { WebAuthenticator } from '../oauth/types';
import { isSendBundleSupported } from '../../lib/transaction/sentinel-api';
import { getIsSmartTransaction } from '../../../../shared/modules/selectors';
// TODO: Migrate to shared directory and remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { fetchSwapsFeatureFlags } from '../../../../ui/pages/swaps/swaps.util';
import { SwapsControllerState } from '../../controllers/swaps/swaps.types';
import {
  SubscriptionServiceAction,
  SubscriptionServiceEvent,
  SubscriptionServiceOptions,
  SERVICE_NAME,
  ServiceName,
} from './types';

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

    await this.#openAndWaitForTabToClose({
      url: checkoutSessionUrl,
      successUrl: redirectUrl,
    });

    if (!currentTabId) {
      // open extension browser shield settings if open from pop up (no current tab)
      this.#platform.openExtensionInBrowser('/settings/transaction-shield');
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
  ) {
    const redirectUrl = this.#webAuthenticator.getRedirectURL();

    const { checkoutSessionUrl } = await this.#messenger.call(
      'SubscriptionController:startShieldSubscriptionWithCard',
      {
        ...params,
        successUrl: redirectUrl,
      },
    );

    await this.#openAndWaitForTabToClose({
      url: checkoutSessionUrl,
      successUrl: redirectUrl,
    });

    if (!currentTabId) {
      // open extension browser shield settings if open from pop up (no current tab)
      this.#platform.openExtensionInBrowser(
        // need `waitForSubscriptionCreation` param to wait for subscription creation happen in the background and not redirect to the shield plan page immediately
        '/settings/transaction-shield/?waitForSubscriptionCreation=true',
      );
    }

    const subscriptions = await this.#messenger.call(
      'SubscriptionController:getSubscriptions',
    );
    return subscriptions;
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
            reject(new Error('Tab action failed'));
          }
        }
      };
      this.#platform.addTabRemovedListener(onTabRemovedListener);
    });
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
}

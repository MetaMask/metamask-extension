import { RestrictedMessenger } from '@metamask/base-controller';
import {
  PAYMENT_TYPES,
  StartSubscriptionRequest,
  UpdatePaymentMethodOpts,
} from '@metamask/subscription-controller';
import ExtensionPlatform from '../../platforms/extension';
import { WebAuthenticator } from '../oauth/types';
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

  #messenger: RestrictedMessenger<
    typeof SERVICE_NAME,
    SubscriptionServiceAction,
    SubscriptionServiceEvent,
    SubscriptionServiceAction['type'],
    SubscriptionServiceEvent['type']
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
      this.#platform.openExtensionInBrowser('/settings/transaction-shield');
    }

    const subscriptions = await this.#messenger.call(
      'SubscriptionController:getSubscriptions',
    );
    return subscriptions;
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
        if (tabId === openedTab.id && changeInfo.url) {
          if (changeInfo.url.startsWith(params.successUrl)) {
            // Payment was successful!
            succeeded = true;

            // Clean up: close the tab
            this.#platform.closeTab(tabId);
          }
          // TODO: handle cancel url ?
        }
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
}

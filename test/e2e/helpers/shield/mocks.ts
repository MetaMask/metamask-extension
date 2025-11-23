import { USER_STORAGE_FEATURE_NAMES } from '@metamask/profile-sync-controller/user-storage';
import { Mockttp } from 'mockttp';
import { UserStorageMockttpController } from '../identity/user-storage/userStorageMockttpController';
import { BASE_SHIELD_SUBSCRIPTION, BASE_SUBSCRIPTION_API_URL, CLAIMS_API, MOCK_CHECKOUT_SESSION_URL, MOCK_CLAIM_2, MOCK_CLAIMS_CONFIGURATION_RESPONSE, MOCK_CLAIMS_RESPONSE, MOCK_COHORT_ASSIGNMENT_RESPONSE, SUBMIT_CLAIMS_RESPONSE, SHIELD_PRICING_DATA, SHIELD_USER_EVENTS_RESPONSE, SUBSCRIPTION_API, MOCK_CLAIM_GENERATE_MESSAGE_RESPONSE, MOCK_CLAIM_1 } from './constants';

export class ShieldMockttpService {
  #hasSubscribedToShield = false;

  #cancelAtPeriodEnd = false;

  #newClaimSubmitted = false;

  async setup(server: Mockttp, overrides?: {
    mockNotEligible?: boolean;
    isActiveUser?: boolean;
    subscriptionId?: string;
  }) {

    // Mock Identity Services first as shield/subscription APIs depend on it (Auth Token)
    const userStorageMockttpController = new UserStorageMockttpController();
    userStorageMockttpController.setupPath(
      USER_STORAGE_FEATURE_NAMES.accounts,
      server,
    );

    // Subscription APIs
    await this.#handleSubscriptionPricing(server);
    await this.#handleSubscriptionEligibility(server, overrides);
    await this.#handleGetSubscriptions(server, overrides);
    await this.#handleCreateSubscriptionByCard(server);
    await this.#handleCheckoutSession(server);
    await this.#handleCancelSubscription(server, overrides);
    await this.#handleRenewSubscription(server, overrides);
    await server
      .forPost(SUBSCRIPTION_API.USER_EVENTS)
      .thenJson(200, SHIELD_USER_EVENTS_RESPONSE);
    await server
      .forPost(SUBSCRIPTION_API.COHORT_ASSIGNMENT)
      .thenJson(200, MOCK_COHORT_ASSIGNMENT_RESPONSE);

    // Claims APIs
    await this.#handleGetClaimsConfigurations(server);
    await this.#handleGetClaims(server);
    await this.#handleClaimGenerateMessage(server);
    await this.#handleSubmitClaim(server);
  }

  async #handleSubscriptionPricing(server: Mockttp) {
    await server
      .forGet(SUBSCRIPTION_API.PRICING)
      .thenJson(200, SHIELD_PRICING_DATA);
  }

  async #handleSubscriptionEligibility(server: Mockttp, overrides?: {
    mockNotEligible?: boolean;
  }) {
    await server
      .forGet(SUBSCRIPTION_API.ELIGIBILITY)
      .always()
      .thenJson(200, [
        {
          canSubscribe: !overrides?.mockNotEligible,
          canViewEntryModal: true,
          minBalanceUSD: 1000,
          product: 'shield',
          modalType: 'A',
          cohorts: [
            {
              cohort: 'wallet_home',
              eligible: true,
              eligibilityRate: 1.0,
            },
            {
              cohort: 'post_tx',
              eligible: true,
              eligibilityRate: 1.0,
            },
          ],
          assignedCohort: null,
          hasAssignedCohortExpired: null,
        },
      ]);
  }

  async #handleCreateSubscriptionByCard(server: Mockttp) {
    // Mock card subscription creation endpoint
    await server
      .forPost(
        SUBSCRIPTION_API.CREATE_SUBSCRIPTION_BY_CARD,
      )
      .thenCallback(() => {
        this.#hasSubscribedToShield = true;
        return {
          statusCode: 200,
          json: {
            checkoutSessionUrl: MOCK_CHECKOUT_SESSION_URL,
          },
        };
      });
  }

  async #handleGetSubscriptions(server: Mockttp, overrides?: {
    isActiveUser?: boolean;
  }) {
    // GET subscriptions - returns data only if card subscription was requested
    // Using .always() to ensure this overrides global mocks
    await server
      .forGet(SUBSCRIPTION_API.SUBSCRIPTIONS)
      .always()
      .thenCallback(() => ({
        statusCode: 200,
        json: this.#hasSubscribedToShield || overrides?.isActiveUser
          ? {
              customerId: 'test_customer_id',
              subscriptions: [
                {
                  ...BASE_SHIELD_SUBSCRIPTION,
                  cancelAtPeriodEnd: this.#cancelAtPeriodEnd,
                }
              ],
              trialedProducts: ['shield'],
            }
          : {
              subscriptions: [],
              trialedProducts: [],
            },
      }));
  }

  async #handleCheckoutSession(server: Mockttp) {
    await server
      .forGet(MOCK_CHECKOUT_SESSION_URL)
      .thenCallback(() => ({
        statusCode: 302,
        headers: { Location: 'https://mock-redirect-url.com' },
      }));
  }

  async #handleCancelSubscription(server: Mockttp, overrides?: {
    subscriptionId?: string;
  }) {
    const subscriptionId = overrides?.subscriptionId || 'test_subscription_id';
    await server
      .forPost(
        `${BASE_SUBSCRIPTION_API_URL}/subscriptions/${subscriptionId}/cancel`,
      )
      .thenCallback(() => {
        this.#cancelAtPeriodEnd = true;
        return {
          statusCode: 200,
          json: { ...BASE_SHIELD_SUBSCRIPTION, cancelAtPeriodEnd: true },
        };
      })
  }

  async #handleRenewSubscription(server: Mockttp, overrides?: {
    subscriptionId?: string;
  }) {
    const subscriptionId = overrides?.subscriptionId || 'test_subscription_id';
    await server
      .forPost(
        `${BASE_SUBSCRIPTION_API_URL}/subscriptions/${subscriptionId}/uncancel`,
      )
      .thenCallback(() => {
        this.#cancelAtPeriodEnd = false;
        return {
          statusCode: 200,
          json: { ...BASE_SHIELD_SUBSCRIPTION, cancelAtPeriodEnd: false },
        };
      });
  }

  async #handleGetClaimsConfigurations(server: Mockttp) {
    await server
      .forGet(CLAIMS_API.CONFIGURATIONS)
      .thenJson(200, MOCK_CLAIMS_CONFIGURATION_RESPONSE);
  }

  async #handleGetClaims(server: Mockttp) {
    await server
      .forGet(CLAIMS_API.CLAIMS)
      .thenCallback(() => {
        return {
          statusCode: 200,
          json: this.#newClaimSubmitted ? [MOCK_CLAIM_2, MOCK_CLAIM_1] : MOCK_CLAIMS_RESPONSE,
        };
      });
  }

  // Mock the claim generate message endpoint
  // This endpoint is used to generate a message for the claim signature
  async #handleClaimGenerateMessage(server: Mockttp) {
    await server
      .forPost(CLAIMS_API.SIGNATURE)
      .thenJson(200, MOCK_CLAIM_GENERATE_MESSAGE_RESPONSE);
  }

  async #handleSubmitClaim(server: Mockttp) {
    await server
      .forPost(CLAIMS_API.CLAIMS)
      .thenCallback(() => {
        this.#newClaimSubmitted = true;
        return {
          statusCode: 200,
          json: SUBMIT_CLAIMS_RESPONSE,
        };
      });
  }
}

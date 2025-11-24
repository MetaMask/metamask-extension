import { USER_STORAGE_FEATURE_NAMES } from '@metamask/profile-sync-controller/user-storage';
import { Mockttp } from 'mockttp';
import { UserStorageMockttpController } from '../identity/user-storage/userStorageMockttpController';
import {
  BASE_SHIELD_SUBSCRIPTION,
  BASE_SHIELD_SUBSCRIPTION_CRYPTO,
  BASE_SHIELD_SUBSCRIPTION_CRYPTO_MONTHLY,
  BASE_SUBSCRIPTION_API_URL,
  CLAIMS_API,
  MOCK_CHECKOUT_SESSION_URL,
  MOCK_CLAIM_2,
  MOCK_CLAIMS_CONFIGURATION_RESPONSE,
  MOCK_CLAIMS_RESPONSE,
  MOCK_COHORT_ASSIGNMENT_RESPONSE,
  SUBMIT_CLAIMS_RESPONSE,
  SHIELD_PRICING_DATA,
  SHIELD_USER_EVENTS_RESPONSE,
  SUBSCRIPTION_API,
  MOCK_CLAIM_GENERATE_MESSAGE_RESPONSE,
  MOCK_CLAIM_1,
  RULESET_ENGINE_API,
} from './constants';

export class ShieldMockttpService {
  #hasSubscribedToShield = false;

  #hasSubscribedToShieldCrypto = false;

  #selectedInterval: 'month' | 'year' = 'year';

  #cancelAtPeriodEnd = false;

  #newClaimSubmitted = false;

  #coverageStatus: 'covered' | 'not_covered' = 'covered';

  async setup(
    server: Mockttp,
    overrides?: {
      mockNotEligible?: boolean;
      isActiveUser?: boolean;
      subscriptionId?: string;
      coverageStatus?: 'covered' | 'not_covered';
    },
  ) {
    // Mock Identity Services first as shield/subscription APIs depend on it (Auth Token)
    const userStorageMockttpController = new UserStorageMockttpController();
    userStorageMockttpController.setupPath(
      USER_STORAGE_FEATURE_NAMES.accounts,
      server,
    );

    // Set coverage status if provided
    if (overrides?.coverageStatus) {
      this.#coverageStatus = overrides.coverageStatus;
    }

    // Subscription APIs
    await this.#handleSubscriptionPricing(server);
    await this.#handleSubscriptionEligibility(server, overrides);
    await this.#handleGetSubscriptions(server, overrides);
    await this.#handleCreateSubscriptionByCard(server);
    await this.#handleCreateSubscriptionByCrypto(server);
    await this.#handleCryptoApprovalAmount(server);
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

    // Ruleset Engine APIs
    await this.#handleRulesetEngine(server);
  }

  async #handleSubscriptionPricing(server: Mockttp) {
    await server
      .forGet(SUBSCRIPTION_API.PRICING)
      .thenJson(200, SHIELD_PRICING_DATA);
  }

  async #handleSubscriptionEligibility(
    server: Mockttp,
    overrides?: {
      mockNotEligible?: boolean;
    },
  ) {
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
      .forPost(SUBSCRIPTION_API.CREATE_SUBSCRIPTION_BY_CARD)
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

  async #handleCreateSubscriptionByCrypto(server: Mockttp) {
    // Mock crypto subscription creation endpoint
    await server
      .forPost(SUBSCRIPTION_API.CREATE_SUBSCRIPTION_BY_CRYPTO)
      .thenCallback(async (request) => {
        this.#hasSubscribedToShieldCrypto = true;
        const body = (await request.body.getJson()) as {
          recurringInterval?: 'month' | 'year';
        };
        // Extract recurringInterval from request body
        if (body?.recurringInterval) {
          this.#selectedInterval =
            body.recurringInterval === 'month' ? 'month' : 'year';
        }
        return {
          statusCode: 200,
          json: [
            this.#selectedInterval === 'month'
              ? BASE_SHIELD_SUBSCRIPTION_CRYPTO_MONTHLY
              : BASE_SHIELD_SUBSCRIPTION_CRYPTO,
          ],
        };
      });
  }

  async #handleCryptoApprovalAmount(server: Mockttp) {
    // Mock crypto approval amount endpoint
    await server
      .forPost(SUBSCRIPTION_API.CRYPTO_APPROVAL_AMOUNT)
      .always()
      .thenJson(200, {
        approveAmount: '100000000', // 100 USDC/USDT with 6 decimals (100 * 10^6)
        paymentAddress: '0x1234567890123456789012345678901234567890',
        paymentTokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC or USDT
      });
  }

  async #handleGetSubscriptions(
    server: Mockttp,
    overrides?: {
      isActiveUser?: boolean;
    },
  ) {
    // GET subscriptions - returns data only if subscription was requested
    // Using .always() to ensure this overrides global mocks
    await server
      .forGet(SUBSCRIPTION_API.SUBSCRIPTIONS)
      .always()
      .thenCallback(() => {
        const hasSubscription =
          this.#hasSubscribedToShield ||
          this.#hasSubscribedToShieldCrypto ||
          overrides?.isActiveUser;

        if (!hasSubscription) {
          return {
            statusCode: 200,
            json: {
              subscriptions: [],
              trialedProducts: [],
            },
          };
        }

        // Return crypto subscription if crypto was subscribed, otherwise card
        if (this.#hasSubscribedToShieldCrypto) {
          const cryptoSubscription =
            this.#selectedInterval === 'month'
              ? BASE_SHIELD_SUBSCRIPTION_CRYPTO_MONTHLY
              : BASE_SHIELD_SUBSCRIPTION_CRYPTO;
          return {
            statusCode: 200,
            json: {
              customerId: 'test_customer_id',
              subscriptions: [
                {
                  ...cryptoSubscription,
                  cancelAtPeriodEnd: this.#cancelAtPeriodEnd,
                },
              ],
              trialedProducts: ['shield'],
            },
          };
        }

        return {
          statusCode: 200,
          json: {
            customerId: 'test_customer_id',
            subscriptions: [
              {
                ...BASE_SHIELD_SUBSCRIPTION,
                cancelAtPeriodEnd: this.#cancelAtPeriodEnd,
              },
            ],
            trialedProducts: ['shield'],
          },
        };
      });
  }

  async #handleCheckoutSession(server: Mockttp) {
    await server.forGet(MOCK_CHECKOUT_SESSION_URL).thenCallback(() => ({
      statusCode: 302,
      headers: { Location: 'https://mock-redirect-url.com' },
    }));
  }

  async #handleCancelSubscription(
    server: Mockttp,
    overrides?: {
      subscriptionId?: string;
    },
  ) {
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
      });
  }

  async #handleRenewSubscription(
    server: Mockttp,
    overrides?: {
      subscriptionId?: string;
    },
  ) {
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
    await server.forGet(CLAIMS_API.CLAIMS).thenCallback(() => {
      return {
        statusCode: 200,
        json: this.#newClaimSubmitted
          ? [MOCK_CLAIM_2, MOCK_CLAIM_1]
          : MOCK_CLAIMS_RESPONSE,
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
    await server.forPost(CLAIMS_API.CLAIMS).thenCallback(() => {
      this.#newClaimSubmitted = true;
      return {
        statusCode: 200,
        json: SUBMIT_CLAIMS_RESPONSE,
      };
    });
  }

  async #handleRulesetEngine(server: Mockttp) {
    // Mock transaction coverage init endpoint
    await server
      .forPost(RULESET_ENGINE_API.TRANSACTION_COVERAGE_INIT)
      .always()
      .thenJson(200, {
        requestId: 'test-transaction-request-id',
      });

    // Mock transaction coverage result endpoint
    await server
      .forPost(RULESET_ENGINE_API.TRANSACTION_COVERAGE_RESULT)
      .always()
      .thenCallback(() => {
        const status =
          this.#coverageStatus === 'covered' ? 'covered' : 'not_covered';
        const reasonCode = this.#coverageStatus === 'covered' ? 'E101' : 'E104';

        return {
          statusCode: 200,
          json: {
            status,
            reasonCode,
            message: status,
          },
        };
      });

    // Mock signature coverage init endpoint
    await server
      .forPost(RULESET_ENGINE_API.SIGNATURE_COVERAGE_INIT)
      .always()
      .thenJson(200, {
        requestId: 'test-signature-request-id',
      });

    // Mock signature coverage result endpoint
    await server
      .forPost(RULESET_ENGINE_API.SIGNATURE_COVERAGE_RESULT)
      .always()
      .thenCallback(() => {
        const status =
          this.#coverageStatus === 'covered' ? 'covered' : 'not_covered';
        const reasonCode = this.#coverageStatus === 'covered' ? 'E101' : 'E104';

        return {
          statusCode: 200,
          json: {
            status,
            reasonCode,
            message: status,
          },
        };
      });
  }
}

import { USER_STORAGE_FEATURE_NAMES } from '@metamask/profile-sync-controller/user-storage';
import { Mockttp } from 'mockttp';
import { UserStorageMockttpController } from '../identity/user-storage/userStorageMockttpController';
import {
  BASE_SHIELD_SUBSCRIPTION_CARD,
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
  REWARDS_API,
  MOCK_REWARDS_POINTS_ESTIMATION_RESPONSE,
  MOCK_REWARDS_SEASONS_STATUS_RESPONSE,
  MOCK_REWARDS_SEASON_METADATA_RESPONSE,
} from './constants';

export class ShieldMockttpService {
  #hasSubscribedToShield = false;

  #hasSubscribedToShieldCrypto = false;

  #selectedInterval: 'month' | 'year' = 'year';

  #cancelAtPeriodEnd = false;

  #newClaimSubmitted = false;

  #coverageStatus: 'covered' | 'not_covered' | 'malicious' = 'covered';

  #currentPaymentTokenSymbol: 'USDC' | 'USDT' = 'USDC';

  #customClaimsResponse: unknown[] | null = null;

  async setup(
    server: Mockttp,
    overrides?: {
      mockNotEligible?: boolean;
      isActiveUser?: boolean;
      subscriptionId?: string;
      coverageStatus?: 'covered' | 'not_covered' | 'malicious';
      claimErrorCode?: string;
      defaultPaymentMethod?: 'card' | 'crypto';
      claimsResponse?: unknown[];
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

    // Set custom claims response if provided
    if (overrides?.claimsResponse !== undefined) {
      this.#customClaimsResponse = overrides.claimsResponse;
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
    await this.#handleUpdateCryptoPaymentMethod(server);
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
    await this.#handleSubmitClaim(server, overrides);

    // Ruleset Engine APIs
    await this.#handleRulesetEngine(server);

    // Rewards APIs (needed for useShieldRewards hook on Shield Plan page)
    await this.#handleRewardsApis(server);

    // Gas API mocks
    await this.#handleGasApi(server);

    // Transaction Sentinel API mock
    await this.#handleTxSentinelApi(server);

    // Accounts API v4 for balance fetching
    // await this.#handleAccountsApiV4(server);

    // Mock mainnet RPC calls for balance and block data
    await this.#handleMainnetRpc(server);
  }

  async #handleMainnetRpc(server: Mockttp) {
    // Use regex to match any infura URL (mainnet, base-mainnet, etc.)
    const infuraUrlPattern = /infura/u;

    // Mock eth_blockNumber for any infura endpoint
    await server
      .forPost(infuraUrlPattern)
      .withBodyIncluding('eth_blockNumber')
      .thenCallback(() => ({
        statusCode: 200,
        json: {
          jsonrpc: '2.0',
          id: '1111111111111111',
          result: '0x1234567',
        },
      }));

    // Mock eth_getBlockByNumber for any infura endpoint
    await server
      .forPost(infuraUrlPattern)
      .withBodyIncluding('eth_getBlockByNumber')
      .thenCallback(() => ({
        statusCode: 200,
        json: {
          jsonrpc: '2.0',
          id: '1111111111111111',
          result: {
            number: '0x1234567',
            hash: '0x0000000000000000000000000000000000000000000000000000000000000000',
            parentHash:
              '0x0000000000000000000000000000000000000000000000000000000000000000',
            timestamp: '0x64',
            gasLimit: '0x1c9c380',
            gasUsed: '0x0',
            miner: '0x0000000000000000000000000000000000000000',
            difficulty: '0x0',
            totalDifficulty: '0x0',
            size: '0x0',
            transactions: [],
            baseFeePerGas: '0x7',
          },
        },
      }));

    // Mock eth_getBalance to return 25 ETH for any infura endpoint
    await server
      .forPost(infuraUrlPattern)
      .withJsonBodyIncluding({ method: 'eth_getBalance' })
      .thenCallback(() => ({
        statusCode: 200,
        json: {
          jsonrpc: '2.0',
          id: '1111111111111111',
          result: '0x15af1d78b58c40000', // 25 ETH in hex
        },
      }));

    // Mock eth_chainId
    await server
      .forPost(infuraUrlPattern)
      .withJsonBodyIncluding({ method: 'eth_chainId' })
      .thenCallback(() => ({
        statusCode: 200,
        json: {
          jsonrpc: '2.0',
          id: '1111111111111111',
          result: '0x1', // Mainnet
        },
      }));

    // Mock net_version
    await server
      .forPost(infuraUrlPattern)
      .withJsonBodyIncluding({ method: 'net_version' })
      .thenCallback(() => ({
        statusCode: 200,
        json: {
          jsonrpc: '2.0',
          id: '1111111111111111',
          result: '1', // Mainnet
        },
      }));

    // Mock eth_getCode - returns non-empty code for contracts
    await server
      .forPost(infuraUrlPattern)
      .withJsonBodyIncluding({ method: 'eth_getCode' })
      .thenCallback(() => ({
        statusCode: 200,
        json: {
          jsonrpc: '2.0',
          id: '1111111111111111',
          result: '0x6080604052', // Non-empty bytecode indicating a contract exists
        },
      }));

    // Mock eth_gasPrice
    await server
      .forPost(infuraUrlPattern)
      .withJsonBodyIncluding({ method: 'eth_gasPrice' })
      .thenCallback(() => ({
        statusCode: 200,
        json: {
          jsonrpc: '2.0',
          id: '1111111111111111',
          result: '0x3b9aca00', // 1 Gwei
        },
      }));

    // Mock eth_estimateGas
    await server
      .forPost(infuraUrlPattern)
      .withJsonBodyIncluding({ method: 'eth_estimateGas' })
      .thenCallback(() => ({
        statusCode: 200,
        json: {
          jsonrpc: '2.0',
          id: '1111111111111111',
          result: '0x5208', // 21000 gas
        },
      }));

    // Mock eth_getTransactionCount (nonce)
    await server
      .forPost(infuraUrlPattern)
      .withJsonBodyIncluding({ method: 'eth_getTransactionCount' })
      .thenCallback(() => ({
        statusCode: 200,
        json: {
          jsonrpc: '2.0',
          id: '1111111111111111',
          result: '0x0',
        },
      }));

    // Mock eth_feeHistory
    await server
      .forPost(infuraUrlPattern)
      .withJsonBodyIncluding({ method: 'eth_feeHistory' })
      .thenCallback(() => ({
        statusCode: 200,
        json: {
          jsonrpc: '2.0',
          id: '1111111111111111',
          result: {
            baseFeePerGas: ['0x7', '0x7', '0x7', '0x7', '0x7'],
            gasUsedRatio: [0.5, 0.5, 0.5, 0.5],
            oldestBlock: '0x1234560',
            reward: [
              ['0x5f5e100'],
              ['0x5f5e100'],
              ['0x5f5e100'],
              ['0x5f5e100'],
            ],
          },
        },
      }));

    // Mock eth_call to Multicall3 contract (0xcA11bde05977b3631167028862bE2a173976CA11)
    // Returns balances for ETH (25), USDC (100), USDT (100)
    // The response is an array of (success: bool, returnData: bytes) tuples
    await server
      .forPost(infuraUrlPattern)
      .withJsonBodyIncluding({
        method: 'eth_call',
        params: [
          {
            to: '0xca11bde05977b3631167028862be2a173976ca11',
          },
        ],
      })
      .thenCallback(() => {
        // Multicall3 aggregate3 response format:
        // Returns Result[] where Result = (bool success, bytes returnData)
        // Each balanceOf returns uint256
        //
        // Structure:
        // - offset to array: 0x20
        // - array length: 3 (ETH, USDC, USDT)
        // - For each result:
        //   - success (bool, padded to 32 bytes): 0x01
        //   - offset to returnData
        //   - returnData length
        //   - returnData (balance as uint256)

        // Balances:
        // ETH: 25 ETH = 0x15af1d78b58c40000 (25 * 10^18)
        // USDC: 100 USDC = 0x5f5e100 (100 * 10^6)
        // USDT: 100 USDT = 0x5f5e100 (100 * 10^6)

        const result =
          '0x' +
          // Offset to array start
          '0000000000000000000000000000000000000000000000000000000000000020' +
          // Array length: 3
          '0000000000000000000000000000000000000000000000000000000000000003' +
          // Result 0 (ETH): offset to tuple
          '0000000000000000000000000000000000000000000000000000000000000060' +
          // Result 1 (USDC): offset to tuple
          '00000000000000000000000000000000000000000000000000000000000000c0' +
          // Result 2 (USDT): offset to tuple
          '0000000000000000000000000000000000000000000000000000000000000120' +
          // Result 0 tuple: success = true
          '0000000000000000000000000000000000000000000000000000000000000001' +
          // Result 0 tuple: offset to returnData
          '0000000000000000000000000000000000000000000000000000000000000040' +
          // Result 0 tuple: returnData length (32 bytes)
          '0000000000000000000000000000000000000000000000000000000000000020' +
          // Result 0 tuple: returnData (25 ETH)
          '0000000000000000000000000000000000000000000000015af1d78b58c40000' +
          // Result 1 tuple: success = true
          '0000000000000000000000000000000000000000000000000000000000000001' +
          // Result 1 tuple: offset to returnData
          '0000000000000000000000000000000000000000000000000000000000000040' +
          // Result 1 tuple: returnData length (32 bytes)
          '0000000000000000000000000000000000000000000000000000000000000020' +
          // Result 1 tuple: returnData (100 USDC = 100000000)
          '0000000000000000000000000000000000000000000000000000000005f5e100' +
          // Result 2 tuple: success = true
          '0000000000000000000000000000000000000000000000000000000000000001' +
          // Result 2 tuple: offset to returnData
          '0000000000000000000000000000000000000000000000000000000000000040' +
          // Result 2 tuple: returnData length (32 bytes)
          '0000000000000000000000000000000000000000000000000000000000000020' +
          // Result 2 tuple: returnData (100 USDT = 100000000)
          '0000000000000000000000000000000000000000000000000000000005f5e100';

        return {
          statusCode: 200,
          json: {
            jsonrpc: '2.0',
            id: '1111111111111111',
            result,
          },
        };
      });

    // Mock eth_call for USDC contract - decimals() returns 6
    // Function selector for decimals() is 0x313ce567
    await server
      .forPost(infuraUrlPattern)
      .withJsonBodyIncluding({
        method: 'eth_call',
        params: [
          {
            to: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
          },
        ],
      })
      .thenCallback(async (req) => {
        const body = (await req.body.getJson()) as {
          params?: { data?: string }[];
        };
        const data = body.params?.[0]?.data || '';

        // decimals() selector: 0x313ce567
        if (data.startsWith('0x313ce567')) {
          return {
            statusCode: 200,
            json: {
              jsonrpc: '2.0',
              id: '1111111111111111',
              result:
                '0x0000000000000000000000000000000000000000000000000000000000000006', // 6 decimals
            },
          };
        }
        // symbol() selector: 0x95d89b41
        if (data.startsWith('0x95d89b41')) {
          return {
            statusCode: 200,
            json: {
              jsonrpc: '2.0',
              id: '1111111111111111',
              // "USDC" encoded as string
              result:
                '0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000045553444300000000000000000000000000000000000000000000000000000000',
            },
          };
        }
        // name() selector: 0x06fdde03
        if (data.startsWith('0x06fdde03')) {
          return {
            statusCode: 200,
            json: {
              jsonrpc: '2.0',
              id: '1111111111111111',
              // "USD Coin" encoded as string
              result:
                '0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000855534420436f696e000000000000000000000000000000000000000000000000',
            },
          };
        }
        // Default response for other calls (like allowance, balanceOf)
        return {
          statusCode: 200,
          json: {
            jsonrpc: '2.0',
            id: '1111111111111111',
            result:
              '0x0000000000000000000000000000000000000000000000000000000005f5e100', // 100000000 (100 USDC)
          },
        };
      });

    // Mock eth_call for USDT contract - decimals() returns 6
    await server
      .forPost(infuraUrlPattern)
      .withJsonBodyIncluding({
        method: 'eth_call',
        params: [
          {
            to: '0xdac17f958d2ee523a2206206994597c13d831ec7', // USDT
          },
        ],
      })
      .thenCallback(async (req) => {
        const body = (await req.body.getJson()) as {
          params?: { data?: string }[];
        };
        const data = body.params?.[0]?.data || '';

        // decimals() selector: 0x313ce567
        if (data.startsWith('0x313ce567')) {
          return {
            statusCode: 200,
            json: {
              jsonrpc: '2.0',
              id: '1111111111111111',
              result:
                '0x0000000000000000000000000000000000000000000000000000000000000006', // 6 decimals
            },
          };
        }
        // symbol() selector: 0x95d89b41
        if (data.startsWith('0x95d89b41')) {
          return {
            statusCode: 200,
            json: {
              jsonrpc: '2.0',
              id: '1111111111111111',
              // "USDT" encoded as string
              result:
                '0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000045553445400000000000000000000000000000000000000000000000000000000',
            },
          };
        }
        // name() selector: 0x06fdde03
        if (data.startsWith('0x06fdde03')) {
          return {
            statusCode: 200,
            json: {
              jsonrpc: '2.0',
              id: '1111111111111111',
              // "Tether USD" encoded as string
              result:
                '0x00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000000a5465746865722055534400000000000000000000000000000000000000000000',
            },
          };
        }
        // Default response for other calls (like allowance, balanceOf)
        return {
          statusCode: 200,
          json: {
            jsonrpc: '2.0',
            id: '1111111111111111',
            result:
              '0x0000000000000000000000000000000000000000000000000000000005f5e100', // 100000000 (100 USDT)
          },
        };
      });
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
      defaultPaymentMethod?: 'card' | 'crypto';
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

        // Return crypto subscription if crypto was subscribed, or if defaultPaymentMethod is 'crypto'
        const shouldReturnCrypto =
          this.#hasSubscribedToShieldCrypto ||
          (overrides?.isActiveUser &&
            !this.#hasSubscribedToShield &&
            overrides?.defaultPaymentMethod === 'crypto');

        if (shouldReturnCrypto) {
          const baseCryptoSubscription =
            this.#selectedInterval === 'month'
              ? BASE_SHIELD_SUBSCRIPTION_CRYPTO_MONTHLY
              : BASE_SHIELD_SUBSCRIPTION_CRYPTO;

          // Create subscription with current payment token
          const cryptoSubscription = {
            ...baseCryptoSubscription,
            paymentMethod: {
              type: 'crypto',
              crypto: {
                chainId: '0x1',
                tokenAddress:
                  this.#currentPaymentTokenSymbol === 'USDT'
                    ? '0xdac17f958d2ee523a2206206994597c13d831ec7'
                    : '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                tokenSymbol: this.#currentPaymentTokenSymbol,
                payerAddress: '0x5CfE73b6021E818B776b421B1c4Db2474086a7e1',
              },
            },
          };

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
                ...BASE_SHIELD_SUBSCRIPTION_CARD,
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
          json: { ...BASE_SHIELD_SUBSCRIPTION_CARD, cancelAtPeriodEnd: true },
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
          json: { ...BASE_SHIELD_SUBSCRIPTION_CARD, cancelAtPeriodEnd: false },
        };
      });
  }

  async #handleUpdateCryptoPaymentMethod(server: Mockttp) {
    // Mock the PATCH endpoint for updating crypto payment method
    // Endpoint: /subscriptions/:subscriptionId/payment-method/crypto
    // Use regex to match any subscription ID
    const escapedBaseUrl = BASE_SUBSCRIPTION_API_URL.replace(
      /[.*+?^${}()|[\]\\]/gu,
      '\\$&',
    );
    const updatePaymentMethodRegex = new RegExp(
      `^${escapedBaseUrl}/subscriptions/[^/]+/payment-method/crypto$`,
      'u',
    );

    await server
      .forPatch(updatePaymentMethodRegex)
      .always()
      .thenCallback(async (request) => {
        const body = (await request.body.getJson()) as {
          tokenSymbol?: string;
          chainId?: string;
          payerAddress?: string;
          rawTransaction?: string;
          recurringInterval?: string;
          billingCycles?: number;
        };

        // Update payment token symbol based on the request
        if (body?.tokenSymbol === 'USDT' || body?.tokenSymbol === 'USDC') {
          this.#currentPaymentTokenSymbol = body.tokenSymbol;
        }

        // Update interval if provided
        if (body?.recurringInterval) {
          this.#selectedInterval =
            body.recurringInterval === 'month' ? 'month' : 'year';
        }

        return {
          statusCode: 200,
          json: { success: true },
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
      if (this.#customClaimsResponse !== null) {
        return {
          statusCode: 200,
          json: this.#customClaimsResponse,
        };
      }
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

  async #handleSubmitClaim(
    server: Mockttp,
    overrides?: {
      claimErrorCode?: string;
    },
  ) {
    await server.forPost(CLAIMS_API.CLAIMS).thenCallback(() => {
      // Return error response if error code is specified
      if (overrides?.claimErrorCode) {
        const errorCode = overrides.claimErrorCode;
        let errorResponse: {
          statusCode: number;
          json: {
            errorCode: string;
            message: string;
          };
        };

        if (errorCode === 'E102') {
          // TRANSACTION_NOT_ELIGIBLE
          errorResponse = {
            statusCode: 400,
            json: {
              errorCode: 'E102',
              message:
                'This transaction is not done within MetaMask, hence it is not eligible for claims',
            },
          };
        } else if (errorCode === 'E203') {
          // DUPLICATE_CLAIM_EXISTS
          errorResponse = {
            statusCode: 400,
            json: {
              errorCode: 'E203',
              message:
                'A claim has already been submitted for this transaction hash.',
            },
          };
        } else {
          // Default error
          errorResponse = {
            statusCode: 400,
            json: {
              errorCode,
              message: 'Claim submission failed',
            },
          };
        }

        return errorResponse;
      }

      // Success response
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
        coverageId:
          '0c25021ea15e2bfcefe908b9280ba1667b25ca78fd89c9ac2fca993b8841ad95',
      });

    // Mock transaction coverage result endpoint
    await server
      .forPost(RULESET_ENGINE_API.TRANSACTION_COVERAGE_RESULT)
      .always()
      .thenCallback(() => {
        let status: string;
        let reasonCode: string;

        if (this.#coverageStatus === 'covered') {
          status = 'covered';
          reasonCode = 'E101';
        } else if (this.#coverageStatus === 'malicious') {
          status = 'malicious';
          reasonCode = 'E102';
        } else {
          status = 'not_covered';
          reasonCode = 'E104';
        }

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
        coverageId:
          '0c25021ea15e2bfcefe908b9280ba1667b25ca78fd89c9ac2fca993b8841ad95',
      });

    // Mock signature coverage result endpoint
    await server
      .forPost(RULESET_ENGINE_API.SIGNATURE_COVERAGE_RESULT)
      .always()
      .thenCallback(() => {
        let status: string;
        let reasonCode: string;

        if (this.#coverageStatus === 'covered') {
          status = 'covered';
          reasonCode = 'E101';
        } else if (this.#coverageStatus === 'malicious') {
          status = 'malicious';
          reasonCode = 'E102';
        } else {
          status = 'not_covered';
          reasonCode = 'E104';
        }

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

  async #handleRewardsApis(server: Mockttp) {
    // Mock points estimation endpoint (used by useShieldRewards hook)
    await server
      .forPost(REWARDS_API.POINTS_ESTIMATION)
      .always()
      .thenJson(200, MOCK_REWARDS_POINTS_ESTIMATION_RESPONSE);

    // Mock seasons status endpoint (used by useShieldRewards hook)
    await server
      .forGet(REWARDS_API.SEASONS_STATUS)
      .always()
      .thenJson(200, MOCK_REWARDS_SEASONS_STATUS_RESPONSE);

    // Mock season metadata endpoint (used by getRewardsSeasonMetadata)
    // This uses a regex to match /public/seasons/{seasonId}/meta
    const seasonMetadataRegex = new RegExp(
      `^${REWARDS_API.SEASON_METADATA}/[^/]+/meta$`,
      'u',
    );
    await server
      .forGet(seasonMetadataRegex)
      .always()
      .thenJson(200, MOCK_REWARDS_SEASON_METADATA_RESPONSE);
  }

  async #handleGasApi(server: Mockttp) {
    // Mock supported networks endpoint
    await server
      .forGet('https://gas.api.cx.metamask.io/v1/supportedNetworks')
      .always()
      .thenJson(200, ['0x1', '0x89', '0x38', '0xa', '0xa4b1']);

    // Mock gas prices endpoint for mainnet
    await server
      .forGet('https://gas.api.cx.metamask.io/networks/1/suggestedGasFees')
      .always()
      .thenJson(200, {
        low: {
          suggestedMaxPriorityFeePerGas: '0.05',
          suggestedMaxFeePerGas: '10',
          minWaitTimeEstimate: 15000,
          maxWaitTimeEstimate: 30000,
        },
        medium: {
          suggestedMaxPriorityFeePerGas: '0.1',
          suggestedMaxFeePerGas: '15',
          minWaitTimeEstimate: 15000,
          maxWaitTimeEstimate: 45000,
        },
        high: {
          suggestedMaxPriorityFeePerGas: '0.3',
          suggestedMaxFeePerGas: '20',
          minWaitTimeEstimate: 15000,
          maxWaitTimeEstimate: 60000,
        },
        estimatedBaseFee: '7',
        networkCongestion: 0.5,
        latestPriorityFeeRange: ['0.1', '1'],
        historicalPriorityFeeRange: ['0.05', '2'],
        historicalBaseFeeRange: ['5', '15'],
        priorityFeeTrend: 'up',
        baseFeeTrend: 'down',
      });
  }

  async #handleTxSentinelApi(server: Mockttp) {
    // Mock tx-sentinel endpoint for transaction simulation
    await server
      .forPost('https://tx-sentinel-ethereum-mainnet.api.cx.metamask.io/')
      .always()
      .thenJson(200, {
        block: '0x1234567',
        result: [],
      });
  }
}

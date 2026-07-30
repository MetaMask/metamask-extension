/* eslint-disable @typescript-eslint/naming-convention */
import {
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import { TransactionPayStrategy } from '@metamask/transaction-pay-controller';
import { TransactionMetaMetricsEvent } from '../../../../../shared/constants/transaction';
import { getManifestFlags } from '../../../../../shared/lib/manifestFlags';
import { createBuilderRequest } from './test-utils';
import { getMetaMaskPayProperties } from './metamask-pay';

jest.mock('../../../../../shared/lib/manifestFlags', () => ({
  getManifestFlags: jest.fn(),
}));

const getManifestFlagsMock = jest.mocked(getManifestFlags);

const PREFILL_ENABLED_FLAGS = {
  confirmations_pay_extended: {
    prefilledAmount: {
      default: { enabled: false },
      overrides: { musdConversion: { enabled: true } },
    },
  },
};

const PAY_TOKEN_MOCK = {
  symbol: 'USDC',
  chainId: '0x1',
  address: '0xabc',
};

const TOKENS_MOCK = [
  { skipIfBalance: false, amountUsd: '100' },
  { skipIfBalance: true, amountUsd: '50' },
];

const TOTALS_MOCK = {
  targetAmount: { usd: '99' },
  fees: {
    metaMask: { usd: '0.5' },
    provider: { usd: '0.3' },
    sourceNetwork: { estimate: { usd: '1.0' } },
    targetNetwork: { usd: '0.2' },
  },
};

const RELAY_QUOTE_MOCK = {
  strategy: TransactionPayStrategy.Relay,
  request: { targetTokenAddress: '0xabc' },
  dust: { usd: '0.02' },
};

function createPayRequest(overrides = {}) {
  return createBuilderRequest({
    transactionMeta: {
      id: 'tx-1',
      chainId: '0x1',
      origin: 'metamask',
      status: TransactionStatus.unapproved,
      type: TransactionType.perpsDeposit,
      time: Date.now(),
      txParams: {
        from: '0x1111111111111111111111111111111111111111',
        to: '0x2222222222222222222222222222222222222222',
        gas: '0x5208',
        value: '0x0',
      },
      metamaskPay: {
        chainId: '0x1',
        tokenAddress: '0xabc',
      },
    } as never,
    ...overrides,
  });
}

describe('getMetaMaskPayProperties', () => {
  beforeEach(() => {
    getManifestFlagsMock.mockReturnValue({});
  });

  describe('core pay properties', () => {
    it('returns empty when metamaskPay is absent', async () => {
      const request = createBuilderRequest();
      const result = await getMetaMaskPayProperties(request);

      expect(result.properties).toStrictEqual({});
      expect(result.sensitiveProperties).toStrictEqual({});
    });

    it('sets mm_pay to true when metamaskPay data exists', async () => {
      const request = createPayRequest();
      const result = await getMetaMaskPayProperties(request);

      expect(result.properties.mm_pay).toBe(true);
    });

    it('sets mm_pay_chain_selected from metamaskPay.chainId', async () => {
      const request = createPayRequest();
      const result = await getMetaMaskPayProperties(request);

      expect(result.properties.mm_pay_chain_selected).toBe('0x1');
    });

    it('sets mm_pay_token_selected from txPayData.paymentToken.symbol', async () => {
      const request = createPayRequest({
        transactionMetricsRequest: {
          ...createPayRequest().transactionMetricsRequest,
          getTransactionPayData: jest.fn().mockReturnValue({
            paymentToken: PAY_TOKEN_MOCK,
            tokens: TOKENS_MOCK,
          }),
        },
      });
      const result = await getMetaMaskPayProperties(request);

      expect(result.properties.mm_pay_token_selected).toBe('USDC');
    });
  });

  describe('mm_pay_use_case', () => {
    it('sets perps_deposit for perpsDeposit transactions', async () => {
      const request = createPayRequest();
      const result = await getMetaMaskPayProperties(request);

      expect(result.properties.mm_pay_use_case).toBe('perps_deposit');
    });

    it('sets perps_withdraw for perpsWithdraw transactions', async () => {
      const request = createPayRequest({
        transactionMeta: {
          ...createPayRequest().transactionMeta,
          type: TransactionType.perpsWithdraw,
        },
      });
      const result = await getMetaMaskPayProperties(request);

      expect(result.properties.mm_pay_use_case).toBe('perps_withdraw');
    });

    it('sets musd_conversion for musdConversion transactions', async () => {
      const request = createPayRequest({
        transactionMeta: {
          ...createPayRequest().transactionMeta,
          type: TransactionType.musdConversion,
        },
      });
      const result = await getMetaMaskPayProperties(request);

      expect(result.properties.mm_pay_use_case).toBe('musd_conversion');
    });

    it('sets musd_claim for musdClaim transactions', async () => {
      const request = createPayRequest({
        transactionMeta: {
          ...createPayRequest().transactionMeta,
          type: TransactionType.musdClaim,
        },
      });
      const result = await getMetaMaskPayProperties(request);

      expect(result.properties.mm_pay_use_case).toBe('musd_claim');
    });

    it('does not set use_case for non-pay-type transactions', async () => {
      const request = createPayRequest({
        transactionMeta: {
          ...createPayRequest().transactionMeta,
          type: TransactionType.contractInteraction,
        },
      });
      const result = await getMetaMaskPayProperties(request);

      expect(result.properties.mm_pay_use_case).toBeUndefined();
    });
  });

  describe('mm_pay_amount_input_type', () => {
    function createMusdRequest({
      flags = {},
      fragmentProperties,
      metamaskPay = { chainId: '0x1', tokenAddress: '0xabc' },
    }: {
      flags?: Record<string, unknown>;
      fragmentProperties?: Record<string, unknown>;
      metamaskPay?: { chainId: string; tokenAddress: string } | null;
    } = {}) {
      const base = createPayRequest();

      return createBuilderRequest({
        transactionMeta: {
          ...base.transactionMeta,
          type: TransactionType.musdConversion,
          metamaskPay: metamaskPay ?? undefined,
        } as never,
        transactionMetricsRequest: {
          ...base.transactionMetricsRequest,
          getFeatureFlags: jest.fn().mockReturnValue(flags),
          getTransactionUIMetricsFragment: jest
            .fn()
            .mockReturnValue(
              fragmentProperties
                ? { properties: fragmentProperties }
                : undefined,
            ),
        },
      });
    }

    it('tags prefilled_max when the prefill flag is enabled for the transaction type', async () => {
      const request = createMusdRequest({ flags: PREFILL_ENABLED_FLAGS });

      const result = await getMetaMaskPayProperties(request);

      expect(result.properties.mm_pay_amount_input_type).toBe('prefilled_max');
    });

    it('tags prefilled_max before metamaskPay data exists', async () => {
      const request = createMusdRequest({
        flags: PREFILL_ENABLED_FLAGS,
        metamaskPay: null,
      });

      const result = await getMetaMaskPayProperties(request);

      expect(result.properties.mm_pay_amount_input_type).toBe('prefilled_max');
      expect(result.properties.mm_pay).toBeUndefined();
    });

    it('does not tag when the prefill flag is disabled', async () => {
      const request = createMusdRequest({
        flags: {
          confirmations_pay_extended: {
            prefilledAmount: { default: { enabled: false } },
          },
        },
      });

      const result = await getMetaMaskPayProperties(request);

      expect(result.properties.mm_pay_amount_input_type).toBeUndefined();
    });

    it('does not tag pay types without prefill support even when the flag default is enabled', async () => {
      const base = createPayRequest();
      const request = createBuilderRequest({
        transactionMeta: base.transactionMeta,
        transactionMetricsRequest: {
          ...base.transactionMetricsRequest,
          getFeatureFlags: jest.fn().mockReturnValue({
            confirmations_pay_extended: {
              prefilledAmount: { default: { enabled: true } },
            },
          }),
        },
      });

      const result = await getMetaMaskPayProperties(request);

      expect(result.properties.mm_pay_use_case).toBe('perps_deposit');
      expect(result.properties.mm_pay_amount_input_type).toBeUndefined();
    });

    it('prefers the input type recorded on the UI metrics fragment', async () => {
      const request = createMusdRequest({
        flags: PREFILL_ENABLED_FLAGS,
        fragmentProperties: { mm_pay_amount_input_type: 'manual' },
      });

      const result = await getMetaMaskPayProperties(request);

      expect(result.properties.mm_pay_amount_input_type).toBe('manual');
    });

    it('prefers manifest flags over controller flags', async () => {
      getManifestFlagsMock.mockReturnValue({
        remoteFeatureFlags: PREFILL_ENABLED_FLAGS,
      });

      const request = createMusdRequest({
        flags: {
          confirmations_pay_extended: {
            prefilledAmount: { default: { enabled: false } },
          },
        },
      });

      const result = await getMetaMaskPayProperties(request);

      expect(result.properties.mm_pay_amount_input_type).toBe('prefilled_max');
    });

    it('copies the parent input type and prefilled amount to child transaction events', async () => {
      const base = createPayRequest();
      const request = createBuilderRequest({
        transactionMeta: {
          ...base.transactionMeta,
          type: TransactionType.bridge,
        } as never,
        transactionMetricsRequest: {
          ...base.transactionMetricsRequest,
          getAllTransactions: jest.fn().mockReturnValue([
            {
              id: 'tx-1',
              type: TransactionType.bridge,
            },
            {
              id: 'parent-1',
              type: TransactionType.musdConversion,
              requiredTransactionIds: ['tx-1'],
              metamaskPay: { chainId: '0x1', tokenAddress: '0xabc' },
            },
          ]),
          getTransactionUIMetricsFragment: jest.fn((transactionId: string) =>
            transactionId === 'parent-1'
              ? {
                  properties: {
                    mm_pay_amount_input_type: 'prefilled_max',
                    mm_pay_prefilled_amount: 250,
                  },
                }
              : undefined,
          ),
        },
      });

      const result = await getMetaMaskPayProperties(request);

      expect(result.properties.mm_pay_amount_input_type).toBe('prefilled_max');
      expect(result.properties.mm_pay_prefilled_amount).toBe(250);
    });
  });

  describe('USD values', () => {
    it('sets mm_pay_sending_value_usd from primaryRequiredToken', async () => {
      const request = createPayRequest({
        transactionMetricsRequest: {
          ...createPayRequest().transactionMetricsRequest,
          getTransactionPayData: jest.fn().mockReturnValue({
            tokens: TOKENS_MOCK,
          }),
        },
      });
      const result = await getMetaMaskPayProperties(request);

      expect(result.properties.mm_pay_sending_value_usd).toBe(100);
    });

    it('sets mm_pay_receiving_value_usd from totals.targetAmount.usd', async () => {
      const request = createPayRequest({
        transactionMetricsRequest: {
          ...createPayRequest().transactionMetricsRequest,
          getTransactionPayData: jest.fn().mockReturnValue({
            tokens: TOKENS_MOCK,
            totals: TOTALS_MOCK,
          }),
        },
      });
      const result = await getMetaMaskPayProperties(request);

      expect(result.properties.mm_pay_receiving_value_usd).toBe(99);
    });

    it('sets mm_pay_metamask_fee_usd from totals.fees.metaMask.usd', async () => {
      const request = createPayRequest({
        transactionMetricsRequest: {
          ...createPayRequest().transactionMetricsRequest,
          getTransactionPayData: jest.fn().mockReturnValue({
            tokens: TOKENS_MOCK,
            totals: TOTALS_MOCK,
          }),
        },
      });
      const result = await getMetaMaskPayProperties(request);

      expect(result.properties.mm_pay_metamask_fee_usd).toBe(0.5);
    });

    it('sets mm_pay_provider_fee_usd and mm_pay_network_fee_usd from totals', async () => {
      const request = createPayRequest({
        transactionMetricsRequest: {
          ...createPayRequest().transactionMetricsRequest,
          getTransactionPayData: jest.fn().mockReturnValue({
            tokens: TOKENS_MOCK,
            totals: TOTALS_MOCK,
          }),
        },
      });
      const result = await getMetaMaskPayProperties(request);

      expect(result.properties.mm_pay_provider_fee_usd).toBe('0.3');
      expect(result.properties.mm_pay_network_fee_usd).toBe('1.2');
    });
  });

  describe('strategy and steps', () => {
    it('sets mm_pay_strategy to relay for Relay strategy', async () => {
      const request = createPayRequest({
        transactionMetricsRequest: {
          ...createPayRequest().transactionMetricsRequest,
          getTransactionPayData: jest.fn().mockReturnValue({
            quotes: [RELAY_QUOTE_MOCK],
          }),
        },
      });
      const result = await getMetaMaskPayProperties(request);

      expect(result.properties.mm_pay_strategy).toBe('relay');
    });

    it('sets mm_pay_transaction_step_total from quotes length + 1', async () => {
      const request = createPayRequest({
        transactionMetricsRequest: {
          ...createPayRequest().transactionMetricsRequest,
          getTransactionPayData: jest.fn().mockReturnValue({
            quotes: [RELAY_QUOTE_MOCK, RELAY_QUOTE_MOCK],
          }),
        },
      });
      const result = await getMetaMaskPayProperties(request);

      expect(result.properties.mm_pay_transaction_step_total).toBe(3);
      expect(result.properties.mm_pay_transaction_step).toBe(3);
    });
  });

  describe('mm_pay_time_to_complete_s', () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('adds mm_pay_time_to_complete_s for finalized parent MM Pay transaction', async () => {
      jest.spyOn(Date, 'now').mockReturnValue(1060500);

      const request = createPayRequest({
        eventName: TransactionMetaMetricsEvent.finalized,
        transactionMeta: {
          ...createPayRequest().transactionMeta,
          submittedTime: 1000000,
          requiredTransactionIds: ['child-1'],
        },
        transactionMetricsRequest: {
          ...createPayRequest().transactionMetricsRequest,
          getAllTransactions: jest
            .fn()
            .mockReturnValue([{ id: 'child-1', submittedTime: 1000000 }]),
        },
      });
      const result = await getMetaMaskPayProperties(request);

      expect(result.properties.mm_pay_time_to_complete_s).toBe(60.5);
    });

    it('does not add mm_pay_time_to_complete_s for non-finalized events', async () => {
      const request = createPayRequest({
        eventName: TransactionMetaMetricsEvent.submitted,
        transactionMeta: {
          ...createPayRequest().transactionMeta,
          submittedTime: 1000000,
        },
      });
      const result = await getMetaMaskPayProperties(request);

      expect(result.properties).not.toHaveProperty('mm_pay_time_to_complete_s');
    });

    it('does not add mm_pay_time_to_complete_s when submittedTime is undefined', async () => {
      const request = createPayRequest({
        eventName: TransactionMetaMetricsEvent.finalized,
      });
      const result = await getMetaMaskPayProperties(request);

      expect(result.properties).not.toHaveProperty('mm_pay_time_to_complete_s');
    });

    it('falls back to parent submittedTime when no children have submittedTime', async () => {
      jest.spyOn(Date, 'now').mockReturnValue(1060500);

      const request = createPayRequest({
        eventName: TransactionMetaMetricsEvent.finalized,
        transactionMeta: {
          ...createPayRequest().transactionMeta,
          submittedTime: 1000000,
        },
      });
      const result = await getMetaMaskPayProperties(request);

      expect(result.properties.mm_pay_time_to_complete_s).toBe(60.5);
    });

    it('does not add mm_pay_time_to_complete_s for non-MM-Pay transactions', async () => {
      jest.spyOn(Date, 'now').mockReturnValue(1060000);

      const request = createBuilderRequest({
        eventName: TransactionMetaMetricsEvent.finalized as never,
        transactionMeta: {
          ...createBuilderRequest().transactionMeta,
          type: TransactionType.contractInteraction,
          submittedTime: 1000000,
        } as never,
      });
      const result = await getMetaMaskPayProperties(request);

      expect(result.properties).not.toHaveProperty('mm_pay_time_to_complete_s');
    });
  });
});

/* eslint-disable @typescript-eslint/naming-convention */
import {
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import { TransactionPayStrategy } from '@metamask/transaction-pay-controller';
import { TransactionMetaMetricsEvent } from '../../../../../shared/constants/transaction';
import { createBuilderRequest } from './test-utils';
import { getMetaMaskPayProperties } from './metamask-pay';

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

const BRIDGE_QUOTE_MOCK = {
  strategy: TransactionPayStrategy.Bridge,
  request: { targetTokenAddress: '0xabc' },
  dust: { usd: '0.01' },
  original: {
    metrics: {
      latency: 1234,
      attempts: 3,
      buffer: 0.123,
    },
    quote: {
      bridgeId: 'testBridge',
    },
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
    it('sets mm_pay_strategy to mm_swaps_bridge for Bridge strategy', async () => {
      const request = createPayRequest({
        transactionMetricsRequest: {
          ...createPayRequest().transactionMetricsRequest,
          getTransactionPayData: jest.fn().mockReturnValue({
            quotes: [BRIDGE_QUOTE_MOCK],
          }),
        },
      });
      const result = await getMetaMaskPayProperties(request);

      expect(result.properties.mm_pay_strategy).toBe('mm_swaps_bridge');
    });

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
            quotes: [BRIDGE_QUOTE_MOCK, BRIDGE_QUOTE_MOCK],
          }),
        },
      });
      const result = await getMetaMaskPayProperties(request);

      expect(result.properties.mm_pay_transaction_step_total).toBe(3);
      expect(result.properties.mm_pay_transaction_step).toBe(3);
    });
  });

  describe('bridge quote metrics', () => {
    it('sets mm_pay_quotes_latency from bridge quote metrics', async () => {
      const request = createPayRequest({
        transactionMeta: {
          ...createPayRequest().transactionMeta,
          type: TransactionType.bridge,
        },
        transactionMetricsRequest: {
          ...createPayRequest().transactionMetricsRequest,
          getTransactionPayData: jest.fn().mockReturnValue({
            quotes: [BRIDGE_QUOTE_MOCK],
          }),
          getAllTransactions: jest.fn().mockReturnValue([
            {
              id: 'tx-1',
              type: TransactionType.bridge,
              requiredTransactionIds: undefined,
            },
            {
              id: 'parent-1',
              type: TransactionType.perpsDeposit,
              requiredTransactionIds: ['tx-1'],
              metamaskPay: { chainId: '0x1', tokenAddress: '0xabc' },
            },
          ]),
        },
      });
      const result = await getMetaMaskPayProperties(request);

      expect(result.properties.mm_pay_quotes_latency).toBe(1234);
      expect(result.properties.mm_pay_quotes_attempts).toBe(3);
      expect(result.properties.mm_pay_quotes_buffer_size).toBe(0.123);
      expect(result.properties.mm_pay_bridge_provider).toBe('testBridge');
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

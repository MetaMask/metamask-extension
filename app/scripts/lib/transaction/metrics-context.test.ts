/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  TransactionContainerType,
  TransactionType,
} from '@metamask/transaction-controller';
import { TransactionApprovalAmountType } from '../../../../shared/constants/transaction';
import { buildTransactionMetricsContext } from './metrics-context';

jest.mock('../../../../shared/lib/transaction.utils', () => ({
  ...jest.requireActual('../../../../shared/lib/transaction.utils'),
  determineTransactionAssetType: jest.fn().mockResolvedValue({
    assetType: 'native',
    tokenStandard: 'ERC20',
  }),
}));

const createRequest = (overrides = {}) =>
  ({
    getMethodData: jest.fn().mockResolvedValue({ name: 'Approve' }),
    provider: {} as any,
    getTokenStandardAndDetails: jest.fn(),
    ...overrides,
  }) as any;

const createTransactionMeta = (overrides = {}) =>
  ({
    id: '1',
    type: TransactionType.contractInteraction,
    chainId: '0x1',
    txParams: {
      data: '0x095ea7b3',
    },
    ...overrides,
  }) as any;

describe('buildTransactionMetricsContext', () => {
  it('builds contract interaction context for approve transactions', async () => {
    const context = await buildTransactionMetricsContext({
      transactionMeta: createTransactionMeta(),
      transactionMetricsRequest: createRequest(),
    });

    expect(context.isContractInteraction).toBe(true);
    expect(context.contractAddress).toBeUndefined();
    expect(context.contractMethodName).toBe('Approve');
    expect(context.contractMethod4Byte).toBe('0x095ea7b3');
    expect(context.transactionTypeForMetrics).toBe('contractInteraction');
    expect(context.isApproveMethod).toBe(true);
  });

  it('uses original contract details for enforced simulations', async () => {
    const getMethodData = jest.fn().mockResolvedValue({ name: 'Transfer' });
    const context = await buildTransactionMetricsContext({
      transactionMeta: createTransactionMeta({
        containerTypes: [TransactionContainerType.EnforcedSimulations],
        txParams: {
          to: '0xdb9b1e94b5b69df7e401ddbede43491141047db3',
          data: '0x1cff79cd',
        },
        txParamsOriginal: {
          to: '0x2222222222222222222222222222222222222222',
          data: '0xa9059cbb',
        },
      }),
      transactionMetricsRequest: createRequest({ getMethodData }),
    });

    expect(getMethodData).toHaveBeenCalledWith('0xa9059cbb');
    expect(context.contractAddress).toBe(
      '0x2222222222222222222222222222222222222222',
    );
    expect(context.contractMethodName).toBe('Transfer');
    expect(context.contractMethod4Byte).toBe('0xa9059cbb');
  });

  it('uses current contract details without enforced simulations', async () => {
    const getMethodData = jest
      .fn()
      .mockResolvedValue({ name: 'RedeemDelegations' });
    const context = await buildTransactionMetricsContext({
      transactionMeta: createTransactionMeta({
        txParams: {
          to: '0xdb9b1e94b5b69df7e401ddbede43491141047db3',
          data: '0x1cff79cd',
        },
        txParamsOriginal: {
          to: '0x2222222222222222222222222222222222222222',
          data: '0xa9059cbb',
        },
      }),
      transactionMetricsRequest: createRequest({ getMethodData }),
    });

    expect(getMethodData).toHaveBeenCalledWith('0x1cff79cd');
    expect(context.contractAddress).toBe(
      '0xdb9b1e94b5b69df7e401ddbede43491141047db3',
    );
    expect(context.contractMethodName).toBe('RedeemDelegations');
    expect(context.contractMethod4Byte).toBe('0x1cff79cd');
  });

  it('derives approval amount type', async () => {
    const context = await buildTransactionMetricsContext({
      transactionMeta: createTransactionMeta({
        dappProposedTokenAmount: '100',
        customTokenAmount: '50',
      }),
      transactionMetricsRequest: createRequest(),
    });

    expect(context.transactionApprovalAmountType).toBe(
      TransactionApprovalAmountType.custom,
    );
  });

  it('returns simpleSend context for non-contract transaction types', async () => {
    const context = await buildTransactionMetricsContext({
      transactionMeta: createTransactionMeta({
        type: TransactionType.simpleSend,
        txParams: {},
      }),
      transactionMetricsRequest: createRequest({
        getMethodData: jest.fn(),
      }),
    });

    expect(context.isContractInteraction).toBe(false);
    expect(context.transactionTypeForMetrics).toBe('simpleSend');
    expect(context.contractMethodName).toBeUndefined();
  });

  it('returns musd_conversion as transaction type for mUSD conversion transactions', async () => {
    const context = await buildTransactionMetricsContext({
      transactionMeta: createTransactionMeta({
        type: TransactionType.musdConversion,
        txParams: { data: '0xa9059cbb' },
      }),
      transactionMetricsRequest: createRequest(),
    });

    expect(context.transactionTypeForMetrics).toBe('musd_conversion');
    expect(context.isContractInteraction).toBe(false);
  });

  it('returns musd_claim as transaction type for mUSD claim transactions', async () => {
    const context = await buildTransactionMetricsContext({
      transactionMeta: createTransactionMeta({
        type: TransactionType.musdClaim,
        txParams: { data: '0x12345678' },
      }),
      transactionMetricsRequest: createRequest(),
    });

    expect(context.transactionTypeForMetrics).toBe('musd_claim');
    expect(context.isContractInteraction).toBe(false);
  });

  it('returns perps_deposit as transaction type for perps deposit transactions', async () => {
    const context = await buildTransactionMetricsContext({
      transactionMeta: createTransactionMeta({
        type: TransactionType.perpsDeposit,
        txParams: { data: '0xa9059cbb' },
      }),
      transactionMetricsRequest: createRequest(),
    });

    expect(context.transactionTypeForMetrics).toBe('perps_deposit');
    expect(context.isContractInteraction).toBe(false);
  });

  it('returns perps_withdraw as transaction type for perps withdraw transactions', async () => {
    const context = await buildTransactionMetricsContext({
      transactionMeta: createTransactionMeta({
        type: TransactionType.perpsWithdraw,
        txParams: { data: '0xa9059cbb' },
      }),
      transactionMetricsRequest: createRequest(),
    });

    expect(context.transactionTypeForMetrics).toBe('perps_withdraw');
    expect(context.isContractInteraction).toBe(false);
  });

  describe('retry transactions', () => {
    it('returns snake_case transaction type for retried perps deposit transactions', async () => {
      const context = await buildTransactionMetricsContext({
        transactionMeta: createTransactionMeta({
          type: TransactionType.retry,
          originalType: TransactionType.perpsDeposit,
          txParams: { data: '0xa9059cbb' },
        }),
        transactionMetricsRequest: createRequest(),
      });

      expect(context.transactionTypeForMetrics).toBe('perps_deposit');
    });

    it('returns snake_case transaction type for retried mUSD conversion transactions', async () => {
      const context = await buildTransactionMetricsContext({
        transactionMeta: createTransactionMeta({
          type: TransactionType.retry,
          originalType: TransactionType.musdConversion,
          txParams: { data: '0xa9059cbb' },
        }),
        transactionMetricsRequest: createRequest(),
      });

      expect(context.transactionTypeForMetrics).toBe('musd_conversion');
    });

    it('returns mm_swap as transaction type for retried swap transactions', async () => {
      const context = await buildTransactionMetricsContext({
        transactionMeta: createTransactionMeta({
          type: TransactionType.retry,
          originalType: TransactionType.swap,
          txParams: { data: '0xa9059cbb' },
        }),
        transactionMetricsRequest: createRequest(),
      });

      expect(context.transactionTypeForMetrics).toBe('mm_swap');
      expect(context.isContractInteraction).toBe(true);
    });
  });
});

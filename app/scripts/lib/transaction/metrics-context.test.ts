/* eslint-disable @typescript-eslint/no-explicit-any */
import { TransactionType } from '@metamask/transaction-controller';
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
    expect(context.contractMethodName).toBe('Approve');
    expect(context.contractMethod4Byte).toBe('0x095ea7b3');
    expect(context.transactionTypeForMetrics).toBe('contractInteraction');
    expect(context.isApproveMethod).toBe(true);
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

  it('returns musdConversion as transaction type for mUSD conversion transactions', async () => {
    const context = await buildTransactionMetricsContext({
      transactionMeta: createTransactionMeta({
        type: TransactionType.musdConversion,
        txParams: { data: '0xa9059cbb' },
      }),
      transactionMetricsRequest: createRequest(),
    });

    expect(context.transactionTypeForMetrics).toBe('musdConversion');
    expect(context.isContractInteraction).toBe(false);
  });

  it('returns musdClaim as transaction type for mUSD claim transactions', async () => {
    const context = await buildTransactionMetricsContext({
      transactionMeta: createTransactionMeta({
        type: TransactionType.musdClaim,
        txParams: { data: '0x12345678' },
      }),
      transactionMetricsRequest: createRequest(),
    });

    expect(context.transactionTypeForMetrics).toBe('musdClaim');
    expect(context.isContractInteraction).toBe(false);
  });

  it('returns perpsDeposit as transaction type for perps deposit transactions', async () => {
    const context = await buildTransactionMetricsContext({
      transactionMeta: createTransactionMeta({
        type: TransactionType.perpsDeposit,
        txParams: { data: '0xa9059cbb' },
      }),
      transactionMetricsRequest: createRequest(),
    });

    expect(context.transactionTypeForMetrics).toBe('perpsDeposit');
    expect(context.isContractInteraction).toBe(false);
  });

  it('returns perpsWithdraw as transaction type for perps withdraw transactions', async () => {
    const context = await buildTransactionMetricsContext({
      transactionMeta: createTransactionMeta({
        type: TransactionType.perpsWithdraw,
        txParams: { data: '0xa9059cbb' },
      }),
      transactionMetricsRequest: createRequest(),
    });

    expect(context.transactionTypeForMetrics).toBe('perpsWithdraw');
    expect(context.isContractInteraction).toBe(false);
  });
});

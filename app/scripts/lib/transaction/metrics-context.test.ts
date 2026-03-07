/* eslint-disable @typescript-eslint/no-explicit-any */
import { TransactionType } from '@metamask/transaction-controller';
import { TransactionApprovalAmountType } from '../../../../shared/constants/transaction';
import { buildTransactionMetricsContext } from './metrics-context';

jest.mock('../../../../shared/modules/transaction.utils', () => ({
  ...jest.requireActual('../../../../shared/modules/transaction.utils'),
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
});

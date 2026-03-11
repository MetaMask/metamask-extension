import type { InfiniteData } from '@tanstack/react-query';
import type { NormalizedV4MultiAccountTransactionsResponse } from '../../../../shared/lib/multichain/types';
import {
  applyActivityTransactionOverrides,
  MUSD_CLAIM_CATEGORY,
} from './activity-overrides';

function makePage(
  txs: Array<{
    txParams?: { to?: string; from?: string };
    chainId?: string;
    transactionCategory?: string;
  }>,
) {
  return {
    data: txs.map((tx, i) => ({
      id: `tx-${i}`,
      time: Date.now(),
      txParams: tx.txParams ?? {},
      chainId: tx.chainId ?? '0x1',
      transactionCategory: tx.transactionCategory ?? 'CONTRACT_CALL',
      transactionType: '',
      nonce: 0,
    })),
  };
}

describe('applyActivityTransactionOverrides', () => {
  it('sets MUSD_CLAIM_CATEGORY for Merkl distributor call on Linea', () => {
    const data: InfiniteData<NormalizedV4MultiAccountTransactionsResponse> = {
      pages: [
        makePage([
          {
            txParams: {
              to: '0x3Ef3D8bA38EBe18DB133cEc108f4D14CE00Dd9Ae',
              from: '0x4f5243ceea96cee1da0fdb89c756d0e999439424',
            },
            chainId: '0xe708',
            transactionCategory: 'CONTRACT_CALL',
          },
        ]),
      ],
      pageParams: [undefined],
    };

    const result = applyActivityTransactionOverrides(data);

    expect(result.pages[0].data[0].transactionCategory).toBe(MUSD_CLAIM_CATEGORY);
  });

  it('leaves other transactions unchanged', () => {
    const data: InfiniteData<NormalizedV4MultiAccountTransactionsResponse> = {
      pages: [
        makePage([
          {
            txParams: {
              to: '0x0000000000000000000000000000000000000001',
              from: '0x4f5243ceea96cee1da0fdb89c756d0e999439424',
            },
            chainId: '0xe708',
            transactionCategory: 'CONTRACT_CALL',
          },
        ]),
      ],
      pageParams: [undefined],
    };

    const result = applyActivityTransactionOverrides(data);

    expect(result.pages[0].data[0].transactionCategory).toBe('CONTRACT_CALL');
  });

  it('leaves Merkl distributor on different chain unchanged', () => {
    const data: InfiniteData<NormalizedV4MultiAccountTransactionsResponse> = {
      pages: [
        makePage([
          {
            txParams: {
              to: '0x3Ef3D8bA38EBe18DB133cEc108f4D14CE00Dd9Ae',
              from: '0x4f5243ceea96cee1da0fdb89c756d0e999439424',
            },
            chainId: '0x1',
            transactionCategory: 'CONTRACT_CALL',
          },
        ]),
      ],
      pageParams: [undefined],
    };

    const result = applyActivityTransactionOverrides(data);

    expect(result.pages[0].data[0].transactionCategory).toBe('CONTRACT_CALL');
  });
});

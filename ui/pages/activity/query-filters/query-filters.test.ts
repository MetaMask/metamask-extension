import type { V1TransactionByHashResponse } from '@metamask/core-backend';
import { renderHook } from '@testing-library/react';
import { useSelector } from 'react-redux';
import { toAssetId } from '../../../../shared/lib/asset-utils';
import { isExcludedTransactionHash } from './excluded-transaction-hash';
import { isIncomingTokenTransfer } from './incoming-token-transfer';
import { useQueryFilters } from './useQueryFilters';
import { isZeroValueSelfSend } from './zero-value-self-send';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

const subjectAddress = '0x9bed78535d6a03a955f1504aadba974d9a29e292';
const otherAddress = '0xf70da97812cb96acdf810712aa562db8dfa3dbef';
const tokenAddress = '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913';

function transaction(overrides = {}) {
  return {
    hash: '0xhash',
    timestamp: '2026-05-12T13:37:47.000Z',
    chainId: 1,
    from: subjectAddress,
    to: otherAddress,
    value: '1',
    valueTransfers: [],
    transactionCategory: 'TRANSFER',
    ...overrides,
  } as unknown as V1TransactionByHashResponse;
}

describe('query filters', () => {
  beforeEach(() => {
    jest.mocked(useSelector).mockReturnValue(new Set());
  });

  it('matches excluded transaction hashes case-insensitively', () => {
    expect(
      isExcludedTransactionHash(
        transaction({ hash: '0xABC' }),
        new Set(['0xabc']),
      ),
    ).toBe(true);
  });

  it('matches zero-value self sends', () => {
    expect(
      isZeroValueSelfSend(
        transaction({
          from: subjectAddress,
          to: subjectAddress.toUpperCase(),
          value: '0',
          methodId: '0x',
        }),
        subjectAddress,
      ),
    ).toBe(true);
  });

  it('matches incoming token transfers', () => {
    expect(
      isIncomingTokenTransfer(
        transaction({
          from: otherAddress,
          valueTransfers: [
            {
              from: otherAddress,
              to: subjectAddress.toUpperCase(),
              contractAddress: tokenAddress,
              amount: '100',
              decimal: 6,
              symbol: 'USDC',
            },
          ],
        }),
        subjectAddress,
      ),
    ).toBe(true);
  });

  it('filters query results and maps remaining transactions', () => {
    jest.mocked(useSelector).mockReturnValue(new Set(['0xexcluded']));
    const validTransaction = transaction({
      hash: '0xvalid',
      valueTransfers: [
        {
          from: subjectAddress,
          to: otherAddress,
          contractAddress: tokenAddress,
          amount: '100',
          decimal: 6,
          symbol: 'USDC',
        },
      ],
    });
    const excludedTransaction = transaction({ hash: '0xEXCLUDED' });

    const { result } = renderHook(() =>
      useQueryFilters({ subjectAddress, networks: [] }),
    );
    const filtered = result.current({
      pages: [
        {
          data: [validTransaction, excludedTransaction],
          pageInfo: {
            count: 2,
            hasNextPage: false,
          },
          unprocessedNetworks: [],
        },
      ],
      pageParams: [],
    });

    expect(filtered.pages[0].data).toEqual([
      {
        type: 'send',
        chainId: 'eip155:1',
        status: 'success',
        timestamp: 1778593067000,
        hash: '0xvalid',
        data: {
          from: subjectAddress,
          to: otherAddress,
          token: {
            amount: '100',
            decimals: 6,
            direction: 'out',
            symbol: 'USDC',
            assetId: toAssetId(tokenAddress, 'eip155:1'),
          },
        },
      },
    ]);
  });
});

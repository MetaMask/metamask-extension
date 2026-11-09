import type { V5TransactionRecord } from '@metamask/core-backend';
import { renderHook } from '@testing-library/react';
import { useSelector } from 'react-redux';
import { toAssetId } from '../../../../shared/lib/asset-utils';
import { isExcludedTransactionHash } from './excluded-transaction-hash';
import { useQueryFilters } from './useQueryFilters';
import { isZeroValueSelfSend } from './zero-value-self-send';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

const subjectAddress = '0x9bed78535d6a03a955f1504aadba974d9a29e292';
const otherAddress = '0xf70da97812cb96acdf810712aa562db8dfa3dbef';
const tokenAddress = '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913';
const timestamp = 1778593067000;

function transaction({
  id = '0xhash',
  from = subjectAddress,
  to = otherAddress,
  value = '1',
  methodId,
  valueTransfers = [],
}: {
  id?: string;
  from?: string;
  to?: string | null;
  value?: string;
  methodId?: string | null;
  valueTransfers?: V5TransactionRecord['valueTransfers'];
} = {}): V5TransactionRecord {
  return {
    accountId: `eip155:1:${subjectAddress}`,
    tx: {
      id,
      chainId: 'eip155:1',
      status: 'confirmed',
      timestamp,
      date: '2026-05-12T13:37:47.000Z',
      from,
      to,
      blockNumber: '1',
      blockHash: '0xblock',
      value,
      methodId,
      transactionCategory: 'TRANSFER',
    },
    valueTransfers,
    fee: null,
  };
}

describe('query filters', () => {
  beforeEach(() => {
    jest.mocked(useSelector).mockReturnValue(new Set());
  });

  it('matches excluded transaction hashes case-insensitively', () => {
    expect(
      isExcludedTransactionHash(
        transaction({ id: '0xABC' }),
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

  it('filters query results and maps remaining transactions', () => {
    jest.mocked(useSelector).mockReturnValue(new Set(['0xexcluded']));
    const validTransaction = transaction({
      id: '0xvalid',
      valueTransfers: [
        {
          assetClass: 'ft',
          from: subjectAddress,
          to: otherAddress,
          assetId: `eip155:1/erc20:${tokenAddress}`,
          amount: '100',
          decimal: 6,
          symbol: 'USDC',
        },
      ],
    });
    const excludedTransaction = transaction({ id: '0xEXCLUDED' });

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
          unprocessedAccounts: [],
        },
      ],
      pageParams: [],
    });

    expect(filtered.pages[0].data).toEqual([
      {
        type: 'send',
        chainId: 'eip155:1',
        status: 'success',
        timestamp,
        hash: '0xvalid',
        data: {
          fees: undefined,
          from: subjectAddress,
          to: otherAddress,
          token: {
            amount: '100',
            assetType: 'erc20',
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

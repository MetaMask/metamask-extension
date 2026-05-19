import {
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import type { TransactionGroup } from '../../multichain/types';
import { CHAIN_IDS } from '../../../constants/network';
import { mapLocalTransaction } from './local-transaction';

const from = '0x9bed78535d6a03a955f1504aadba974d9a29e292';
const to = '0x80181d3ba89220cdb80234fc7aa19d5cc56229cc';

describe('mapLocalTransaction', () => {
  it('maps a pending native send to a Send activity', () => {
    const transaction = {
      chainId: CHAIN_IDS.MAINNET,
      id: 'send-id',
      hash: '0xsend',
      networkClientId: 'mainnet',
      status: TransactionStatus.submitted,
      time: 1716367781000,
      type: TransactionType.simpleSend,
      txParams: {
        from,
        to,
        value: '0x1',
      },
    };

    expect(
      mapLocalTransaction({
        transactionGroup: {
          hasCancelled: false,
          hasRetried: false,
          initialTransaction: transaction,
          nonce: '0x1',
          primaryTransaction: transaction,
          transactions: [transaction],
        } as unknown as TransactionGroup,
      }),
    ).toStrictEqual({
      type: 'send',
      chainId: 'eip155:1',
      status: 'pending',
      timestamp: 1716367781000,
      data: {
        hash: '0xsend',
        from,
        to,
        tokenSymbol: 'ETH',
      },
    });
  });

  it('uses the original transaction type and primary transaction status', () => {
    const initialTransaction = {
      chainId: CHAIN_IDS.LINEA_MAINNET,
      id: 'approve-id',
      hash: '0xapprove',
      networkClientId: 'linea-mainnet',
      status: TransactionStatus.submitted,
      time: 1716367781000,
      transferInformation: {
        contractAddress: '0x239fd4b0c4db49fa8660e65b97619d43d0e0a79d',
        decimals: 0,
        symbol: 'TDN',
      },
      type: TransactionType.tokenMethodApprove,
      txParams: {
        from,
        to: '0x239fd4b0c4db49fa8660e65b97619d43d0e0a79d',
        data: '0xa22cb465',
      },
    };
    const primaryTransaction = {
      ...initialTransaction,
      id: 'retry-id',
      hash: '0xretry',
      status: TransactionStatus.approved,
      time: 1716367881000,
      type: TransactionType.retry,
    };

    expect(
      mapLocalTransaction({
        transactionGroup: {
          hasCancelled: false,
          hasRetried: true,
          initialTransaction,
          nonce: '0x2',
          primaryTransaction,
          transactions: [initialTransaction, primaryTransaction],
        } as unknown as TransactionGroup,
      }),
    ).toStrictEqual({
      type: 'approveSpendingCap',
      chainId: 'eip155:59144',
      status: 'pending',
      timestamp: 1716367881000,
      data: {
        hash: '0xretry',
        tokenSymbol: 'TDN',
      },
    });
  });

  it('maps swap metadata token symbols to a Swap activity', () => {
    const transaction = {
      chainId: CHAIN_IDS.BASE,
      id: 'swap-id',
      hash: '0xswap',
      networkClientId: 'base-mainnet',
      status: TransactionStatus.confirmed,
      time: 1716367781000,
      swapMetaData: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        token_from: 'ETH',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        token_to: 'USDC',
      },
      type: TransactionType.swap,
      txParams: {
        from,
        to: '0x9dda6ef3d919c9bc8885d5560999a3640431e8e6',
        value: '0x246139ca8000',
      },
    };

    expect(
      mapLocalTransaction({
        transactionGroup: {
          hasCancelled: false,
          hasRetried: false,
          initialTransaction: transaction,
          nonce: '0x3',
          primaryTransaction: transaction,
          transactions: [transaction],
        } as unknown as TransactionGroup,
      }),
    ).toStrictEqual({
      type: 'swap',
      chainId: 'eip155:8453',
      status: 'success',
      timestamp: 1716367781000,
      data: {
        hash: '0xswap',
        sourceTokenSymbol: 'ETH',
        destinationTokenSymbol: 'USDC',
      },
    });
  });
});

import { TransactionStatus, TransactionType } from '@metamask/keyring-api';
import { MultichainNetworks } from '../../../constants/multichain/networks';
import { mapKeyringTransaction } from './keyring-transaction';

describe('mapKeyringTransaction', () => {
  it('maps keyring send transactions with token amount data', () => {
    expect(
      mapKeyringTransaction({
        transaction: {
          id: 'send-id',
          chain: MultichainNetworks.SOLANA,
          account: '00000000-0000-4000-8000-000000000000',
          status: TransactionStatus.Confirmed,
          timestamp: 1716367781,
          type: TransactionType.Send,
          from: [
            {
              address: 'from-address',
              asset: {
                fungible: true,
                type: `${MultichainNetworks.SOLANA}/token:usdc`,
                unit: 'USDC',
                amount: '2.5',
              },
            },
          ],
          to: [{ address: 'to-address', asset: null }],
          fees: [],
          events: [],
        },
      }),
    ).toStrictEqual({
      type: 'send',
      chainId: MultichainNetworks.SOLANA,
      status: 'success',
      timestamp: 1716367781000,
      data: {
        hash: 'send-id',
        from: 'from-address',
        to: 'to-address',
        token: {
          amount: '2.5',
          direction: 'out',
          symbol: 'USDC',
        },
      },
    });
  });

  it('maps keyring swap transactions with source and destination token amounts', () => {
    expect(
      mapKeyringTransaction({
        transaction: {
          id: 'swap-id',
          chain: MultichainNetworks.SOLANA,
          account: '00000000-0000-4000-8000-000000000000',
          status: TransactionStatus.Submitted,
          timestamp: 1716367781,
          type: TransactionType.Swap,
          from: [
            {
              address: 'from-address',
              asset: {
                fungible: true,
                type: `${MultichainNetworks.SOLANA}/slip44:501`,
                unit: 'SOL',
                amount: '1',
              },
            },
          ],
          to: [
            {
              address: 'to-address',
              asset: {
                fungible: true,
                type: `${MultichainNetworks.SOLANA}/token:usdc`,
                unit: 'USDC',
                amount: '100',
              },
            },
          ],
          fees: [],
          events: [],
        },
      }),
    ).toStrictEqual({
      type: 'swap',
      chainId: MultichainNetworks.SOLANA,
      status: 'pending',
      timestamp: 1716367781000,
      data: {
        hash: 'swap-id',
        sourceToken: {
          amount: '1',
          direction: 'out',
          symbol: 'SOL',
        },
        destinationToken: {
          amount: '100',
          direction: 'in',
          symbol: 'USDC',
        },
      },
    });
  });
});

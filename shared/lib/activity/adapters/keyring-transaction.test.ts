import { TransactionStatus, TransactionType } from '@metamask/keyring-api';
import { MultichainNetworks } from '../../../constants/multichain/networks';
import { mapKeyringTransaction } from './keyring-transaction';

describe('mapKeyringTransaction', () => {
  it('maps keyring send transactions with token amount data', () => {
    const item = mapKeyringTransaction({
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
    });

    expect(item).toStrictEqual(
      expect.objectContaining({
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
            assetId: `${MultichainNetworks.SOLANA}/token:usdc`,
            direction: 'out',
            symbol: 'USDC',
          },
        },
      }),
    );
  });

  it('maps keyring swap transactions with source and destination token amounts', () => {
    const item = mapKeyringTransaction({
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
    });

    expect(item).toStrictEqual(
      expect.objectContaining({
        type: 'swap',
        chainId: MultichainNetworks.SOLANA,
        status: 'pending',
        timestamp: 1716367781000,
        data: {
          hash: 'swap-id',
          sourceToken: {
            amount: '1',
            assetId: `${MultichainNetworks.SOLANA}/slip44:501`,
            direction: 'out',
            symbol: 'SOL',
          },
          destinationToken: {
            amount: '100',
            assetId: `${MultichainNetworks.SOLANA}/token:usdc`,
            direction: 'in',
            symbol: 'USDC',
          },
        },
      }),
    );
  });

  it('maps bitcoin send token from to-movement when from is empty', () => {
    const item = mapKeyringTransaction({
      transaction: {
        id: 'btc-send-output-id',
        chain: MultichainNetworks.BITCOIN,
        account: '00000000-0000-4000-8000-000000000000',
        status: TransactionStatus.Confirmed,
        timestamp: 1716367781,
        type: TransactionType.Send,
        from: [{ address: 'bc1from', asset: null }],
        to: [
          {
            address: 'bc1to',
            asset: {
              fungible: true,
              type: `${MultichainNetworks.BITCOIN}/slip44:0`,
              unit: 'BTC',
              amount: '0.1',
            },
          },
        ],
        fees: [],
        events: [],
      },
    });

    expect(item).toStrictEqual(
      expect.objectContaining({
        type: 'send',
        chainId: MultichainNetworks.BITCOIN,
        status: 'success',
        timestamp: 1716367781000,
        data: {
          hash: 'btc-send-output-id',
          from: 'bc1from',
          to: 'bc1to',
          token: {
            amount: '0.1',
            assetId: `${MultichainNetworks.BITCOIN}/slip44:0`,
            direction: 'out',
            symbol: 'BTC',
          },
        },
      }),
    );
  });
});

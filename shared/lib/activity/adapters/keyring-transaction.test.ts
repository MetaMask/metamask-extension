import { TransactionStatus, TransactionType } from '@metamask/keyring-api';
import { MultichainNetworks } from '../../../constants/multichain/networks';
import { solanaBridgeFixture } from './fixtures/non-evm-bridge';
import {
  CustomTransactionTypeLabel,
  mapKeyringTransaction,
} from './keyring-transaction';

const STELLAR_USDC_ASSET = `stellar:pubnet/asset:USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN`;

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

    expect(item).toMatchObject({
      type: 'send',
      chainId: MultichainNetworks.SOLANA,
      status: 'success',
      timestamp: 1716367781000,
      hash: 'send-id',
      data: {
        from: 'from-address',
        to: 'to-address',
        token: {
          amount: '2.5',
          assetId: `${MultichainNetworks.SOLANA}/token:usdc`,
          direction: 'out',
          symbol: 'USDC',
        },
      },
    });
  });

  it('maps cross-chain bridge source sends to bridge activity items', () => {
    const item = mapKeyringTransaction({
      subjectAddress: solanaBridgeFixture.fromAddress,
      transaction: solanaBridgeFixture.transaction,
      bridgeHistory: solanaBridgeFixture.bridgeHistory,
    });

    expect(item).toMatchObject({
      type: 'bridge',
      chainId: MultichainNetworks.SOLANA,
      status: 'success',
      hash: solanaBridgeFixture.transaction.id,
      data: {
        from: solanaBridgeFixture.fromAddress,
        sourceToken: {
          amount: '1.5',
          symbol: 'USDC',
          direction: 'out',
        },
        destinationToken: {
          amount: '1.4',
          symbol: 'USDC',
          direction: 'in',
        },
      },
    });
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

    expect(item).toMatchObject({
      type: 'swap',
      chainId: MultichainNetworks.SOLANA,
      status: 'pending',
      timestamp: 1716367781000,
      hash: 'swap-id',
      data: {
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
    });
  });

  it('maps token approve with amount ≤15 digits to approveSpendingCap preserving the amount', () => {
    const item = mapKeyringTransaction({
      transaction: {
        id: 'approve-id',
        chain: MultichainNetworks.SOLANA,
        account: '00000000-0000-4000-8000-000000000000',
        status: TransactionStatus.Confirmed,
        timestamp: 1716367781,
        type: TransactionType.TokenApprove,
        from: [
          {
            address: 'owner-address',
            asset: {
              fungible: true,
              type: `${MultichainNetworks.SOLANA}/token:usdc`,
              unit: 'USDC',
              amount: '999999999999999', // 15 digits — kept
            },
          },
        ],
        to: [{ address: 'spender-address', asset: null }],
        fees: [],
        events: [],
      },
    });

    expect(item).toMatchObject({
      type: 'approveSpendingCap',
      chainId: MultichainNetworks.SOLANA,
      status: 'success',
      timestamp: 1716367781000,
      hash: 'approve-id',
      data: {
        from: 'owner-address',
        token: {
          amount: '999999999999999',
          assetId: `${MultichainNetworks.SOLANA}/token:usdc`,
          direction: 'out',
          symbol: 'USDC',
        },
      },
    });
  });

  it('strips token amount for approve with >15 digit integer part (uint256.max)', () => {
    const uint256Max =
      '115792089237316195423570985008687907853269984665640564039457584007913129639935';
    const item = mapKeyringTransaction({
      transaction: {
        id: 'unlimited-approve-id',
        chain: MultichainNetworks.SOLANA,
        account: '00000000-0000-4000-8000-000000000000',
        status: TransactionStatus.Confirmed,
        timestamp: 1716367781,
        type: TransactionType.TokenApprove,
        from: [
          {
            address: 'owner-address',
            asset: {
              fungible: true,
              type: `${MultichainNetworks.SOLANA}/token:usdc`,
              unit: 'USDC',
              amount: uint256Max,
            },
          },
        ],
        to: [{ address: 'spender-address', asset: null }],
        fees: [],
        events: [],
      },
    });

    expect(item).toMatchObject({
      type: 'approveSpendingCap',
      hash: 'unlimited-approve-id',
      data: {
        token: {
          assetId: `${MultichainNetworks.SOLANA}/token:usdc`,
          symbol: 'USDC',
          direction: 'out',
          amount: undefined,
        },
      },
    });
  });

  it('strips token amount when integer part has exactly 16 digits (boundary)', () => {
    const item = mapKeyringTransaction({
      transaction: {
        id: 'boundary-approve-id',
        chain: MultichainNetworks.SOLANA,
        account: '00000000-0000-4000-8000-000000000000',
        status: TransactionStatus.Confirmed,
        timestamp: 1716367781,
        type: TransactionType.TokenApprove,
        from: [
          {
            address: 'owner-address',
            asset: {
              fungible: true,
              type: `${MultichainNetworks.SOLANA}/token:usdc`,
              unit: 'USDC',
              amount: '1000000000000000', // 16 digits — stripped
            },
          },
        ],
        to: [{ address: 'spender-address', asset: null }],
        fees: [],
        events: [],
      },
    });

    expect(item).toMatchObject({
      type: 'approveSpendingCap',
      data: {
        token: {
          amount: undefined,
        },
      },
    });
  });

  it('maps bitcoin send from account address and to output address', () => {
    const item = mapKeyringTransaction({
      subjectAddress: 'bc1qcj8v4ft5uvt59jjrxd856a48xegclwne78h0ye',
      transaction: {
        id: '9a2098cdeb6dcd2d89b9d8993b5f5b2d97a49f91b63aba0ae6d525e6532a64b6',
        chain: MultichainNetworks.BITCOIN,
        account: '00000000-0000-4000-8000-000000000000',
        status: TransactionStatus.Confirmed,
        timestamp: 1716367781,
        type: TransactionType.Send,
        from: [],
        to: [
          {
            address: 'bc1qc5tzsfpd3zjecma6529kanjtug69rf58mtfxmu',
            asset: {
              fungible: true,
              type: `${MultichainNetworks.BITCOIN}/slip44:0`,
              unit: 'BTC',
              amount: '0.000003',
            },
          },
        ],
        fees: [],
        events: [],
      },
    });

    expect(item).toMatchObject({
      type: 'send',
      data: {
        from: 'bc1qcj8v4ft5uvt59jjrxd856a48xegclwne78h0ye',
        to: 'bc1qc5tzsfpd3zjecma6529kanjtug69rf58mtfxmu',
        token: {
          amount: '0.000003',
          direction: 'out',
          symbol: 'BTC',
        },
      },
    });
  });

  it('maps trustline approve TokenApprove to assetActivation', () => {
    const item = mapKeyringTransaction({
      transaction: {
        id: 'trustline-approve-id',
        chain: 'stellar:pubnet',
        account: '00000000-0000-4000-8000-000000000000',
        status: TransactionStatus.Confirmed,
        timestamp: 1716367781,
        type: TransactionType.TokenApprove,
        details: {
          typeLabel: CustomTransactionTypeLabel.TrustlineApprove,
        },
        from: [
          {
            address: 'owner-address',
            asset: {
              fungible: true,
              type: STELLAR_USDC_ASSET,
              unit: 'USDC',
              amount: '0',
            },
          },
        ],
        to: [{ address: 'issuer-address', asset: null }],
        fees: [],
        events: [],
      },
    });

    expect(item).toMatchObject({
      type: 'assetActivation',
      chainId: 'stellar:pubnet',
      status: 'success',
      timestamp: 1716367781000,
      hash: 'trustline-approve-id',
      data: {
        from: 'owner-address',
        token: {
          amount: undefined,
          assetId: STELLAR_USDC_ASSET,
          direction: 'out',
          symbol: 'USDC',
        },
      },
    });
  });

  it('maps trustline disapprove TokenDisapprove to assetDeactivation', () => {
    const item = mapKeyringTransaction({
      transaction: {
        id: 'trustline-disapprove-id',
        chain: 'stellar:pubnet',
        account: '00000000-0000-4000-8000-000000000000',
        status: TransactionStatus.Confirmed,
        timestamp: 1716367781,
        type: TransactionType.TokenDisapprove,
        details: {
          typeLabel: CustomTransactionTypeLabel.TrustlineDisapprove,
        },
        from: [
          {
            address: 'owner-address',
            asset: {
              fungible: true,
              type: STELLAR_USDC_ASSET,
              unit: 'USDC',
              amount: '0',
            },
          },
        ],
        to: [{ address: 'issuer-address', asset: null }],
        fees: [],
        events: [],
      },
    });

    expect(item).toMatchObject({
      type: 'assetDeactivation',
      chainId: 'stellar:pubnet',
      status: 'success',
      timestamp: 1716367781000,
      hash: 'trustline-disapprove-id',
      data: {
        from: 'owner-address',
        token: {
          amount: undefined,
          assetId: STELLAR_USDC_ASSET,
          direction: 'out',
          symbol: 'USDC',
        },
      },
    });
  });
});

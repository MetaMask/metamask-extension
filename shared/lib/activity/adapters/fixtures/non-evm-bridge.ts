import { StatusTypes } from '@metamask/bridge-controller';
import type { BridgeHistoryItem } from '@metamask/bridge-status-controller';
import { TransactionStatus, TransactionType } from '@metamask/keyring-api';
import type { Transaction } from '@metamask/keyring-api';
import { MultichainNetworks } from '../../../../constants/multichain/networks';

const fromAddress = 'EsEduLCwNdAbJZ2oTr1wB1ymQw76NuwswWwG6imzQN7H';
const txId =
  '66tz9MfmUDrFsN1STJabEyJrsukcTzNdmSNmdXGY1jaXSD2uuP8xigJdcBzAAYhyPnceR2Su2ryfunwiZGwBCGvL';

export const solanaBridgeFixture = {
  fromAddress,
  transaction: {
    id: txId,
    chain: MultichainNetworks.SOLANA,
    account: 'acc-1',
    status: TransactionStatus.Confirmed,
    timestamp: 1781530731,
    type: TransactionType.Send,
    from: [
      {
        address: fromAddress,
        asset: {
          fungible: true,
          type: `${MultichainNetworks.SOLANA}/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`,
          unit: 'USDC',
          amount: '1.5',
        },
      },
    ],
    to: [{ address: 'to-address', asset: null }],
    fees: [],
    events: [],
  } as unknown as Transaction,
  bridgeHistory: {
    quote: {
      srcChainId: MultichainNetworks.SOLANA,
      destChainId: 1,
      srcTokenAmount: '1.5',
      destTokenAmount: '1.4',
      srcAsset: {
        assetId: `${MultichainNetworks.SOLANA}/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`,
        decimals: 6,
        symbol: 'USDC',
      },
      destAsset: {
        assetId: 'eip155:1/token:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        decimals: 6,
        symbol: 'USDC',
      },
    },
    status: {
      status: StatusTypes.COMPLETE,
      destChain: { amount: '1.4' },
    },
  } as unknown as BridgeHistoryItem,
};

import {
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import { CHAIN_IDS } from '../../../../constants/network';

const nftPurchaseErc1155Transaction = {
  chainId: CHAIN_IDS.MAINNET,
  id: 'nft-buy-id',
  hash: '0x2fda37c5b591c30367649c3c317621429bb5c59ff6a77b0a8cd48b56897168bc',
  status: TransactionStatus.confirmed,
  time: 1780606867763,
  type: TransactionType.contractInteraction,
  txParams: {
    from: '0x9bed78535d6a03a955f1504aadba974d9a29e292',
    to: '0x0000000000000068f116a894984e2db1123eb395',
    value: '0x51d91a3da280',
    data: '0x00000000',
  },
  simulationData: {
    nativeBalanceChange: {
      previousBalance: '0x49bfcb2d8362e',
      newBalance: '0x44a23989a93ae',
      difference: '0x51d91a3da280',
      isDecrease: true,
    },
    tokenBalanceChanges: [
      {
        address: '0x6fad73936527d2a82aea5384d252462941b44042',
        standard: 'erc1155',
        id: '0x39',
        previousBalance: '0x0',
        newBalance: '0x1',
        difference: '0x1',
        isDecrease: false,
      },
    ],
  },
};

export const localStateFixtures = {
  // ERC-1155 purchase local state before API metadata is available.
  nftPurchaseErc1155: {
    transactionGroup: {
      hasCancelled: false,
      hasRetried: false,
      initialTransaction: nftPurchaseErc1155Transaction,
      nonce: '0xd8',
      primaryTransaction: nftPurchaseErc1155Transaction,
      transactions: [nftPurchaseErc1155Transaction],
    },
  },
};

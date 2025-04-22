import { MultichainTransactionDetailsModal } from './multichain-transaction-details-modal';

export default {
  title: 'Components/App/MultichainTransactionDetailsModal',
  component: MultichainTransactionDetailsModal,
};

const mockTransaction = {
  type: 'send',
  status: 'confirmed',
  timestamp: new Date('Sep 30 2023 12:56').getTime(),
  id: 'b93ea2cb4eed0f9e13284ed8860bcfc45de2488bb6a8b0b2a843c4b2fbce40f3',
  chain: 'bip122:000000000019d6689c085ae165831e93',
  account: 'test-account-id',
  from: [
    {
      address: 'bc1p7atgm33ak04ntsq9366mvym42ecrk4y34ssysc99340a39eq9arq0pu9uj',
      asset: {
        amount: '1.2',
        unit: 'BTC',
        fungible: true,
      },
    },
  ],
  to: [
    {
      address: 'bc1p3t7744qewy262ym5afgeuqlwswtpfe22y7c4lwv0a7972p2k73msee7rr3',
      asset: {
        amount: '1.2',
        unit: 'BTC',
        fungible: true,
      },
    },
  ],
  fees: [
    {
      type: 'priority',
      asset: {
        amount: '1.0001',
        unit: 'BTC',
        fungible: true,
      },
    },
  ],
};

export const Default = {
  args: {
    transaction: mockTransaction,
    onClose: () => console.log('Modal closed'),
    userAddress:
      'bc1p7atgm33ak04ntsq9366mvym42ecrk4y34ssysc99340a39eq9arq0pu9uj',
    networkConfig: {
      nickname: 'Bitcoin',
      isEvmNetwork: false,
      chainId: 'bip122:000000000019d6689c085ae165831e93',
      decimals: 8,
      ticker: 'BTC',
      id: 'btc-mainnet',
    },
  },
};

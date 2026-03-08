import React from 'react';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import { render, screen } from '@testing-library/react';
import type { BridgeHistoryItem } from '@metamask/bridge-status-controller';
import {
  type Transaction,
  TransactionStatus,
  TransactionType,
} from '@metamask/keyring-api';
import { StatusTypes } from '@metamask/bridge-controller';
import { TransactionGroupCategory } from '../../../../shared/constants/transaction';
import useBridgeChainInfo from '../../../hooks/bridge/useBridgeChainInfo';
import MultichainBridgeTransactionListItem from './multichain-bridge-transaction-list-item';

jest.mock('../../../hooks/bridge/useBridgeChainInfo');

jest.mock('../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string, args?: string[]) => {
    const messages: Record<string, string> = {
      bridgeTo: 'Bridge to',
      bridgeTransactionProgress: `Transaction ${args?.[0]} of 2`,
      swap: 'Swap',
      swapTokenToToken: `Swap ${args?.[0]} to ${args?.[1]}`,
    };

    return messages[key] ?? key;
  },
}));

jest.mock('../transaction-icon', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: ({ category }: { category: string }) => (
    <div data-testid="transaction-icon" data-category={category} />
  ),
}));

const mockStore = configureMockStore();
const mockUseBridgeChainInfo = useBridgeChainInfo as jest.Mock;

const renderComponent = (bridgeHistoryItem: BridgeHistoryItem) => {
  const store = mockStore({
    localeMessages: {
      currentLocale: 'en',
    },
  });

  const transaction = {
    id: 'tron-swap-source',
    chain: 'tron:728126428',
    status: TransactionStatus.Confirmed,
    timestamp: 1708800000,
    type: TransactionType.Swap,
    from: [
      {
        asset: {
          amount: '5',
          fungible: true,
          type: 'tron:728126428/trc20:TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
          unit: 'USDT',
        },
      },
    ],
  } as unknown as Transaction;

  return render(
    <Provider store={store}>
      <MultichainBridgeTransactionListItem
        transaction={transaction}
        bridgeHistoryItem={bridgeHistoryItem}
        toggleShowDetails={jest.fn()}
      />
    </Provider>,
  );
};

describe('MultichainBridgeTransactionListItem', () => {
  beforeEach(() => {
    mockUseBridgeChainInfo.mockReturnValue({
      srcNetwork: { chainId: 'tron:728126428' },
      destNetwork: { chainId: 'tron:728126428' },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders same-chain Tron async swaps as swaps', () => {
    renderComponent({
      quote: {
        srcChainId: 'tron:728126428',
        destChainId: 'tron:728126428',
        srcAsset: { symbol: 'USDT' },
        destAsset: { symbol: 'TRX' },
      },
      status: {
        srcChain: { txHash: '0xsource' },
        status: StatusTypes.PENDING,
      },
    } as unknown as BridgeHistoryItem);

    expect(screen.getByText('Swap USDT to TRX')).toBeInTheDocument();
    expect(screen.getByTestId('transaction-icon')).toHaveAttribute(
      'data-category',
      TransactionGroupCategory.swap,
    );
  });
});

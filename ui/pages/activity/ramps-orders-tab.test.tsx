import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RampsOrderStatus } from '@metamask/ramps-controller';
import { syncRampsOrdersWithUserStorage } from '../../store/controller-actions/ramps-controller';
import {
  createRampsMockStore,
  createRampsTestWrapper,
} from '../../hooks/ramps/test-utils';
import { RampsOrdersTab } from './ramps-orders-tab';

jest.mock('../../store/controller-actions/ramps-controller', () => ({
  syncRampsOrdersWithUserStorage: jest.fn().mockResolvedValue(undefined),
}));

const mockOrder = {
  id: 'order-1',
  providerOrderId: 'provider-order-1',
  walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
  status: RampsOrderStatus.Completed,
  createdAt: 1_704_067_200_000,
  fiatAmount: 100,
  cryptoAmount: '0.05',
  fiatCurrency: { symbol: 'USD' },
  cryptoCurrency: { symbol: 'ETH' },
  provider: { id: '/providers/transak', name: 'Transak' },
  network: { name: 'Ethereum', chainId: 'eip155:1' },
  paymentMethod: { id: 'card', name: 'Debit card' },
  orderType: 'BUY',
  providerOrderLink: 'https://example.com/order/1',
  txHash: '',
  isOnlyLink: false,
  success: true,
  totalFeesFiat: 2,
  canBeUpdated: false,
  idHasExpired: false,
  excludeFromPurchases: false,
  timeDescriptionPending: '',
} as const;

describe('RampsOrdersTab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('matches snapshot when empty', () => {
    const { container } = render(<RampsOrdersTab />, {
      wrapper: createRampsTestWrapper(),
    });

    expect(container).toMatchSnapshot();
  });

  it('matches snapshot with orders', () => {
    const store = createRampsMockStore({
      orders: [mockOrder],
    });

    const { container } = render(<RampsOrdersTab />, {
      wrapper: createRampsTestWrapper(store),
    });

    expect(container).toMatchSnapshot();
  });

  it('opens order details when a card is clicked', async () => {
    const user = userEvent.setup();
    const store = createRampsMockStore({
      orders: [mockOrder],
    });

    render(<RampsOrdersTab />, {
      wrapper: createRampsTestWrapper(store),
    });

    await user.click(screen.getByTestId('ramps-order-card-provider-order-1'));

    expect(screen.getByTestId('ramps-order-detail-modal')).toMatchSnapshot();
  });

  it('triggers user storage sync', async () => {
    const user = userEvent.setup();

    render(<RampsOrdersTab />, {
      wrapper: createRampsTestWrapper(),
    });

    await user.click(screen.getByTestId('ramps-orders-sync-button'));

    expect(syncRampsOrdersWithUserStorage).toHaveBeenCalledTimes(1);
  });
});

/**
 * @jest-environment jsdom
 */
import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RampsOrderStatus, type RampsOrder } from '@metamask/ramps-controller';
import copyToClipboard from 'copy-to-clipboard';
import configureStore from '../../../../store/store';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../../test/lib/i18n-helpers';
import { OrderContent } from './order-content';

// Pin the timezone so date snapshots are deterministic regardless of the
// contributor's local timezone (formatDate renders in the local zone).
process.env.TZ = 'UTC';

jest.mock('copy-to-clipboard');
const mockCopyToClipboard = jest.mocked(copyToClipboard);

const completedOrder = {
  providerOrderId: 'provider-order-1234567890',
  providerOrderLink: 'https://provider.example/order/1',
  status: RampsOrderStatus.Completed,
  createdAt: 1_700_000_000_000,
  cryptoAmount: '0.5',
  fiatAmount: 1000,
  totalFeesFiat: 12.5,
  cryptoCurrency: {
    symbol: 'ETH',
    iconUrl: 'https://x/eth.png',
    decimals: 18,
    chainId: 'eip155:1',
  },
  fiatCurrency: { symbol: 'USD', decimals: 2 },
  network: { name: 'Ethereum', chainId: 'eip155:1' },
  provider: { id: 'transak', name: 'Transak' },
  walletAddress: '0xabc',
} as unknown as RampsOrder;

const renderContent = (order: RampsOrder) =>
  renderWithProvider(
    <OrderContent order={order} />,
    configureStore({ metamask: {} }),
  );

describe('OrderContent (completed)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders the crypto amount and symbol', () => {
    renderContent(completedOrder);
    expect(
      screen.getByTestId('ramps-order-details-token-amount'),
    ).toHaveTextContent('0.5 ETH');
  });

  it('renders the token logo with the crypto icon', () => {
    renderContent(completedOrder);
    expect(
      screen.getByTestId('ramps-order-details-token-icon'),
    ).toHaveAttribute('src', 'https://x/eth.png');
  });

  it('renders the fees and total formatted as currency', () => {
    renderContent(completedOrder);
    expect(screen.getByTestId('ramps-order-details-fees')).toHaveTextContent(
      '$12.50',
    );
    expect(screen.getByTestId('ramps-order-details-total')).toHaveTextContent(
      '$1,000.00',
    );
  });

  it('renders the view-on-provider link when providerOrderLink is set', () => {
    renderContent(completedOrder);
    expect(
      screen.getByTestId('ramps-order-details-view-on-provider'),
    ).toBeInTheDocument();
  });

  it('hides the view-on-provider link when providerOrderLink is empty', () => {
    renderContent({ ...completedOrder, providerOrderLink: '' } as RampsOrder);
    expect(
      screen.queryByTestId('ramps-order-details-view-on-provider'),
    ).not.toBeInTheDocument();
  });

  it('copies the full order id when the order id is clicked', async () => {
    const user = userEvent.setup();
    renderContent(completedOrder);
    await user.click(screen.getByTestId('ramps-order-details-order-id'));
    expect(mockCopyToClipboard).toHaveBeenCalledWith(
      'provider-order-1234567890',
      expect.anything(),
    );
  });

  it('has an accessible name on the copy-order-id button', () => {
    renderContent(completedOrder);
    expect(
      screen.getByRole('button', { name: messages.copyToClipboard.message }),
    ).toBe(screen.getByTestId('ramps-order-details-order-id'));
  });

  it('matches the completed snapshot', () => {
    const { container } = renderContent(completedOrder);
    expect(container).toMatchSnapshot();
  });

  it('renders a humanized status label for completed orders', () => {
    renderContent(completedOrder);
    expect(screen.getByTestId('ramps-order-details-status')).toHaveTextContent(
      'Complete',
    );
  });

  it('renders a humanized "Failed" label for failed orders', () => {
    renderContent({
      ...completedOrder,
      status: RampsOrderStatus.Failed,
    } as RampsOrder);
    expect(screen.getByTestId('ramps-order-details-status')).toHaveTextContent(
      'Failed',
    );
  });

  it('hides the status description for a terminal order', () => {
    renderContent({
      ...completedOrder,
      statusDescription: 'Your funds have been delivered.',
    } as unknown as RampsOrder);
    expect(
      screen.queryByTestId('ramps-order-details-status-description'),
    ).not.toBeInTheDocument();
  });

  it('renders bank transfer details when paymentDetails are present', () => {
    renderContent({
      ...completedOrder,
      paymentDetails: [
        {
          fiatCurrency: 'USD',
          paymentMethod: 'bank_transfer',
          fields: [
            { id: 'iban', name: 'IBAN', value: 'DE00 0000 0000' },
            { id: 'bic', name: 'BIC', value: 'ABCDEF' },
          ],
        },
      ],
    } as unknown as RampsOrder);
    const section = screen.getByTestId('ramps-order-details-bank-details');
    expect(section).toHaveTextContent('IBAN');
    expect(section).toHaveTextContent('DE00 0000 0000');
    expect(section).toHaveTextContent('BIC');
  });

  it('renders the order id unshortened when it is 8 characters or fewer', () => {
    renderContent({
      ...completedOrder,
      providerOrderId: 'abcd1234',
    } as RampsOrder);
    expect(
      screen.getByTestId('ramps-order-details-order-id'),
    ).toHaveTextContent('abcd1234');
  });

  it('falls back to USD/2 decimals when fiatCurrency is missing', () => {
    const { fiatCurrency, ...rest } = completedOrder;
    renderContent(rest as RampsOrder);
    expect(screen.getByTestId('ramps-order-details-fees')).toHaveTextContent(
      '$12.50',
    );
    expect(screen.getByTestId('ramps-order-details-total')).toHaveTextContent(
      '$1,000.00',
    );
  });

  it('renders an empty symbol when cryptoCurrency.symbol is missing', () => {
    renderContent({
      ...completedOrder,
      cryptoCurrency: { ...completedOrder.cryptoCurrency, symbol: undefined },
    } as unknown as RampsOrder);
    expect(
      screen.getByTestId('ramps-order-details-token-amount'),
    ).toHaveTextContent('0.5');
  });

  it('falls back to a generic label when provider name is missing', () => {
    renderContent({
      ...completedOrder,
      provider: { ...completedOrder.provider, name: undefined },
    } as unknown as RampsOrder);
    expect(
      screen.getByTestId('ramps-order-details-view-on-provider'),
    ).toBeInTheDocument();
  });
});

describe('OrderContent (pending)', () => {
  const pendingOrder = {
    ...completedOrder,
    status: RampsOrderStatus.Pending,
    cryptoAmount: '',
  } as unknown as RampsOrder;

  it('shows the pending message', () => {
    renderContent(pendingOrder);
    expect(
      screen.getByTestId('ramps-order-details-pending-message'),
    ).toHaveTextContent('Your order may take some time to confirm.');
  });

  it('shows an amount skeleton while the crypto amount is unresolved', () => {
    renderContent(pendingOrder);
    expect(
      screen.getByTestId('ramps-order-details-amount-skeleton'),
    ).toBeInTheDocument();
  });

  it('shows fee and total skeletons while amounts are unresolved', () => {
    renderContent(pendingOrder);
    expect(
      screen.getByTestId('ramps-order-details-fees-skeleton'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('ramps-order-details-total-skeleton'),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('ramps-order-details-fees')).toBeNull();
  });

  it('renders the amount and hides the skeleton when the crypto amount is resolved', () => {
    renderContent({
      ...completedOrder,
      status: RampsOrderStatus.Pending,
    } as RampsOrder);
    expect(
      screen.getByTestId('ramps-order-details-token-amount'),
    ).toHaveTextContent('0.5 ETH');
    expect(
      screen.queryByTestId('ramps-order-details-amount-skeleton'),
    ).not.toBeInTheDocument();
  });

  it('matches the pending snapshot', () => {
    const { container } = renderContent(pendingOrder);
    expect(container).toMatchSnapshot();
  });

  it('renders the status description inline for a pending order', () => {
    renderContent({
      ...pendingOrder,
      statusDescription: 'Card purchases may take a few minutes to complete.',
    } as unknown as RampsOrder);
    expect(
      screen.getByTestId('ramps-order-details-status-description'),
    ).toHaveTextContent('Card purchases may take a few minutes to complete.');
  });
});

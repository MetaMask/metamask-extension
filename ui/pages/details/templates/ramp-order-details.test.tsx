import React from 'react';
import { render } from '@testing-library/react';
import type { ActivityListItem } from '../../../../shared/lib/activity/types';
import { RampOrderDetails } from './ramp-order-details';

const mockHandleCopy = jest.fn();
const mockGoToBuy = jest.fn();
const mockOpenTab = jest.fn();

jest.mock('../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string, args?: string[]) =>
    args ? `${key}:${args.join(',')}` : key,
}));

jest.mock('../../../hooks/useFormatters', () => ({
  useFormatters: () => ({
    formatCurrencyWithMinThreshold: (amount: number, currency?: string) =>
      `${amount} ${currency ?? ''}`.trim(),
  }),
}));

jest.mock('../../../hooks/useCopyToClipboard', () => ({
  useCopyToClipboard: () => [{ copied: false }, mockHandleCopy],
}));

jest.mock('../../../hooks/ramps/useRampsNavigation/useRampsNavigation', () => ({
  __esModule: true,
  default: () => ({ goToBuy: mockGoToBuy }),
}));

jest.mock('../components/sections', () => ({
  MetadataSection: () => <div data-testid="metadata-section" />,
  TokensSection: ({
    tokens,
  }: {
    tokens: { token?: { symbol?: string } }[];
  }) => <div data-testid="tokens-section">{tokens[0]?.token?.symbol}</div>,
}));

jest.mock('../components/block-explorer-button', () => ({
  BlockExplorerButton: ({
    chainId,
    txHash,
  }: {
    chainId?: string;
    txHash?: string;
  }) => (
    <div
      data-testid="block-explorer-button"
      data-chain-id={chainId}
      data-tx-hash={txHash}
    />
  ),
}));

jest.mock('../components/shared', () => ({
  Footer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="footer">{children}</div>
  ),
  Section: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="section">{children}</div>
  ),
  Row: ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div data-testid="row" data-label={label}>
      {value}
    </div>
  ),
}));

beforeEach(() => {
  jest.clearAllMocks();
  (
    global as unknown as { platform: { openTab: typeof mockOpenTab } }
  ).platform = { openTab: mockOpenTab };
});

type RampOrderItem = Extract<
  ActivityListItem,
  { type: 'rampBuy' | 'rampSell' }
>;

const buildItem = (overrides: Partial<RampOrderItem> = {}): RampOrderItem =>
  ({
    type: 'rampBuy',
    chainId: 'eip155:1',
    status: 'success',
    timestamp: 1700000000000,
    hash: undefined,
    id: '/providers/transak/orders/order-123456789012',
    data: {
      from: '0xabc123',
      fiat: { amount: '100', currency: 'USD' },
      token: { symbol: 'ETH', assetId: 'eip155:1/slip44:60', direction: 'in' },
      fees: [],
      provider: {
        id: 'transak',
        name: 'Transak',
        orderLink: 'https://transak.example/order-123',
      },
      statusDescription: undefined,
      paymentDetails: [],
    },
    ...overrides,
  }) as RampOrderItem;

describe('RampOrderDetails', () => {
  it('renders the token hero, metadata, and fees sections', () => {
    const { getByTestId } = render(
      <RampOrderDetails
        item={buildItem({
          data: {
            ...buildItem().data,
            fees: [{ type: 'total', amount: '0.98', symbol: 'USD' }],
          },
        })}
      />,
    );

    expect(getByTestId('tokens-section')).toHaveTextContent('ETH');
    expect(getByTestId('metadata-section')).toBeInTheDocument();
  });

  it('formats the fee as a single fiat amount, without duplicating the currency', () => {
    const { getAllByTestId } = render(
      <RampOrderDetails
        item={buildItem({
          data: {
            ...buildItem().data,
            fees: [{ type: 'total', amount: '0.98', symbol: 'USD' }],
          },
        })}
      />,
    );

    const feeRow = getAllByTestId('row').find(
      (row) => row.getAttribute('data-label') === 'rampsOrderDetailsFees',
    );
    expect(feeRow).toHaveTextContent('0.98 USD');
    expect(feeRow?.textContent?.match(/USD/gu)).toHaveLength(1);
  });

  it('shows a shortened, copyable order id', () => {
    const { getByText } = render(<RampOrderDetails item={buildItem()} />);

    const idButton = getByText('order-...789012');
    idButton.click();

    expect(mockHandleCopy).toHaveBeenCalledWith('order-123456789012');
  });

  it('does not show a status description for a completed order', () => {
    const { queryByText } = render(
      <RampOrderDetails
        item={buildItem({
          data: {
            ...buildItem().data,
            statusDescription: 'Your deposit was successful!',
          },
        })}
      />,
    );

    expect(queryByText('Your deposit was successful!')).not.toBeInTheDocument();
  });

  it('shows a status description for a failed order', () => {
    const { getByText } = render(
      <RampOrderDetails
        item={buildItem({
          status: 'failed',
          data: {
            ...buildItem().data,
            statusDescription: 'The provider could not process the payment.',
          },
        })}
      />,
    );

    expect(
      getByText('The provider could not process the payment.'),
    ).toBeInTheDocument();
  });

  it('opens the provider order link when "view on provider" is clicked', () => {
    const { getByText } = render(<RampOrderDetails item={buildItem()} />);

    getByText('rampsOrderDetailsViewOnProvider:Transak').click();

    expect(mockOpenTab).toHaveBeenCalledWith({
      url: 'https://transak.example/order-123',
    });
  });

  it('shows a "buy again" CTA for a buy order', () => {
    const { getByText } = render(<RampOrderDetails item={buildItem()} />);

    expect(getByText('rampsOrderDetailsBuyAgain')).toBeInTheDocument();
  });

  it('does not show a "buy again" CTA for a sell order', () => {
    const { queryByText } = render(
      <RampOrderDetails item={buildItem({ type: 'rampSell' })} />,
    );

    expect(queryByText('rampsOrderDetailsBuyAgain')).not.toBeInTheDocument();
  });

  it('renders a block explorer button with the item chain id and hash', () => {
    const { getByTestId } = render(
      <RampOrderDetails item={buildItem({ hash: '0xsettlementhash' })} />,
    );

    const button = getByTestId('block-explorer-button');
    expect(button).toHaveAttribute('data-chain-id', 'eip155:1');
    expect(button).toHaveAttribute('data-tx-hash', '0xsettlementhash');
  });
});

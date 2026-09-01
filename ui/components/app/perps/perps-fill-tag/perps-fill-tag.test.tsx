import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../../test/lib/i18n-helpers';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { FillType } from '../types/transactionHistory';
import type { PerpsTransaction } from '../types';
import { PERPS_SUPPORT_ARTICLES_URLS } from '../../../../../shared/constants/perps';
import { PerpsFillTag } from './perps-fill-tag';

const MOCK_ADDRESS = '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc';

const createMockStore = (address: string = MOCK_ADDRESS) =>
  configureStore({
    metamask: {
      ...mockState.metamask,
      internalAccounts: {
        ...mockState.metamask.internalAccounts,
        accounts: {
          ...mockState.metamask.internalAccounts.accounts,
          [mockState.metamask.internalAccounts.selectedAccount]: {
            ...mockState.metamask.internalAccounts.accounts[
              mockState.metamask.internalAccounts
                .selectedAccount as keyof typeof mockState.metamask.internalAccounts.accounts
            ],
            address,
          },
        },
      },
    },
  });

const createMockTransaction = (
  fillType: FillType,
  overrides?: Partial<PerpsTransaction>,
): PerpsTransaction => ({
  id: 'test-id',
  type: 'trade',
  category: 'position_close',
  title: 'Closed long',
  subtitle: '1.5 ETH',
  timestamp: Date.now(),
  symbol: 'ETH',
  fill: {
    shortTitle: 'Closed long',
    amount: '+$100',
    amountNumber: 100,
    isPositive: true,
    size: '1.5',
    entryPrice: '2000',
    points: '0',
    pnl: '+100',
    fee: '1',
    action: 'Closed',
    feeToken: 'USDC',
    fillType,
  },
  ...overrides,
});

describe('PerpsFillTag', () => {
  const mockOpenTab = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    globalThis.platform = { openTab: mockOpenTab } as never;
  });

  it('returns null for standard fill type', () => {
    const store = createMockStore();
    const transaction = createMockTransaction(FillType.Standard);

    const { container } = renderWithProvider(
      <PerpsFillTag transaction={transaction} />,
      store,
    );

    expect(container.firstChild).toBeNull();
  });

  it('returns null when no fill data', () => {
    const store = createMockStore();
    const transaction: PerpsTransaction = {
      id: 'test-id',
      type: 'trade',
      category: 'position_close',
      title: 'Test',
      subtitle: 'Test',
      timestamp: Date.now(),
      symbol: 'ETH',
    };

    const { container } = renderWithProvider(
      <PerpsFillTag transaction={transaction} />,
      store,
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders Take Profit badge', () => {
    const store = createMockStore();
    const transaction = createMockTransaction(FillType.TakeProfit);

    renderWithProvider(<PerpsFillTag transaction={transaction} />, store);

    expect(
      screen.getByText(messages.perpsTakeProfit.message),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('perps-fill-tag-take-profit'),
    ).toBeInTheDocument();
  });

  it('renders Stop Loss badge', () => {
    const store = createMockStore();
    const transaction = createMockTransaction(FillType.StopLoss);

    renderWithProvider(<PerpsFillTag transaction={transaction} />, store);

    expect(
      screen.getByText(messages.perpsStopLoss.message),
    ).toBeInTheDocument();
    expect(screen.getByTestId('perps-fill-tag-stop-loss')).toBeInTheDocument();
  });

  it('renders Auto-deleveraging badge', () => {
    const store = createMockStore();
    const transaction = createMockTransaction(FillType.AutoDeleveraging);

    renderWithProvider(<PerpsFillTag transaction={transaction} />, store);

    expect(
      screen.getByText(messages.perpsAutoDeleveraging.message),
    ).toBeInTheDocument();
    expect(screen.getByTestId('perps-fill-tag-adl')).toBeInTheDocument();
  });

  it('opens ADL support article when ADL badge is clicked', () => {
    const store = createMockStore();
    const transaction = createMockTransaction(FillType.AutoDeleveraging);

    renderWithProvider(<PerpsFillTag transaction={transaction} />, store);

    fireEvent.click(screen.getByTestId('perps-fill-tag-adl-button'));

    expect(mockOpenTab).toHaveBeenCalledWith({
      url: PERPS_SUPPORT_ARTICLES_URLS.AdlUrl,
    });
  });

  it('renders Liquidated badge when user is the liquidated user', () => {
    const store = createMockStore(MOCK_ADDRESS);
    const transaction = createMockTransaction(FillType.Liquidation, {
      fill: {
        shortTitle: 'Closed long',
        amount: '-$100',
        amountNumber: -100,
        isPositive: false,
        size: '1.5',
        entryPrice: '2000',
        points: '0',
        pnl: '-100',
        fee: '1',
        action: 'Closed',
        feeToken: 'USDC',
        fillType: FillType.Liquidation,
        liquidation: {
          liquidatedUser: MOCK_ADDRESS,
          markPx: '1800',
          method: 'market',
        },
      },
    });

    renderWithProvider(<PerpsFillTag transaction={transaction} />, store);

    expect(
      screen.getByText(messages.perpsLiquidated.message),
    ).toBeInTheDocument();
    expect(screen.getByTestId('perps-fill-tag-liquidated')).toBeInTheDocument();
  });

  it('renders Liquidated badge with case-insensitive address comparison', () => {
    const checksummedAddress = '0x0DCD5D886577d5081B0c52e242Ef29E70Be3E7bc';
    const lowercaseAddress = '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc';
    const store = createMockStore(checksummedAddress);
    const transaction = createMockTransaction(FillType.Liquidation, {
      fill: {
        shortTitle: 'Closed long',
        amount: '-$100',
        amountNumber: -100,
        isPositive: false,
        size: '1.5',
        entryPrice: '2000',
        points: '0',
        pnl: '-100',
        fee: '1',
        action: 'Closed',
        feeToken: 'USDC',
        fillType: FillType.Liquidation,
        liquidation: {
          liquidatedUser: lowercaseAddress,
          markPx: '1800',
          method: 'market',
        },
      },
    });

    renderWithProvider(<PerpsFillTag transaction={transaction} />, store);

    expect(
      screen.getByText(messages.perpsLiquidated.message),
    ).toBeInTheDocument();
    expect(screen.getByTestId('perps-fill-tag-liquidated')).toBeInTheDocument();
  });

  it('does not render Liquidated badge when user is not the liquidated user', () => {
    const store = createMockStore(MOCK_ADDRESS);
    const transaction = createMockTransaction(FillType.Liquidation, {
      fill: {
        shortTitle: 'Closed long',
        amount: '-$100',
        amountNumber: -100,
        isPositive: false,
        size: '1.5',
        entryPrice: '2000',
        points: '0',
        pnl: '-100',
        fee: '1',
        action: 'Closed',
        feeToken: 'USDC',
        fillType: FillType.Liquidation,
        liquidation: {
          liquidatedUser: '0xOtherAddress',
          markPx: '1800',
          method: 'market',
        },
      },
    });

    const { container } = renderWithProvider(
      <PerpsFillTag transaction={transaction} />,
      store,
    );

    expect(container.firstChild).toBeNull();
  });

  it('does not render Liquidated badge when liquidation object is missing', () => {
    const store = createMockStore();
    const transaction = createMockTransaction(FillType.Liquidation, {
      fill: {
        shortTitle: 'Closed long',
        amount: '-$100',
        amountNumber: -100,
        isPositive: false,
        size: '1.5',
        entryPrice: '2000',
        points: '0',
        pnl: '-100',
        fee: '1',
        action: 'Closed',
        feeToken: 'USDC',
        fillType: FillType.Liquidation,
      },
    });

    const { container } = renderWithProvider(
      <PerpsFillTag transaction={transaction} />,
      store,
    );

    expect(container.firstChild).toBeNull();
  });
});

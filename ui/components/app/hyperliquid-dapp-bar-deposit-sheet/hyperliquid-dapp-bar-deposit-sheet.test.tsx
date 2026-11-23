import React from 'react';
import { fireEvent } from '@testing-library/react';
import { ButtonSize } from '@metamask/design-system-react';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { HyperliquidDappBarDepositSheet } from './hyperliquid-dapp-bar-deposit-sheet';

const mockTriggerDeposit = jest.fn();
const mockTriggerWithdraw = jest.fn();

jest.mock('../perps/hooks/usePerpsDepositConfirmation', () => ({
  usePerpsDepositConfirmation: () => ({
    trigger: mockTriggerDeposit,
    isLoading: false,
  }),
}));

jest.mock('../perps/hooks/usePerpsWithdrawNavigation', () => ({
  usePerpsWithdrawNavigation: () => ({
    trigger: mockTriggerWithdraw,
    isLoading: false,
  }),
}));

jest.mock('../perps/perps-market-balance-actions', () => ({
  PerpsMarketBalanceActions: ({
    onAddFunds,
    onWithdraw,
    showActionButtons = true,
    actionButtonSize,
    actionsPlacement,
    addFundsLabel = 'Add funds',
  }: {
    onAddFunds?: () => void;
    onWithdraw?: () => void;
    showActionButtons?: boolean;
    actionButtonSize?: string;
    actionsPlacement?: string;
    addFundsLabel?: string;
  }) => (
    <div data-testid="perps-balance-actions" data-placement={actionsPlacement}>
      <div data-testid="perps-balance-actions-total">$1.00</div>
      {showActionButtons ? (
        <div data-testid="perps-balance-actions-buttons">
          <button
            data-testid="perps-balance-actions-withdraw"
            data-size={actionButtonSize}
            onClick={onWithdraw}
          >
            Withdraw
          </button>
          <button
            data-testid="perps-balance-actions-add-funds"
            data-size={actionButtonSize}
            onClick={onAddFunds}
          >
            {addFundsLabel}
          </button>
        </div>
      ) : (
        <div
          data-testid="perps-balance-actions-skeleton"
          data-placement="beside"
        />
      )}
    </div>
  ),
}));

describe('HyperliquidDappBarDepositSheet', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderSheet = () => {
    const store = configureStore({ metamask: mockState.metamask });
    return renderWithProvider(<HyperliquidDappBarDepositSheet />, store);
  };

  it('renders the balance actions without a Perps link or pull handle', () => {
    const { getByTestId, queryByTestId } = renderSheet();

    expect(
      getByTestId('hyperliquid-dapp-bar-deposit-sheet'),
    ).toBeInTheDocument();
    expect(
      queryByTestId('hyperliquid-dapp-bar-deposit-sheet__grabber'),
    ).not.toBeInTheDocument();
    const headerRow = getByTestId(
      'hyperliquid-dapp-bar-deposit-sheet__header-row',
    );
    const header = getByTestId('hyperliquid-dapp-bar-deposit-sheet__header');
    expect(header).toHaveTextContent(/^Perps balance$/u);
    const row = getByTestId('hyperliquid-dapp-bar-deposit-sheet__row');
    const body = row.querySelector('.hyperliquid-dapp-bar-deposit-sheet__body');
    const controls = headerRow.querySelector(
      '.hyperliquid-dapp-bar-deposit-sheet__controls',
    );
    expect(body).toContainElement(getByTestId('perps-balance-actions'));
    expect(controls).toContainElement(
      getByTestId('hyperliquid-dapp-bar-deposit-sheet__toggle'),
    );
    expect(Array.from(headerRow.children)).toEqual([header, controls]);
    expect(Array.from(row.children)).toEqual([body]);
    expect(
      queryByTestId('hyperliquid-dapp-bar-deposit-sheet__overflow'),
    ).not.toBeInTheDocument();
    expect(headerRow).toHaveAttribute('aria-expanded', 'true');
    // Header row sits above the balance row.
    expect(headerRow.nextElementSibling).toBe(row);
    expect(
      queryByTestId('hyperliquid-dapp-bar-deposit-sheet__title'),
    ).not.toBeInTheDocument();
    expect(
      queryByTestId('hyperliquid-dapp-bar-deposit-sheet__view-in-perps'),
    ).not.toBeInTheDocument();
    expect(getByTestId('perps-balance-actions')).toHaveAttribute(
      'data-placement',
      'beside',
    );
    const buttons = getByTestId('perps-balance-actions-buttons');
    const withdraw = getByTestId('perps-balance-actions-withdraw');
    const fund = getByTestId('perps-balance-actions-add-funds');
    expect(buttons).toContainElement(withdraw);
    expect(buttons).toContainElement(fund);
    expect(Array.from(buttons.children)).toEqual([withdraw, fund]);
    expect(withdraw).toHaveTextContent('Withdraw');
    expect(fund).toHaveTextContent('Add funds');
    expect(fund).toHaveAttribute('data-size', ButtonSize.Sm);
    expect(withdraw).toHaveAttribute('data-size', ButtonSize.Sm);
    expect(
      queryByTestId('hyperliquid-dapp-bar-deposit-sheet__minimize'),
    ).not.toBeInTheDocument();
  });

  it('shows the balance and action buttons at the same time', () => {
    const { getByTestId, queryByTestId } = renderSheet();

    expect(
      getByTestId('hyperliquid-dapp-bar-deposit-sheet__header'),
    ).toHaveTextContent('Perps balance');
    expect(
      queryByTestId('hyperliquid-dapp-bar-deposit-sheet__overflow'),
    ).not.toBeInTheDocument();
    expect(
      getByTestId('hyperliquid-dapp-bar-deposit-sheet__row'),
    ).toContainElement(getByTestId('perps-balance-actions'));
    expect(getByTestId('perps-balance-actions-add-funds')).toHaveTextContent(
      'Add funds',
    );
    expect(getByTestId('perps-balance-actions-withdraw')).toBeInTheDocument();
  });

  it('toggles the balance details by clicking anywhere on the header row', () => {
    const { getByTestId, queryByTestId } = renderSheet();
    const headerRow = getByTestId(
      'hyperliquid-dapp-bar-deposit-sheet__header-row',
    );

    fireEvent.click(getByTestId('hyperliquid-dapp-bar-deposit-sheet__header'));

    expect(headerRow).toHaveAttribute('aria-expanded', 'false');
    expect(
      queryByTestId('hyperliquid-dapp-bar-deposit-sheet__row'),
    ).not.toBeInTheDocument();

    fireEvent.click(headerRow);

    expect(headerRow).toHaveAttribute('aria-expanded', 'true');
    expect(
      getByTestId('hyperliquid-dapp-bar-deposit-sheet__row'),
    ).toBeInTheDocument();
  });

  it('wires Add funds and Withdraw to the Perps deposit and withdraw triggers', () => {
    const { getByTestId } = renderSheet();

    fireEvent.click(getByTestId('perps-balance-actions-add-funds'));
    fireEvent.click(getByTestId('perps-balance-actions-withdraw'));

    expect(mockTriggerDeposit).toHaveBeenCalledTimes(1);
    expect(mockTriggerWithdraw).toHaveBeenCalledTimes(1);
  });
});

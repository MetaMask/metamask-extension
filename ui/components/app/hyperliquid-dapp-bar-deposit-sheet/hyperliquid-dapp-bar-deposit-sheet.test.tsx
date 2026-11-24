import React from 'react';
import { act, fireEvent } from '@testing-library/react';
import { ButtonSize } from '@metamask/design-system-react';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { HyperliquidDappBarDepositSheet } from './hyperliquid-dapp-bar-deposit-sheet';

const mockTriggerDeposit = jest.fn();
const mockTriggerWithdraw = jest.fn();

const mockAccountLoading: {
  isInitialLoading: boolean;
  subscribers: Set<() => void>;
} = {
  isInitialLoading: false,
  subscribers: new Set(),
};

const setAccountLoading = (isInitialLoading: boolean) => {
  mockAccountLoading.isInitialLoading = isInitialLoading;
  act(() => {
    mockAccountLoading.subscribers.forEach((notify) => notify());
  });
};

jest.mock('../../../hooks/perps/stream', () => {
  const ReactActual = jest.requireActual<typeof import('react')>('react');
  return {
    usePerpsLiveAccount: () => {
      const [, setVersion] = ReactActual.useState(0);
      ReactActual.useEffect(() => {
        const notify = () => setVersion((version) => version + 1);
        mockAccountLoading.subscribers.add(notify);
        return () => {
          mockAccountLoading.subscribers.delete(notify);
        };
      }, []);
      return {
        account: null,
        isInitialLoading: mockAccountLoading.isInitialLoading,
      };
    },
  };
});

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
      <div data-testid="perps-balance-actions-available">$1.00 available</div>
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
    mockAccountLoading.isInitialLoading = false;
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
    expect(header).toHaveTextContent(/^Hyperliquid balance$/u);
    expect(header).not.toHaveTextContent(/perps/iu);
    const row = getByTestId('hyperliquid-dapp-bar-deposit-sheet__row');
    const body = row.querySelector('.hyperliquid-dapp-bar-deposit-sheet__body');
    const controls = headerRow.querySelector(
      '.hyperliquid-dapp-bar-deposit-sheet__controls',
    );
    expect(body).toContainElement(getByTestId('perps-balance-actions'));
    expect(controls).toContainElement(
      getByTestId('hyperliquid-dapp-bar-deposit-sheet__overflow'),
    );
    expect(Array.from(headerRow.children)).toEqual([header, controls]);
    expect(Array.from(row.children)).toEqual([body]);
    expect(row).not.toContainElement(
      getByTestId('hyperliquid-dapp-bar-deposit-sheet__overflow'),
    );
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

  it('shows the sheet immediately while loading and fills the balance in without remounting', () => {
    mockAccountLoading.isInitialLoading = true;
    const { queryByTestId, getByTestId } = renderSheet();

    const sheet = getByTestId('hyperliquid-dapp-bar-deposit-sheet');
    expect(
      getByTestId('hyperliquid-dapp-bar-deposit-sheet__header'),
    ).toHaveTextContent('Hyperliquid balance');
    expect(
      getByTestId('hyperliquid-dapp-bar-deposit-sheet__overflow'),
    ).toBeInTheDocument();
    expect(
      getByTestId('hyperliquid-dapp-bar-deposit-sheet__row'),
    ).toContainElement(getByTestId('perps-balance-actions-skeleton'));
    expect(getByTestId('perps-balance-actions-skeleton')).toHaveAttribute(
      'data-placement',
      'beside',
    );
    expect(
      queryByTestId('perps-balance-actions-withdraw'),
    ).not.toBeInTheDocument();

    setAccountLoading(false);

    expect(getByTestId('hyperliquid-dapp-bar-deposit-sheet')).toBe(sheet);
    expect(getByTestId('perps-balance-actions-add-funds')).toHaveTextContent(
      'Add funds',
    );
    expect(getByTestId('perps-balance-actions-withdraw')).toBeInTheDocument();
  });

  it('opens a disable confirmation and closes it from cancel or confirm', () => {
    const { getByTestId, getByRole, queryByRole } = renderSheet();

    fireEvent.click(
      getByTestId('hyperliquid-dapp-bar-deposit-sheet__overflow'),
    );

    expect(getByRole('menuitem')).toHaveTextContent('Disable this feature');

    fireEvent.click(getByRole('menuitem'));

    const dialog = getByRole('dialog');
    expect(dialog).toHaveTextContent('Hide Hyperliquid balance?');
    expect(dialog).toHaveTextContent(
      "You won't see your balance on the connection bar when connected to Hyperliquid anymore. Turn it back on any time in Settings > Preferences.",
    );

    fireEvent.click(getByRole('button', { name: 'Cancel' }));
    expect(queryByRole('dialog')).not.toBeInTheDocument();

    fireEvent.click(
      getByTestId('hyperliquid-dapp-bar-deposit-sheet__overflow'),
    );
    fireEvent.click(getByRole('menuitem'));
    fireEvent.click(getByRole('button', { name: 'Disable' }));

    expect(queryByRole('dialog')).not.toBeInTheDocument();
    expect(
      getByTestId('hyperliquid-dapp-bar-deposit-sheet'),
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

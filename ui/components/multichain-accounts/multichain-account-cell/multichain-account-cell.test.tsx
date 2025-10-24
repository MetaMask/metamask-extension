import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import configureStore from '../../../store/store';
import mockDefaultState from '../../../../test/data/mock-state.json';
import {
  MultichainAccountCell,
  MultichainAccountCellProps,
} from './multichain-account-cell';

describe('MultichainAccountCell', () => {
  const store = configureStore(mockDefaultState);
  const defaultProps: MultichainAccountCellProps = {
    accountId: 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/0',
    accountName: 'Test Account',
    balance: '$2,400.00',
    endAccessory: <span data-testid="end-accessory">More</span>,
  };

  it('renders with all required props and displays account information correctly', () => {
    renderWithProvider(<MultichainAccountCell {...defaultProps} />, store);

    const cellElement = screen.getByTestId(
      `multichain-account-cell-${defaultProps.accountId}`,
    );
    expect(cellElement).toBeInTheDocument();

    expect(screen.getByText('Test Account')).toBeInTheDocument();
    expect(screen.getByText('$2,400.00')).toBeInTheDocument();
    expect(screen.getByTestId('end-accessory')).toBeInTheDocument();

    expect(
      screen.queryByTestId(
        `multichain-account-cell-${defaultProps.accountId}-selected-indicator`,
      ),
    ).not.toBeInTheDocument();
  });

  it('shows selection state correctly and applies proper styling', () => {
    renderWithProvider(
      <MultichainAccountCell {...defaultProps} selected={true} />,
      store,
    );

    expect(
      screen.getByTestId(
        `multichain-account-cell-${defaultProps.accountId}-selected-indicator`,
      ),
    ).toBeInTheDocument();
  });

  it('handles click events and applies pointer cursor when onClick is provided', () => {
    const handleClick = jest.fn();
    renderWithProvider(
      <MultichainAccountCell {...defaultProps} onClick={handleClick} />,
      store,
    );

    const cellElement = screen.getByTestId(
      `multichain-account-cell-${defaultProps.accountId}`,
    );

    expect(cellElement.style.cursor).toBe('pointer');

    fireEvent.click(cellElement);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders correctly without optional props', () => {
    renderWithProvider(
      <MultichainAccountCell
        accountId={defaultProps.accountId}
        accountName="Minimal Account"
        balance="$100"
      />,
      store,
    );

    expect(screen.getByText('Minimal Account')).toBeInTheDocument();
    expect(screen.getByText('$100')).toBeInTheDocument();

    const endAccessoryContainer = document.querySelector(
      '.multichain-account-cell__end_accessory',
    );
    expect(endAccessoryContainer).toBeInTheDocument();
    expect(endAccessoryContainer?.children.length).toBe(0);

    const cellElement = screen.getByTestId(
      `multichain-account-cell-${defaultProps.accountId}`,
    );
    expect(cellElement.style.cursor).toBe('default');
  });

  it('renders a complete cell with all features enabled', () => {
    const handleClick = jest.fn();
    renderWithProvider(
      <MultichainAccountCell
        accountId={defaultProps.accountId}
        accountName="Complete Account"
        balance="$1,234.56"
        onClick={handleClick}
        endAccessory={<span data-testid="end-accessory">More</span>}
        selected={true}
      />,
      store,
    );

    expect(screen.getByText('Complete Account')).toBeInTheDocument();
    expect(screen.getByText('$1,234.56')).toBeInTheDocument();
    expect(screen.getByTestId('end-accessory')).toBeInTheDocument();
    expect(
      screen.getByTestId(
        `multichain-account-cell-${defaultProps.accountId}-selected-indicator`,
      ),
    ).toBeInTheDocument();

    const cellElement = screen.getByTestId(
      `multichain-account-cell-${defaultProps.accountId}`,
    );
    expect(cellElement.style.cursor).toBe('pointer');

    fireEvent.click(cellElement);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders startAccessory when provided', () => {
    const startAccessoryElement = (
      <span data-testid="start-accessory">Start</span>
    );

    renderWithProvider(
      <MultichainAccountCell
        {...defaultProps}
        startAccessory={startAccessoryElement}
      />,
      store,
    );

    expect(screen.getByTestId('start-accessory')).toBeInTheDocument();
    expect(screen.getByText('Start')).toBeInTheDocument();
  });

  it('hides selected bar when startAccessory is present', () => {
    // Arrange
    const startAccessoryElement = (
      <span data-testid="start-accessory">Start</span>
    );

    renderWithProvider(
      <MultichainAccountCell
        {...defaultProps}
        startAccessory={startAccessoryElement}
        selected={true}
      />,
      store,
    );

    expect(screen.getByTestId('start-accessory')).toBeInTheDocument();
    expect(
      screen.queryByTestId(
        `multichain-account-cell-${defaultProps.accountId}-selected-indicator`,
      ),
    ).not.toBeInTheDocument();
  });

  it('hides balance value when privacy mode is enabled', () => {
    const props = {
      ...defaultProps,
      privacyMode: true,
    };

    renderWithProvider(<MultichainAccountCell {...props} />, store);

    expect(screen.queryByText('$2,400.00')).not.toBeInTheDocument();

    const balanceContainer = screen.getByTestId('balance-display');

    expect(balanceContainer).toBeInTheDocument();
    expect(balanceContainer.textContent).not.toContain('$2,400.00');
    expect(balanceContainer.textContent).toMatch(/^[•]+$/u);
  });

  describe('Native balance display', () => {
    it('displays regular balance when showNativeTokenAsMainBalance is false', () => {
      const customState = {
        ...mockDefaultState,
        metamask: {
          ...mockDefaultState.metamask,
          preferences: {
            ...mockDefaultState.metamask.preferences,
            showNativeTokenAsMainBalance: false,
          },
        },
      };
      const customStore = configureStore(customState);

      renderWithProvider(
        <MultichainAccountCell {...defaultProps} />,
        customStore,
      );

      expect(screen.getByText('$2,400.00')).toBeInTheDocument();
    });

    it('displays regular balance when showNativeTokenAsMainBalance is true but selectedNativeBalanceSelector is null', () => {
      // The mock state already has showNativeTokenAsMainBalance: true
      // but the selectedNativeBalanceSelector will return null due to multiple chains being enabled
      renderWithProvider(<MultichainAccountCell {...defaultProps} />, store);

      expect(screen.getByText('$2,400.00')).toBeInTheDocument();
    });

    it('displays regular balance when showNativeTokenAsMainBalance is true but selectedNativeBalanceSelector returns null due to complex balance calculation', () => {
      // The mock state has showNativeTokenAsMainBalance: true
      // but the selectedNativeBalanceSelector will return null due to the complex balance calculation system
      // not being properly mocked in the test environment
      renderWithProvider(<MultichainAccountCell {...defaultProps} />, store);

      // Should fall back to regular balance when native balance calculation fails
      expect(screen.getByText('$2,400.00')).toBeInTheDocument();
    });

    it('displays regular balance when showNativeTokenAsMainBalance is true but selectedNativeBalanceSelector returns null due to missing market data', () => {
      const customState = {
        ...mockDefaultState,
        metamask: {
          ...mockDefaultState.metamask,
          preferences: {
            ...mockDefaultState.metamask.preferences,
            showNativeTokenAsMainBalance: true,
          },
          // Mock enabled networks to have only one chain but no market data
          enabledNetworks: {
            eip155: {
              '0x1': true,
            },
          },
          marketData: {},
          currencyRates: {},
        },
      };
      const customStore = configureStore(customState);

      renderWithProvider(
        <MultichainAccountCell {...defaultProps} />,
        customStore,
      );

      // Should fall back to regular balance when native balance calculation fails
      expect(screen.getByText('$2,400.00')).toBeInTheDocument();
    });
  });
});

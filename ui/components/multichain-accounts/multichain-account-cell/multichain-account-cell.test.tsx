import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import configureStore from '../../../store/store';
import mockDefaultState from '../../../../test/data/mock-state.json';
import {
  STATUS_CONNECTED,
  STATUS_CONNECTED_TO_ANOTHER_ACCOUNT,
} from '../../../helpers/constants/connected-sites';
import {
  MultichainAccountCell,
  MultichainAccountCellProps,
} from './multichain-account-cell';

jest.mock('@metamask/chain-agnostic-permission', () => ({
  isInternalAccountInPermittedAccountIds: jest.fn(),
  getCaip25CaveatFromPermission: jest.fn(),
  getCaipAccountIdsFromCaip25CaveatValue: jest.fn(),
}));

const mockChainAgnosticPermission = jest.requireMock(
  '@metamask/chain-agnostic-permission',
);
const mockIsInternalAccountInPermittedAccountIds =
  mockChainAgnosticPermission.isInternalAccountInPermittedAccountIds;
const mockGetCaip25CaveatFromPermission =
  mockChainAgnosticPermission.getCaip25CaveatFromPermission;
const mockGetCaipAccountIdsFromCaip25CaveatValue =
  mockChainAgnosticPermission.getCaipAccountIdsFromCaip25CaveatValue;

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

  describe('Connection Status', () => {
    beforeEach(() => {
      mockIsInternalAccountInPermittedAccountIds.mockReturnValue(false);
      mockGetCaip25CaveatFromPermission.mockReturnValue(null);
      mockGetCaipAccountIdsFromCaip25CaveatValue.mockReturnValue([]);
    });

    it('shows connected status badge when connectionStatus is STATUS_CONNECTED', () => {
      renderWithProvider(
        <MultichainAccountCell
          {...defaultProps}
          connectionStatus={STATUS_CONNECTED}
        />,
        store,
      );

      // Should show the badge status component with connection indicator
      const badgeStatus = screen.getByTestId('multichain-badge-status');
      expect(badgeStatus).toBeInTheDocument();

      // Should show the connection status badge with green background for connected
      const connectedBadge = document.querySelector(
        '.multichain-badge-status__badge--bg-success-default, .mm-box--background-color-success-default',
      );
      expect(connectedBadge).toBeInTheDocument();

      // Should show tooltip with "Active" text
      const tooltipElement = document.querySelector(
        '[data-original-title="Active"]',
      );
      expect(tooltipElement).toBeInTheDocument();
    });

    it('shows connected status badge when connectionStatus is STATUS_CONNECTED_TO_ANOTHER_ACCOUNT', () => {
      renderWithProvider(
        <MultichainAccountCell
          {...defaultProps}
          connectionStatus={STATUS_CONNECTED_TO_ANOTHER_ACCOUNT}
        />,
        store,
      );

      // Should show the badge status component with connection indicator
      const badgeStatus = screen.getByTestId('multichain-badge-status');
      expect(badgeStatus).toBeInTheDocument();

      // Should show the connection status badge with alternative background for connected to another
      const connectedBadge = document.querySelector(
        '.multichain-badge-status__badge--bg-icon-alternative, .mm-box--background-color-icon-alternative',
      );
      expect(connectedBadge).toBeInTheDocument();

      // Should show tooltip with "Not connected" text (since current account is not the active one)
      const tooltipElement = document.querySelector(
        '[data-original-title="Not connected"]',
      );
      expect(tooltipElement).toBeInTheDocument();
    });

    it('does not show connected status badge when connectionStatus is undefined', () => {
      renderWithProvider(
        <MultichainAccountCell
          {...defaultProps}
          connectionStatus={undefined}
        />,
        store,
      );

      // Should still render badge status but without the tooltip/connection indicator
      const badgeStatus = screen.getByTestId('multichain-badge-status');
      expect(badgeStatus).toBeInTheDocument();

      // Should not show the tooltip when showConnectedStatus is false
      const tooltip = screen.queryByTestId('multichain-badge-status__tooltip');
      expect(tooltip).not.toBeInTheDocument();
    });

    it('uses seed address from selector for ConnectedStatus component', () => {
      renderWithProvider(
        <MultichainAccountCell
          {...defaultProps}
          connectionStatus={STATUS_CONNECTED}
        />,
        store,
      );

      // ConnectedStatus component should be rendered with the badge status
      const badgeStatus = screen.getByTestId('multichain-badge-status');
      expect(badgeStatus).toBeInTheDocument();

      // Avatar container should still be present
      const avatarContainer = document.querySelector(
        '.multichain-account-cell__account-avatar',
      );
      expect(avatarContainer).toBeInTheDocument();
    });
  });
});

import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
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
  ...jest.requireActual('@metamask/chain-agnostic-permission'),
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
    expect(
      screen.getByTestId('multichain-account-cell-name-Test Account'),
    ).toBeInTheDocument();
    expect(screen.getByText('$2,400.00')).toBeInTheDocument();
    expect(screen.getByTestId('end-accessory')).toBeInTheDocument();
  });

  it('shows selection state correctly and applies proper styling', () => {
    renderWithProvider(
      <MultichainAccountCell {...defaultProps} selected={true} />,
      store,
    );

    const cellElement = screen.getByTestId(
      `multichain-account-cell-${defaultProps.accountId}`,
    );
    expect(cellElement).toHaveClass('is-selected');
  });

  it('ignores clicks and shows pending styling when pending is true', () => {
    const handleClick = jest.fn();
    renderWithProvider(
      <MultichainAccountCell
        {...defaultProps}
        onClick={handleClick}
        pending={true}
      />,
      store,
    );

    const cellElement = screen.getByTestId(
      `multichain-account-cell-${defaultProps.accountId}`,
    );

    expect(cellElement).toHaveClass('is-pending');
    expect(cellElement).toHaveAttribute('aria-busy', 'true');
    expect(cellElement.style.cursor).toBe('wait');
    fireEvent.click(cellElement);
    expect(handleClick).not.toHaveBeenCalled();
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

    const cellElement = screen.getByTestId(
      `multichain-account-cell-${defaultProps.accountId}`,
    );
    expect(cellElement).toHaveClass('is-selected');
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

  it('renders with startAccessory when provided', () => {
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
  });

  it('does not render hovered addresses element when showDefaultAddress is false', () => {
    renderWithProvider(<MultichainAccountCell {...defaultProps} />, store);

    expect(
      screen.queryByTestId('multichain-account-cell-hovered-addresses'),
    ).not.toBeInTheDocument();
  });

  it('renders hovered addresses element when showDefaultAddress is true', () => {
    renderWithProvider(
      <MultichainAccountCell {...defaultProps} showDefaultAddress={true} />,
      store,
    );

    const addressElement = screen.getByTestId(
      'multichain-account-cell-hovered-addresses',
    );
    expect(addressElement).toBeInTheDocument();
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

  it('hides balance value when privacy mode is enabled with balancePosition subtitle', () => {
    const props = {
      ...defaultProps,
      privacyMode: true,
      balancePosition: 'subtitle' as const,
    };

    renderWithProvider(<MultichainAccountCell {...props} />, store);

    expect(screen.queryByText('$2,400.00')).not.toBeInTheDocument();

    const balanceContainer = screen.getByTestId('balance-display-subtitle');

    expect(balanceContainer).toBeInTheDocument();
    expect(balanceContainer.textContent).not.toContain('$2,400.00');
    expect(balanceContainer.textContent).toMatch(/^[•]+$/u);
  });

  it('renders no balance element when balance is undefined', () => {
    renderWithProvider(
      <MultichainAccountCell {...defaultProps} balance={undefined} />,
      store,
    );

    expect(screen.queryByTestId('balance-display')).not.toBeInTheDocument();
  });

  it('renders no balance element when balance is an empty string', () => {
    renderWithProvider(
      <MultichainAccountCell {...defaultProps} balance="" />,
      store,
    );

    expect(screen.queryByTestId('balance-display')).not.toBeInTheDocument();
  });

  it('renders no balance element when balance is missing and privacy mode is enabled', () => {
    renderWithProvider(
      <MultichainAccountCell
        {...defaultProps}
        balance={undefined}
        privacyMode
      />,
      store,
    );

    expect(screen.queryByTestId('balance-display')).not.toBeInTheDocument();
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
      const avatarContainer = screen.getByTestId('account-cell-avatar');
      expect(avatarContainer).toBeInTheDocument();
    });
  });

  describe('Mode defaults', () => {
    it('defaults isHidden, isEditMode, and isDeleteMode to false when props are omitted', () => {
      renderWithProvider(
        <MultichainAccountCell
          accountId={defaultProps.accountId}
          accountName="Default Mode Account"
          balance="$100"
          endAccessory={<span data-testid="end-accessory">More</span>}
        />,
        store,
      );

      const cellElement = screen.getByTestId(
        `multichain-account-cell-${defaultProps.accountId}`,
      );

      expect(cellElement).not.toHaveClass('multichain-account-cell--hidden');
      expect(cellElement).not.toHaveClass('multichain-account-cell--edit-mode');
      expect(cellElement).not.toHaveClass(
        'multichain-account-cell--delete-mode',
      );
      expect(cellElement).not.toHaveAttribute('data-hidden');
      expect(cellElement).not.toHaveAttribute('data-edit-mode');
      expect(cellElement).not.toHaveAttribute('data-delete-mode');
      expect(screen.getByTestId('end-accessory')).toBeInTheDocument();
    });
  });

  describe('Hidden mode', () => {
    it('applies hidden styling and data attribute when isHidden is true', () => {
      renderWithProvider(
        <MultichainAccountCell {...defaultProps} isHidden={true} />,
        store,
      );

      const cellElement = screen.getByTestId(
        `multichain-account-cell-${defaultProps.accountId}`,
      );

      expect(cellElement).toHaveClass('multichain-account-cell--hidden');
      expect(cellElement).toHaveAttribute('data-hidden', 'true');
    });
  });

  describe('Delete mode', () => {
    it('shows delete icon instead of visibility icon when in edit and delete mode', () => {
      renderWithProvider(
        <MultichainAccountCell
          {...defaultProps}
          isEditMode={true}
          isDeleteMode={true}
        />,
        store,
      );

      const cellElement = screen.getByTestId(
        `multichain-account-cell-${defaultProps.accountId}`,
      );

      expect(cellElement).toHaveClass('multichain-account-cell--delete-mode');
      expect(cellElement).toHaveAttribute('data-delete-mode', 'true');
      expect(
        screen.getByTestId('multichain-account-cell-edit-mode-delete-icon'),
      ).toBeInTheDocument();
      expect(
        screen.queryByTestId('multichain-account-cell-edit-mode-visible-icon'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('multichain-account-cell-edit-mode-hidden-icon'),
      ).not.toBeInTheDocument();
    });

    it('does not show delete icon when isDeleteMode is true but not in edit mode', () => {
      renderWithProvider(
        <MultichainAccountCell {...defaultProps} isDeleteMode={true} />,
        store,
      );

      const cellElement = screen.getByTestId(
        `multichain-account-cell-${defaultProps.accountId}`,
      );

      expect(cellElement).not.toHaveClass(
        'multichain-account-cell--delete-mode',
      );
      expect(cellElement).not.toHaveAttribute('data-delete-mode');
      expect(
        screen.queryByTestId('multichain-account-cell-edit-mode-delete-icon'),
      ).not.toBeInTheDocument();
    });

    it('treats delete mode as mutually exclusive with hidden mode', () => {
      renderWithProvider(
        <MultichainAccountCell
          {...defaultProps}
          isEditMode={true}
          isDeleteMode={true}
          isHidden={true}
        />,
        store,
      );

      const cellElement = screen.getByTestId(
        `multichain-account-cell-${defaultProps.accountId}`,
      );

      expect(cellElement).toHaveClass('multichain-account-cell--delete-mode');
      expect(cellElement).not.toHaveClass('multichain-account-cell--hidden');
      expect(cellElement).not.toHaveAttribute('data-hidden');
      expect(
        screen.getByTestId('multichain-account-cell-edit-mode-delete-icon'),
      ).toBeInTheDocument();
      expect(
        screen.queryByTestId('multichain-account-cell-edit-mode-hidden-icon'),
      ).not.toBeInTheDocument();
    });

    it('calls onDeleteIconClick when the delete icon is clicked', () => {
      const handleDeleteIconClick = jest.fn();
      const handleCellClick = jest.fn();

      renderWithProvider(
        <MultichainAccountCell
          {...defaultProps}
          isEditMode={true}
          isDeleteMode={true}
          onClick={handleCellClick}
          onDeleteIconClick={handleDeleteIconClick}
        />,
        store,
      );

      fireEvent.click(
        screen.getByTestId('multichain-account-cell-edit-mode-delete-icon'),
      );

      expect(handleDeleteIconClick).toHaveBeenCalledTimes(1);
      expect(handleDeleteIconClick).toHaveBeenCalledWith(
        defaultProps.accountId,
      );
      expect(handleCellClick).not.toHaveBeenCalled();
    });

    it('does not call onDeleteIconClick when pending is true', () => {
      const handleDeleteIconClick = jest.fn();

      renderWithProvider(
        <MultichainAccountCell
          {...defaultProps}
          isEditMode={true}
          isDeleteMode={true}
          pending={true}
          onDeleteIconClick={handleDeleteIconClick}
        />,
        store,
      );

      fireEvent.click(
        screen.getByTestId('multichain-account-cell-edit-mode-delete-icon'),
      );

      expect(handleDeleteIconClick).not.toHaveBeenCalled();
    });
  });

  describe('Edit mode', () => {
    it('applies edit-mode styling and suppresses end accessory', () => {
      renderWithProvider(
        <MultichainAccountCell
          {...defaultProps}
          isEditMode={true}
          showDefaultAddress={true}
        />,
        store,
      );

      const cellElement = screen.getByTestId(
        `multichain-account-cell-${defaultProps.accountId}`,
      );

      expect(cellElement).toHaveClass('multichain-account-cell--edit-mode');
      expect(cellElement).toHaveAttribute('data-edit-mode', 'true');
      expect(screen.queryByTestId('end-accessory')).not.toBeInTheDocument();
      expect(
        screen.getByTestId('multichain-account-cell-hovered-addresses'),
      ).toBeInTheDocument();
    });

    it('does not call onClick when the row is clicked in edit mode', () => {
      const handleCellClick = jest.fn();

      renderWithProvider(
        <MultichainAccountCell
          {...defaultProps}
          isEditMode={true}
          onClick={handleCellClick}
        />,
        store,
      );

      fireEvent.click(
        screen.getByTestId(`multichain-account-cell-${defaultProps.accountId}`),
      );

      expect(handleCellClick).not.toHaveBeenCalled();
    });

    it('renders a default cursor in edit mode even when onClick is provided', () => {
      renderWithProvider(
        <MultichainAccountCell
          {...defaultProps}
          isEditMode={true}
          onClick={jest.fn()}
        />,
        store,
      );

      expect(
        screen.getByTestId(`multichain-account-cell-${defaultProps.accountId}`),
      ).toHaveStyle({ cursor: 'default' });
    });

    it('does not show connection status badge in edit mode', () => {
      renderWithProvider(
        <MultichainAccountCell
          {...defaultProps}
          isEditMode={true}
          connectionStatus={STATUS_CONNECTED}
        />,
        store,
      );

      const tooltipElement = document.querySelector(
        '[data-original-title="Active"]',
      );
      expect(tooltipElement).not.toBeInTheDocument();
    });

    it('shows eye icon next to balance in visible edit mode', () => {
      renderWithProvider(
        <MultichainAccountCell {...defaultProps} isEditMode={true} />,
        store,
      );

      expect(
        screen.getByTestId('multichain-account-cell-edit-mode-visible-icon'),
      ).toBeInTheDocument();
      expect(
        screen.queryByTestId('multichain-account-cell-edit-mode-hidden-icon'),
      ).not.toBeInTheDocument();
    });

    it('shows crossed eye icon next to balance in hidden edit mode', () => {
      renderWithProvider(
        <MultichainAccountCell
          {...defaultProps}
          isEditMode={true}
          isHidden={true}
        />,
        store,
      );

      expect(
        screen.getByTestId('multichain-account-cell-edit-mode-hidden-icon'),
      ).toBeInTheDocument();
      expect(
        screen.queryByTestId('multichain-account-cell-edit-mode-visible-icon'),
      ).not.toBeInTheDocument();
    });

    it('does not show edit mode visibility icon when not in edit mode', () => {
      renderWithProvider(<MultichainAccountCell {...defaultProps} />, store);

      expect(
        screen.queryByTestId('multichain-account-cell-edit-mode-visible-icon'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('multichain-account-cell-edit-mode-hidden-icon'),
      ).not.toBeInTheDocument();
    });

    it('does not render startAccessory when in edit mode', () => {
      renderWithProvider(
        <MultichainAccountCell
          {...defaultProps}
          isEditMode={true}
          startAccessory={<span data-testid="start-accessory">Start</span>}
        />,
        store,
      );

      expect(screen.queryByTestId('start-accessory')).not.toBeInTheDocument();
    });

    it('calls onVisibilityIconClick when the visibility icon is clicked', () => {
      const handleVisibilityIconClick = jest.fn();
      const handleCellClick = jest.fn();

      renderWithProvider(
        <MultichainAccountCell
          {...defaultProps}
          isEditMode={true}
          onClick={handleCellClick}
          onVisibilityIconClick={handleVisibilityIconClick}
        />,
        store,
      );

      fireEvent.click(
        screen.getByTestId('multichain-account-cell-edit-mode-visible-icon'),
      );

      expect(handleVisibilityIconClick).toHaveBeenCalledTimes(1);
      expect(handleVisibilityIconClick).toHaveBeenCalledWith(
        defaultProps.accountId,
      );
      expect(handleCellClick).not.toHaveBeenCalled();
    });

    it('does not call onVisibilityIconClick when pending is true', () => {
      const handleVisibilityIconClick = jest.fn();

      renderWithProvider(
        <MultichainAccountCell
          {...defaultProps}
          isEditMode={true}
          pending={true}
          onVisibilityIconClick={handleVisibilityIconClick}
        />,
        store,
      );

      fireEvent.click(
        screen.getByTestId('multichain-account-cell-edit-mode-visible-icon'),
      );

      expect(handleVisibilityIconClick).not.toHaveBeenCalled();
    });
  });
});

import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import configureStore from '../../../store/store';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import mockState from '../../../../test/data/mock-state.json';
import { WalletSectionHeader } from './wallet-section-header';

describe('WalletSectionHeader', () => {
  it('renders title', () => {
    const store = configureStore(mockState);
    renderWithProvider(<WalletSectionHeader title="Account 1 Wallet" />, store);
    expect(screen.getByText('Account 1 Wallet')).toBeInTheDocument();
  });

  it('renders locked badge when isLocked is true', () => {
    const store = configureStore(mockState);
    renderWithProvider(
      <WalletSectionHeader title="Locked Wallet" isLocked />,
      store,
    );
    expect(
      screen.getByTestId('wallet-section-header-locked-badge'),
    ).toBeInTheDocument();
    expect(screen.getByText(messages.locked?.message ?? 'Locked')).toBeInTheDocument();
  });

  it('renders removal action button with RemoveMinus icon and Remove text and triggers onRemove', () => {
    const store = configureStore(mockState);
    const handleRemove = jest.fn();
    renderWithProvider(
      <WalletSectionHeader
        title="Removable Wallet"
        isRemovable
        onRemove={handleRemove}
      />,
      store,
    );
    const removeButton = screen.getByTestId(
      'wallet-section-header-remove-button',
    );
    expect(removeButton).toBeInTheDocument();
    expect(removeButton).toHaveTextContent(messages.remove?.message ?? 'Remove');
    fireEvent.click(removeButton);
    expect(handleRemove).toHaveBeenCalledTimes(1);
  });

  it('renders drag handle when showDragHandle is true', () => {
    const store = configureStore(mockState);
    renderWithProvider(
      <WalletSectionHeader title="Draggable Header" showDragHandle />,
      store,
    );
    expect(
      screen.getByTestId('wallet-section-header-drag-handle'),
    ).toBeInTheDocument();
  });

  it('does not render drag handle by default when showDragHandle is false', () => {
    const store = configureStore(mockState);
    renderWithProvider(
      <WalletSectionHeader title="Non-Draggable Header" />,
      store,
    );
    expect(
      screen.queryByTestId('wallet-section-header-drag-handle'),
    ).not.toBeInTheDocument();
  });

  it('renders collapsible header with toggle button and handles click', () => {
    const store = configureStore(mockState);
    const handleToggle = jest.fn();
    renderWithProvider(
      <WalletSectionHeader
        title="Collapsible Wallet"
        isCollapsible
        isExpanded
        onToggleExpand={handleToggle}
        testId="collapsible-wallet-header"
      />,
      store,
    );

    const button = screen.getByTestId('collapsible-wallet-header');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(button);
    expect(handleToggle).toHaveBeenCalledTimes(1);
  });

  it('calls onRename when renaming via InlineEditableLabel', async () => {
    const store = configureStore(mockState);
    const handleRename = jest.fn();
    renderWithProvider(
      <WalletSectionHeader
        title="Wallet 2"
        onRename={handleRename}
      />,
      store,
    );

    fireEvent.click(screen.getByText('Wallet 2'));

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Renamed Wallet' } });
    fireEvent.click(screen.getByTestId('wallet-section-header-title-save'));

    await waitFor(() => {
      expect(handleRename).toHaveBeenCalledWith('Renamed Wallet');
    });
  });

  it('does not trigger onToggleExpand when clicking title to rename in collapsible header', async () => {
    const store = configureStore(mockState);
    const handleToggle = jest.fn();
    const handleRename = jest.fn();
    renderWithProvider(
      <WalletSectionHeader
        title="Wallet 2"
        isCollapsible
        onToggleExpand={handleToggle}
        onRename={handleRename}
        testId="collapsible-rename-header"
      />,
      store,
    );

    fireEvent.click(screen.getByText('Wallet 2'));

    expect(handleToggle).not.toHaveBeenCalled();
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'New Wallet' } });
    fireEvent.click(screen.getByTestId('wallet-section-header-title-save'));

    await waitFor(() => {
      expect(handleRename).toHaveBeenCalledWith('New Wallet');
    });
    expect(handleToggle).not.toHaveBeenCalled();
  });

  it('does not trigger onToggleExpand when clicking remove button in collapsible header', () => {
    const store = configureStore(mockState);
    const handleToggle = jest.fn();
    const handleRemove = jest.fn();
    renderWithProvider(
      <WalletSectionHeader
        title="Wallet 2"
        isCollapsible
        isRemovable
        onToggleExpand={handleToggle}
        onRemove={handleRemove}
        testId="collapsible-remove-header"
      />,
      store,
    );

    const removeButton = screen.getByTestId('collapsible-remove-header-remove-button');
    fireEvent.click(removeButton);

    expect(handleRemove).toHaveBeenCalledTimes(1);
    expect(handleToggle).not.toHaveBeenCalled();
  });
});

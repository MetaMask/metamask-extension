import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import configureStore from '../../../store/store';
import mockDefaultState from '../../../../test/data/mock-state.json';
import { setAccountGroupName } from '../../../store/actions';
import {
  MultichainAccountEditModal,
  MultichainAccountEditModalProps,
} from './multichain-account-edit-modal';

jest.mock('../../../store/actions', () => ({
  setAccountGroupName: jest.fn(),
}));

describe('MultichainAccountEditModal', () => {
  const mockProps: MultichainAccountEditModalProps = {
    isOpen: true,
    onClose: jest.fn(),
    accountGroupId: 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/0',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the modal with correct elements when open', () => {
    const store = configureStore(mockDefaultState);
    renderWithProvider(<MultichainAccountEditModal {...mockProps} />, store);

    expect(screen.getByText('Rename')).toBeInTheDocument();
    expect(screen.getByText('Account name')).toBeInTheDocument();

    const inputField = screen.getByPlaceholderText('Account 1');
    expect(inputField).toBeInTheDocument();

    // Check confirm button exists and is disabled initially
    const confirmButton = screen.getByText('Confirm');
    expect(confirmButton).toBeInTheDocument();
    expect(confirmButton).toBeDisabled();
  });

  it('does not render when isOpen is false', () => {
    const store = configureStore(mockDefaultState);
    renderWithProvider(
      <MultichainAccountEditModal {...mockProps} isOpen={false} />,
      store,
    );

    // Should not find modal elements when closed
    expect(screen.queryByText('Rename')).not.toBeInTheDocument();
    expect(screen.queryByText('Account name')).not.toBeInTheDocument();
    expect(screen.queryByText('Confirm')).not.toBeInTheDocument();
  });

  it('enables confirm button when input has valid value', () => {
    const store = configureStore(mockDefaultState);
    renderWithProvider(<MultichainAccountEditModal {...mockProps} />, store);

    const input = screen.getByPlaceholderText('Account 1');
    const confirmButton = screen.getByText('Confirm');

    // Initially disabled
    expect(confirmButton).toBeDisabled();

    // Type valid text
    fireEvent.change(input, { target: { value: 'New Account Name' } });

    // Button should be enabled
    expect(confirmButton).not.toBeDisabled();

    // Clear input
    fireEvent.change(input, { target: { value: '' } });

    // Button should be disabled again
    expect(confirmButton).toBeDisabled();

    // Type just spaces
    fireEvent.change(input, { target: { value: '   ' } });

    // Button should still be disabled
    expect(confirmButton).toBeDisabled();
  });

  it('calls onClose when header close button is clicked', () => {
    const store = configureStore(mockDefaultState);
    renderWithProvider(<MultichainAccountEditModal {...mockProps} />, store);

    const closeButton = screen.getByLabelText('Close');
    fireEvent.click(closeButton);

    expect(mockProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when back button is clicked', () => {
    const store = configureStore(mockDefaultState);
    renderWithProvider(<MultichainAccountEditModal {...mockProps} />, store);

    const backButton = screen.getByLabelText('Back');
    fireEvent.click(backButton);

    expect(mockProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('updates input value when typing', () => {
    const store = configureStore(mockDefaultState);
    renderWithProvider(<MultichainAccountEditModal {...mockProps} />, store);

    const input = screen.getByPlaceholderText('Account 1');
    fireEvent.change(input, { target: { value: 'New Account Name' } });

    expect(input).toHaveValue('New Account Name');
  });

  it('dispatches setAccountGroupName action when saving with new name', async () => {
    const store = configureStore(mockDefaultState);
    store.dispatch = jest.fn().mockResolvedValue(undefined);

    renderWithProvider(<MultichainAccountEditModal {...mockProps} />, store);

    const input = screen.getByPlaceholderText('Account 1');
    fireEvent.change(input, { target: { value: 'New Account Name' } });

    const confirmButton = screen.getByText('Confirm');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(setAccountGroupName).toHaveBeenCalledWith(
        mockProps.accountGroupId,
        'New Account Name',
      );
      expect(mockProps.onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('does not dispatch action when name is unchanged', async () => {
    const store = configureStore(mockDefaultState);
    store.dispatch = jest.fn().mockResolvedValue(undefined);

    renderWithProvider(<MultichainAccountEditModal {...mockProps} />, store);

    const input = screen.getByPlaceholderText('Account 1');

    // Type the same name
    fireEvent.change(input, {
      target: { value: 'Account 1' },
    });

    // Click the confirm button
    const confirmButton = screen.getByText('Confirm');
    fireEvent.click(confirmButton);

    // Check that dispatch was not called
    await waitFor(() => {
      expect(setAccountGroupName).not.toHaveBeenCalled();
      expect(mockProps.onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('trims whitespace when saving account name', async () => {
    const store = configureStore(mockDefaultState);
    store.dispatch = jest.fn().mockResolvedValue(undefined);

    renderWithProvider(<MultichainAccountEditModal {...mockProps} />, store);

    const input = screen.getByPlaceholderText('Account 1');

    // Type a new name with whitespace
    fireEvent.change(input, { target: { value: '  New Account Name  ' } });

    // Click the confirm button
    const confirmButton = screen.getByText('Confirm');
    fireEvent.click(confirmButton);

    // Check if dispatch was called with the trimmed name
    await waitFor(() => {
      expect(setAccountGroupName).toHaveBeenCalledWith(
        mockProps.accountGroupId,
        'New Account Name',
      );
    });
  });

  it('focuses the input field on mount', () => {
    const store = configureStore(mockDefaultState);
    renderWithProvider(<MultichainAccountEditModal {...mockProps} />, store);

    const input = screen.getByPlaceholderText('Account 1');

    expect(input).toHaveFocus();
  });

  it('handles empty input correctly', () => {
    const store = configureStore(mockDefaultState);
    renderWithProvider(<MultichainAccountEditModal {...mockProps} />, store);

    const input = screen.getByPlaceholderText('Account 1');
    const confirmButton = screen.getByText('Confirm');

    // Type something first to enable the button
    fireEvent.change(input, { target: { value: 'Something' } });
    expect(confirmButton).not.toBeDisabled();

    // Then clear the input
    fireEvent.change(input, { target: { value: '' } });

    expect(confirmButton).toBeDisabled();
  });

  it('handles form submission with different account name', async () => {
    const store = configureStore(mockDefaultState);
    store.dispatch = jest.fn().mockResolvedValue(undefined);

    renderWithProvider(<MultichainAccountEditModal {...mockProps} />, store);

    const input = screen.getByPlaceholderText('Account 1');

    const differentName = 'Different Account Name';
    fireEvent.change(input, { target: { value: differentName } });

    const confirmButton = screen.getByText('Confirm');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(setAccountGroupName).toHaveBeenCalledWith(
        mockProps.accountGroupId,
        differentName,
      );
      expect(mockProps.onClose).toHaveBeenCalled();
    });
  });
});

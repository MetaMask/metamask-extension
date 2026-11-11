import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import configureStore from '../../../store/store';
import mockDefaultState from '../../../../test/data/mock-state.json';
import { setAccountGroupName } from '../../../store/actions';
import {
  MultichainAccountEditModal,
  MultichainAccountEditModalProps,
} from './multichain-account-edit-modal';

jest.mock('../../../store/actions', () => ({
  setAccountGroupName: jest.fn().mockImplementation(() => {
    return async () => true; // Return a thunk that resolves to true
  }),
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

    expect(
      screen.getByText(messages.renameAccount.message),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(messages.accountName.message),
    ).not.toBeInTheDocument();

    const inputField = screen.getByLabelText(messages.accountName.message);
    expect(inputField).toHaveValue('Account 1');
    expect(
      screen.getByRole('button', { name: messages.clear.message }),
    ).toBeInTheDocument();

    // Save stays disabled until the name changes
    const saveButton = screen.getByRole('button', {
      name: messages.save.message,
    });
    expect(saveButton).toBeInTheDocument();
    expect(saveButton).toBeDisabled();
  });

  it('does not render when isOpen is false', () => {
    const store = configureStore(mockDefaultState);
    renderWithProvider(
      <MultichainAccountEditModal {...mockProps} isOpen={false} />,
      store,
    );

    // Should not find modal elements when closed
    expect(
      screen.queryByText(messages.renameAccount.message),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText(messages.accountName.message),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: messages.save.message }),
    ).not.toBeInTheDocument();
  });

  it('enables confirm button when input has valid value', () => {
    const store = configureStore(mockDefaultState);
    renderWithProvider(<MultichainAccountEditModal {...mockProps} />, store);

    const input = screen.getByPlaceholderText('Account 1');
    const saveButton = screen.getByRole('button', {
      name: messages.save.message,
    });

    // Initially disabled
    expect(saveButton).toBeDisabled();

    // Type valid text
    fireEvent.change(input, { target: { value: 'New Account Name' } });

    // Button should be enabled
    expect(saveButton).not.toBeDisabled();

    // Clear input
    fireEvent.change(input, { target: { value: '' } });

    // Button should be disabled again
    expect(saveButton).toBeDisabled();

    // Type just spaces
    fireEvent.change(input, { target: { value: '   ' } });

    // Button should still be disabled
    expect(saveButton).toBeDisabled();
  });

  it('calls onClose when header close button is clicked', () => {
    const store = configureStore(mockDefaultState);
    renderWithProvider(<MultichainAccountEditModal {...mockProps} />, store);

    const closeButton = screen.getByLabelText(messages.close.message);
    fireEvent.click(closeButton);

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
    store.dispatch = jest.fn().mockResolvedValue(true);

    renderWithProvider(<MultichainAccountEditModal {...mockProps} />, store);

    const input = screen.getByPlaceholderText('Account 1');
    fireEvent.change(input, { target: { value: 'New Account Name' } });

    const saveButton = screen.getByRole('button', {
      name: messages.save.message,
    });
    fireEvent.click(saveButton);

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
    const saveButton = screen.getByRole('button', {
      name: messages.save.message,
    });
    fireEvent.click(saveButton);

    // Check that dispatch was not called
    await waitFor(() => {
      expect(setAccountGroupName).not.toHaveBeenCalled();
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
    const saveButton = screen.getByRole('button', {
      name: messages.save.message,
    });
    fireEvent.click(saveButton);

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
    const saveButton = screen.getByRole('button', {
      name: messages.save.message,
    });

    // Type something first to enable the button
    fireEvent.change(input, { target: { value: 'Something' } });
    expect(saveButton).not.toBeDisabled();

    // Then clear the input
    fireEvent.change(input, { target: { value: '' } });

    expect(saveButton).toBeDisabled();
  });

  it('handles form submission with different account name', async () => {
    const store = configureStore(mockDefaultState);
    store.dispatch = jest.fn().mockResolvedValue(true);

    renderWithProvider(<MultichainAccountEditModal {...mockProps} />, store);

    const input = screen.getByPlaceholderText('Account 1');

    const differentName = 'Different Account Name';
    fireEvent.change(input, { target: { value: differentName } });

    const saveButton = screen.getByRole('button', {
      name: messages.save.message,
    });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(setAccountGroupName).toHaveBeenCalledWith(
        mockProps.accountGroupId,
        differentName,
      );
      expect(mockProps.onClose).toHaveBeenCalled();
    });
  });

  it('shows error message when account name already exists', async () => {
    // Mock the setAccountGroupName to return a thunk that resolves to false
    // indicating a duplicate account name
    (setAccountGroupName as jest.Mock).mockImplementationOnce(() => {
      return async () => false; // Return false to simulate duplicate name
    });

    const store = configureStore(mockDefaultState);
    renderWithProvider(<MultichainAccountEditModal {...mockProps} />, store);

    const input = screen.getByPlaceholderText('Account 1');
    fireEvent.change(input, { target: { value: 'Duplicate Account Name' } });

    const saveButton = screen.getByRole('button', {
      name: messages.save.message,
    });
    fireEvent.click(saveButton);

    // Wait for the error message to appear
    await waitFor(() => {
      // Check that the error message is displayed
      expect(
        screen.getByText(messages.accountNameAlreadyInUse.message),
      ).toBeInTheDocument();

      // Check that the input field is still present
      const inputContainer = screen.getByTestId('account-name-input');
      expect(inputContainer).toBeInTheDocument();

      // The modal should remain open and not call onClose
      expect(mockProps.onClose).not.toHaveBeenCalled();
    });

    expect(setAccountGroupName).toHaveBeenCalledWith(
      mockProps.accountGroupId,
      'Duplicate Account Name',
    );
  });

  it('clears the input and hides the clear button when clear is clicked', () => {
    const store = configureStore(mockDefaultState);
    renderWithProvider(<MultichainAccountEditModal {...mockProps} />, store);

    const input = screen.getByPlaceholderText('Account 1');
    fireEvent.click(
      screen.getByRole('button', { name: messages.clear.message }),
    );

    expect(input).toHaveValue('');
    expect(input).toHaveFocus();
    expect(
      screen.queryByRole('button', { name: messages.clear.message }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: messages.save.message }),
    ).toBeDisabled();
  });

  it('saves account name when Enter key is pressed in the input field', async () => {
    const store = configureStore(mockDefaultState);
    store.dispatch = jest.fn().mockResolvedValue(true);

    renderWithProvider(<MultichainAccountEditModal {...mockProps} />, store);

    const input = screen.getByPlaceholderText('Account 1');

    fireEvent.change(input, { target: { value: 'New Account Name' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(setAccountGroupName).toHaveBeenCalledWith(
        mockProps.accountGroupId,
        'New Account Name',
      );
      expect(mockProps.onClose).toHaveBeenCalledTimes(1);
    });
  });
});

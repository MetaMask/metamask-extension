import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/jest/rendering';
import configureStore, { MetaMaskReduxDispatch } from '../../../store/store';
import { EditAccountNameModal } from './edit-account-name-modal';

// Mock the setAccountLabel action
const mockSetAccountLabel = jest.fn();
jest.mock('../../../store/actions', () => ({
  ...jest.requireActual('../../../store/actions'),
  setAccountLabel: (address: string, label: string) => {
    // Return a thunk function like the real action does
    return (_dispatch: MetaMaskReduxDispatch) => {
      mockSetAccountLabel(address, label);
      // Return a resolved promise to simulate the async behavior
      return Promise.resolve(address);
    };
  },
}));

describe('EditAccountNameModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    currentAccountName: 'Account 1',
    address: '0x1234567890abcdef1234567890abcdef12345678',
  };

  const mockState = {
    metamask: {
      localeMessages: {
        current: {
          editAccountName: 'Edit account name',
          name: 'Name',
          save: 'Save',
        },
        currentLocale: 'en',
      },
    },
  };

  const renderComponent = (props = {}, state = {}) => {
    const store = configureStore({
      ...mockState,
      ...state,
    });

    return renderWithProvider(
      <EditAccountNameModal {...defaultProps} {...props} />,
      store,
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render the modal when isOpen is true', () => {
      renderComponent();

      expect(screen.getByText('Edit account name')).toBeInTheDocument();
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    });

    it('should not render the modal when isOpen is false', () => {
      renderComponent({ isOpen: false });

      expect(screen.queryByText('Edit account name')).not.toBeInTheDocument();
    });

    it('should display the current account name as placeholder', () => {
      renderComponent();

      const input = screen.getByPlaceholderText('Account 1');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('placeholder', 'Account 1');
    });

    it('should display the account address as help text', () => {
      renderComponent();

      expect(
        screen.getByText('0x1234567890abcdef1234567890abcdef12345678'),
      ).toBeInTheDocument();
    });
  });

  describe('Form Interactions', () => {
    it('should update input value when user types', () => {
      renderComponent();

      const input = screen.getByPlaceholderText('Account 1');
      fireEvent.change(input, { target: { value: 'New Account Name' } });

      expect(input).toHaveValue('New Account Name');
    });

    it('should enable save button when input has valid text', () => {
      renderComponent();

      const input = screen.getByPlaceholderText('Account 1');
      const saveButton = screen.getByRole('button', { name: 'Save' });

      expect(saveButton).toBeDisabled();

      fireEvent.change(input, { target: { value: 'New Name' } });
      expect(saveButton).toBeEnabled();
    });
  });

  describe('Save Functionality', () => {
    it('should dispatch setAccountLabel action when save is clicked with valid input', async () => {
      renderComponent();

      const input = screen.getByPlaceholderText('Account 1');
      const saveButton = screen.getByRole('button', { name: 'Save' });

      fireEvent.change(input, { target: { value: 'New Account Name' } });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockSetAccountLabel).toHaveBeenCalledWith(
          '0x1234567890abcdef1234567890abcdef12345678',
          'New Account Name',
        );
      });
    });

    it('should not dispatch action if new name is same as current name', async () => {
      renderComponent();

      const input = screen.getByPlaceholderText('Account 1');
      const saveButton = screen.getByRole('button', { name: 'Save' });

      fireEvent.change(input, { target: { value: 'Account 1' } });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockSetAccountLabel).not.toHaveBeenCalled();
      });
    });

    it('should call onClose after saving', async () => {
      const onClose = jest.fn();
      renderComponent({ onClose });

      const input = screen.getByPlaceholderText('Account 1');
      const saveButton = screen.getByRole('button', { name: 'Save' });

      fireEvent.change(input, { target: { value: 'New Name' } });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
    });

    it('should call onClose even when no changes are made', async () => {
      const onClose = jest.fn();
      renderComponent({ onClose });

      const saveButton = screen.getByRole('button', { name: 'Save' });

      // Enable the button by adding some text first
      const input = screen.getByPlaceholderText('Account 1');
      fireEvent.change(input, { target: { value: 'test' } });

      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
    });
  });

  describe('Modal Close Functionality', () => {
    it('should call onClose when close button is clicked', () => {
      const onClose = jest.fn();
      renderComponent({ onClose });

      const closeButton = screen.getByRole('button', { name: 'Close' });
      fireEvent.click(closeButton);

      expect(onClose).toHaveBeenCalled();
    });
  });
});

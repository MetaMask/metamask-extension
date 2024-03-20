import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import initializedMockState from '../../../../test/data/mock-send-state.json';
import {
  ONBOARDING_SECURE_YOUR_WALLET_ROUTE,
  ONBOARDING_COMPLETION_ROUTE,
} from '../../../helpers/constants/routes';
import { FirstTimeFlowType } from '../../../../shared/constants/onboarding';
import CreatePassword from './create-password';

const mockHistoryPush = jest.fn();
const mockHistoryReplace = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: () => ({
    push: mockHistoryPush,
    replace: mockHistoryReplace,
  }),
}));

describe('Onboarding Create Password', () => {
  const mockState = {
    metamask: {
      identities: {},
      selectedAddress: '',
      internalAccounts: {
        accounts: {},
        selectedAccount: '',
      },
      metaMetricsId: '0x00000000',
    },
  };

  const mockCreateNewAccount = jest.fn().mockResolvedValue();

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialized State Conditionals with keyrings and firstTimeFlowType', () => {
    it('should route to secure your wallet when keyring is present but not imported first time flow type', () => {
      const mockStore = configureMockStore()(initializedMockState);

      renderWithProvider(<CreatePassword />, mockStore);
      expect(mockHistoryReplace).toHaveBeenCalledWith(
        ONBOARDING_SECURE_YOUR_WALLET_ROUTE,
      );
    });

    it('should route to completion when keyring is present and imported first time flow type', () => {
      const importFirstTimeFlowState = {
        ...initializedMockState,
        metamask: {
          ...initializedMockState.metamask,
          firstTimeFlowType: FirstTimeFlowType.import,
        },
      };
      const mockStore = configureMockStore()(importFirstTimeFlowState);

      renderWithProvider(<CreatePassword />, mockStore);
      expect(mockHistoryReplace).toHaveBeenCalledWith(
        ONBOARDING_COMPLETION_ROUTE,
      );
    });
  });

  describe('Render', () => {
    it('should match snapshot', () => {
      const mockStore = configureMockStore()(mockState);
      const { container } = renderWithProvider(<CreatePassword />, mockStore);

      expect(container).toMatchSnapshot();
    });
  });

  describe('Password Validation Checks', () => {
    it('should show password as text when click Show under password', () => {
      const mockStore = configureMockStore()(mockState);
      const { queryByTestId } = renderWithProvider(
        <CreatePassword />,
        mockStore,
      );

      const createPassword = queryByTestId('create-password-new');
      const event = {
        target: {
          value: '1234567',
        },
      };

      fireEvent.change(createPassword, event);

      expect(createPassword).toHaveAttribute('type', 'password');

      const showPassword = queryByTestId('show-password');

      fireEvent.click(showPassword);

      expect(createPassword).toHaveAttribute('type', 'text');
    });
    it('should disable create new account button and show short password error with password length of 7', () => {
      const mockStore = configureMockStore()(mockState);
      const { queryByTestId } = renderWithProvider(
        <CreatePassword createNewAccount={mockCreateNewAccount} />,
        mockStore,
      );

      const createPassword = queryByTestId('create-password-new');
      const event = {
        target: {
          value: '1234567',
        },
      };

      fireEvent.change(createPassword, event);

      const shortPasswordError = queryByTestId('short-password-error');
      expect(shortPasswordError).toBeInTheDocument();

      const createNewWalletButton = queryByTestId('create-password-wallet');

      expect(createNewWalletButton).toBeDisabled();

      fireEvent.click(createNewWalletButton);
      expect(mockCreateNewAccount).not.toHaveBeenCalled();
    });

    it('should show weak password strength', () => {
      const mockStore = configureMockStore()(mockState);
      const { queryByTestId } = renderWithProvider(
        <CreatePassword createNewAccount={mockCreateNewAccount} />,
        mockStore,
      );

      const createNewWalletButton = queryByTestId('create-password-wallet');

      const createPassword = queryByTestId('create-password-new');
      const event = {
        target: {
          value: '12345678',
        },
      };

      fireEvent.change(createPassword, event);

      const weakPasswordError = queryByTestId('weak-password');
      expect(weakPasswordError).toBeInTheDocument();

      expect(createNewWalletButton).toBeDisabled();

      fireEvent.click(createNewWalletButton);

      expect(mockCreateNewAccount).not.toHaveBeenCalled();
    });

    it('should show average password strength', () => {
      const mockStore = configureMockStore()(mockState);
      const { queryByTestId } = renderWithProvider(
        <CreatePassword createNewAccount={mockCreateNewAccount} />,
        mockStore,
      );

      const createNewWalletButton = queryByTestId('create-password-wallet');

      const createPassword = queryByTestId('create-password-new');
      const event = {
        target: {
          value: 'ZsE(!6679',
        },
      };

      fireEvent.change(createPassword, event);

      const weakPasswordError = queryByTestId('average-password');
      expect(weakPasswordError).toBeInTheDocument();

      expect(createNewWalletButton).toBeDisabled();

      fireEvent.click(createNewWalletButton);

      expect(mockCreateNewAccount).not.toHaveBeenCalled();
    });

    it('should show strong password strength', () => {
      const mockStore = configureMockStore()(mockState);
      const { queryByTestId } = renderWithProvider(
        <CreatePassword createNewAccount={mockCreateNewAccount} />,
        mockStore,
      );

      const createPassword = queryByTestId('create-password-new');
      const event = {
        target: {
          value: 'E}URkDoV|/*,pxI',
        },
      };

      fireEvent.change(createPassword, event);

      const weakPasswordError = queryByTestId('strong-password');
      expect(weakPasswordError).toBeInTheDocument();

      const createNewWalletButton = queryByTestId('create-password-wallet');

      expect(createNewWalletButton).toBeDisabled();

      fireEvent.click(createNewWalletButton);

      expect(mockCreateNewAccount).not.toHaveBeenCalled();
    });

    it('should show mismatch password error', () => {
      const mockStore = configureMockStore()(mockState);
      const { queryByTestId, queryByText } = renderWithProvider(
        <CreatePassword createNewAccount={mockCreateNewAccount} />,
        mockStore,
      );

      const createPassword = queryByTestId('create-password-new');
      const confirmPassword = queryByTestId('create-password-confirm');

      const createPasswordEvent = {
        target: {
          value: '123456789',
        },
      };
      const confirmPasswordEvent = {
        target: {
          value: '12345678',
        },
      };

      fireEvent.change(createPassword, createPasswordEvent);
      fireEvent.change(confirmPassword, confirmPasswordEvent);

      const passwordMismatchError = queryByText("Passwords don't match");

      expect(passwordMismatchError).toBeInTheDocument();

      const createNewWalletButton = queryByTestId('create-password-wallet');

      expect(createNewWalletButton).toBeDisabled();

      fireEvent.click(createNewWalletButton);

      expect(mockCreateNewAccount).not.toHaveBeenCalled();
    });

    it('should not create new wallet without terms checked', () => {
      const mockStore = configureMockStore()(mockState);
      const { queryByTestId } = renderWithProvider(
        <CreatePassword createNewAccount={mockCreateNewAccount} />,
        mockStore,
      );

      const createPassword = queryByTestId('create-password-new');
      const confirmPassword = queryByTestId('create-password-confirm');

      const createPasswordEvent = {
        target: {
          value: '12345678',
        },
      };
      const confirmPasswordEvent = {
        target: {
          value: '12345678',
        },
      };

      fireEvent.change(createPassword, createPasswordEvent);
      fireEvent.change(confirmPassword, confirmPasswordEvent);

      const terms = queryByTestId('create-password-terms');

      expect(terms).not.toBeChecked();

      const createNewWalletButton = queryByTestId('create-password-wallet');

      expect(createNewWalletButton).toBeDisabled();

      fireEvent.click(createNewWalletButton);

      expect(mockCreateNewAccount).not.toHaveBeenCalled();
    });
  });

  describe('Create New Account', () => {
    it('should create new account with correct passwords and terms checked', async () => {
      const mockStore = configureMockStore()(mockState);
      const { queryByTestId } = renderWithProvider(
        <CreatePassword createNewAccount={mockCreateNewAccount} />,
        mockStore,
      );

      const createPassword = queryByTestId('create-password-new');
      const confirmPassword = queryByTestId('create-password-confirm');

      const password = '12345678';

      const createPasswordEvent = {
        target: {
          value: password,
        },
      };
      const confirmPasswordEvent = {
        target: {
          value: password,
        },
      };

      fireEvent.change(createPassword, createPasswordEvent);
      fireEvent.change(confirmPassword, confirmPasswordEvent);

      const terms = queryByTestId('create-password-terms');
      fireEvent.click(terms);

      const createNewWalletButton = queryByTestId('create-password-wallet');

      expect(createNewWalletButton).not.toBeDisabled();

      fireEvent.click(createNewWalletButton);

      expect(mockCreateNewAccount).toHaveBeenCalledWith(password);

      await waitFor(() => {
        expect(mockHistoryPush).toHaveBeenCalledWith(
          ONBOARDING_SECURE_YOUR_WALLET_ROUTE,
        );
      });
    });
  });

  describe('Import Wallet', () => {
    const importMockState = {
      ...mockState,
      metamask: {
        ...mockState.metamask,
        firstTimeFlowType: FirstTimeFlowType.import,
      },
    };

    it('should import wallet', async () => {
      const mockStore = configureMockStore()(importMockState);

      const props = {
        importWithRecoveryPhrase: jest.fn().mockResolvedValue(),
        secretRecoveryPhrase: 'SRP',
      };

      const { queryByTestId } = renderWithProvider(
        <CreatePassword {...props} />,
        mockStore,
      );

      const createPassword = queryByTestId('create-password-new');
      const confirmPassword = queryByTestId('create-password-confirm');

      const password = '12345678';

      const createPasswordEvent = {
        target: {
          value: password,
        },
      };
      const confirmPasswordEvent = {
        target: {
          value: password,
        },
      };

      fireEvent.change(createPassword, createPasswordEvent);
      fireEvent.change(confirmPassword, confirmPasswordEvent);

      const terms = queryByTestId('create-password-terms');
      fireEvent.click(terms);

      const importWalletButton = queryByTestId('create-password-import');

      expect(importWalletButton.textContent).toMatchInlineSnapshot(
        `"Import my wallet"`,
      );

      fireEvent.click(importWalletButton);

      expect(props.importWithRecoveryPhrase).toHaveBeenCalledWith(
        password,
        props.secretRecoveryPhrase,
      );

      await waitFor(() => {
        expect(mockHistoryPush).toHaveBeenCalledWith(
          ONBOARDING_COMPLETION_ROUTE,
        );
      });
    });
  });

  describe('Analytics IFrame', () => {
    it('should inject iframe when participating in metametrics', () => {
      const state = {
        ...mockState,
        metamask: {
          ...mockState.metamask,
          participateInMetaMetrics: true,
        },
      };
      const mockStore = configureMockStore()(state);
      const { queryByTestId } = renderWithProvider(
        <CreatePassword />,
        mockStore,
      );
      expect(queryByTestId('create-password-iframe')).toBeInTheDocument();
    });

    it('should not inject iframe when participating in metametrics', () => {
      const state = {
        ...mockState,
        metamask: {
          ...mockState.metamask,
          participateInMetaMetrics: false,
        },
      };
      const mockStore = configureMockStore()(state);
      const { queryByTestId } = renderWithProvider(
        <CreatePassword />,
        mockStore,
      );
      expect(queryByTestId('create-password-iframe')).not.toBeInTheDocument();
    });
  });
});

/* eslint-disable jest/require-top-level-describe */
import React from 'react';
import { CaipChainId } from '@metamask/utils';
import { fireEvent, renderWithProvider, waitFor } from '../../../../test/jest';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import { WalletClientType } from '../../../hooks/accounts/useMultichainWalletSnapClient';
import { createMockInternalAccount } from '../../../../test/jest/mocks';
import { CreateSnapAccount } from './create-snap-account';

// Mock dependencies
jest.mock('../../../hooks/accounts/useMultichainWalletSnapClient', () => {
  const mockCreateAccount = jest.fn().mockResolvedValue(true);
  return {
    useMultichainWalletSnapClient: jest.fn().mockReturnValue({
      createAccount: mockCreateAccount,
    }),
    __mockCreateAccount: mockCreateAccount,
  };
});

jest.mock('../../../store/actions', () => ({
  ...jest.requireActual('../../../store/actions'),
  getNextAvailableAccountName: jest.fn().mockResolvedValue('Snap Account 2'),
}));

const { __mockCreateAccount: mockCreateAccount } = jest.requireMock(
  '../../../hooks/accounts/useMultichainWalletSnapClient',
);

const mockSnapAccount = createMockInternalAccount({
  name: 'Snap Account 1',
  address: '0xb552685e3d2790efd64a175b00d51f02cdafee5d',
});

const defaultProps = {
  onActionComplete: jest.fn(),
  onSelectSRP: jest.fn(),
  selectedKeyringId: 'test-keyring-id',
  clientType: 'eip155:eoa' as WalletClientType,
  chainId: 'eip155:1' as CaipChainId,
};

const render = (props = defaultProps) => {
  const store = configureStore({
    ...mockState,
    metamask: {
      ...mockState.metamask,
      completedOnboarding: true,
      internalAccounts: {
        selectedAccount: mockSnapAccount.id,
        accounts: {
          [mockSnapAccount.id]: mockSnapAccount,
        },
      },
      keyrings: [
        {
          type: 'Snap Keyring',
          accounts: [mockSnapAccount.address],
        },
      ],
      accounts: {
        [mockSnapAccount.address]: {
          address: mockSnapAccount.address,
          balance: '0x0',
        },
      },
      balances: {
        [mockSnapAccount.id]: {
          '0x1': {
            amount: '0',
          },
        },
      },
      selectedAddress: mockSnapAccount.address,
      provider: {
        type: 'mainnet',
        chainId: '0x1',
      },
    },
  });
  return renderWithProvider(<CreateSnapAccount {...props} />, store);
};

describe('CreateSnapAccount', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the CreateAccount component with correct props', async () => {
    const { getByTestId } = render();
    await waitFor(() => {
      expect(getByTestId('submit-add-account-with-name')).toBeInTheDocument();
    });
  });

  it('calls onActionComplete with true when account creation is successful', async () => {
    const onActionComplete = jest.fn();
    const { getByTestId } = render({
      ...defaultProps,
      onActionComplete,
    });

    const createButton = getByTestId('submit-add-account-with-name');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(onActionComplete).toHaveBeenCalledWith(true);
    });
  });

  it('calls onActionComplete with false when account creation fails', async () => {
    const error = new Error('Failed to create account');
    jest.spyOn(console, 'error').mockImplementation(() => {
      /* Suppress error log */
    });
    mockCreateAccount.mockRejectedValueOnce(error);

    const onActionComplete = jest.fn();
    const { getByTestId } = render({
      ...defaultProps,
      onActionComplete,
    });

    const createButton = getByTestId('submit-add-account-with-name');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(onActionComplete).toHaveBeenCalledWith(false);
    });
  });

  it('passes the correct chainId and keyringId to createAccount', async () => {
    const { getByTestId } = render();

    const createButton = getByTestId('submit-add-account-with-name');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(mockCreateAccount).toHaveBeenCalledWith(
        defaultProps.chainId,
        defaultProps.selectedKeyringId,
        '',
      );
    });
  });
});

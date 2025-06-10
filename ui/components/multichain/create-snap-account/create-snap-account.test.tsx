/* eslint-disable jest/require-top-level-describe */
import React from 'react';
import { CaipChainId } from '@metamask/utils';
import { SnapKeyringInternalOptions } from '@metamask/eth-snap-keyring';
import { fireEvent, renderWithProvider, waitFor } from '../../../../test/jest';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import { WalletClientType } from '../../../hooks/accounts/useMultichainWalletSnapClient';
import { createMockInternalAccount } from '../../../../test/jest/mocks';
import { MultichainNetworks } from '../../../../shared/constants/multichain/networks';
import { CreateAccountSnapOptions } from '../../../../shared/lib/accounts';
import { CreateSnapAccount } from './create-snap-account';

const newSnapAccount = createMockInternalAccount({
  name: 'Snap Account 2',
  address: '0xb552685e3d2790efd64a175b00d51f02cdafee5d',
});

const mockCreateAccount = jest.fn().mockResolvedValue(newSnapAccount);

// Mock dependencies
jest.mock('../../../hooks/accounts/useMultichainWalletSnapClient', () => {
  const mockGetNextAvailableAccountName = jest
    .fn()
    .mockResolvedValue('Snap Account 2');

  return {
    ...jest.requireActual(
      '../../../hooks/accounts/useMultichainWalletSnapClient',
    ),
    useMultichainWalletSnapClient: jest.fn().mockReturnValue({
      createAccount: (
        options: CreateAccountSnapOptions,
        internalOptions?: SnapKeyringInternalOptions,
      ) => mockCreateAccount(options, internalOptions),
      getNextAvailableAccountName: mockGetNextAvailableAccountName,
    }),
  };
});

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
          metadata: {
            id: 'test-keyring-id',
            name: '',
          },
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
      expect(onActionComplete).toHaveBeenCalledWith(true, newSnapAccount);
    });
  });

  it('passes the correct chainId and keyringId to createAccount', async () => {
    const { getByTestId } = render();

    const createButton = getByTestId('submit-add-account-with-name');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(mockCreateAccount).toHaveBeenCalledWith(
        {
          scope: defaultProps.chainId,
          entropySource: defaultProps.selectedKeyringId,
          accountNameSuggestion: '',
        },
        {
          setSelectedAccount: undefined,
        },
      );
    });
  });

  it('renders the suggested account name as placeholder', async () => {
    const { getByPlaceholderText } = render({
      ...defaultProps,
      clientType: WalletClientType.Solana,
      chainId: MultichainNetworks.SOLANA,
    });

    await waitFor(() => {
      const nameSuggestion = getByPlaceholderText('Snap Account 2');
      expect(nameSuggestion).toBeInTheDocument();
    });
  });

  it('only calls createAccount once', async () => {
    const { getByTestId } = render();

    const createButton = getByTestId('submit-add-account-with-name');
    fireEvent.click(createButton);
    fireEvent.click(createButton);
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(mockCreateAccount).toHaveBeenCalledTimes(1);
    });
  });
});

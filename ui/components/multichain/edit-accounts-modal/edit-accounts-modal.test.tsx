import React from 'react';
import { CaipAccountId } from '@metamask/utils';
import { fireEvent, waitFor } from '@testing-library/react';
import { SolAccountType, SolScope } from '@metamask/keyring-api';
import { KeyringTypes } from '@metamask/keyring-controller';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { renderWithProvider } from '../../../../test/jest/rendering';
import mockState from '../../../../test/data/mock-state.json';
import configureStore from '../../../store/store';
import { MergedInternalAccount } from '../../../selectors/selectors.types';
import { createMockInternalAccount } from '../../../../test/jest/mocks';
import { EditAccountsModal } from '.';

const mockKeyringId = '01JKAF3DSGM3AB87EM9N0K41AJ';

const goToAddNewAccount = (
  getByTestId: (testId: string) => HTMLElement,
  accountType: 'bitcoin' | 'solana' | 'evm',
) => {
  const addNewAccountButton = getByTestId('add-new-account-button');
  fireEvent.click(addNewAccountButton);

  if (accountType === 'evm') {
    const addEvmAccountButton = getByTestId(
      'multichain-account-menu-popover-add-account',
    );
    fireEvent.click(addEvmAccountButton);
  } else if (accountType === 'solana') {
    const addSolanaAccountButton = getByTestId(
      'multichain-account-menu-popover-add-solana-account',
    );
    fireEvent.click(addSolanaAccountButton);
  } else {
    const addBitcoinAccountButton = getByTestId(
      'multichain-account-menu-popover-add-bitcoin-account',
    );
    fireEvent.click(addBitcoinAccountButton);
  }
};

const mockNewAccount = createMockInternalAccount({
  name: 'Solana Account 1',
  address: '3wqBoWo34h34tovyEwy5WLmELH88spdMThjGtevnmKu1',
  keyringType: KeyringTypes.snap,
  type: SolAccountType.DataAccount,
});

const mockCreateAccount = jest.fn().mockResolvedValue(mockNewAccount);

jest.mock('../../../hooks/accounts/useMultichainWalletSnapClient', () => ({
  ...jest.requireActual(
    '../../../hooks/accounts/useMultichainWalletSnapClient',
  ),
  useMultichainWalletSnapClient: jest.fn().mockImplementation(() => {
    return {
      getNextAvailableAccountName: jest
        .fn()
        .mockResolvedValue('Solana Account 1'),
      createAccount: mockCreateAccount,
    };
  }),
}));

const mockAddNewAccount = jest.fn();
jest.mock('../../../store/actions.ts', () => ({
  ...jest.requireActual('../../../store/actions.ts'),
  addNewAccount: (keyringId: string) => mockAddNewAccount(keyringId),
  setAccountLabel: jest.fn(),
}));

const getCaipAccountId = (account: InternalAccount): CaipAccountId => {
  const [scope] = account.scopes;
  return `${scope}:${account.address}`;
};

const render = (
  props: {
    onSubmit: (addresses: string[]) => void;
    onClose: () => void;
  } = {
    onSubmit: jest.fn(),
    onClose: jest.fn(),
  },
  state = {},
) => {
  const store = configureStore({
    ...mockState,
    metamask: {
      ...mockState.metamask,
      ...state,
      permissionHistory: {
        'https://test.dapp': {
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          eth_accounts: {
            accounts: {
              '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': 1709225290848,
            },
          },
        },
      },
    },
    activeTab: {
      origin: 'https://test.dapp',
    },
  });

  const accounts = Object.values(
    mockState.metamask.internalAccounts.accounts,
  ) as unknown as MergedInternalAccount[];

  const accountsWithCaipAccountId = accounts.map((account) => {
    return {
      ...account,
      caipAccountId: `${account.scopes[0]}:${account.address}` as CaipAccountId,
    };
  });

  return renderWithProvider(
    <EditAccountsModal
      accounts={accountsWithCaipAccountId}
      defaultSelectedAccountAddresses={[
        accountsWithCaipAccountId[0].caipAccountId,
      ]}
      {...props}
    />,
    store,
  );
};
describe('EditAccountsModal', () => {
  it('should render correctly', () => {
    const { container } = render();
    expect(container).toMatchSnapshot();
  });

  it('shows select all button', async () => {
    const { getByLabelText } = render();
    expect(getByLabelText('Select all')).toBeInTheDocument();
  });

  it('calls onSubmit with the selected account addresses when the connect button is clicked', async () => {
    const onSubmit = jest.fn();
    const { getByTestId } = render({
      onSubmit,
      onClose: jest.fn(),
    });
    fireEvent.click(getByTestId('connect-more-accounts-button'));
    expect(onSubmit).toHaveBeenCalledWith([
      'eip155:0:0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
    ]);
  });

  it('calls onClose when the connect button is clicked', async () => {
    const onClose = jest.fn();
    const { getByTestId } = render({
      onSubmit: jest.fn(),
      onClose,
    });
    fireEvent.click(getByTestId('connect-more-accounts-button'));
    expect(onClose).toHaveBeenCalledWith();
  });

  it('shows the disconnect text button when nothing is selected', () => {
    const { getByLabelText, getByTestId } = render();
    fireEvent.click(getByLabelText('Select all'));
    fireEvent.click(getByLabelText('Select all'));
    expect(getByTestId('disconnect-accounts-button')).toHaveTextContent(
      'Disconnect',
    );
  });

  describe('adding accounts', () => {
    it('shows evm and solana account options', () => {
      const { getByTestId } = render();

      const addNewAccountButton = getByTestId('add-new-account-button');
      fireEvent.click(addNewAccountButton);

      expect(
        getByTestId('multichain-account-menu-popover-add-account'),
      ).toBeInTheDocument();
      expect(
        getByTestId('multichain-account-menu-popover-add-solana-account'),
      ).toBeInTheDocument();
    });

    it('adds a new evm account', async () => {
      const { getByTestId } = render();
      goToAddNewAccount(getByTestId, 'evm');

      await waitFor(() =>
        expect(getByTestId('account-name-input')).toBeInTheDocument(),
      );

      const addAccountButton = getByTestId('submit-add-account-with-name');
      fireEvent.click(addAccountButton);

      await waitFor(() =>
        expect(mockAddNewAccount).toHaveBeenCalledWith(mockKeyringId),
      );
    });
    it('adds a new solana account', async () => {
      const { getByTestId } = render();
      goToAddNewAccount(getByTestId, 'solana');

      await waitFor(() =>
        expect(getByTestId('account-name-input')).toBeInTheDocument(),
      );

      const addAccountButton = getByTestId('submit-add-account-with-name');
      fireEvent.click(addAccountButton);

      const expectedArgs = {
        scope: SolScope.Mainnet,
        entropySource: mockKeyringId,
        accountNameSuggestion: 'Solana Account 1',
      };

      const expectedInternalArgs = {
        setSelectedAccount: true,
      };

      expect(mockCreateAccount).toHaveBeenCalledWith(
        expectedArgs,
        expectedInternalArgs,
      );
    });

    it('shows the srp list when the srp button is clicked', async () => {
      const hdAccount = createMockInternalAccount({
        address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
      });
      const hdAccount2 = createMockInternalAccount({
        address: '0x67B2fAf7959fB61eb9746571041476Bbd0672569',
      });

      const hdKeyring = {
        type: KeyringTypes.hd,
        accounts: [hdAccount.address],
        metadata: {
          id: '01JKAF3DSGM3AB87EM9N0K41AJ',
          name: '',
        },
      };
      const hdKeyring2 = {
        type: KeyringTypes.hd,
        accounts: [hdAccount2.address],
        metadata: {
          id: '01JKAF3DSGM3AB87EM9N0K4444',
          name: '',
        },
      };

      const { getByTestId } = render(undefined, {
        internalAccounts: {
          accounts: {
            [hdAccount.id]: hdAccount,
            [hdAccount2.id]: hdAccount2,
          },
          selectedAccount: hdAccount.id,
        },
        keyrings: [hdKeyring, hdKeyring2],
      });
      goToAddNewAccount(getByTestId, 'solana');

      const srpButton = getByTestId('select-srp-Secret Recovery Phrase 1');
      fireEvent.click(srpButton);

      expect(getByTestId('srp-list')).toBeInTheDocument();
    });
  });

  it('selects the new CAIP account ID of the account when it is created', async () => {
    const caipAccountIdOfOriginalAccount = getCaipAccountId(
      mockState.metamask.internalAccounts.accounts[
        'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3'
      ] as InternalAccount,
    );
    const expectedNewCaipAccountId = getCaipAccountId(mockNewAccount);
    const mockOnSubmit = jest.fn();
    const { getByTestId } = render({
      onSubmit: mockOnSubmit,
      onClose: jest.fn(),
    });
    goToAddNewAccount(getByTestId, 'solana');

    await waitFor(() =>
      expect(getByTestId('account-name-input')).toBeInTheDocument(),
    );

    const addAccountButton = getByTestId('submit-add-account-with-name');
    fireEvent.click(addAccountButton);

    await waitFor(() =>
      expect(mockOnSubmit).toHaveBeenCalledWith([
        caipAccountIdOfOriginalAccount,
        expectedNewCaipAccountId,
      ]),
    );
  });
});

/* eslint-disable jest/require-top-level-describe */
import React from 'react';
import reactRouterDom from 'react-router-dom';
import {
  BtcAccountType,
  EthAccountType,
  KeyringAccountType,
} from '@metamask/keyring-api';
import {
  KeyringControllerState,
  KeyringTypes,
} from '@metamask/keyring-controller';
import { AccountTreeControllerState } from '@metamask/account-tree-controller';
import { AccountsControllerState } from '@metamask/accounts-controller';
import { DeepPartial } from 'redux';
import configureStore from '../../../store/store';
import mockDefaultState from '../../../../test/data/mock-state.json';
import { createMockInternalAccount } from '../../../../test/jest/mocks';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import { MultichainAccountListMenu } from '.';
import { AccountWalletCategory, toAccountWalletId, toDefaultAccountGroupId } from '@metamask/account-api';

///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
const mockGetEnvironmentType = jest.fn();
const mockGenerateNewHdKeyring = jest.fn();
const mockDetectNfts = jest.fn();

jest.mock('../../../../app/scripts/lib/util', () => ({
  ...jest.requireActual('../../../../app/scripts/lib/util'),
  getEnvironmentType: () => () => mockGetEnvironmentType(),
}));
///: END:ONLY_INCLUDE_IF

jest.mock('../../../store/actions', () => {
  return {
    ...jest.requireActual('../../../store/actions'),
    generateNewHdKeyring: () => mockGenerateNewHdKeyring(),
    detectNfts: () => mockDetectNfts,
  };
});

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: jest.fn(() => []),
}));

type TestState = {
  metamask: AccountsControllerState &
    AccountTreeControllerState &
    KeyringControllerState;
};

const MOCK_STATE: TestState = {
  ...mockDefaultState,
  metamask: {
    ...mockDefaultState.metamask,
    remoteFeatureFlags: {
      addBitcoinAccount: true,
    },
    permissionHistory: {
      'https://test.dapp': {
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        eth_accounts: {
          accounts: {
            '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': 1596681857076,
          },
        },
      },
    },
    subjects: {
      'https://test.dapp': {
        permissions: {
          'endowment:caip25': {
            caveats: [
              {
                type: 'authorizedScopes',
                value: {
                  requiredScopes: {},
                  optionalScopes: {
                    'eip155:1': {
                      accounts: [
                        'eip155:1:0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
                      ],
                    },
                  },
                  isMultichainOrigin: false,
                },
              },
            ],
            invoker: 'https://test.dapp',
            parentCapability: 'endowment:caip25',
          },
        },
      },
    },
  },
  activeTab: {
    id: 113,
    title: 'E2E Test Dapp',
    origin: 'https://metamask.github.io',
    protocol: 'https:',
    url: 'https://metamask.github.io/test-dapp/',
  },
  unconnectedAccount: {
    state: 'OPEN',
  },
} as TestState;

const render = (
  state: DeepPartial<TestState> = MOCK_STATE,
  props: {
    onClose: () => void;
    allowedAccountTypes: KeyringAccountType[];
  } = {
    onClose: () => jest.fn(),
    allowedAccountTypes: [EthAccountType.Eoa, EthAccountType.Erc4337],
  },
  location: string = '/',
) => {
  const store = configureStore(state);
  return renderWithProvider(
    <MultichainAccountListMenu {...props} />,
    store,
    location,
  );
};

describe('MultichainAccountListMenu', () => {
  const historyPushMock = jest.fn();

  beforeEach(() => {
    jest
      .spyOn(reactRouterDom, 'useHistory')
      .mockImplementation()
      .mockReturnValue({ push: historyPushMock });
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.clearAllMocks();
  });

  it('displays important elements', () => {
    const { getByText, getByTestId } = render();

    expect(getByText('Add account or hardware wallet')).toBeInTheDocument();
    expect(
      getByTestId('multichain-account-menu-search-bar'),
    ).toBeInTheDocument();
    expect(document.querySelector('[aria-label="Back"]')).toStrictEqual(null);
  });

  it('detects NFTs when an account is clicked', () => {
    const { getAllByTestId } = render();
    const listItems = document.querySelectorAll(
      '.multichain-account-list-item',
    );
    expect(listItems).toHaveLength(6);
    const button = getAllByTestId('account-item');
    button[0].click();
    expect(mockDetectNfts).toHaveBeenCalled();
  });

  describe('prop `allowedAccountTypes`', () => {
    const mockAccount = createMockInternalAccount();
    const mockBtcAccount = createMockInternalAccount({
      name: 'Bitcoin Account',
      type: BtcAccountType.P2wpkh,
      keyringType: KeyringTypes.snap,
      address: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
    });

    const mockPrimaryHdKeyringId = '01JKAF3DSGM3AB87EM9N0K41AJ';
    const mockWalletId1 = toAccountWalletId(
      AccountWalletCategory.Entropy,
      mockPrimaryHdKeyringId,
    );
    const mockGroupId1 = toDefaultAccountGroupId(mockWalletId1);
    const mockState = {
      ...mockDefaultState,
      metamask: {
        ...mockDefaultState.metamask,
        internalAccounts: {
          accounts: {
            [mockAccount.id]: mockAccount,
            [mockBtcAccount.id]: mockBtcAccount,
          },
          selectedAccount: mockAccount.id,
        },
        isUnlocked: true,
        keyrings: [
          {
            type: 'HD Key Tree',
            accounts: [mockAccount.address],
            metadata: { id: mockPrimaryHdKeyringId, name: '' },
          },
          {
            type: 'Snap Keyring',
            accounts: [mockBtcAccount.address],
            metadata: { id: 'Snap Keyring', name: '' },
          },
        ],
        accountTree: {
          selectedAccountGroup: mockGroupId1,
          wallets: {
            [mockWalletId1]: {
              id: mockWalletId1,
              groups: {
                [mockGroupId1]: {
                  id: mockGroupId1,
                  accounts: [mockAccount.id, mockBtcAccount.id],
                  metadata: {
                    name: 'Default',
                  },
                },
              },
              metadata: {
                name: 'Wallet 1',
                type: AccountWalletCategory.Entropy,
                entropy: {
                  id: mockPrimaryHdKeyringId,
                  index: 0,
                },
              },
            },
          },
        },
      },
    } as TestState;

    it('allows only EthAccountTypes', () => {
      const { queryByText } = render(mockState, {
        onClose: jest.fn(),
        allowedAccountTypes: [EthAccountType.Eoa, EthAccountType.Erc4337],
      });

      expect(queryByText(mockAccount.metadata.name)).toBeInTheDocument();
      expect(queryByText(mockBtcAccount.metadata.name)).not.toBeInTheDocument();
    });

    it('allows only BtcAccountType', () => {
      const { queryByText } = render(mockState, {
        onClose: jest.fn(),
        allowedAccountTypes: [BtcAccountType.P2wpkh],
      });

      expect(queryByText(mockAccount.metadata.name)).not.toBeInTheDocument();
      expect(queryByText(mockBtcAccount.metadata.name)).toBeInTheDocument();
    });
  });
});

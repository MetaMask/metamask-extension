import React from 'react';
import { fireEvent } from '@testing-library/react';
import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
} from '@metamask/multichain';
import { renderWithProvider } from '../../../../test/jest/rendering';
import mockState from '../../../../test/data/mock-state.json';
import configureStore from '../../../store/store';
import { overrideAccountsFromMockState } from '../../../../test/jest/mocks';
import {
  MOCK_ACCOUNT_BIP122_P2WPKH,
  MOCK_ACCOUNT_EOA,
} from '../../../../test/data/mock-accounts';
import { ConnectPage, ConnectPageProps } from './connect-page';

const mockTestDappUrl = 'https://test.dapp';

const mockTargetSubjectMetadata = {
  extensionId: null,
  iconUrl: 'https://metamask.github.io/test-dapp/metamask-fox.svg',
  name: 'E2E Test Dapp',
  origin: 'https://metamask.github.io',
  subjectType: 'website',
};

const render = (
  options: {
    props?: ConnectPageProps;
    state?: object;
  } = {},
) => {
  const {
    props = {
      request: {
        id: '1',
        origin: mockTestDappUrl,
      },
      permissionsRequestId: '1',
      rejectPermissionsRequest: jest.fn(),
      approveConnection: jest.fn(),
      activeTabOrigin: mockTestDappUrl,
      targetSubjectMetadata: mockTargetSubjectMetadata,
    },
    state,
  } = options;

  const store = configureStore({
    ...mockState,
    metamask: {
      ...mockState.metamask,
      ...state,
      permissionHistory: {
        mockTestDappUrl: {
          eth_accounts: {
            accounts: {
              '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': 1709225290848,
            },
          },
        },
      },
    },
    activeTab: {
      origin: mockTestDappUrl,
    },
  });
  return renderWithProvider(<ConnectPage {...props} />, store);
};
describe('ConnectPage', () => {
  it('should render correctly', () => {
    const { container } = render();
    expect(container).toMatchSnapshot();
  });

  it('should render title correctly', () => {
    const { getByText } = render();
    expect(getByText('github.io')).toBeDefined();
  });

  it('should render subtitle correctly', () => {
    const { getByText } = render();
    expect(getByText('Connect this website with MetaMask')).toBeDefined();
  });

  it('should render account connectionListItem', () => {
    const { getByText } = render();
    const permissionsTab = getByText('Permissions');
    fireEvent.click(permissionsTab);

    expect(
      getByText('See your accounts and suggest transactions'),
    ).toBeDefined();
  });

  it('should render network connectionListItem', () => {
    const { getByText } = render();
    const permissionsTab = getByText('Permissions');
    fireEvent.click(permissionsTab);

    expect(getByText('Use your enabled networks')).toBeDefined();
  });

  it('should render confirm and cancel button', () => {
    const { getByText } = render();
    const confirmButton = getByText('Connect');
    const cancelButton = getByText('Cancel');
    expect(confirmButton).toBeDefined();
    expect(cancelButton).toBeDefined();
  });

  it('should render with defaults from the requested permissions', () => {
    const { container } = render({
      props: {
        request: {
          id: '1',
          origin: mockTestDappUrl,
          permissions: {
            [Caip25EndowmentPermissionName]: {
              caveats: [
                {
                  type: Caip25CaveatType,
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
            },
          },
        },
        permissionsRequestId: '1',
        rejectPermissionsRequest: jest.fn(),
        approveConnection: jest.fn(),
        activeTabOrigin: mockTestDappUrl,
        targetSubjectMetadata: mockTargetSubjectMetadata,
      },
    });
    expect(container).toMatchSnapshot();
  });

  it('should render a disabled confirm if current account is a non-EVM account', () => {
    // NOTE: We select the non-EVM account by default here!
    const mockSelectedAccountId = MOCK_ACCOUNT_BIP122_P2WPKH.id;
    const mockAccounts = [MOCK_ACCOUNT_EOA, MOCK_ACCOUNT_BIP122_P2WPKH];
    const mockAccountsState = overrideAccountsFromMockState(
      mockState,
      mockAccounts,
      mockSelectedAccountId,
    );

    const { getByText } = render({
      state: mockAccountsState.metamask,
    });
    const confirmButton = getByText('Connect');
    const cancelButton = getByText('Cancel');
    // The currently selected account is a Bitcoin account, the "connecting account list" would be
    // empty by default and thus, we cannot confirm without explictly select an EVM account.
    expect(confirmButton).toBeDisabled();
    expect(cancelButton).toBeDefined();
  });
});

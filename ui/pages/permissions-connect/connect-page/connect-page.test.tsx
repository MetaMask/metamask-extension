import React from 'react';
import { fireEvent } from '@testing-library/react';
import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
} from '@metamask/chain-agnostic-permission';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import mockState from '../../../../test/data/mock-state.json';
import configureStore from '../../../store/store';
import { ConnectPage, ConnectPageProps } from './connect-page';

// Mock the CreateSolanaAccountModal component to avoid errors
jest.mock(
  '../../../components/multichain/create-solana-account-modal/create-solana-account-modal',
  () => ({
    CreateSolanaAccountModal: ({ onClose }: { onClose: () => void }) => (
      <div data-testid="create-solana-account-modal">
        <button onClick={onClose}>Close</button>
      </div>
    ),
  }),
);

jest.mock(
  '../../../components/multichain/pages/review-permissions-page/site-cell/site-cell',
  () => ({
    SiteCell: () => <div data-testid="site-cell" />,
  }),
);

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
        permissions: {
          [Caip25EndowmentPermissionName]: {
            caveats: [
              {
                type: Caip25CaveatType,
                value: {
                  requiredScopes: {},
                  optionalScopes: {
                    'eip155:1': {
                      accounts: [],
                    },
                  },
                  sessionProperties: {},
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
    state,
  } = options;

  const store = configureStore({
    ...mockState,
    metamask: {
      ...mockState.metamask,
      ...state,
      permissionHistory: {
        mockTestDappUrl: {
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

  it('should render image icon correctly', () => {
    const { getByAltText } = render();

    const image = getByAltText('metamask.github.io logo');
    expect(image).toHaveAttribute(
      'src',
      'https://metamask.github.io/test-dapp/metamask-fox.svg',
    );
  });

  it('should render fallback icon correctly', () => {
    const { container } = render({
      props: {
        request: {},
        permissionsRequestId: '1',
        rejectPermissionsRequest: jest.fn(),
        approveConnection: jest.fn(),
        activeTabOrigin: mockTestDappUrl,
        targetSubjectMetadata: {
          ...mockTargetSubjectMetadata,
          iconUrl: null,
        },
      },
    });

    const divElement = container.querySelector('div.mm-avatar-base--size-lg');
    expect(divElement).toHaveTextContent('m');
  });

  it('should render fallback icon correctly for IP address as an origin', () => {
    const { container } = render({
      props: {
        request: {},
        permissionsRequestId: '1',
        rejectPermissionsRequest: jest.fn(),
        approveConnection: jest.fn(),
        activeTabOrigin: mockTestDappUrl,
        targetSubjectMetadata: {
          ...mockTargetSubjectMetadata,
          iconUrl: null,
          origin: 'http://127.0.0.1/test-dapp',
        },
      },
    });

    const divElement = container.querySelector('div.mm-avatar-base--size-lg');
    expect(divElement).toHaveTextContent('?');
  });

  it('should render title correctly', () => {
    const { getByText } = render();
    expect(getByText('metamask.github.io')).toBeDefined();
  });

  it('should render subtitle correctly', () => {
    const { getByText } = render();
    expect(getByText('Connect this website with MetaMask')).toBeDefined();
  });

  it('should render accounts tab correctly', () => {
    const { getByText, queryAllByText } = render();

    expect(getByText('Accounts')).toBeDefined();
    expect(getByText('Test Account')).toBeDefined();
    expect(getByText('0x0DCD5...3E7bc')).toBeDefined();

    const valueElements = queryAllByText('966.988');
    expect(valueElements[0]).toBeDefined();
  });

  it('should render empty accounts state correctly', () => {
    const { getByText, getByTestId } = render({
      props: {
        request: {},
        permissionsRequestId: '1',
        rejectPermissionsRequest: jest.fn(),
        approveConnection: jest.fn(),
        activeTabOrigin: mockTestDappUrl,
        targetSubjectMetadata: mockTargetSubjectMetadata,
      },
    });

    expect(getByText('Select an account to connect')).toBeDefined();

    const confirmButton = getByTestId('confirm-btn');
    expect(confirmButton).toBeDisabled();
  });

  it('should render permissions tab content', () => {
    const { getByText, getByTestId } = render();
    const permissionsTab = getByText('Permissions');
    fireEvent.click(permissionsTab);

    expect(getByTestId('site-cell')).toBeDefined();
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
                    sessionProperties: {},
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

    const elementsWithAria = container.querySelectorAll('[aria-describedby]');
    elementsWithAria.forEach((el) =>
      el.setAttribute('aria-describedby', 'static-tooltip-id'),
    );

    expect(container).toMatchSnapshot();
  });

  it('should render Solana account requested message when promptToCreateSolanaAccount is true', () => {
    const { getByText } = render({
      props: {
        request: {
          permissions: {
            [Caip25EndowmentPermissionName]: {
              caveats: [
                {
                  type: Caip25CaveatType,
                  value: {
                    requiredScopes: {},
                    optionalScopes: {
                      'eip155:1': {
                        accounts: [],
                      },
                    },
                    sessionProperties: {},
                    isMultichainOrigin: false,
                  },
                },
              ],
            },
          },
          metadata: {
            id: '1',
            origin: mockTargetSubjectMetadata.origin,
            promptToCreateSolanaAccount: true,
          },
        },
        permissionsRequestId: '1',
        rejectPermissionsRequest: jest.fn(),
        approveConnection: jest.fn(),
        activeTabOrigin: mockTestDappUrl,
        targetSubjectMetadata: mockTargetSubjectMetadata,
      },
    });

    expect(
      getByText('This site is requesting a Solana account.'),
    ).toBeDefined();
    expect(getByText('Create Solana account')).toBeDefined();
  });

  it('should not render Solana account message when promptToCreateSolanaAccount is false', () => {
    const { queryByText } = render({
      props: {
        request: {
          permissions: {
            [Caip25EndowmentPermissionName]: {
              caveats: [
                {
                  type: Caip25CaveatType,
                  value: {
                    requiredScopes: {},
                    optionalScopes: {
                      'eip155:1': {
                        accounts: [],
                      },
                    },
                    sessionProperties: {},
                    isMultichainOrigin: false,
                  },
                },
              ],
            },
          },
          metadata: {
            id: '1',
            origin: mockTargetSubjectMetadata.origin,
            promptToCreateSolanaAccount: false,
          },
        },
        permissionsRequestId: '1',
        rejectPermissionsRequest: jest.fn(),
        approveConnection: jest.fn(),
        activeTabOrigin: mockTestDappUrl,
        targetSubjectMetadata: mockTargetSubjectMetadata,
      },
    });

    expect(
      queryByText('A Solana account is required to connect to this site.'),
    ).toBeNull();
    expect(queryByText('Create Solana account')).toBeNull();
  });

  it('should open CreateSolanaAccountModal when create Solana account button is clicked', () => {
    const { getByText, getByTestId } = render({
      props: {
        request: {
          permissions: {
            [Caip25EndowmentPermissionName]: {
              caveats: [
                {
                  type: Caip25CaveatType,
                  value: {
                    requiredScopes: {},
                    optionalScopes: {
                      'eip155:1': {
                        accounts: [],
                      },
                    },
                    sessionProperties: {},
                    isMultichainOrigin: false,
                  },
                },
              ],
            },
          },
          metadata: {
            id: '1',
            origin: mockTargetSubjectMetadata.origin,
            promptToCreateSolanaAccount: true,
          },
        },
        permissionsRequestId: '1',
        rejectPermissionsRequest: jest.fn(),
        approveConnection: jest.fn(),
        activeTabOrigin: mockTestDappUrl,
        targetSubjectMetadata: mockTargetSubjectMetadata,
      },
    });

    const createSolanaAccountButton = getByText('Create Solana account');
    fireEvent.click(createSolanaAccountButton);

    expect(getByTestId('create-solana-account-modal')).toBeDefined();
  });

  it('should not show select account message when promptToCreateSolanaAccount is true', () => {
    const { queryByText } = render({
      props: {
        request: {
          permissions: {
            [Caip25EndowmentPermissionName]: {
              caveats: [
                {
                  type: Caip25CaveatType,
                  value: {
                    requiredScopes: {},
                    optionalScopes: {
                      'eip155:1': {
                        accounts: [],
                      },
                    },
                    sessionProperties: {},
                    isMultichainOrigin: false,
                  },
                },
              ],
            },
          },
          metadata: {
            id: '1',
            origin: mockTargetSubjectMetadata.origin,
            promptToCreateSolanaAccount: true,
          },
        },
        permissionsRequestId: '1',
        rejectPermissionsRequest: jest.fn(),
        approveConnection: jest.fn(),
        activeTabOrigin: mockTestDappUrl,
        targetSubjectMetadata: mockTargetSubjectMetadata,
      },
    });

    expect(queryByText('Select an account to connect')).toBeNull();
  });
});

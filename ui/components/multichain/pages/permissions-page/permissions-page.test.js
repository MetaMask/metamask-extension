import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { mockNetworkState } from '../../../../../test/stub/networks';
import { CHAIN_IDS } from '../../../../../shared/constants/network';
import { isGatorPermissionsRevocationFeatureEnabled } from '../../../../../shared/lib/environment';
import * as actions from '../../../../store/actions';
import PermissionsPage from './permissions-page';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => {
  return {
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
  };
});

mockState.metamask.subjectMetadata = {
  'https://metamask.github.io': {
    iconUrl: 'https://metamask.github.io/test-dapp/metamask-fox.svg',
    name: 'E2E Test Dapp',
    subjectType: 'website',
    origin: 'https://metamask.github.io',
    extensionId: null,
  },
  'npm:@metamask/testSnap1': {
    name: 'Test Snap 1',
    version: '1.2.3',
    subjectType: 'snap',
  },
  'npm:@metamask/testSnap2': {
    name: 'Test Snap 2',
    version: '1.2.3',
    subjectType: 'snap',
  },
  'npm:@metamask/testSnap3': {
    name: 'Test Snap 3',
    version: '1.2.3',
    subjectType: 'snap',
  },
};

mockState.metamask.subjects = {
  'https://metamask.github.io': {
    origin: 'https://metamask.github.io',
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
        date: 1698071087770,
        id: 'BIko27gpEajmo_CcNYPxD',
        invoker: 'https://metamask.github.io',
        parentCapability: 'endowment:caip25',
      },
    },
  },
};

mockState.metamask.snaps = {
  'npm:@metamask/testSnap1': {
    id: 'npm:@metamask/testSnap1',
    origin: 'npm:@metamask/testSnap1',
    version: '5.1.2',
    iconUrl: null,
    initialPermissions: {
      'endowment:ethereum-provider': {},
    },
  },
  'npm:@metamask/testSnap2': {
    id: 'npm:@metamask/testSnap2',
    origin: 'npm:@metamask/testSnap2',
    version: '5.1.2',
    iconUrl: null,
    initialPermissions: {
      'endowment:ethereum-provider': {},
    },
  },
  'npm:@metamask/testSnap3': {
    id: 'npm:@metamask/testSnap3',
    origin: 'npm:@metamask/testSnap3',
    version: '5.1.2',
    iconUrl: null,
    initialPermissions: {
      'endowment:ethereum-provider': {},
    },
  },
};

mockState.metamask.domains = {
  'https://metamask.github.io': 'mainnet',
  'npm:@metamask/testSnap1': 'mainnet',
  'npm:@metamask/testSnap2': 'mainnet',
  'npm:@metamask/testSnap3': 'mainnet',
};

let store = configureStore({
  ...mockState,
  metamask: {
    ...mockState.metamask,
    ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET, id: 'mainnet' }),
  },
});

jest.mock('../../../../../shared/lib/environment');

describe('All Connections', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest
      .mocked(isGatorPermissionsRevocationFeatureEnabled)
      .mockReturnValue(false);
  });

  describe('render', () => {
    it('renders correctly', () => {
      const { getByTestId } = renderWithProvider(<PermissionsPage />, store);

      expect(
        getByTestId('parent-selector-permission-list'),
      ).toBeInTheDocument();
    });

    it('renders no connections message when user has no connections', () => {
      mockState.metamask.snaps = {};
      mockState.metamask.subjectMetadata = {};
      mockState.metamask.subjects = {};
      store = configureStore(mockState);
      const { getByTestId } = renderWithProvider(<PermissionsPage />, store);
      expect(getByTestId('no-connections')).toBeInTheDocument();
    });

    it('renders permissions title when Gator Permissions feature is disabled', () => {
      const { getByTestId } = renderWithProvider(<PermissionsPage />, store);
      expect(getByTestId('permissions-page-title')).toHaveTextContent(
        'Permissions',
      );
    });

    it('renders permissions title when Gator Permissions feature is enabled', () => {
      jest
        .mocked(isGatorPermissionsRevocationFeatureEnabled)
        .mockReturnValue(true);
      const { getByTestId } = renderWithProvider(<PermissionsPage />, store);
      expect(getByTestId('permissions-page-title')).toHaveTextContent(
        'Permissions',
      );
    });
  });

  describe('Disconnect All functionality', () => {
    let storeWithConnections;

    beforeEach(() => {
      const stateWithConnections = {
        ...mockState,
        metamask: {
          ...mockState.metamask,
          ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET, id: 'mainnet' }),
          subjectMetadata: {
            'https://metamask.github.io': {
              iconUrl: 'https://metamask.github.io/test-dapp/metamask-fox.svg',
              name: 'E2E Test Dapp',
              subjectType: 'website',
              origin: 'https://metamask.github.io',
              extensionId: null,
            },
          },
          subjects: {
            'https://metamask.github.io': {
              origin: 'https://metamask.github.io',
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
                  date: 1698071087770,
                  id: 'BIko27gpEajmo_CcNYPxD',
                  invoker: 'https://metamask.github.io',
                  parentCapability: 'endowment:caip25',
                },
              },
            },
          },
        },
      };
      storeWithConnections = configureStore(stateWithConnections);
    });

    it('renders Disconnect All button when there are connections', () => {
      const { getByTestId } = renderWithProvider(
        <PermissionsPage />,
        storeWithConnections,
      );
      expect(getByTestId('disconnect-all-button')).toBeInTheDocument();
    });

    it('does not render Disconnect All button when there are no connections', () => {
      const stateWithNoConnections = {
        ...mockState,
        metamask: {
          ...mockState.metamask,
          ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET, id: 'mainnet' }),
          subjectMetadata: {},
          subjects: {},
          snaps: {},
        },
      };
      const emptyStore = configureStore(stateWithNoConnections);
      const { queryByTestId } = renderWithProvider(
        <PermissionsPage />,
        emptyStore,
      );
      expect(queryByTestId('disconnect-all-button')).not.toBeInTheDocument();
    });

    it('opens Disconnect All Sites modal when button is clicked', () => {
      const { getByTestId } = renderWithProvider(
        <PermissionsPage />,
        storeWithConnections,
      );

      fireEvent.click(getByTestId('disconnect-all-button'));

      expect(getByTestId('disconnect-all-sites-modal')).toBeInTheDocument();
    });

    it('closes modal when close button is clicked', async () => {
      const { getByTestId, queryByTestId, getByRole } = renderWithProvider(
        <PermissionsPage />,
        storeWithConnections,
      );

      fireEvent.click(getByTestId('disconnect-all-button'));
      expect(getByTestId('disconnect-all-sites-modal')).toBeInTheDocument();

      // Click the close button in the modal header
      const closeButton = getByRole('button', { name: /close/iu });
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(
          queryByTestId('disconnect-all-sites-modal'),
        ).not.toBeInTheDocument();
      });
    });

    it('calls removePermissionsFor when confirm is clicked', () => {
      // Mock removePermissionsFor to return a no-op thunk to avoid
      // calling the background method (which isn't initialized in tests)
      const removePermissionsForMock = jest
        .spyOn(actions, 'removePermissionsFor')
        .mockImplementation(() => () => undefined);

      const { getByTestId } = renderWithProvider(
        <PermissionsPage />,
        storeWithConnections,
      );

      fireEvent.click(getByTestId('disconnect-all-button'));
      fireEvent.click(getByTestId('disconnect-all-sites-confirm'));

      expect(removePermissionsForMock).toHaveBeenCalledWith({
        'https://metamask.github.io': ['endowment:caip25'],
      });

      removePermissionsForMock.mockRestore();
    });
  });

  describe('connection click', () => {
    const accountConnectionStore = configureStore({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET, id: 'mainnet' }),
        subjectMetadata: {
          'https://metamask.github.io': {
            iconUrl: 'https://metamask.github.io/test-dapp/metamask-fox.svg',
            name: 'E2E Test Dapp',
            subjectType: 'website',
            origin: 'https://metamask.github.io',
            extensionId: null,
          },
        },
        subjects: {
          'https://metamask.github.io': {
            origin: 'https://metamask.github.io',
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
                date: 1698071087770,
                id: 'BIko27gpEajmo_CcNYPxD',
                invoker: 'https://metamask.github.io',
                parentCapability: 'endowment:caip25',
              },
            },
          },
        },
        snaps: {},
      },
    });

    it('navigates to review permissions for account connections', () => {
      const { getByTestId } = renderWithProvider(
        <PermissionsPage />,
        accountConnectionStore,
      );

      fireEvent.click(getByTestId('connection-list-item'));

      expect(mockNavigate).toHaveBeenCalledWith({
        pathname: '/review-permissions',
        search: 'origin=https%3A%2F%2Fmetamask.github.io',
      });
    });

    it('navigates to token transfer for connections with only advanced permissions', () => {
      jest
        .mocked(isGatorPermissionsRevocationFeatureEnabled)
        .mockReturnValue(true);

      const gatorOnlyOrigin = 'https://gator-only.com';
      const gatorOnlyStore = configureStore({
        ...mockState,
        metamask: {
          ...mockState.metamask,
          ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET, id: 'mainnet' }),
          subjectMetadata: {},
          subjects: {},
          snaps: {},
          grantedPermissions: [
            {
              permissionResponse: {
                chainId: '0x1',
                from: '0xB68c70159E9892DdF5659ec42ff9BD2bbC23e778',
                permission: {
                  type: 'native-token-periodic',
                  isAdjustmentAllowed: false,
                  data: {
                    periodAmount: '0x22b1c8c1227a0000',
                    periodDuration: 1747699200,
                    startTime: 1747699200,
                    justification: 'Test justification',
                  },
                },
                context: '0x00000000',
                delegationManager: '0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3',
              },
              siteOrigin: gatorOnlyOrigin,
              status: 'Active',
            },
          ],
        },
      });

      const { getByTestId } = renderWithProvider(
        <PermissionsPage />,
        gatorOnlyStore,
      );

      fireEvent.click(getByTestId('connection-list-item'));

      expect(mockNavigate).toHaveBeenCalledWith(
        `/gator-permissions/token-transfer/${encodeURIComponent(gatorOnlyOrigin)}`,
      );
    });
  });
});

import React from 'react';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import { PermissionsPage } from './permissions-page';

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
      eth_accounts: {
        caveats: [
          {
            type: 'restrictReturnedAccounts',
            value: ['0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc'],
          },
        ],
        date: 1698071087770,
        id: 'BIko27gpEajmo_CcNYPxD',
        invoker: 'https://metamask.github.io',
        parentCapability: 'eth_accounts',
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

let store = configureStore(mockState);

describe('All Connections', () => {
  describe('render', () => {
    it('renders correctly', () => {
      const { container, getByTestId } = renderWithProvider(
        <PermissionsPage />,
        store,
      );
      expect(container).toMatchSnapshot();

      expect(getByTestId('permissions-page')).toBeInTheDocument();
    });

    it('renders sections when user has 5 or less connections', () => {
      const { getByTestId } = renderWithProvider(<PermissionsPage />, store);
      expect(getByTestId('sites-connections')).toBeInTheDocument();
      expect(getByTestId('snaps-connections')).toBeInTheDocument();
    });

    it('renders tabs when user has more than 5 connections', () => {
      mockState.metamask.snaps = {
        ...mockState.metamask.snaps,
        'npm:@metamask/testSnap4': {
          id: 'npm:@metamask/testSnap4',
          origin: 'npm:@metamask/testSnap4',
          version: '5.1.2',
          iconUrl: null,
          initialPermissions: {
            'endowment:ethereum-provider': {},
          },
        },
        'npm:@metamask/testSnap5': {
          id: 'npm:@metamask/testSnap5',
          origin: 'npm:@metamask/testSnap5',
          version: '5.1.2',
          iconUrl: null,
          initialPermissions: {
            'endowment:ethereum-provider': {},
          },
        },
      };
      mockState.metamask.subjectMetadata = {
        ...mockState.metamask.subjectMetadata,
        'npm:@metamask/testSnap4': {
          name: 'Test Snap 4',
          version: '1.2.3',
          subjectType: 'snap',
        },
        'npm:@metamask/testSnap5': {
          name: 'Test Snap 5',
          version: '1.2.3',
          subjectType: 'snap',
        },
      };
      store = configureStore(mockState);
      const { getByTestId } = renderWithProvider(<PermissionsPage />, store);
      expect(getByTestId('permissions-page-sites-tab')).toBeInTheDocument();
      expect(getByTestId('permissions-page-snaps-tab')).toBeInTheDocument();
    });
    it('renders no connections message when user has no connections', () => {
      mockState.metamask.snaps = {};
      mockState.metamask.subjectMetadata = {};
      mockState.metamask.subjects = {};
      store = configureStore(mockState);
      const { getByTestId } = renderWithProvider(<PermissionsPage />, store);
      expect(getByTestId('no-connections')).toBeInTheDocument();
    });
  });
});

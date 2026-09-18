import React from 'react';
import { Hex } from '@metamask/utils';
import type { PermissionInfoWithMetadata } from '@metamask/gator-permissions-controller';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../../test/lib/i18n-helpers';
import { GatorPermissionsPage } from './gator-permissions-page';

const MOCK_CHAIN_ID = '0x1' as Hex;

const MOCK_GATOR_PERMISSION: PermissionInfoWithMetadata = {
  permissionResponse: {
    chainId: MOCK_CHAIN_ID,
    from: '0xB68c70159E9892DdF5659ec42ff9BD2bbC23e778',
    permission: {
      type: 'native-token-periodic',
      isAdjustmentAllowed: false,
      data: {
        periodAmount: '0x22b1c8c1227a0000',
        periodDuration: 1747699200,
        startTime: 1747699200,
        justification:
          'This is a very important request for streaming allowance for some very important thing',
      },
    },
    context: '0x00000000',
    delegationManager: '0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3',
  },
  siteOrigin: 'http://localhost:8000',
  status: 'Active',
};

const MOCK_SITE_PERMISSION = {
  'https://example.com': {
    permissions: {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      eth_accounts: {
        caveats: [{ type: 'restrictReturnedAccounts', value: ['0x123'] }],
      },
    },
  },
};

const mockUseGatorPermissions = jest.fn(() => ({ loading: false }));
jest.mock('../../../../hooks/gator-permissions/useGatorPermissions', () => ({
  useGatorPermissions: () => mockUseGatorPermissions(),
}));

const createStore = ({
  grantedPermissions = [] as PermissionInfoWithMetadata[],
  subjects = {} as Record<string, unknown>,
} = {}) => {
  return configureStore({
    ...mockState,
    metamask: {
      ...mockState.metamask,
      grantedPermissions,
      subjects: {
        ...mockState.metamask.subjects,
        ...subjects,
      },
    },
  });
};

describe('Gator Permissions Page', () => {
  beforeEach(() => {
    mockUseGatorPermissions.mockReturnValue({ loading: false });
  });

  describe('render', () => {
    it('renders loading spinner while loading', () => {
      mockUseGatorPermissions.mockReturnValue({ loading: true });
      const store = createStore();
      const { getByTestId, queryByTestId } = renderWithProvider(
        <GatorPermissionsPage />,
        store,
      );

      expect(getByTestId('gator-permissions-loading')).toBeInTheDocument();
      expect(queryByTestId('permission-list')).not.toBeInTheDocument();
      expect(queryByTestId('no-connections')).not.toBeInTheDocument();
    });

    it('renders page container', () => {
      const store = createStore({
        grantedPermissions: [MOCK_GATOR_PERMISSION],
      });
      const { getByTestId } = renderWithProvider(
        <GatorPermissionsPage />,
        store,
      );

      expect(
        getByTestId('parent-selector-gator-permissions'),
      ).toBeInTheDocument();
    });

    it('renders empty state when no permissions exist', () => {
      const store = createStore({ subjects: {} });
      const { getByTestId } = renderWithProvider(
        <GatorPermissionsPage />,
        store,
      );

      expect(getByTestId('no-connections')).toBeInTheDocument();
    });

    it('renders token transfer section when gator permissions exist', () => {
      const store = createStore({
        grantedPermissions: [MOCK_GATOR_PERMISSION],
        subjects: {},
      });
      const { getByTestId, getByText } = renderWithProvider(
        <GatorPermissionsPage />,
        store,
      );

      expect(getByTestId('permission-list')).toBeInTheDocument();
      expect(getByText(messages.assets.message)).toBeInTheDocument();
      expect(getByText(messages.tokenTransfer.message)).toBeInTheDocument();
    });

    it('renders connections section when site permissions exist', () => {
      const store = createStore({
        grantedPermissions: [MOCK_GATOR_PERMISSION],
        subjects: MOCK_SITE_PERMISSION,
      });
      const { getByText } = renderWithProvider(<GatorPermissionsPage />, store);

      expect(getByText(messages.dapps.message)).toBeInTheDocument();
      expect(getByText(messages.connections.message)).toBeInTheDocument();
    });
  });
});

import React from 'react';
import thunk from 'redux-thunk';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import { HomeNetworkFilterModal } from './home-network-filter-modal';

type MockNetwork = {
  chainId: string;
  name: string;
  isEvm: boolean;
};

const ETHEREUM: MockNetwork = {
  chainId: 'eip155:1',
  name: 'Ethereum',
  isEvm: true,
};
const CUSTOM_NETWORK: MockNetwork = {
  chainId: 'eip155:1337',
  name: 'Custom network 1',
  isEvm: true,
};
const SEPOLIA: MockNetwork = {
  chainId: 'eip155:11155111',
  name: 'Sepolia',
  isEvm: true,
};

const toMap = (networks: MockNetwork[]) =>
  Object.fromEntries(networks.map((network) => [network.chainId, network]));

// Hook-level state the component derives its sections from.
let mockDefaultNetworks: MockNetwork[] = [ETHEREUM];
let mockCustomNetworks: MockNetwork[] = [];
let mockTestNetworks: MockNetwork[] = [];
let mockShowTestNetworks = false;

jest.mock(
  '../../../../multichain/network-manager/hooks/useNetworkManagerState',
  () => ({
    useNetworkManagerState: ({
      showDefaultNetworks = false,
    }: { showDefaultNetworks?: boolean } = {}) =>
      showDefaultNetworks
        ? {
            nonTestNetworks: toMap(mockDefaultNetworks),
            isNetworkInDefaultNetworkTab: () => true,
          }
        : {
            nonTestNetworks: toMap(mockCustomNetworks),
            testNetworks: toMap(mockTestNetworks),
          },
  }),
);

jest.mock(
  '../../../../multichain/network-manager/hooks/useNetworkChangeHandlers',
  () => ({
    useNetworkChangeHandlers: () => ({
      handleNetworkChange: jest.fn().mockResolvedValue(undefined),
    }),
  }),
);

jest.mock('../../../../../selectors/multichain/networks', () => ({
  ...jest.requireActual('../../../../../selectors/multichain/networks'),
  getAllEnabledNetworksForAllNamespaces: () => [],
  getMultichainNetworkConfigurationsByChainId: () => [{}, {}],
}));

jest.mock('../../../../../selectors', () => ({
  ...jest.requireActual('../../../../../selectors'),
  getOrderedNetworksList: () => [],
  getShowTestNetworks: () => mockShowTestNetworks,
  getUseExternalServices: () => true,
}));

jest.mock(
  '../../../../../selectors/multichain-accounts/account-tree',
  () => ({
    ...jest.requireActual(
      '../../../../../selectors/multichain-accounts/account-tree',
    ),
    getInternalAccountBySelectedAccountGroupAndCaip: () => ({ id: 'mock-evm' }),
  }),
);

jest.mock('../../../../../selectors/network-blacklist/network-blacklist', () => ({
  ...jest.requireActual(
    '../../../../../selectors/network-blacklist/network-blacklist',
  ),
  selectAdditionalNetworksBlacklistFeatureFlag: () => [],
}));

jest.mock('../../../../../../shared/lib/network.utils', () => ({
  ...jest.requireActual('../../../../../../shared/lib/network.utils'),
  sortNetworks: (map: Record<string, MockNetwork>) => Object.values(map),
  getNetworkIcon: () => '',
  getFilteredFeaturedNetworks: () => [],
}));

// NetworkListItem pulls in network-gas selectors we don't care about here;
// render a lightweight stand-in that just exposes the network name.
jest.mock('../../../../multichain/network-list-item', () => ({
  NetworkListItem: ({ name }: { name: string }) => (
    <div data-testid="mock-network-list-item">{name}</div>
  ),
}));

const renderModal = () => {
  const store = configureMockStore([thunk])({
    metamask: { currentLocale: 'en' },
  });
  return renderWithProvider(
    <HomeNetworkFilterModal isOpen onClose={jest.fn()} />,
    store,
  );
};

describe('HomeNetworkFilterModal', () => {
  beforeEach(() => {
    mockDefaultNetworks = [ETHEREUM];
    mockCustomNetworks = [];
    mockTestNetworks = [];
    mockShowTestNetworks = false;
  });

  describe('when only default networks are present', () => {
    it('labels the top row "All networks" and hides the "Default networks" header', () => {
      const { getByText, queryByText } = renderModal();

      expect(getByText('All networks')).toBeInTheDocument();
      expect(queryByText('All default networks')).not.toBeInTheDocument();
      expect(queryByText('Default networks')).not.toBeInTheDocument();
      // The default networks themselves still render.
      expect(getByText('Ethereum')).toBeInTheDocument();
    });
  });

  describe('when custom networks are present', () => {
    it('labels the top row "All default networks" and shows the section headers', () => {
      mockCustomNetworks = [CUSTOM_NETWORK];

      const { getByText, queryByText } = renderModal();

      expect(getByText('All default networks')).toBeInTheDocument();
      expect(queryByText('All networks')).not.toBeInTheDocument();
      expect(getByText('Default networks')).toBeInTheDocument();
      expect(getByText('Custom networks')).toBeInTheDocument();
    });
  });

  describe('when test networks are present and enabled', () => {
    it('labels the top row "All default networks" and shows the "Default networks" header', () => {
      mockTestNetworks = [SEPOLIA];
      mockShowTestNetworks = true;

      const { getByText, queryByText } = renderModal();

      expect(getByText('All default networks')).toBeInTheDocument();
      expect(queryByText('All networks')).not.toBeInTheDocument();
      expect(getByText('Default networks')).toBeInTheDocument();
      expect(getByText('Testnets')).toBeInTheDocument();
    });
  });
});

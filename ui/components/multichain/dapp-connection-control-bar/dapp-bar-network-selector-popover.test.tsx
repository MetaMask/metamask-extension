import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import configureStore from '../../../store/store';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { DappBarEVMNetworkSelectorPopover } from './dapp-bar-network-selector-popover';

const MAINNET_CLIENT_ID = 'mainnet-client';
const BNB_CLIENT_ID = 'bnb-client';
const SEPOLIA_CLIENT_ID = 'sepolia-client';
const DAPP_ORIGIN = 'https://dapp.example.com';

const mockSetActiveNetwork = jest.fn((_) => ({ type: 'SET_ACTIVE_NETWORK' }));
const mockSetNetworkClientIdForDomain = jest.fn(
  (_origin: string, _clientId: string) => Promise.resolve(),
);
const mockAddPermittedChain = jest.fn(
  (_origin: string, _chainId: string) => () => Promise.resolve(),
);
const mockShowPermittedNetworkToast = jest.fn(() => ({
  type: 'SHOW_PERMITTED_NETWORK_TOAST',
}));
const mockUpdateCustomNonce = jest.fn(() => ({ type: 'UPDATE_CUSTOM_NONCE' }));
const mockSetNextNonce = jest.fn(() => ({ type: 'SET_NEXT_NONCE' }));
const mockDetectNfts = jest.fn((_) => () => Promise.resolve());
const mockSetTokenNetworkFilter = jest.fn((_) => ({
  type: 'SET_TOKEN_NETWORK_FILTER',
}));

jest.mock('../../../store/actions', () => ({
  ...jest.requireActual('../../../store/actions'),
  setActiveNetwork: (id: string) => mockSetActiveNetwork(id),
  setNetworkClientIdForDomain: (origin: string, id: string) =>
    mockSetNetworkClientIdForDomain(origin, id),
  addPermittedChain: (origin: string, chainId: string) =>
    mockAddPermittedChain(origin, chainId),
  showPermittedNetworkToast: () => mockShowPermittedNetworkToast(),
  updateCustomNonce: () => mockUpdateCustomNonce(),
  setNextNonce: () => mockSetNextNonce(),
  detectNfts: (chainIds: string[]) => mockDetectNfts(chainIds),
  setTokenNetworkFilter: (filter: Record<string, boolean>) =>
    mockSetTokenNetworkFilter(filter),
}));

const mockGetAllDomains = jest.fn();
const mockGetMultichainNetworkConfigurationsByChainId = jest.fn();
const mockGetOrderedNetworksList = jest.fn();
const mockGetOriginOfCurrentTab = jest.fn();
const mockGetPermittedEVMChainsForSelectedTab = jest.fn();
const mockGetPreferences = jest.fn();
const mockGetShowTestNetworks = jest.fn();
const mockGetAllChainsToPoll = jest.fn();

jest.mock('../../../selectors', () => ({
  ...jest.requireActual('../../../selectors'),
  getAllDomains: (state: unknown) => mockGetAllDomains(state),
  getMultichainNetworkConfigurationsByChainId: (state: unknown) =>
    mockGetMultichainNetworkConfigurationsByChainId(state),
  getOrderedNetworksList: (state: unknown) => mockGetOrderedNetworksList(state),
  getOriginOfCurrentTab: (state: unknown) => mockGetOriginOfCurrentTab(state),
  getPermittedEVMChainsForSelectedTab: (state: unknown, activeTab: unknown) =>
    mockGetPermittedEVMChainsForSelectedTab(state, activeTab),
  getShowTestNetworks: (state: unknown) => mockGetShowTestNetworks(state),
  getAllChainsToPoll: (state: unknown) => mockGetAllChainsToPoll(state),
}));

jest.mock('../../../../shared/lib/selectors/preferences', () => ({
  ...jest.requireActual('../../../../shared/lib/selectors/preferences'),
  getPreferences: (state: unknown) => mockGetPreferences(state),
}));

const mockGetDappActiveNetwork = jest.fn();

jest.mock('../../../selectors/dapp', () => ({
  ...jest.requireActual('../../../selectors/dapp'),
  getDappActiveNetwork: (state: unknown) => mockGetDappActiveNetwork(state),
}));

const makeEvmNetworks = () => ({
  '0x1': {
    chainId: '0x1',
    name: 'Ethereum',
    nativeCurrency: 'ETH',
    defaultRpcEndpointIndex: 0,
    rpcEndpoints: [
      {
        type: 'custom',
        url: 'https://mainnet.example',
        networkClientId: MAINNET_CLIENT_ID,
      },
    ],
    blockExplorerUrls: [],
  },
  '0x38': {
    chainId: '0x38',
    name: 'BNB Chain',
    nativeCurrency: 'BNB',
    defaultRpcEndpointIndex: 0,
    rpcEndpoints: [
      {
        type: 'custom',
        url: 'https://bnb.example',
        networkClientId: BNB_CLIENT_ID,
      },
    ],
    blockExplorerUrls: [],
  },
  '0xaa36a7': {
    chainId: '0xaa36a7',
    name: 'Sepolia',
    nativeCurrency: 'ETH',
    defaultRpcEndpointIndex: 0,
    rpcEndpoints: [
      {
        type: 'custom',
        url: 'https://sepolia.example',
        networkClientId: SEPOLIA_CLIENT_ID,
      },
    ],
    blockExplorerUrls: [],
  },
});

const makeMultichainNetworks = () => ({
  'eip155:1': {
    chainId: 'eip155:1',
    name: 'Ethereum',
    nativeCurrency: 'ETH',
    isEvm: true,
  },
  'eip155:56': {
    chainId: 'eip155:56',
    name: 'BNB Chain',
    nativeCurrency: 'BNB',
    isEvm: true,
  },
  'eip155:11155111': {
    chainId: 'eip155:11155111',
    name: 'Sepolia',
    nativeCurrency: 'ETH',
    isEvm: true,
  },
});

type SetupOptions = {
  permittedChainIds?: string[];
  showTestnets?: boolean;
  tokenNetworkFilter?: Record<string, boolean>;
  dappActiveChainId?: string | null;
  dappActiveIsEvm?: boolean;
  domains?: Record<string, string>;
  origin?: string | null;
};

const setupSelectors = ({
  permittedChainIds = ['0x1'],
  showTestnets = false,
  tokenNetworkFilter = { '0x1': true },
  dappActiveChainId = '0x1',
  dappActiveIsEvm = true,
  domains = { [DAPP_ORIGIN]: MAINNET_CLIENT_ID },
  origin = DAPP_ORIGIN,
}: SetupOptions = {}) => {
  mockGetAllDomains.mockReturnValue(domains);
  mockGetMultichainNetworkConfigurationsByChainId.mockReturnValue([
    makeMultichainNetworks(),
    makeEvmNetworks(),
  ]);
  mockGetOrderedNetworksList.mockReturnValue(['0x1', '0x38']);
  mockGetOriginOfCurrentTab.mockReturnValue(origin);
  mockGetPermittedEVMChainsForSelectedTab.mockReturnValue(permittedChainIds);
  mockGetPreferences.mockReturnValue({ tokenNetworkFilter });
  mockGetShowTestNetworks.mockReturnValue(showTestnets);
  mockGetAllChainsToPoll.mockReturnValue(['0x1', '0x38', '0xaa36a7']);
  mockGetDappActiveNetwork.mockReturnValue(
    dappActiveChainId
      ? {
          chainId: dappActiveChainId,
          name: 'Active',
          nativeCurrency: 'ETH',
          isEvm: dappActiveIsEvm,
        }
      : null,
  );
};

const renderPopover = ({
  isOpen = true,
  onClose = jest.fn(),
  trackEvent = jest.fn(),
}: {
  isOpen?: boolean;
  onClose?: jest.Mock;
  trackEvent?: jest.Mock;
} = {}) => {
  const anchor = document.createElement('button');
  document.body.appendChild(anchor);

  const store = configureStore({ metamask: {}, activeTab: {} });

  const utils = renderWithProvider(
    <MetaMetricsContext.Provider
      value={{
        trackEvent,
        bufferedTrace: jest.fn(),
        bufferedEndTrace: jest.fn(),
        onboardingParentContext: { current: null },
      }}
    >
      <DappBarEVMNetworkSelectorPopover
        referenceElement={anchor}
        isOpen={isOpen}
        onClose={onClose}
      />
    </MetaMetricsContext.Provider>,
    store,
  );

  return { ...utils, onClose, trackEvent, anchor };
};

describe('DappBarNetworkSelectorPopover', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupSelectors();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders the list of enabled EVM networks', () => {
    const { getByTestId } = renderPopover();
    expect(
      getByTestId('dapp-bar-network-selector-popover__list'),
    ).toBeInTheDocument();
    expect(getByTestId('Ethereum')).toBeInTheDocument();
    expect(getByTestId('BNB Chain')).toBeInTheDocument();
  });

  it('hides test networks by default', () => {
    const { queryByTestId } = renderPopover();
    expect(queryByTestId('Sepolia')).not.toBeInTheDocument();
  });

  it('shows test networks when showTestNetworks is true', () => {
    setupSelectors({ showTestnets: true });
    const { getByTestId } = renderPopover();
    expect(getByTestId('Sepolia')).toBeInTheDocument();
  });

  it('shows test networks when the dapp is already on a testnet', () => {
    setupSelectors({ dappActiveChainId: '0xaa36a7' });
    const { getByTestId } = renderPopover();
    expect(getByTestId('Sepolia')).toBeInTheDocument();
  });

  it('marks the currently active dapp network with a selected-state icon', () => {
    const { getByTestId } = renderPopover();
    expect(
      getByTestId('dapp-bar-network-selector-popover__selected-eip155:1'),
    ).toBeInTheDocument();
  });

  it('closes the popover without dispatching anything when the active network is re-selected', () => {
    const { getByTestId, onClose } = renderPopover();
    fireEvent.click(getByTestId('Ethereum'));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(mockSetActiveNetwork).not.toHaveBeenCalled();
    expect(mockSetNetworkClientIdForDomain).not.toHaveBeenCalled();
    expect(mockAddPermittedChain).not.toHaveBeenCalled();
  });

  describe('when switching to a different, already-permitted network', () => {
    let onClose: jest.Mock;
    let trackEvent: jest.Mock;

    beforeEach(async () => {
      setupSelectors({ permittedChainIds: ['0x1', '0x38'] });
      const rendered = renderPopover();
      onClose = rendered.onClose;
      trackEvent = rendered.trackEvent;

      fireEvent.click(rendered.getByTestId('BNB Chain'));

      await waitFor(() => {
        expect(mockSetActiveNetwork).toHaveBeenCalled();
      });
    });

    it('persists the per-origin network client', () => {
      expect(mockSetNetworkClientIdForDomain).toHaveBeenCalledWith(
        DAPP_ORIGIN,
        BNB_CLIENT_ID,
      );
    });

    it('does not request a new chain permission', () => {
      expect(mockAddPermittedChain).not.toHaveBeenCalled();
    });

    it('does not surface the permitted-network toast', () => {
      expect(mockShowPermittedNetworkToast).not.toHaveBeenCalled();
    });

    it('activates the selected network client', () => {
      expect(mockSetActiveNetwork).toHaveBeenCalledWith(BNB_CLIENT_ID);
    });

    it('resets the custom nonce', () => {
      expect(mockUpdateCustomNonce).toHaveBeenCalled();
    });

    it('refreshes the next nonce', () => {
      expect(mockSetNextNonce).toHaveBeenCalled();
    });

    it('detects NFTs across all polled chains', () => {
      expect(mockDetectNfts).toHaveBeenCalledWith(['0x1', '0x38', '0xaa36a7']);
    });

    it('updates the token-network filter to the new chain', () => {
      expect(mockSetTokenNetworkFilter).toHaveBeenCalledWith({ '0x38': true });
    });

    it('tracks a network-switched MetaMetrics event', () => {
      expect(trackEvent).toHaveBeenCalledWith({
        event: MetaMetricsEventName.NavNetworkSwitched,
        category: MetaMetricsEventCategory.Network,
        properties: {
          location: 'Dapp Connection Control Bar',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          chain_id: '0x38',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          from_network: '0x1',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          to_network: '0x38',
        },
      });
    });

    it('closes the popover', () => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('when switching to a different, unpermitted network', () => {
    beforeEach(async () => {
      setupSelectors({ permittedChainIds: ['0x1'] });
      const { getByTestId } = renderPopover();

      fireEvent.click(getByTestId('BNB Chain'));

      await waitFor(() => {
        expect(mockSetActiveNetwork).toHaveBeenCalled();
      });
    });

    it('grants the chain permission to the dapp origin', () => {
      expect(mockAddPermittedChain).toHaveBeenCalledWith(
        DAPP_ORIGIN,
        'eip155:56',
      );
    });

    it('surfaces the permitted-network toast', () => {
      expect(mockShowPermittedNetworkToast).toHaveBeenCalledTimes(1);
    });

    it('persists the per-origin network client', () => {
      expect(mockSetNetworkClientIdForDomain).toHaveBeenCalledWith(
        DAPP_ORIGIN,
        BNB_CLIENT_ID,
      );
    });

    it('activates the selected network client', () => {
      expect(mockSetActiveNetwork).toHaveBeenCalledWith(BNB_CLIENT_ID);
    });
  });

  it('sets a full token-network filter when multiple networks were previously filtered', async () => {
    setupSelectors({
      permittedChainIds: ['0x1', '0x38'],
      tokenNetworkFilter: { '0x1': true, '0x38': true },
    });
    const { getByTestId } = renderPopover();

    fireEvent.click(getByTestId('BNB Chain'));

    await waitFor(() => {
      expect(mockSetTokenNetworkFilter).toHaveBeenCalledWith({
        '0x1': true,
        '0x38': true,
        '0xaa36a7': true,
      });
    });
  });

  it('skips per-origin network-client persistence when the origin is not tracked in domains', async () => {
    setupSelectors({
      permittedChainIds: ['0x1', '0x38'],
      domains: {},
    });
    const { getByTestId, onClose } = renderPopover();

    fireEvent.click(getByTestId('BNB Chain'));

    await waitFor(() => {
      expect(mockSetActiveNetwork).toHaveBeenCalledWith(BNB_CLIENT_ID);
    });
    expect(mockSetNetworkClientIdForDomain).not.toHaveBeenCalled();
    expect(mockAddPermittedChain).not.toHaveBeenCalled();
    expect(mockShowPermittedNetworkToast).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('skips per-origin network-client persistence when there is no active tab origin', async () => {
    setupSelectors({
      permittedChainIds: ['0x1', '0x38'],
      origin: null,
    });
    const { getByTestId } = renderPopover();

    fireEvent.click(getByTestId('BNB Chain'));

    await waitFor(() => {
      expect(mockSetActiveNetwork).toHaveBeenCalledWith(BNB_CLIENT_ID);
    });
    expect(mockSetNetworkClientIdForDomain).not.toHaveBeenCalled();
    expect(mockAddPermittedChain).not.toHaveBeenCalled();
  });
});

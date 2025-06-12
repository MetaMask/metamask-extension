import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { AddressQRCode } from './address-qr-code';
import { ACCOUNT_DETAILS_ROUTE } from '../../../helpers/constants/routes';
import * as blockExplorerUtils from '../../../components/multichain/menu-items/view-explorer-menu-item';
import { MetaMetricsContext } from '../../../contexts/metametrics';

// Mock the block explorer utility
jest.mock('../../../components/multichain/menu-items/view-explorer-menu-item', () => ({
  openBlockExplorer: jest.fn(),
}));

// Mock the multichain block explorer helper
jest.mock('../../../helpers/utils/multichain/blockExplorer', () => ({
  getMultichainAccountUrl: jest.fn(),
}));

// Mock the useMultichainSelector hook
jest.mock('../../../hooks/useMultichainSelector', () => ({
  useMultichainSelector: jest.fn(),
}));

// Mock React Router
const mockHistoryPush = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: () => ({
    push: mockHistoryPush,
  }),
}));

const mockStore = configureStore([thunk]);
const mockTrackEvent = jest.fn();
const mockOpenBlockExplorer = blockExplorerUtils.openBlockExplorer as jest.MockedFunction<typeof blockExplorerUtils.openBlockExplorer>;

const mockAccount = {
  id: 'account-1',
  address: '0x1234567890abcdef1234567890abcdef12345678',
  metadata: {
    name: 'Test Account',
    keyring: {
      type: 'HD Key Tree',
    },
  },
  options: {},
  methods: [],
  type: 'eip155:eoa',
};

const mockMultichainNetwork = {
  chainId: 'eip155:1',
  name: 'Ethereum Mainnet',
  nativeCurrency: {
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
  },
  blockExplorerUrls: ['https://etherscan.io'],
};

const mockState = {
  appState: {
    accountDetailsAddress: mockAccount.address,
  },
  metamask: {
    internalAccounts: {
      accounts: {
        [mockAccount.id]: mockAccount,
      },
      selectedAccount: mockAccount.id,
    },
    keyrings: [
      {
        type: 'HD Key Tree',
        accounts: [mockAccount.address],
      },
    ],
  },
};

const renderComponent = (state = mockState) => {
  const store = mockStore(state);

  return render(
    <Provider store={store}>
      <MemoryRouter>
        <MetaMetricsContext.Provider value={mockTrackEvent}>
          <AddressQRCode />
        </MetaMetricsContext.Provider>
      </MemoryRouter>
    </Provider>
  );
};

describe('AddressQRCode', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock the multichain selector
    const { useMultichainSelector } = require('../../../hooks/useMultichainSelector');
    useMultichainSelector.mockReturnValue(mockMultichainNetwork);

    // Mock the block explorer URL helper
    const { getMultichainAccountUrl } = require('../../../helpers/utils/multichain/blockExplorer');
    getMultichainAccountUrl.mockReturnValue('https://etherscan.io/address/0x1234567890abcdef1234567890abcdef12345678');
  });

  describe('Component Rendering', () => {
    it('should render the page with back button', () => {
      renderComponent();

      expect(screen.getByLabelText('Back')).toBeInTheDocument();
    });

    it('should render view on explorer button', () => {
      renderComponent();

      const explorerButton = screen.getByRole('button', { name: /explorer/i });
      expect(explorerButton).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should navigate back to account details when back button is clicked', () => {
      renderComponent();

      const backButton = screen.getByLabelText('Back');
      fireEvent.click(backButton);

      expect(mockHistoryPush).toHaveBeenCalledWith(ACCOUNT_DETAILS_ROUTE);
    });
  });

  describe('Block Explorer Integration', () => {
    it('should open block explorer when view on explorer button is clicked', async () => {
      renderComponent();

      const explorerButton = screen.getByRole('button', { name: /explorer/i });
      fireEvent.click(explorerButton);

      await waitFor(() => {
        expect(mockOpenBlockExplorer).toHaveBeenCalledWith(
          'https://etherscan.io/address/0x1234567890abcdef1234567890abcdef12345678',
          'Account Details QR Code Page',
          mockTrackEvent
        );
      });
    });
  });
});
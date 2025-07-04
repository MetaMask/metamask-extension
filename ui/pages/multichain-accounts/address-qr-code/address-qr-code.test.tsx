import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import {
  ACCOUNT_DETAILS_ROUTE,
  ACCOUNT_DETAILS_QR_CODE_ROUTE,
} from '../../../helpers/constants/routes';
import { openBlockExplorer } from '../../../components/multichain/menu-items/view-explorer-menu-item';
import { getMultichainAccountUrl } from '../../../helpers/utils/multichain/blockExplorer';
import { useMultichainSelector } from '../../../hooks/useMultichainSelector';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { AddressQRCode } from './address-qr-code';

// Mock the block explorer utility
jest.mock(
  '../../../components/multichain/menu-items/view-explorer-menu-item',
  () => ({
    openBlockExplorer: jest.fn(),
  }),
);

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

// Mock i18n
jest.mock('../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => {
    const translations: Record<string, string> = {
      address: '[address]',
      viewOnExplorer: 'View on explorer',
    };
    return translations[key] || key;
  },
}));

const mockStore = configureStore([thunk]);
const mockTrackEvent = jest.fn();

// Cast the imported functions to mocked versions
const mockUseMultichainSelector = useMultichainSelector as jest.MockedFunction<
  typeof useMultichainSelector
>;
const mockGetMultichainAccountUrl =
  getMultichainAccountUrl as jest.MockedFunction<
    typeof getMultichainAccountUrl
  >;
const mockOpenBlockExplorer = openBlockExplorer as jest.MockedFunction<
  typeof openBlockExplorer
>;

const mockBlockExplorerUrl =
  'https://etherscan.io/address/0x1234567890abcdef1234567890abcdef12345678';

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

const renderComponent = (state = mockState, address = mockAccount.address) => {
  const store = mockStore(state);

  return render(
    <Provider store={store}>
      <MemoryRouter
        initialEntries={[`${ACCOUNT_DETAILS_QR_CODE_ROUTE}/${address}`]}
      >
        <MetaMetricsContext.Provider value={mockTrackEvent}>
          <Route path={`${ACCOUNT_DETAILS_QR_CODE_ROUTE}/:address`}>
            <AddressQRCode />
          </Route>
        </MetaMetricsContext.Provider>
      </MemoryRouter>
    </Provider>,
  );
};

describe('AddressQRCode', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock the multichain selector
    mockUseMultichainSelector.mockReturnValue(mockMultichainNetwork);

    // Mock the block explorer URL helper
    mockGetMultichainAccountUrl.mockReturnValue(mockBlockExplorerUrl);
  });

  describe('Component Rendering', () => {
    it('should render the page with back button', () => {
      renderComponent();

      expect(screen.getByLabelText('Back')).toBeInTheDocument();
    });

    it('should render view on explorer button', () => {
      renderComponent();

      const explorerButton = screen.getByRole('button', {
        name: 'View on explorer',
      });
      expect(explorerButton).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should navigate back to account details when back button is clicked', () => {
      renderComponent();

      const backButton = screen.getByLabelText('Back');
      fireEvent.click(backButton);

      expect(mockHistoryPush).toHaveBeenCalledWith(
        `${ACCOUNT_DETAILS_ROUTE}/${mockAccount.address}`,
      );
    });
  });

  describe('Block Explorer Integration', () => {
    it('should open block explorer when view on explorer button is clicked', async () => {
      renderComponent();

      const explorerButton = screen.getByRole('button', {
        name: 'View on explorer',
      });
      fireEvent.click(explorerButton);

      await waitFor(() => {
        expect(mockOpenBlockExplorer).toHaveBeenCalledWith(
          mockBlockExplorerUrl,
          'Account Details QR Code Page',
          mockTrackEvent,
        );
      });
    });
  });
});

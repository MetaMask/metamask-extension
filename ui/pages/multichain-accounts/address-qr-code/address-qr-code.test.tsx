import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { openBlockExplorer } from '../../../components/multichain/menu-items/view-explorer-menu-item';
import { getMultichainAccountUrl } from '../../../helpers/utils/multichain/blockExplorer';
import { useMultichainSelector } from '../../../hooks/useMultichainSelector';

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

// Mock react-router-dom-v5-compat
const mockUseNavigate = jest.fn();
const mockUseParams = jest.fn();
jest.mock('react-router-dom-v5-compat', () => {
  const actual = jest.requireActual('react-router-dom-v5-compat');
  return {
    ...actual,
    useNavigate: () => mockUseNavigate,
    useParams: () => mockUseParams(),
  };
});

// Mock i18n
jest.mock('../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string, substitutions?: string[]) => {
    const translations: Record<string, string> = {
      address: '[address]',
      viewOnExplorer: 'View on explorer',
      viewAddressOnExplorer: `View on ${substitutions?.[0]}`,
    };
    return translations[key] || key;
  },
}));

const mockStore = configureStore([thunk]);

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

  // Set up useParams mock to return the address
  mockUseParams.mockReturnValue({ address });

  return renderWithProvider(<AddressQRCode />, store);
};

describe('AddressQRCode', () => {
  beforeEach(() => {
    // Clear all mock calls but not implementations
    mockUseNavigate.mockClear();
    mockUseParams.mockClear();
    mockUseMultichainSelector.mockClear();
    mockGetMultichainAccountUrl.mockClear();

    // Set up default mock return values
    mockUseMultichainSelector.mockReturnValue(mockMultichainNetwork);
    mockGetMultichainAccountUrl.mockReturnValue(mockBlockExplorerUrl);
  });

  describe('Component Rendering', () => {
    it('should render the page with back button', () => {
      renderComponent();

      expect(screen.getByLabelText('Back')).toBeInTheDocument();
    });

    it('should render view on etherscan button', () => {
      renderComponent();

      const explorerButton = screen.getByRole('button', {
        name: 'View on Etherscan',
      });
      expect(explorerButton).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should navigate back to account details when back button is clicked', () => {
      renderComponent();

      const backButton = screen.getByLabelText('Back');
      fireEvent.click(backButton);

      expect(mockUseNavigate).toHaveBeenCalledWith(-1);
    });
  });

  describe('Block Explorer Integration', () => {
    it('should open block explorer when view on etherscan button is clicked', async () => {
      renderComponent();

      const explorerButton = screen.getByRole('button', {
        name: 'View on Etherscan',
      });
      fireEvent.click(explorerButton);

      await waitFor(() => {
        expect(mockOpenBlockExplorer).toHaveBeenCalledWith(
          mockBlockExplorerUrl,
          'Account Details QR Code Page',
          expect.any(Function),
        );
      });
    });
  });
});

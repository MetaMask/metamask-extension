import React from 'react';
import mockState from '../../../../test/data/mock-state.json';
import configureStore from '../../../store/store';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { setBackgroundConnection } from '../../../store/background-connection';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import {
  AccountOverviewNonEvm,
  AccountOverviewNonEvmProps,
} from './account-overview-non-evm';

jest.mock('../../../store/actions', () => {
  return {
    ...jest.requireActual('../../../store/actions'),
    tokenBalancesStartPolling: jest.fn().mockResolvedValue('pollingToken'),
    tokenBalancesStopPollingByPollingToken: jest.fn(),
    setTokenNetworkFilter: jest.fn(),
    updateSlides: jest.fn(),
    removeSlide: jest.fn(),
    addImportedTokens: jest.fn(),
  };
});

// Mock the dispatch function
const mockDispatch = jest.fn();

jest.mock('react-redux', () => {
  const actual = jest.requireActual('react-redux');
  return {
    ...actual,
    useDispatch: () => mockDispatch,
  };
});

const defaultProps: AccountOverviewNonEvmProps = {
  defaultHomeActiveTabName: null,
  onTabClick: jest.fn(),
  setBasicFunctionalityModalOpen: jest.fn(),
  onSupportLinkClick: jest.fn(),
};

const render = (
  props: AccountOverviewNonEvmProps = defaultProps,
  stateOverrides = {},
) => {
  const store = configureStore({
    metamask: {
      ...mockState.metamask,
      preferences: {
        ...mockState.metamask.preferences,
        tokenNetworkFilter: {
          [CHAIN_IDS.MAINNET]: true,
          [CHAIN_IDS.LINEA_MAINNET]: true,
        },
      },
      enabledNetworkMap: {
        eip155: {},
      },
      ...stateOverrides,
    },
  });

  return renderWithProvider(<AccountOverviewNonEvm {...props} />, store);
};

describe('AccountOverviewBtc', () => {
  beforeEach(() => {
    setBackgroundConnection({
      tokenBalancesStartPolling: jest.fn(),
    } as never);
  });

  describe('when no EVM networks are enabled', () => {
    it('shows only Tokens and Activity tabs', () => {
      const { queryByTestId } = render(defaultProps, {
        enabledNetworkMap: {
          eip155: {},
        },
      });

      expect(queryByTestId('account-overview__asset-tab')).toBeInTheDocument();
      expect(
        queryByTestId('account-overview__nfts-tab'),
      ).not.toBeInTheDocument();
      expect(
        queryByTestId('account-overview__activity-tab'),
      ).toBeInTheDocument();
      expect(
        queryByTestId('account-overview__defi-tab'),
      ).not.toBeInTheDocument();
    });

    it('shows tokens links', () => {
      const { queryByTestId } = render(defaultProps, {
        enabledNetworkMap: {
          eip155: {},
        },
      });

      expect(queryByTestId('account-overview__asset-tab')).toBeInTheDocument();
      const button = queryByTestId('asset-list-control-bar-action-button');
      expect(button).toBeInTheDocument(); // Verify the button is present
      expect(button).toBeEnabled(); // Verify the button is enabled
      // TODO: This one might be required, but we do not really handle tokens for BTC yet...
      expect(queryByTestId('refresh-list-button')).not.toBeInTheDocument();
    });
  });

  describe('when EVM networks are enabled', () => {
    it('shows Tokens, NFTs, and Activity tabs when DeFi is disabled', () => {
      const { queryByTestId } = render(defaultProps, {
        enabledNetworkMap: {
          eip155: {
            [CHAIN_IDS.MAINNET]: true,
            [CHAIN_IDS.LINEA_MAINNET]: true,
          },
        },
        remoteFeatureFlags: {
          assetsDefiPositionsEnabled: false,
        },
      });

      expect(queryByTestId('account-overview__asset-tab')).toBeInTheDocument();
      expect(queryByTestId('account-overview__nfts-tab')).toBeInTheDocument();
      expect(
        queryByTestId('account-overview__activity-tab'),
      ).toBeInTheDocument();
      expect(
        queryByTestId('account-overview__defi-tab'),
      ).not.toBeInTheDocument();
    });

    it('shows all tabs including DeFi when DeFi positions are enabled', () => {
      const { queryByTestId } = render(defaultProps, {
        enabledNetworkMap: {
          eip155: {
            [CHAIN_IDS.MAINNET]: true,
            [CHAIN_IDS.LINEA_MAINNET]: true,
          },
        },
        remoteFeatureFlags: {
          assetsDefiPositionsEnabled: true,
        },
      });

      expect(queryByTestId('account-overview__asset-tab')).toBeInTheDocument();
      expect(queryByTestId('account-overview__nfts-tab')).toBeInTheDocument();
      expect(
        queryByTestId('account-overview__activity-tab'),
      ).toBeInTheDocument();
      expect(queryByTestId('account-overview__defi-tab')).toBeInTheDocument();
    });

    it('shows NFTs and Activity tabs even when only one EVM network is enabled', () => {
      const { queryByTestId } = render(defaultProps, {
        enabledNetworkMap: {
          eip155: {
            [CHAIN_IDS.MAINNET]: true,
            [CHAIN_IDS.LINEA_MAINNET]: false,
          },
        },
      });

      expect(queryByTestId('account-overview__asset-tab')).toBeInTheDocument();
      expect(queryByTestId('account-overview__nfts-tab')).toBeInTheDocument();
      expect(
        queryByTestId('account-overview__activity-tab'),
      ).toBeInTheDocument();
    });
  });

  describe('when switching between network types', () => {
    it('hides NFTs and DeFi tabs when all EVM networks are disabled', () => {
      const { queryByTestId } = render(defaultProps, {
        enabledNetworkMap: {
          eip155: {
            [CHAIN_IDS.MAINNET]: false,
            [CHAIN_IDS.LINEA_MAINNET]: false,
          },
          solana: {
            'solana:mainnet': true,
          },
        },
      });

      expect(queryByTestId('account-overview__asset-tab')).toBeInTheDocument();
      expect(
        queryByTestId('account-overview__nfts-tab'),
      ).not.toBeInTheDocument();
      expect(
        queryByTestId('account-overview__activity-tab'),
      ).toBeInTheDocument();
      expect(
        queryByTestId('account-overview__defi-tab'),
      ).not.toBeInTheDocument();
    });
  });
});

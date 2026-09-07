import React from 'react';
import mockState from '../../../../test/data/mock-state.json';
import configureStore from '../../../store/store';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { createMockRouteMessenger } from '../../../../test/lib/mock-route-messenger';
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
  setBasicFunctionalityModalOpen: jest.fn(),
  onSupportLinkClick: jest.fn(),
};

const render = (
  props: AccountOverviewNonEvmProps = defaultProps,
  stateOverrides = {},
) => {
  const store = configureStore({
    activeTab: mockState.activeTab,
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

  return renderWithProvider(
    <AccountOverviewNonEvm {...props} />,
    store,
    undefined,
    undefined,
    undefined,
    undefined,
    createMockRouteMessenger(),
  );
};

const expectStandardTabs = (
  queryByTestId: (id: string) => HTMLElement | null,
) => {
  expect(queryByTestId('account-overview__asset-tab')).toBeInTheDocument();
  expect(queryByTestId('account-overview__nfts-tab')).toBeInTheDocument();
  expect(queryByTestId('account-overview__activity-tab')).toBeInTheDocument();
};

const expectAllTabs = (queryByTestId: (id: string) => HTMLElement | null) => {
  expectStandardTabs(queryByTestId);
  expect(queryByTestId('account-overview__defi-tab')).toBeInTheDocument();
};

describe('AccountOverviewBtc', () => {
  beforeEach(() => {
    setBackgroundConnection({
      tokenBalancesStartPolling: jest.fn(),
    } as never);
  });

  describe('when no EVM networks are enabled', () => {
    it('shows all tabs', () => {
      const { queryByTestId } = render(defaultProps, {
        enabledNetworkMap: {
          eip155: {},
        },
      });

      expectAllTabs(queryByTestId);
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
    it('hides the DeFi tab when DeFi positions are disabled', () => {
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
      expectStandardTabs(queryByTestId);
      expect(
        queryByTestId('account-overview__defi-tab'),
      ).not.toBeInTheDocument();
    });
  });
});

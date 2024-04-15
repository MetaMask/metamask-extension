import React from 'react';
import configureMockStore from 'redux-mock-store';
import { act, fireEvent } from '@testing-library/react';

import { SEND_STAGES } from '../../ducks/send';
import { renderWithProvider } from '../../../test/jest';
import mockSendState from '../../../test/data/mock-send-state.json';
import {
  CHAIN_IDS,
  GOERLI_DISPLAY_NAME,
  NETWORK_TYPES,
} from '../../../shared/constants/network';
import { useIsOriginalNativeTokenSymbol } from '../../hooks/useIsOriginalNativeTokenSymbol';
import Routes from '.';

const mockShowNetworkDropdown = jest.fn();
const mockHideNetworkDropdown = jest.fn();

jest.mock('webextension-polyfill', () => ({
  runtime: {
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
    getManifest: () => ({ manifest_version: 2 }),
  },
}));

jest.mock('../../store/actions', () => ({
  getGasFeeTimeEstimate: jest.fn().mockImplementation(() => Promise.resolve()),
  gasFeeStartPollingByNetworkClientId: jest
    .fn()
    .mockResolvedValue('pollingToken'),
  gasFeeStopPollingByPollingToken: jest.fn(),
  getNetworkConfigurationByNetworkClientId: jest
    .fn()
    .mockResolvedValue({ chainId: '0x5' }),
  showNetworkDropdown: () => mockShowNetworkDropdown,
  hideNetworkDropdown: () => mockHideNetworkDropdown,
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: () => ({
    push: jest.fn(),
  }),
}));

jest.mock('../../ducks/send', () => ({
  ...jest.requireActual('../../ducks/send'),
  resetSendState: () => ({ type: 'XXX' }),
  getGasPrice: jest.fn(),
}));

jest.mock('../../ducks/domains', () => ({
  ...jest.requireActual('../../ducks/domains'),
  initializeDomainSlice: () => ({ type: 'XXX' }),
}));

jest.mock('../../hooks/useIsOriginalNativeTokenSymbol', () => {
  return {
    useIsOriginalNativeTokenSymbol: jest.fn(),
  };
});

jest.mock(
  '../../components/app/metamask-template-renderer/safe-component-list',
);

const render = async (route, state) => {
  const store = configureMockStore()({
    ...mockSendState,
    ...state,
  });

  let result;

  await act(
    async () => (result = renderWithProvider(<Routes />, store, route)),
  );

  return result;
};

describe('Routes Component', () => {
  useIsOriginalNativeTokenSymbol.mockImplementation(() => true);

  afterEach(() => {
    mockShowNetworkDropdown.mockClear();
    mockHideNetworkDropdown.mockClear();
  });

  describe('render during send flow', () => {
    it('should render with network change disabled while adding recipient for send flow', async () => {
      const state = {
        send: {
          ...mockSendState.send,
          stage: SEND_STAGES.ADD_RECIPIENT,
        },
      };

      const { getByTestId } = await render(['/send'], state);

      const networkDisplay = getByTestId('network-display');
      await act(async () => {
        fireEvent.click(networkDisplay);
      });
      expect(mockShowNetworkDropdown).not.toHaveBeenCalled();
    });

    it('should render with network change disabled while user is in send page', async () => {
      const state = {
        metamask: {
          ...mockSendState.metamask,
          providerConfig: {
            chainId: CHAIN_IDS.GOERLI,
            nickname: GOERLI_DISPLAY_NAME,
            type: NETWORK_TYPES.GOERLI,
          },
        },
      };
      const { getByTestId } = await render(['/send'], state);

      const networkDisplay = getByTestId('network-display');
      await act(async () => {
        fireEvent.click(networkDisplay);
      });
      expect(mockShowNetworkDropdown).not.toHaveBeenCalled();
    });

    it('should render with network change disabled while editing a send transaction', async () => {
      const state = {
        send: {
          ...mockSendState.send,
          stage: SEND_STAGES.EDIT,
        },
        metamask: {
          ...mockSendState.metamask,
          providerConfig: {
            chainId: CHAIN_IDS.GOERLI,
            nickname: GOERLI_DISPLAY_NAME,
            type: NETWORK_TYPES.GOERLI,
          },
        },
      };
      const { getByTestId } = await render(['/send'], state);

      const networkDisplay = getByTestId('network-display');
      await act(async () => {
        fireEvent.click(networkDisplay);
      });
      expect(mockShowNetworkDropdown).not.toHaveBeenCalled();
    });

    it('should render when send transaction is not active', async () => {
      const state = {
        metamask: {
          ...mockSendState.metamask,
          swapsState: {
            ...mockSendState.metamask.swapsState,
            swapsFeatureIsLive: true,
          },
          pendingApprovals: {},
          approvalFlows: [],
          announcements: {},
          providerConfig: {
            chainId: CHAIN_IDS.MAINNET,
            ticker: 'ETH',
            type: NETWORK_TYPES.MAINNET,
          },
        },
        send: {
          ...mockSendState.send,
          stage: SEND_STAGES.INACTIVE,
        },
        localeMessages: {
          currentLocale: 'en',
        },
      };
      const { getByTestId } = await render(undefined, state);
      expect(getByTestId('account-menu-icon')).not.toBeDisabled();
    });
  });
});

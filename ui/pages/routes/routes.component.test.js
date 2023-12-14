import React from 'react';
import configureMockStore from 'redux-mock-store';
import { fireEvent } from '@testing-library/react';

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
  getGasFeeEstimatesAndStartPolling: jest
    .fn()
    .mockImplementation(() => Promise.resolve()),
  addPollingTokenToAppState: jest.fn(),
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

describe('Routes Component', () => {
  useIsOriginalNativeTokenSymbol.mockImplementation(() => true);
  afterEach(() => {
    mockShowNetworkDropdown.mockClear();
    mockHideNetworkDropdown.mockClear();
  });
  describe('render during send flow', () => {
    it('should render with network change disabled while adding recipient for send flow', () => {
      const store = configureMockStore()({
        ...mockSendState,
        send: {
          ...mockSendState.send,
          stage: SEND_STAGES.ADD_RECIPIENT,
        },
      });

      const { getByTestId } = renderWithProvider(<Routes />, store, ['/send']);

      const networkDisplay = getByTestId('network-display');
      fireEvent.click(networkDisplay);
      expect(mockShowNetworkDropdown).not.toHaveBeenCalled();
    });
    it('should render with network change disabled while user is in send page', () => {
      const store = configureMockStore()({
        ...mockSendState,
        metamask: {
          ...mockSendState.metamask,
          providerConfig: {
            chainId: CHAIN_IDS.GOERLI,
            nickname: GOERLI_DISPLAY_NAME,
            type: NETWORK_TYPES.GOERLI,
          },
        },
      });
      const { getByTestId } = renderWithProvider(<Routes />, store, ['/send']);

      const networkDisplay = getByTestId('network-display');
      fireEvent.click(networkDisplay);
      expect(mockShowNetworkDropdown).not.toHaveBeenCalled();
    });
    it('should render with network change disabled while editing a send transaction', () => {
      const store = configureMockStore()({
        ...mockSendState,
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
      });
      const { getByTestId } = renderWithProvider(<Routes />, store, ['/send']);

      const networkDisplay = getByTestId('network-display');
      fireEvent.click(networkDisplay);
      expect(mockShowNetworkDropdown).not.toHaveBeenCalled();
    });
    it('should render when send transaction is not active', () => {
      const store = configureMockStore()({
        ...mockSendState,
        metamask: {
          ...mockSendState.metamask,
          swapsState: {
            ...mockSendState.metamask.swapsState,
            swapsFeatureIsLive: true,
          },
          pendingApprovals: {},
          approvalFlows: [],
          announcements: {},
        },
        send: {
          ...mockSendState.send,
          stage: SEND_STAGES.INACTIVE,
        },
      });
      const { getByTestId } = renderWithProvider(<Routes />, store);
      expect(getByTestId('account-menu-icon')).not.toBeDisabled();
    });
  });
});

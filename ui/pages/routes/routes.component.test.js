import React from 'react';
import configureMockStore from 'redux-mock-store';
import { fireEvent } from '@testing-library/react';
import thunk from 'redux-thunk';

import { SEND_STAGES } from '../../ducks/send';
import { renderWithProvider } from '../../../test/jest';
import mockSendState from '../../../test/data/mock-send-state.json';
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

describe('Routes Component', () => {
  afterEach(() => {
    mockShowNetworkDropdown.mockClear();
    mockHideNetworkDropdown.mockClear();
  });
  describe('render during send flow', () => {
    it('should render while adding recipient for send flow', () => {
      const store = configureMockStore()({
        ...mockSendState,
        send: {
          ...mockSendState.send,
          stage: SEND_STAGES.ADD_RECIPIENT,
        },
      });
      const { getByTestId } = renderWithProvider(<Routes />, store, ['/send']);

      expect(getByTestId('account-menu-icon')).toBeDisabled();

      const networkDisplay = getByTestId('network-display');
      fireEvent.click(networkDisplay);
      expect(mockShowNetworkDropdown).not.toHaveBeenCalled();
    });
    it('should render draft send page', () => {
      const store = configureMockStore()({
        ...mockSendState,
      });
      const { getByTestId } = renderWithProvider(<Routes />, store, ['/send']);

      expect(getByTestId('account-menu-icon')).toBeDisabled();

      const networkDisplay = getByTestId('network-display');
      fireEvent.click(networkDisplay);
      expect(mockShowNetworkDropdown).not.toHaveBeenCalled();
    });
    it('should render while editing a send transaction', () => {
      const store = configureMockStore()({
        ...mockSendState,
        send: {
          ...mockSendState.send,
          stage: SEND_STAGES.EDIT,
        },
      });
      const { getByTestId } = renderWithProvider(<Routes />, store, ['/send']);

      expect(getByTestId('account-menu-icon')).toBeDisabled();

      const networkDisplay = getByTestId('network-display');
      fireEvent.click(networkDisplay);
      expect(mockShowNetworkDropdown).not.toHaveBeenCalled();
    });
    it('should render when send transaction is not active', () => {
      const store = configureMockStore([thunk])({
        ...mockSendState,
        metamask: {
          ...mockSendState.metamask,
          swapsState: {
            ...mockSendState.metamask.swapsState,
            swapsFeatureIsLive: true,
          },
          pendingApprovals: {},
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

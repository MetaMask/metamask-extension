import React from 'react';
import configureMockStore from 'redux-mock-store';
// import { fireEvent } from '@testing-library/react';

// import { SEND_STAGES } from '../../ducks/send';
// import { getInitialSendStateWithExistingTxState } from '../../../test/jest/mocks';
import { renderWithProvider } from '../../../test/jest';
import mockSendState from '../../../test/data/mock-send-state.json';
import Routes from '.';

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
  disconnectGasFeeEstimatePoller: jest.fn(),
  getGasFeeTimeEstimate: jest.fn().mockImplementation(() => Promise.resolve()),
  getGasFeeEstimatesAndStartPolling: jest
    .fn()
    .mockImplementation(() => Promise.resolve()),
  addPollingTokenToAppState: jest.fn(),
  removePollingTokenFromAppState: jest.fn(),
  createTransactionEventFragment: jest.fn(),
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
  describe('render', () => {
    it('should render draft send page', () => {
      const store = configureMockStore()({
        ...mockSendState,
      });
      const { getByTestId } = renderWithProvider(<Routes />, store, ['/send']);

      expect(getByTestId('account-menu-icon')).toBeDisabled();
    });
  });
});

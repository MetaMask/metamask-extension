import React from 'react';
import { screen } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { setBackgroundConnection } from '../../../store/background-connection';
import TransactionsTab from './transactions-tab';

const backgroundConnectionMock = new Proxy(
  {},
  { get: () => jest.fn().mockResolvedValue(undefined) },
);

describe('TransactionsTab', () => {
  const mockStore = configureMockStore([thunk])(mockState);

  beforeEach(() => {
    jest.clearAllMocks();
    setBackgroundConnection(backgroundConnectionMock as never);
  });

  describe('snapshot', () => {
    it('matches snapshot', () => {
      const { container } = renderWithProvider(<TransactionsTab />, mockStore);

      expect(container).toMatchSnapshot();
    });
  });

  describe('setting items', () => {
    it('renders createToggleItem toggles with expected test ids', () => {
      renderWithProvider(<TransactionsTab />, mockStore);

      expect(screen.getByTestId('showHexData-toggle')).toBeInTheDocument();
      expect(
        screen.getByTestId('useExternalNameSources-toggle'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId(
          'settings-page-smart-account-requests-from-dapps-toggle',
        ),
      ).toBeInTheDocument();
    });

    it('renders custom items (transaction simulations, security alerts, smart transactions)', () => {
      renderWithProvider(<TransactionsTab />, mockStore);

      expect(
        screen.getByTestId('useTransactionSimulations'),
      ).toBeInTheDocument();
      expect(screen.getByTestId('securityAlert')).toBeInTheDocument();
      expect(
        screen.getByTestId('advanced-setting-enable-smart-transactions'),
      ).toBeInTheDocument();
    });
  });
});

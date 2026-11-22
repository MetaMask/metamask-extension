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
  const createStore = (
    remoteFeatureFlags = {},
    isBasicFunctionalityConsolidatedEnabled = false,
  ) =>
    configureMockStore([thunk])({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        remoteFeatureFlags,
        preferences: {
          ...mockState.metamask.preferences,
          isBasicFunctionalityConsolidatedEnabled,
        },
      },
    });

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
    it('renders all toggle items with expected test ids', () => {
      renderWithProvider(<TransactionsTab />, mockStore);

      const expectedTestIds = [
        'transactions-simulations-toggle',
        'transactions-security-alerts-toggle',
        'transactions-smart-transactions-toggle',
        'transactions-smart-account-requests-toggle',
        'transactions-proposed-nicknames-toggle',
        'transactions-show-hex-data-toggle',
        'transactions-settings-hex-data-toggle',
      ];

      for (const testId of expectedTestIds) {
        expect(screen.getByTestId(testId)).toBeInTheDocument();
      }
    });

    it('hides consolidated Basic Functionality toggles when the flag is enabled', () => {
      renderWithProvider(
        <TransactionsTab />,
        createStore({ extensionBasicFunctionalityToggle: true }, true),
      );

      expect(
        screen.queryByTestId('transactions-simulations-toggle'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('transactions-security-alerts-toggle'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('transactions-proposed-nicknames-toggle'),
      ).not.toBeInTheDocument();
      expect(
        screen.getByTestId('transactions-smart-transactions-toggle'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('transactions-show-hex-data-toggle'),
      ).toBeInTheDocument();
    });
  });
});

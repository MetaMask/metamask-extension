import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/jest/rendering';
import configureStore from '../../../../store/store';
import { AlertTypes } from '../../../../../shared/constants/alerts';
import { ALERT_STATE } from '../../../../ducks/alerts/enums';
import { SmartTransactionsBannerAlert } from './smart-transactions-banner-alert';

// Mock the entire module
jest.mock('../../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key) => key,
  __esModule: true,
  default: () => (key) => key,
}));

// Mock the setAlertEnabledness function
jest.mock('../../../../store/actions', () => ({
  setAlertEnabledness: jest.fn().mockResolvedValue(undefined),
}));

describe('SmartTransactionsBannerAlert', () => {
  const mockState = {
    metamask: {
      alerts: {
        [AlertTypes.smartTransactionsMigration]: {
          state: ALERT_STATE.OPEN,
        },
      },
    },
    [AlertTypes.smartTransactionsMigration]: {
      state: ALERT_STATE.OPEN,
    },
  };

  it('renders banner when alert is open', () => {
    const store = configureStore(mockState);
    renderWithProvider(<SmartTransactionsBannerAlert />, store);

    expect(
      screen.getByTestId('smart-transactions-banner-alert'),
    ).toBeInTheDocument();
    expect(screen.getByText('smartTransactionsEnabled')).toBeInTheDocument();
    expect(screen.getByText('learnMore')).toBeInTheDocument();
  });

  it('does not render when alert is closed', () => {
    const closedState = {
      metamask: {
        alerts: {
          [AlertTypes.smartTransactionsMigration]: {
            state: ALERT_STATE.CLOSED,
          },
        },
      },
      [AlertTypes.smartTransactionsMigration]: {
        state: ALERT_STATE.CLOSED,
      },
    };
    const store = configureStore(closedState);
    renderWithProvider(<SmartTransactionsBannerAlert />, store);

    expect(
      screen.queryByTestId('smart-transactions-banner-alert'),
    ).not.toBeInTheDocument();
  });

  it('dispatches dismissal action when close button clicked', async () => {
    const store = configureStore(mockState);
    renderWithProvider(<SmartTransactionsBannerAlert />, store);

    screen.getByRole('button', { name: /close/iu }).click();

    // Wait for the async action to complete
    await new Promise((resolve) => setTimeout(resolve, 0));

    const state = store.getState();
    expect(state[AlertTypes.smartTransactionsMigration].state).toBe(
      ALERT_STATE.CLOSED,
    );
  });

  it('dispatches dismissal action when learn more link clicked', async () => {
    const store = configureStore(mockState);
    renderWithProvider(<SmartTransactionsBannerAlert />, store);

    screen.getByText('learnMore').click();

    // Wait for the async action to complete
    await new Promise((resolve) => setTimeout(resolve, 0));

    const state = store.getState();
    expect(state[AlertTypes.smartTransactionsMigration].state).toBe(
      ALERT_STATE.CLOSED,
    );
  });
});

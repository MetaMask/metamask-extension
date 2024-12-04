import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/jest/rendering';
import configureStore from '../../../../store/store';
import { AlertTypes } from '../../../../../shared/constants/alerts';
import { ALERT_STATE } from '../../../../ducks/alerts/enums';
import { STXBannerAlert } from './stx-banner-alert';

describe('STXBannerAlert', () => {
  const mockState = {
    metamask: {
      alerts: {
        [AlertTypes.stxMigration]: {
          state: ALERT_STATE.OPEN,
        },
      },
    },
  };

  it('renders banner when alert is open', () => {
    const store = configureStore(mockState);
    renderWithProvider(<STXBannerAlert />, store);

    expect(screen.getByTestId('stx-banner-alert')).toBeInTheDocument();
    expect(
      screen.getByText('smartTransactionsEnabledMessage'),
    ).toBeInTheDocument();
    expect(screen.getByText('smartTransactionsLearnMore')).toBeInTheDocument();
  });

  it('does not render when alert is closed', () => {
    const closedState = {
      metamask: {
        alerts: {
          [AlertTypes.stxMigration]: {
            state: ALERT_STATE.CLOSED,
          },
        },
      },
    };
    const store = configureStore(closedState);
    renderWithProvider(<STXBannerAlert />, store);

    expect(screen.queryByTestId('stx-banner-alert')).not.toBeInTheDocument();
  });

  it('dispatches dismissal action when close button clicked', () => {
    const store = configureStore(mockState);
    renderWithProvider(<STXBannerAlert />, store);

    screen.getByRole('button', { name: /close/iu }).click();

    const state = store.getState();
    expect(state.metamask.alerts[AlertTypes.stxMigration].state).toBe(
      ALERT_STATE.CLOSED,
    );
  });

  it('dispatches dismissal action when learn more link clicked', () => {
    const store = configureStore(mockState);
    renderWithProvider(<STXBannerAlert />, store);

    screen.getByText('smartTransactionsLearnMore').click();

    const state = store.getState();
    expect(state.metamask.alerts[AlertTypes.stxMigration].state).toBe(
      ALERT_STATE.CLOSED,
    );
  });
});

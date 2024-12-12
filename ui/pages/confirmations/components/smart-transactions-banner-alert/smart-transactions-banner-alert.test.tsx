import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/jest/rendering';
import configureStore from '../../../../store/store';
import { AlertTypes } from '../../../../../shared/constants/alerts';
import { setAlertEnabledness } from '../../../../store/actions';
import { SmartTransactionsBannerAlert } from './smart-transactions-banner-alert';

jest.mock('../../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => key,
  __esModule: true,
  default: () => (key: string) => key,
}));

// Update the mock to return a plain action object
jest.mock('../../../../store/actions', () => ({
  setAlertEnabledness: jest.fn(() => ({ type: 'mock-action' })),
}));

describe('SmartTransactionsBannerAlert', () => {
  const mockState = {
    metamask: {
      alertEnabledness: {
        [AlertTypes.smartTransactionsMigration]: true,
      },
      preferences: {
        smartTransactionsOptInStatus: true,
      },
    },
  };

  it('renders banner when alert is enabled and STX is opted in', () => {
    const store = configureStore(mockState);
    renderWithProvider(<SmartTransactionsBannerAlert />, store);

    expect(
      screen.getByTestId('smart-transactions-banner-alert'),
    ).toBeInTheDocument();
    expect(screen.getByText('smartTransactionsEnabled')).toBeInTheDocument();
    expect(screen.getByText('learnMore')).toBeInTheDocument();
  });

  it('does not render when alert is disabled', () => {
    const disabledState = {
      metamask: {
        alertEnabledness: {
          [AlertTypes.smartTransactionsMigration]: false,
        },
        preferences: {
          smartTransactionsOptInStatus: true,
        },
      },
    };
    const store = configureStore(disabledState);
    renderWithProvider(<SmartTransactionsBannerAlert />, store);

    expect(
      screen.queryByTestId('smart-transactions-banner-alert'),
    ).not.toBeInTheDocument();
  });

  it('does not render when STX is not opted in', () => {
    const notOptedInState = {
      metamask: {
        alertEnabledness: {
          [AlertTypes.smartTransactionsMigration]: true,
        },
        preferences: {
          smartTransactionsOptInStatus: false,
        },
      },
    };
    const store = configureStore(notOptedInState);
    renderWithProvider(<SmartTransactionsBannerAlert />, store);

    expect(
      screen.queryByTestId('smart-transactions-banner-alert'),
    ).not.toBeInTheDocument();
  });

  it('calls setAlertEnabledness when close button clicked', () => {
    const store = configureStore(mockState);
    renderWithProvider(<SmartTransactionsBannerAlert />, store);

    screen.getByRole('button', { name: /close/iu }).click();

    expect(setAlertEnabledness).toHaveBeenCalledWith(
      AlertTypes.smartTransactionsMigration,
      false,
    );
  });

  it('calls setAlertEnabledness when learn more link clicked', () => {
    const store = configureStore(mockState);
    renderWithProvider(<SmartTransactionsBannerAlert />, store);

    screen.getByText('learnMore').click();

    expect(setAlertEnabledness).toHaveBeenCalledWith(
      AlertTypes.smartTransactionsMigration,
      false,
    );
  });
});

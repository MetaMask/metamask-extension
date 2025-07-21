import React from 'react';
import type { Store } from '@reduxjs/toolkit';
import { screen } from '@testing-library/react';
import { TransactionType } from '@metamask/transaction-controller';
import { ConfirmContext } from '../../context/confirm';
import type { Confirmation, SignatureRequestType } from '../../types/confirm';
import { renderWithProvider } from '../../../../../test/jest/rendering';
import configureStore from '../../../../store/store';
import { AlertTypes } from '../../../../../shared/constants/alerts';
import { setAlertEnabledness } from '../../../../store/actions';
import { mockNetworkState } from '../../../../../test/stub/networks';
import { CHAIN_IDS } from '../../../../../shared/constants/network';
import { SmartTransactionsBannerAlert } from './smart-transactions-banner-alert';

type TestConfirmContextValue = {
  currentConfirmation: Confirmation;
  isScrollToBottomCompleted: boolean;
  setIsScrollToBottomCompleted: (isScrollToBottomCompleted: boolean) => void;
};

jest.mock('../../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => key,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: () => (key: string) => key,
}));

jest.mock('../../../../store/actions', () => ({
  setAlertEnabledness: jest.fn(() => ({ type: 'mock-action' })),
}));

const renderWithConfirmContext = (
  component: React.ReactElement,
  store: Store,
  confirmationValue: TestConfirmContextValue = {
    currentConfirmation: {
      type: TransactionType.simpleSend,
      id: '1',
    } as SignatureRequestType,
    isScrollToBottomCompleted: true,
    setIsScrollToBottomCompleted: () => undefined,
  },
) => {
  return renderWithProvider(
    <ConfirmContext.Provider value={confirmationValue}>
      {component}
    </ConfirmContext.Provider>,
    store,
  );
};

describe('SmartTransactionsBannerAlert', () => {
  const mockState = {
    metamask: {
      alertEnabledness: {
        [AlertTypes.smartTransactionsMigration]: true,
      },
      preferences: {
        smartTransactionsOptInStatus: true,
        smartTransactionsMigrationApplied: true,
      },
      featureFlags: {
        smartTransactionsEnabled: true,
      },
      smartTransactionsFeatureFlags: {
        enabled: true,
      },
      swapsState: {
        swapsFeatureFlags: {
          ethereum: {
            extensionActive: true,
            mobileActive: false,
            smartTransactions: {
              expectedDeadline: 45,
              maxDeadline: 150,
              extensionReturnTxHashAsap: false,
            },
          },
          smartTransactions: {
            extensionActive: true,
            mobileActive: false,
          },
        },
      },
      smartTransactionsState: {
        liveness: true,
      },
      ...mockNetworkState({
        id: 'network-configuration-id-1',
        chainId: CHAIN_IDS.MAINNET,
        rpcUrl: 'https://mainnet.infura.io/v3/',
      }),
    },
  };

  it('renders banner when all conditions are met', () => {
    const store = configureStore(mockState);
    renderWithProvider(<SmartTransactionsBannerAlert />, store);

    expect(
      screen.getByTestId('smart-transactions-banner-alert'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('smartTransactionsEnabledTitle'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('smartTransactionsEnabledDescription'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('smartTransactionsEnabledLink'),
    ).toBeInTheDocument();
  });

  it('does not render when alert is disabled', () => {
    const disabledState = {
      ...mockState,
      metamask: {
        ...mockState.metamask,
        alertEnabledness: {
          [AlertTypes.smartTransactionsMigration]: false,
        },
      },
    };
    const store = configureStore(disabledState);
    renderWithProvider(<SmartTransactionsBannerAlert />, store);

    expect(
      screen.queryByTestId('smart-transactions-banner-alert'),
    ).not.toBeInTheDocument();
  });

  it('does not render when migration has not been applied', () => {
    const noMigrationState = {
      ...mockState,
      metamask: {
        ...mockState.metamask,
        preferences: {
          ...mockState.metamask.preferences,
          smartTransactionsMigrationApplied: false,
        },
      },
    };
    const store = configureStore(noMigrationState);
    renderWithProvider(<SmartTransactionsBannerAlert />, store);

    expect(
      screen.queryByTestId('smart-transactions-banner-alert'),
    ).not.toBeInTheDocument();
  });

  it('does not render when chain does not support smart transactions', () => {
    const unsupportedChainState = {
      ...mockState,
      metamask: {
        ...mockState.metamask,
        ...mockNetworkState({
          id: 'network-configuration-id-2',
          chainId: CHAIN_IDS.POLYGON,
          rpcUrl: 'https://polygon-rpc.com',
        }),
      },
    };
    const store = configureStore(unsupportedChainState);
    renderWithProvider(<SmartTransactionsBannerAlert />, store);

    expect(
      screen.queryByTestId('smart-transactions-banner-alert'),
    ).not.toBeInTheDocument();
  });

  it('does not render when smart transactions preference is disabled', () => {
    const disabledPreferenceState = {
      ...mockState,
      metamask: {
        ...mockState.metamask,
        preferences: {
          ...mockState.metamask.preferences,
          smartTransactionsOptInStatus: false, // Add this
        },
        featureFlags: {
          smartTransactionsEnabled: false,
        },
        smartTransactionsFeatureFlags: {
          enabled: false,
        },
        swapsState: {
          swapsFeatureFlags: {
            ethereum: {
              extensionActive: false,
              smartTransactions: {
                expectedDeadline: 45,
                maxDeadline: 150,
                extensionReturnTxHashAsap: false,
              },
            },
            smartTransactions: {
              extensionActive: false,
              mobileActive: false,
            },
          },
        },
      },
    };
    const store = configureStore(disabledPreferenceState);
    renderWithProvider(<SmartTransactionsBannerAlert />, store);

    expect(
      screen.queryByTestId('smart-transactions-banner-alert'),
    ).not.toBeInTheDocument();
  });

  it('dismisses banner when close button or link is clicked', () => {
    const store = configureStore(mockState);

    // Test close button
    const { unmount } = renderWithProvider(
      <SmartTransactionsBannerAlert />,
      store,
    );
    screen.getByRole('button', { name: /close/iu }).click();
    expect(setAlertEnabledness).toHaveBeenCalledWith(
      AlertTypes.smartTransactionsMigration,
      false,
    );

    // Cleanup
    unmount();
    jest.clearAllMocks();

    // Test link
    renderWithProvider(<SmartTransactionsBannerAlert />, store);
    screen.getByText('smartTransactionsEnabledLink').click();
    expect(setAlertEnabledness).toHaveBeenCalledWith(
      AlertTypes.smartTransactionsMigration,
      false,
    );
  });

  it('renders banner when inside ConfirmContext with supported transaction type', () => {
    const store = configureStore(mockState);
    renderWithConfirmContext(<SmartTransactionsBannerAlert />, store);

    expect(
      screen.getByTestId('smart-transactions-banner-alert'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('smartTransactionsEnabledTitle'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('smartTransactionsEnabledDescription'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('smartTransactionsEnabledLink'),
    ).toBeInTheDocument();
  });

  it('does not render banner for unsupported transaction types', () => {
    const store = configureStore(mockState);
    const unsupportedConfirmation: TestConfirmContextValue = {
      currentConfirmation: {
        type: TransactionType.signTypedData,
        id: '2',
      } as SignatureRequestType,
      isScrollToBottomCompleted: true,
      setIsScrollToBottomCompleted: () => undefined,
    };

    renderWithConfirmContext(
      <SmartTransactionsBannerAlert />,
      store,
      unsupportedConfirmation,
    );

    expect(
      screen.queryByTestId('smart-transactions-banner-alert'),
    ).not.toBeInTheDocument();
  });

  describe('margin style tests', () => {
    const store = configureStore(mockState);

    it('applies no styles with default margin type', () => {
      renderWithConfirmContext(<SmartTransactionsBannerAlert />, store);
      const alert = screen.getByTestId('smart-transactions-banner-alert');
      expect(alert).not.toHaveStyle({ margin: 0 });
      expect(alert).not.toHaveStyle({ marginTop: 0 });
    });

    it('applies zero margin when marginType is "none"', () => {
      renderWithConfirmContext(
        <SmartTransactionsBannerAlert marginType="none" />,
        store,
      );
      const alert = screen.getByTestId('smart-transactions-banner-alert');
      expect(alert).toHaveStyle({ margin: 0 });
    });

    it('applies zero top margin when marginType is "noTop"', () => {
      renderWithConfirmContext(
        <SmartTransactionsBannerAlert marginType="noTop" />,
        store,
      );
      const alert = screen.getByTestId('smart-transactions-banner-alert');
      expect(alert).toHaveStyle({ marginTop: 0 });
    });

    it('applies only top margin when marginType is "onlyTop"', () => {
      renderWithConfirmContext(
        <SmartTransactionsBannerAlert marginType="onlyTop" />,
        store,
      );
      const alert = screen.getByTestId('smart-transactions-banner-alert');
      expect(alert).toHaveStyle({ margin: '16px 0px 0px 0px' });
    });
  });

  it('handles being outside of ConfirmContext correctly', () => {
    const store = configureStore(mockState);
    renderWithProvider(<SmartTransactionsBannerAlert />, store);

    expect(
      screen.getByTestId('smart-transactions-banner-alert'),
    ).toBeInTheDocument();
  });

  it('automatically dismisses banner when Smart Transactions is manually disabled', () => {
    const store = configureStore({
      metamask: {
        ...mockState.metamask,
        preferences: {
          ...mockState.metamask.preferences,
          smartTransactionsOptInStatus: false,
        },
      },
    });

    jest.clearAllMocks();

    renderWithConfirmContext(<SmartTransactionsBannerAlert />, store);

    expect(setAlertEnabledness).toHaveBeenCalledTimes(1);
    expect(setAlertEnabledness).toHaveBeenCalledWith(
      AlertTypes.smartTransactionsMigration,
      false,
    );
  });
});

import React from 'react';
import { useHistory } from 'react-router-dom';
import {
  renderWithProvider,
  setBackgroundConnection,
} from '../../../test/jest';
import configureStore from '../../store/store';
import { updateTxData } from '../../ducks/confirm-transaction/confirm-transaction.duck';
import {
  getAccountsWithLabels,
  getMetaMaskAccounts,
  getPreferences,
  getSelectedAccount,
  getSelectedAddress,
  getTokenList,
  transactionFeeSelector,
} from '../../selectors';
import {
  fetchEstimatedOptimismL1Fee,
  getIsOptimism,
} from '../../ducks/optimism';
import ConfirmTransactionBase from '.';

jest.mock('react-router-dom', () => {
  return {
    ...jest.requireActual('react-router-dom'),
    useHistory: jest.fn(),
  };
});

jest.mock('../../selectors', () => {
  return {
    ...jest.requireActual('../../selectors'),
    __esModule: true,
    checkNetworkAndAccountSupports1559: jest.fn(),
    doesAddressRequireLedgerHidConnection: jest.fn(),
    getAccountsWithLabels: jest.fn(),
    getAdvancedInlineGasShown: jest.fn(),
    getCustomNonceValue: jest.fn(),
    getIsEthGasPriceFetched: jest.fn(),
    getIsMainnet: jest.fn(),
    getKnownMethodData: jest.fn(),
    getMetaMaskAccounts: jest.fn(),
    getNoGasPriceFetched: jest.fn(),
    getPreferences: jest.fn(),
    getSelectedAccount: jest.fn(),
    getSelectedAddress: jest.fn(),
    getShouldShowFiat: jest.fn(),
    getTokenList: jest.fn(),
    getUseNonceField: jest.fn(),
    getUseTokenDetection: jest.fn(),
    transactionFeeSelector: jest.fn(),
  };
});

jest.mock('../../ducks/optimism', () => {
  return {
    ...jest.requireActual('../../ducks/optimism'),
    __esModule: true,
    fetchEstimatedOptimismL1Fee: jest.fn(),
    getIsOptimism: jest.fn(),
  };
});

const backgroundConnection = {
  getGasFeeEstimatesAndStartPolling: jest.fn(),
  getNextNonce: jest.fn(),
  trackMetaMetricsEvent: jest.fn(),
  trackMetaMetricsPage: jest.fn(),
  tryReverseResolveAddress: jest.fn(),
};

setBackgroundConnection(backgroundConnection);

describe('ConfirmTransactionBase', () => {
  const transactionId = 111111111;
  const fromAddress = '0x1111';
  const account = {
    [fromAddress]: { address: fromAddress },
  };
  const toAddress = '0x2222';
  const store = configureStore({
    confirmTransaction: {
      txData: {
        id: transactionId,
        origin: 'something',
      },
    },
    metamask: {
      accounts: {
        [fromAddress]: account,
      },
      addressBook: {},
      cachedBalances: {},
      ensResolutionsByAddress: {},
      identities: {
        [fromAddress]: {},
      },
      keyrings: [],
      provider: {},
      unapprovedTxs: [
        {
          id: transactionId,
          txParams: {
            from: fromAddress,
            to: toAddress,
            gasPrice: '0x0',
            gas: '0x0',
            value: '0x0',
            data: '0x0',
          },
        },
      ],
    },
  });

  beforeEach(() => {
    useHistory.mockReturnValue({
      listen: jest.fn(),
    });

    getAccountsWithLabels.mockReturnValue([]);
    getMetaMaskAccounts.mockReturnValue({
      [fromAddress]: {
        address: fromAddress,
        balance: '0x0',
      },
    });
    getPreferences.mockReturnValue({});
    getSelectedAccount.mockReturnValue(account);
    getSelectedAddress.mockReturnValue(fromAddress);
    getTokenList.mockReturnValue({});
    transactionFeeSelector.mockReturnValue({
      hexEstimatedL1Fee: '0x0',
      gasEstimationObject: {},
    });

    fetchEstimatedOptimismL1Fee.mockReturnValue(async () => {
      return '0x0';
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('if the current network is Optimism', () => {
    beforeEach(() => {
      getIsOptimism.mockReturnValue(true);
    });

    it('kicks off a request to fetch the L1 fee from Optimism on mount', () => {
      renderWithProvider(<ConfirmTransactionBase />, store);
      expect(fetchEstimatedOptimismL1Fee).toHaveBeenCalled();
    });

    it('kicks off a fresh request to fetch the L1 fee from Optimism when txData is updated', () => {
      renderWithProvider(<ConfirmTransactionBase />, store);
      store.dispatch(
        updateTxData({
          id: transactionId,
          origin: 'something else',
        }),
      );
      expect(fetchEstimatedOptimismL1Fee).toHaveBeenCalledTimes(2);
    });
  });

  describe('if the current network is not Optimism', () => {
    beforeEach(() => {
      getIsOptimism.mockReturnValue(false);
    });

    it('does not kick off a request to fetch the L1 fee from Optimism on mount', () => {
      renderWithProvider(<ConfirmTransactionBase />, store);
      expect(fetchEstimatedOptimismL1Fee).not.toHaveBeenCalled();
    });

    it('does not kick off a fresh request to fetch the L1 fee from Optimism when txData is updated', () => {
      renderWithProvider(<ConfirmTransactionBase />, store);
      store.dispatch(
        updateTxData({
          id: transactionId,
          origin: 'something else',
        }),
      );
      expect(fetchEstimatedOptimismL1Fee).not.toHaveBeenCalled();
    });
  });
});

import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import * as ConfirmTransactionDucks from '../../../ducks/confirm-transaction/confirm-transaction.duck';
import * as Actions from '../../../store/actions';
import _mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { setBackgroundConnection } from '../../../store/background-connection';

import {
  CONFIRM_TRANSACTION_ROUTE,
  DECRYPT_MESSAGE_REQUEST_PATH,
  ENCRYPTION_PUBLIC_KEY_REQUEST_PATH,
} from '../../../helpers/constants/routes';

import ConfirmTransaction from '.';

const mockUseNavigate = jest.fn();
const mockUseParams = jest.fn();

jest.mock('react-router-dom-v5-compat', () => ({
  ...jest.requireActual('react-router-dom-v5-compat'),
  useNavigate: () => mockUseNavigate,
  useParams: () => mockUseParams,
}));

const mockUnapprovedTx = _mockState.metamask.transactions[0];

const middleware = [thunk];

const mockState = {
  metamask: {
    ..._mockState.metamask,
  },
  appState: {
    gasLoadingAnimationIsShowing: false,
  },
  history: {
    mostRecentOverviewPage: '/',
  },
  send: {
    draftTransactions: {},
  },
};

setBackgroundConnection({
  addPollingTokenToAppState: jest.fn(),
  getContractMethodData: jest.fn(),
  removePollingTokenFromAppState: jest.fn(),
  setDefaultHomeActiveTabName: jest.fn(),
});

jest.mock(
  '../../../ducks/confirm-transaction/confirm-transaction.duck',
  () => ({
    setTransactionToConfirm: jest.fn().mockImplementation((txId) => {
      return { type: 'mock-set-transaction-to-confirm', value: txId };
    }),
  }),
);

jest.mock('../../confirm-decrypt-message', () => {
  return {
    __esModule: true,
    default: () => {
      return <div className="mock-confirm-decrypt-message" />;
    },
  };
});

jest.mock('../../confirm-encryption-public-key', () => {
  return {
    __esModule: true,
    default: () => {
      return <div className="mock-confirm-encryption-public-key" />;
    },
  };
});

jest.mock('./confirm-token-transaction-switch', () => {
  return {
    __esModule: true,
    default: () => {
      return <div className="mock-confirm-token-transaction-switch" />;
    },
  };
});
jest.mock('../confirm-transaction-switch', () => {
  return {
    __esModule: true,
    default: () => {
      return <div className="mock-confirm-transaction-switch" />;
    },
  };
});

describe('Confirmation Transaction Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock store actions
    jest
      .spyOn(Actions, 'gasFeeStartPollingByNetworkClientId')
      .mockResolvedValue(null);

    // Set up default router mocks
    mockUseParams.mockReturnValue({ id: mockUnapprovedTx.id });
  });

  it('should display the Loading component when the transaction is invalid', () => {
    const mockStore = configureMockStore(middleware)({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        transactions: [],
      },
    });
    const { container } = renderWithProvider(<ConfirmTransaction />, mockStore);

    expect(container.querySelector('.loading-overlay')).toBeInTheDocument();
    expect(container.querySelector('.loading-overlay')).toMatchSnapshot();
  });

  it('should not display the Loading component when the transaction is valid', () => {
    const mockStore = configureMockStore(middleware)({ ...mockState });
    const { container } = renderWithProvider(<ConfirmTransaction />, mockStore);
    expect(container.querySelector('.loading-overlay')).toBeNull();
  });

  [
    [DECRYPT_MESSAGE_REQUEST_PATH, '.mock-confirm-decrypt-message'],
    [ENCRYPTION_PUBLIC_KEY_REQUEST_PATH, '.mock-confirm-encryption-public-key'],
  ].forEach(([componentPath, mockClassNameMatch]) => {
    it(`should render "${componentPath}" route`, () => {
      const mockStore = configureMockStore(middleware)(mockState);
      const { container } = renderWithProvider(
        <ConfirmTransaction />,
        mockStore,
        `${CONFIRM_TRANSACTION_ROUTE}/${mockUnapprovedTx.id}${componentPath}`,
      );

      expect(container.querySelector(mockClassNameMatch)).toBeInTheDocument();
    });
  });

  it(`should render ConfirmTransactionSwitch component if the route path is unmatched and the transaction is valid`, () => {
    const mockStore = configureMockStore(middleware)(mockState);
    const { container } = renderWithProvider(
      <ConfirmTransaction />,
      mockStore,
      `/unknown-path`,
    );

    expect(
      container.querySelector('.mock-confirm-transaction-switch'),
    ).toBeInTheDocument();
  });

  describe('initialization', () => {
    it('should poll for gas estimates', () => {
      const mockStore = configureMockStore(middleware)(mockState);
      const gasEstimationPollingSpy = jest
        .spyOn(Actions, 'gasFeeStartPollingByNetworkClientId')
        .mockResolvedValue(null);

      renderWithProvider(<ConfirmTransaction />, mockStore);

      expect(gasEstimationPollingSpy).toHaveBeenCalled();
    });

    it('should call setTransactionToConfirm if transaction id is provided', () => {
      const mockStore = configureMockStore(middleware)({ ...mockState });
      ConfirmTransactionDucks.setTransactionToConfirm.mockClear();

      renderWithProvider(<ConfirmTransaction />, mockStore);

      expect(
        ConfirmTransactionDucks.setTransactionToConfirm,
      ).toHaveBeenCalled();
    });

    it('should not call setTransactionToConfirm when transaction id is not provided', () => {
      const mockStore = configureMockStore(middleware)({
        ...mockState,
        metamask: { ...mockState.metamask, transactions: [] },
      });
      mockUseParams.mockReturnValue({ id: null });
      ConfirmTransactionDucks.setTransactionToConfirm.mockClear();

      renderWithProvider(<ConfirmTransaction />, mockStore);

      expect(
        ConfirmTransactionDucks.setTransactionToConfirm,
      ).not.toHaveBeenCalled();
    });

    describe('when unapproved transactions exist or a sendTo recipient exists', () => {
      it('should not call navigate with replace option', () => {
        const mockStore = configureMockStore(middleware)(mockState);

        renderWithProvider(<ConfirmTransaction />, mockStore);
        expect(mockUseNavigate).not.toHaveBeenCalled();
      });
    });
  });
});

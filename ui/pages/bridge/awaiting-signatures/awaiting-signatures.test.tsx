import React from 'react';
import { act, waitFor } from '@testing-library/react';
import { Reducer, AnyAction } from 'redux';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import configureStore, { MetaMaskReduxState } from '../../../store/store';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import {
  createBridgeMockStore,
  MOCK_EVM_ACCOUNT,
} from '../../../../test/data/bridge/mock-bridge-store';
import {
  AWAITING_SIGNATURES_ROUTE,
  DEFAULT_ROUTE,
  CROSS_CHAIN_SWAP_ROUTE,
} from '../../../helpers/constants/routes';
import AwaitingSignatures from './awaiting-signatures';

const mockUseNavigate = jest.fn();
const mockUseLocation = jest.fn();

jest.mock('react-router-dom', () => {
  return {
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockUseNavigate,
    useLocation: () => mockUseLocation(),
  };
});

const middleware = [thunk];

describe('AwaitingSignatures', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocation.mockReturnValue({
      pathname: `${CROSS_CHAIN_SWAP_ROUTE}${AWAITING_SIGNATURES_ROUTE}`,
      search: '',
      hash: '',
      state: null,
    });
  });

  describe('navigation on successful transaction', () => {
    it('navigates to activity when transaction is in bridge history', async () => {
      const requestId = 'test-request-id-123';
      const bridgeMockStore = createBridgeMockStore({
        bridgeStatusStateOverrides: {
          txHistory: {
            'tx-meta-id-123': {
              quote: {
                requestId,
              },
              account: MOCK_EVM_ACCOUNT.address,
            },
          },
        },
      });
      const store = configureMockStore(middleware)(bridgeMockStore);

      mockUseLocation.mockReturnValue({
        pathname: `${CROSS_CHAIN_SWAP_ROUTE}${AWAITING_SIGNATURES_ROUTE}`,
        search: `?requestId=${encodeURIComponent(requestId)}`,
        hash: '',
        state: null,
      });

      renderWithProvider(
        <AwaitingSignatures />,
        store,
        `${CROSS_CHAIN_SWAP_ROUTE}${AWAITING_SIGNATURES_ROUTE}?requestId=${encodeURIComponent(requestId)}`,
      );

      await waitFor(() => {
        expect(mockUseNavigate).toHaveBeenCalledWith(
          `${DEFAULT_ROUTE}?tab=activity`,
          {
            replace: true,
            state: { stayOnHomePage: true },
          },
        );
      });
    });

    it('does not navigate when transaction is not in history', () => {
      const requestId = 'test-request-id-456';
      const bridgeMockStore = createBridgeMockStore({
        bridgeStatusStateOverrides: {
          txHistory: {},
        },
      });
      const store = configureMockStore(middleware)(bridgeMockStore);

      mockUseLocation.mockReturnValue({
        pathname: `${CROSS_CHAIN_SWAP_ROUTE}${AWAITING_SIGNATURES_ROUTE}`,
        search: `?requestId=${encodeURIComponent(requestId)}`,
        hash: '',
        state: null,
      });

      renderWithProvider(
        <AwaitingSignatures />,
        store,
        `${CROSS_CHAIN_SWAP_ROUTE}${AWAITING_SIGNATURES_ROUTE}?requestId=${encodeURIComponent(requestId)}`,
      );

      expect(mockUseNavigate).not.toHaveBeenCalled();
    });
  });

  describe('navigation on QR scan cancellation', () => {
    it('navigates to activity when QR scan is cancelled', async () => {
      const requestId = 'test-request-id-789';
      const pathname = `${CROSS_CHAIN_SWAP_ROUTE}${AWAITING_SIGNATURES_ROUTE}?requestId=${encodeURIComponent(requestId)}`;

      mockUseLocation.mockReturnValue({
        pathname: `${CROSS_CHAIN_SWAP_ROUTE}${AWAITING_SIGNATURES_ROUTE}`,
        search: `?requestId=${encodeURIComponent(requestId)}`,
        hash: '',
        state: null,
      });

      // Create initial state with QR scan active
      const initialBridgeMockStore = createBridgeMockStore({
        bridgeStatusStateOverrides: {
          txHistory: {},
        },
        metamaskStateOverrides: {
          activeQrCodeScanRequest: {
            type: 'sign',
            request: {
              requestId: 'qr-request-id',
            },
          },
        },
      });

      // Create real store with custom reducer to allow state updates
      const store = configureStore(initialBridgeMockStore);

      // Custom reducer to handle state updates
      const reducer: Reducer<MetaMaskReduxState, AnyAction> = (
        reduxState,
        action,
      ) => {
        const storeState = reduxState ?? store.getState();

        if (action.type === 'TEST_UPDATE_QR_SCAN_REQUEST') {
          return {
            ...storeState,
            metamask: {
              ...storeState.metamask,
              activeQrCodeScanRequest: action.payload,
            },
          };
        }
        // For other actions, use the original reducer logic
        // Since we can't easily access the original reducer, we'll just return current state
        // This is acceptable for this test since we only need to test the QR scan cancellation
        return storeState;
      };

      store.replaceReducer(reducer);

      // Render with initial state (QR scan active)
      renderWithProvider(<AwaitingSignatures />, store, pathname);

      // Wait for initial render to complete and ref to be set
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      // Update store to clear QR scan request (simulating cancellation)
      await act(async () => {
        store.dispatch({
          type: 'TEST_UPDATE_QR_SCAN_REQUEST',
          payload: null,
        });
      });

      await waitFor(() => {
        expect(mockUseNavigate).toHaveBeenCalledWith(
          `${DEFAULT_ROUTE}?tab=activity`,
          {
            replace: true,
            state: { stayOnHomePage: true },
          },
        );
      });
    });

    it('does not navigate when QR scan is still active', () => {
      const requestId = 'test-request-id-abc';
      const bridgeMockStore = createBridgeMockStore({
        bridgeStatusStateOverrides: {
          txHistory: {},
        },
        metamaskStateOverrides: {
          activeQrCodeScanRequest: {
            type: 'sign',
            request: {
              requestId: 'qr-request-id',
            },
          },
        },
      });
      const store = configureMockStore(middleware)(bridgeMockStore);

      mockUseLocation.mockReturnValue({
        pathname: `${CROSS_CHAIN_SWAP_ROUTE}${AWAITING_SIGNATURES_ROUTE}`,
        search: `?requestId=${encodeURIComponent(requestId)}`,
        hash: '',
        state: null,
      });

      renderWithProvider(
        <AwaitingSignatures />,
        store,
        `${CROSS_CHAIN_SWAP_ROUTE}${AWAITING_SIGNATURES_ROUTE}?requestId=${encodeURIComponent(requestId)}`,
      );

      expect(mockUseNavigate).not.toHaveBeenCalled();
    });

    it('does not navigate on initial load when QR scan was never active', () => {
      const requestId = 'test-request-id-def';
      const bridgeMockStore = createBridgeMockStore({
        bridgeStatusStateOverrides: {
          txHistory: {},
        },
        metamaskStateOverrides: {
          activeQrCodeScanRequest: null,
        },
      });
      const store = configureMockStore(middleware)(bridgeMockStore);

      mockUseLocation.mockReturnValue({
        pathname: `${CROSS_CHAIN_SWAP_ROUTE}${AWAITING_SIGNATURES_ROUTE}`,
        search: `?requestId=${encodeURIComponent(requestId)}`,
        hash: '',
        state: null,
      });

      renderWithProvider(
        <AwaitingSignatures />,
        store,
        `${CROSS_CHAIN_SWAP_ROUTE}${AWAITING_SIGNATURES_ROUTE}?requestId=${encodeURIComponent(requestId)}`,
      );

      expect(mockUseNavigate).not.toHaveBeenCalled();
    });

    it('does not navigate when between approval and bridge steps in two-step flow', () => {
      const requestId = 'test-request-id-two-step';
      const bridgeMockStore = createBridgeMockStore({
        bridgeStatusStateOverrides: {
          txHistory: {
            'tx-meta-id-approval': {
              quote: {
                requestId,
              },
              approvalTxId: 'approval-tx-id-123',
              account: MOCK_EVM_ACCOUNT.address,
            },
          },
        },
        metamaskStateOverrides: {
          activeQrCodeScanRequest: null,
        },
      });
      const store = configureMockStore(middleware)(bridgeMockStore);

      mockUseLocation.mockReturnValue({
        pathname: `${CROSS_CHAIN_SWAP_ROUTE}${AWAITING_SIGNATURES_ROUTE}`,
        search: `?requestId=${encodeURIComponent(requestId)}`,
        hash: '',
        state: null,
      });

      renderWithProvider(
        <AwaitingSignatures />,
        store,
        `${CROSS_CHAIN_SWAP_ROUTE}${AWAITING_SIGNATURES_ROUTE}?requestId=${encodeURIComponent(requestId)}`,
      );

      // Should not navigate because we're between approval and bridge steps
      expect(mockUseNavigate).not.toHaveBeenCalled();
    });

    it('does not navigate when there is no requestId in URL', () => {
      const bridgeMockStore = createBridgeMockStore({
        bridgeStatusStateOverrides: {
          txHistory: {},
        },
        metamaskStateOverrides: {
          activeQrCodeScanRequest: null,
        },
      });
      const store = configureMockStore(middleware)(bridgeMockStore);

      mockUseLocation.mockReturnValue({
        pathname: `${CROSS_CHAIN_SWAP_ROUTE}${AWAITING_SIGNATURES_ROUTE}`,
        search: '',
        hash: '',
        state: null,
      });

      renderWithProvider(
        <AwaitingSignatures />,
        store,
        `${CROSS_CHAIN_SWAP_ROUTE}${AWAITING_SIGNATURES_ROUTE}`,
      );

      expect(mockUseNavigate).not.toHaveBeenCalled();
    });
  });

  describe('navigation on fullscreen-initiated failure', () => {
    it('navigates to activity when QR scan is cleared in fullscreen mode (activeQuote still present)', async () => {
      const requestId = 'test-request-id-fullscreen';
      const pathname = `${CROSS_CHAIN_SWAP_ROUTE}${AWAITING_SIGNATURES_ROUTE}?requestId=${encodeURIComponent(requestId)}`;

      mockUseLocation.mockReturnValue({
        pathname: `${CROSS_CHAIN_SWAP_ROUTE}${AWAITING_SIGNATURES_ROUTE}`,
        search: `?requestId=${encodeURIComponent(requestId)}`,
        hash: '',
        state: null,
      });

      // Create initial state with QR scan active and activeQuote present (fullscreen mode)
      // In fullscreen mode, activeQuote doesn't get cleared when transaction fails
      // Note: activeQuote is computed by selector from bridge controller state
      const initialBridgeMockStore = createBridgeMockStore({
        bridgeStatusStateOverrides: {
          txHistory: {},
        },
        bridgeStateOverrides: {
          // activeQuote is a computed property from the bridge controller selector
          // We need to set it for the test, using Record to allow the property
          activeQuote: {
            quote: {
              requestId,
            },
            sentAmount: {
              amount: '100',
            },
          },
        } as Record<string, unknown>,
        metamaskStateOverrides: {
          activeQrCodeScanRequest: {
            type: 'sign',
            request: {
              requestId: 'qr-request-id',
            },
          },
        },
      });

      // Create real store with custom reducer to allow state updates
      const store = configureStore(initialBridgeMockStore);

      // Custom reducer to handle state updates
      const reducer: Reducer<MetaMaskReduxState, AnyAction> = (
        reduxState,
        action,
      ) => {
        const storeState = reduxState ?? store.getState();

        if (action.type === 'TEST_UPDATE_QR_SCAN_REQUEST') {
          return {
            ...storeState,
            metamask: {
              ...storeState.metamask,
              activeQrCodeScanRequest: action.payload,
            },
          };
        }
        return storeState;
      };

      store.replaceReducer(reducer);

      // Render with initial state (QR scan active, activeQuote present)
      renderWithProvider(<AwaitingSignatures />, store, pathname);

      // Wait for initial render to complete and refs to be set
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      // Update store to clear QR scan request (simulating failure in fullscreen)
      // Note: activeQuote remains present in fullscreen mode (unlike popup mode)
      await act(async () => {
        store.dispatch({
          type: 'TEST_UPDATE_QR_SCAN_REQUEST',
          payload: null,
        });
      });

      await waitFor(() => {
        expect(mockUseNavigate).toHaveBeenCalledWith(
          `${DEFAULT_ROUTE}?tab=activity`,
          {
            replace: true,
            state: { stayOnHomePage: true },
          },
        );
      });
    });
  });
});

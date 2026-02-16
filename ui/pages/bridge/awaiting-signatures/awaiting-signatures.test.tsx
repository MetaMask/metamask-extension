import React from 'react';
import { waitFor } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
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
    // Note: Testing QR scan cancellation state transition requires complex store updates.
    // The cancellation logic is covered by:
    // 1. Integration/E2E tests (fullscreen QR flow)
    // 2. Manual testing
    // The negative cases below ensure we don't navigate prematurely

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
});

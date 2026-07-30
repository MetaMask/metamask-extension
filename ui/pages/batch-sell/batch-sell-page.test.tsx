import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  BATCH_SELL_ROOT_ROUTE,
  BATCH_SELL_SELECT_ROUTE,
  DEFAULT_ROUTE,
} from '../../helpers/constants/routes';
import { resetBridgeController } from '../../ducks/bridge/actions';
import { useDispatch } from '../../store/hooks';
import BatchSellPage from './batch-sell-page';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
}));

jest.mock('../../store/hooks', () => ({
  useDispatch: jest.fn(),
}));

jest.mock('../../ducks/bridge/actions', () => ({
  resetBridgeController: jest.fn(() => ({
    type: 'RESET_BRIDGE_CONTROLLER',
  })),
}));

// Thin stubs: this suite only cares about BatchSellPage's own behavior
// (feature-flag gating and the popup-close cleanup), not what each sub-page
// renders.
jest.mock('./pages/select/batch-sell-select-page', () => ({
  BatchSellSelectPage: () => <div data-testid="batch-sell-select-page" />,
}));
jest.mock('./pages/review/batch-sell-review-page', () => ({
  BatchSellReviewPage: () => <div data-testid="batch-sell-review-page" />,
}));
jest.mock('./providers/batch-sell-info-modal-provider', () => ({
  BatchSellInfoModalProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));
jest.mock('./providers/batch-sell-selection-provider', () => ({
  BatchSellSelectionProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

const mockDispatch = jest.fn();
const mockUseSelector = jest.mocked(useSelector);
const mockUseDispatch = jest.mocked(useDispatch);

const renderBatchSellPage = (pathname: string = BATCH_SELL_SELECT_ROUTE) =>
  render(
    <MemoryRouter
      initialEntries={[pathname]}
      future={{
        // eslint-disable-next-line @typescript-eslint/naming-convention
        v7_startTransition: true,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        <Route
          path={`${BATCH_SELL_ROOT_ROUTE}/*`}
          element={<BatchSellPage />}
        />
        <Route path={DEFAULT_ROUTE} element={<div data-testid="home" />} />
      </Routes>
    </MemoryRouter>,
  );

describe('BatchSellPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseDispatch.mockReturnValue(mockDispatch as never);
    // Only selector BatchSellPage itself reads directly is the batch-sell
    // feature flag; the mocked sub-pages/providers don't read from the store.
    mockUseSelector.mockReturnValue(true);
  });

  it('renders the batch sell flow when the feature is enabled', () => {
    const { getByTestId } = renderBatchSellPage();

    expect(getByTestId('batch-sell-select-page')).toBeInTheDocument();
  });

  it('redirects home when the batch sell feature flag is disabled', () => {
    mockUseSelector.mockReturnValue(false);

    const { getByTestId } = renderBatchSellPage();

    expect(getByTestId('home')).toBeInTheDocument();
  });

  describe('on popup close', () => {
    it('dispatches resetBridgeController so a stale batch-sell quote does not leak into the next popup session', () => {
      renderBatchSellPage();

      fireEvent(window, new Event('beforeunload'));

      expect(resetBridgeController).toHaveBeenCalled();
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'RESET_BRIDGE_CONTROLLER',
      });
    });
  });
});

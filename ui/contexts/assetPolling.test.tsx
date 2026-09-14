import React, { useContext, useEffect } from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import * as redux from 'react-redux';
import useCurrencyRatePolling from '../hooks/useCurrencyRatePolling';
import useTokenDetectionPolling from '../hooks/useTokenDetectionPolling';
import useStaticTokensPollingHook from '../hooks/useStaticTokensPolling';
import useDeFiPolling from '../hooks/defi/useDeFiPolling';
import { useArcDefaultTokens } from '../hooks/useArcDefaultTokens';
import {
  AssetPollingContext,
  AssetPollingContextValue,
  AssetPollingProvider,
} from './assetPolling';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
}));
jest.mock('../hooks/useCurrencyRatePolling');
jest.mock('../hooks/useTokenDetectionPolling');
jest.mock('../hooks/useStaticTokensPolling');
jest.mock('../hooks/defi/useDeFiPolling');
jest.mock('../hooks/useArcDefaultTokens');

const mockUseSelector = jest.mocked(redux.useSelector);

const mockUseCurrencyRatePolling = jest.mocked(useCurrencyRatePolling);
const mockUseTokenDetectionPolling = jest.mocked(useTokenDetectionPolling);
const mockUseStaticTokensPollingHook = jest.mocked(useStaticTokensPollingHook);
const mockUseDeFiPolling = jest.mocked(useDeFiPolling);
const mockUseArcDefaultTokens = jest.mocked(useArcDefaultTokens);

const renderProvider = (isAssetsUnifyStateEnabled: boolean) => {
  mockUseSelector.mockReturnValue(isAssetsUnifyStateEnabled);

  return render(
    <AssetPollingProvider>
      <div data-testid="child">child</div>
    </AssetPollingProvider>,
  );
};

describe('AssetPollingProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (mockUseCurrencyRatePolling as jest.Mock).mockImplementation(
      () => undefined,
    );
    mockUseTokenDetectionPolling.mockReturnValue({});
    mockUseStaticTokensPollingHook.mockReturnValue({});
    mockUseDeFiPolling.mockReturnValue({});
    mockUseArcDefaultTokens.mockImplementation(() => undefined);
  });

  it('always renders children regardless of feature flag', () => {
    renderProvider(false);
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('always renders children when assets-unify-state is enabled', () => {
    renderProvider(true);
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  describe('when assets-unify-state is disabled', () => {
    beforeEach(() => {
      renderProvider(false);
    });

    it('calls all polling hooks', () => {
      expect(mockUseCurrencyRatePolling).toHaveBeenCalledTimes(1);
      expect(mockUseTokenDetectionPolling).toHaveBeenCalledTimes(1);
      expect(mockUseDeFiPolling).toHaveBeenCalledTimes(1);
      expect(mockUseStaticTokensPollingHook).toHaveBeenCalledTimes(1);
      expect(mockUseArcDefaultTokens).not.toHaveBeenCalled();
    });
  });

  describe('when assets-unify-state is enabled', () => {
    beforeEach(() => {
      renderProvider(true);
    });

    it('calls only AssetsControllerPolling hooks', () => {
      expect(mockUseDeFiPolling).toHaveBeenCalledTimes(1);
      expect(mockUseStaticTokensPollingHook).toHaveBeenCalledTimes(1);
      expect(mockUseArcDefaultTokens).toHaveBeenCalledTimes(1);

      expect(mockUseCurrencyRatePolling).not.toHaveBeenCalled();
      expect(mockUseTokenDetectionPolling).not.toHaveBeenCalled();
    });
  });

  describe('context value memoization', () => {
    it('provides a stable context value object across re-renders', () => {
      jest.spyOn(redux, 'useSelector').mockReturnValue(false);

      const capturedValues: AssetPollingContextValue[] = [];

      const TestConsumer = () => {
        const ctx = useContext(AssetPollingContext);
        useEffect(() => {
          capturedValues.push(ctx);
        });
        return null;
      };

      const { rerender } = render(
        <AssetPollingProvider>
          <TestConsumer />
        </AssetPollingProvider>,
      );

      rerender(
        <AssetPollingProvider>
          <TestConsumer />
        </AssetPollingProvider>,
      );

      expect(capturedValues.length).toBeGreaterThanOrEqual(2);
      expect(capturedValues[0]).toBe(capturedValues[1]);
    });
  });
});

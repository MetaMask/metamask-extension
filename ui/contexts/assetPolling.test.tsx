import React, { useContext, useEffect } from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import * as redux from 'react-redux';
import useCurrencyRatePolling from '../hooks/useCurrencyRatePolling';
import useTokenRatesPolling from '../hooks/useTokenRatesPolling';
import useTokenDetectionPolling from '../hooks/useTokenDetectionPolling';
import useTokenListPolling from '../hooks/useTokenListPolling';
import useStaticTokensPollingHook from '../hooks/useStaticTokensPolling';
import useDeFiPolling from '../hooks/defi/useDeFiPolling';
import useMultichainAssetsRatesPolling from '../hooks/useMultichainAssetsRatesPolling';
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
jest.mock('../hooks/useTokenRatesPolling');
jest.mock('../hooks/useTokenDetectionPolling');
jest.mock('../hooks/useTokenListPolling');
jest.mock('../hooks/useStaticTokensPolling');
jest.mock('../hooks/defi/useDeFiPolling');
jest.mock('../hooks/useMultichainAssetsRatesPolling');
jest.mock('../hooks/useArcDefaultTokens');

const mockUseSelector = jest.mocked(redux.useSelector);

const mockUseCurrencyRatePolling = jest.mocked(useCurrencyRatePolling);
const mockUseTokenRatesPolling = jest.mocked(useTokenRatesPolling);
const mockUseTokenDetectionPolling = jest.mocked(useTokenDetectionPolling);
const mockUseTokenListPolling = jest.mocked(useTokenListPolling);
const mockUseStaticTokensPollingHook = jest.mocked(useStaticTokensPollingHook);
const mockUseDeFiPolling = jest.mocked(useDeFiPolling);
const mockUseMultichainAssetsRatesPolling = jest.mocked(
  useMultichainAssetsRatesPolling,
);
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
    (mockUseTokenRatesPolling as jest.Mock).mockImplementation(() => undefined);
    mockUseTokenDetectionPolling.mockReturnValue({});
    (mockUseTokenListPolling as jest.Mock).mockImplementation(() => undefined);
    mockUseStaticTokensPollingHook.mockReturnValue({});
    mockUseDeFiPolling.mockReturnValue({});
    (mockUseMultichainAssetsRatesPolling as jest.Mock).mockImplementation(
      () => undefined,
    );
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
      expect(mockUseTokenRatesPolling).toHaveBeenCalledTimes(1);
      expect(mockUseTokenDetectionPolling).toHaveBeenCalledTimes(1);
      expect(mockUseTokenListPolling).toHaveBeenCalledTimes(1);
      expect(mockUseDeFiPolling).toHaveBeenCalledTimes(1);
      expect(mockUseMultichainAssetsRatesPolling).toHaveBeenCalledTimes(1);
      expect(mockUseStaticTokensPollingHook).toHaveBeenCalledTimes(1);
      expect(mockUseArcDefaultTokens).not.toHaveBeenCalled();
    });
  });

  describe('when assets-unify-state is enabled', () => {
    beforeEach(() => {
      renderProvider(true);
    });

    it('calls only AssetsControllerPolling hooks', () => {
      expect(mockUseTokenListPolling).toHaveBeenCalledTimes(1);
      expect(mockUseDeFiPolling).toHaveBeenCalledTimes(1);
      expect(mockUseStaticTokensPollingHook).toHaveBeenCalledTimes(1);
      expect(mockUseArcDefaultTokens).toHaveBeenCalledTimes(1);

      expect(mockUseCurrencyRatePolling).not.toHaveBeenCalled();
      expect(mockUseTokenRatesPolling).not.toHaveBeenCalled();
      expect(mockUseTokenDetectionPolling).not.toHaveBeenCalled();
      expect(mockUseMultichainAssetsRatesPolling).not.toHaveBeenCalled();
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

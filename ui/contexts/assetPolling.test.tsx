import React, { useContext, useEffect } from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import useStaticTokensPollingHook from '../hooks/useStaticTokensPolling';
import useDeFiPolling from '../hooks/defi/useDeFiPolling';
import {
  AssetPollingContext,
  AssetPollingContextValue,
  AssetPollingProvider,
} from './assetPolling';

jest.mock('../hooks/useStaticTokensPolling');
jest.mock('../hooks/defi/useDeFiPolling');

const mockUseStaticTokensPollingHook = jest.mocked(useStaticTokensPollingHook);
const mockUseDeFiPolling = jest.mocked(useDeFiPolling);

const renderProvider = () => {
  return render(
    <AssetPollingProvider>
      <div data-testid="child">child</div>
    </AssetPollingProvider>,
  );
};

describe('AssetPollingProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseStaticTokensPollingHook.mockReturnValue({});
    mockUseDeFiPolling.mockReturnValue({});
  });

  it('always renders children', () => {
    renderProvider();
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('calls AssetsControllerPolling hooks', () => {
    renderProvider();

    expect(mockUseDeFiPolling).toHaveBeenCalledTimes(1);
    expect(mockUseStaticTokensPollingHook).toHaveBeenCalledTimes(1);
  });

  describe('context value memoization', () => {
    it('provides a stable context value object across re-renders', () => {
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

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AssetPollingProvider } from './assetPolling';

jest.mock('../hooks/useCurrencyRatePolling', () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock('../hooks/useTokenRatesPolling', () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock('../hooks/useTokenDetectionPolling', () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock('../hooks/useTokenListPolling', () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock('../hooks/useStaticTokensPolling', () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock('../hooks/defi/useDeFiPolling', () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock('../hooks/useMultichainAssetsRatesPolling', () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock('../hooks/useTokenBalances', () => ({
  useTokenBalances: jest.fn(),
}));

const useCurrencyRatePolling = jest.requireMock(
  '../hooks/useCurrencyRatePolling',
).default;
const useTokenRatesPolling = jest.requireMock(
  '../hooks/useTokenRatesPolling',
).default;
const useTokenDetectionPolling = jest.requireMock(
  '../hooks/useTokenDetectionPolling',
).default;
const useTokenListPolling = jest.requireMock(
  '../hooks/useTokenListPolling',
).default;
const useStaticTokensPollingHook = jest.requireMock(
  '../hooks/useStaticTokensPolling',
).default;
const useDeFiPolling = jest.requireMock('../hooks/defi/useDeFiPolling').default;
const useMultichainAssetsRatesPolling = jest.requireMock(
  '../hooks/useMultichainAssetsRatesPolling',
).default;
const { useTokenBalances } = jest.requireMock('../hooks/useTokenBalances');

describe('AssetPollingProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders children', () => {
    render(
      <AssetPollingProvider>
        <div data-testid="child">Child content</div>
      </AssetPollingProvider>,
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  it('calls all polling hooks when mounted', () => {
    render(
      <AssetPollingProvider>
        <div>Child</div>
      </AssetPollingProvider>,
    );

    expect(useCurrencyRatePolling).toHaveBeenCalled();
    expect(useTokenRatesPolling).toHaveBeenCalled();
    expect(useTokenDetectionPolling).toHaveBeenCalled();
    expect(useTokenBalances).toHaveBeenCalled();
    expect(useTokenListPolling).toHaveBeenCalled();
    expect(useDeFiPolling).toHaveBeenCalled();
    expect(useMultichainAssetsRatesPolling).toHaveBeenCalled();
    expect(useStaticTokensPollingHook).toHaveBeenCalled();
  });

  it('calls useTokenBalances with default options (no chainIds, uses enabled chains from store)', () => {
    render(
      <AssetPollingProvider>
        <div>Child</div>
      </AssetPollingProvider>,
    );

    expect(useTokenBalances).toHaveBeenCalledWith();
  });
});

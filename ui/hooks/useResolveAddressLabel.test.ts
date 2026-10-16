import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AddressScanResultType } from '@metamask/phishing-controller';
import { fetchEvmAddressScan } from '../../shared/lib/bridge-utils/security-alerts-api.util';
import { useResolveAddressLabel } from './useResolveAddressLabel';

jest.mock('../../shared/lib/bridge-utils/security-alerts-api.util', () => ({
  ...jest.requireActual(
    '../../shared/lib/bridge-utils/security-alerts-api.util',
  ),
  fetchEvmAddressScan: jest.fn(),
}));

let mockIsExternalServicesEnabled = true;

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: () => mockIsExternalServicesEnabled,
}));

jest.mock('../selectors', () => ({
  getUseExternalServices: jest.fn(),
}));

const mockFetchEvmAddressScan = jest.mocked(fetchEvmAddressScan);

const relayAddress = '0xf70da97812cb96acdf810712aa562db8dfa3dbef';
const arbitrum = 'eip155:42161';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children,
    );
  };
}

describe('useResolveAddressLabel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsExternalServicesEnabled = true;
  });

  it('returns an empty string until the scan resolves, then the label', async () => {
    mockFetchEvmAddressScan.mockResolvedValue({
      // eslint-disable-next-line @typescript-eslint/naming-convention
      result_type: AddressScanResultType.Benign,
      label: 'Relay',
    });

    const { result } = renderHook(
      () =>
        useResolveAddressLabel()({ address: relayAddress, chainId: arbitrum }),
      { wrapper: createWrapper() },
    );

    expect(result.current).toBe('');
    await waitFor(() => expect(result.current).toBe('Relay'));
    expect(mockFetchEvmAddressScan).toHaveBeenCalledWith(
      arbitrum,
      relayAddress,
    );
  });

  it('returns an empty string for malicious addresses', async () => {
    mockFetchEvmAddressScan.mockResolvedValue({
      // eslint-disable-next-line @typescript-eslint/naming-convention
      result_type: AddressScanResultType.Malicious,
      label: 'Relay',
    });

    const { result } = renderHook(
      () =>
        useResolveAddressLabel()({ address: relayAddress, chainId: arbitrum }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(mockFetchEvmAddressScan).toHaveBeenCalled());
    expect(result.current).toBe('');
  });

  it('does not fetch when external services are disabled', () => {
    mockIsExternalServicesEnabled = false;

    const { result } = renderHook(
      () =>
        useResolveAddressLabel()({ address: relayAddress, chainId: arbitrum }),
      { wrapper: createWrapper() },
    );

    expect(result.current).toBe('');
    expect(mockFetchEvmAddressScan).not.toHaveBeenCalled();
  });

  it('returns an already cached label on the first render', async () => {
    mockFetchEvmAddressScan.mockResolvedValue({
      // eslint-disable-next-line @typescript-eslint/naming-convention
      result_type: AddressScanResultType.Benign,
      label: 'Relay',
    });
    const wrapper = createWrapper();

    const first = renderHook(
      () =>
        useResolveAddressLabel()({ address: relayAddress, chainId: arbitrum }),
      { wrapper },
    );
    await waitFor(() => expect(first.result.current).toBe('Relay'));

    const second = renderHook(
      () =>
        useResolveAddressLabel()({ address: relayAddress, chainId: arbitrum }),
      { wrapper },
    );

    expect(second.result.current).toBe('Relay');
    expect(mockFetchEvmAddressScan).toHaveBeenCalledTimes(1);
  });

  it('does not fetch without an address', () => {
    const { result } = renderHook(
      () => useResolveAddressLabel()({ chainId: arbitrum }),
      { wrapper: createWrapper() },
    );

    expect(result.current).toBe('');
    expect(mockFetchEvmAddressScan).not.toHaveBeenCalled();
  });

  it('does not fetch for non-EVM chains', () => {
    const { result } = renderHook(
      () =>
        useResolveAddressLabel()({
          address: 'So11111111111111111111111111111111111111112',
          chainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
        }),
      { wrapper: createWrapper() },
    );

    expect(result.current).toBe('');
    expect(mockFetchEvmAddressScan).not.toHaveBeenCalled();
  });

  it('dedupes requests for the same address', async () => {
    mockFetchEvmAddressScan.mockResolvedValue({
      // eslint-disable-next-line @typescript-eslint/naming-convention
      result_type: AddressScanResultType.Benign,
      label: 'Relay',
    });
    const wrapper = createWrapper();

    renderHook(
      () =>
        useResolveAddressLabel()({ address: relayAddress, chainId: arbitrum }),
      { wrapper },
    );
    renderHook(
      () =>
        useResolveAddressLabel()({
          address: relayAddress.toUpperCase().replace('0X', '0x'),
          chainId: arbitrum,
        }),
      { wrapper },
    );

    await waitFor(() => expect(mockFetchEvmAddressScan).toHaveBeenCalled());
    expect(mockFetchEvmAddressScan).toHaveBeenCalledTimes(1);
  });
});

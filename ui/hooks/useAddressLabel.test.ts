import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AddressScanResultType } from '@metamask/phishing-controller';
import { useSelector } from 'react-redux';
import { fetchEvmAddressScan } from '#shared/lib/bridge-utils/security-alerts-api.util';
import {
  getIsAddressResolutionEnabled,
  getUseExternalServices,
} from '../selectors';
import { useAddressLabel } from './useAddressLabel';

let mockIsSecurityAlertsAPIEnabled = true;

jest.mock('#shared/lib/bridge-utils/security-alerts-api.util', () => ({
  ...jest.requireActual('#shared/lib/bridge-utils/security-alerts-api.util'),
  fetchEvmAddressScan: jest.fn(),
  isSecurityAlertsAPIEnabled: jest.fn(() => mockIsSecurityAlertsAPIEnabled),
}));

let mockIsExternalServicesEnabled = true;
let mockIsAddressResolutionEnabled = true;

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
}));

const mockUseSelector = jest.mocked(useSelector);

jest.mock('../selectors', () => ({
  getUseExternalServices: jest.fn(),
  getIsAddressResolutionEnabled: jest.fn(),
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

describe('useAddressLabel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsExternalServicesEnabled = true;
    mockIsAddressResolutionEnabled = true;
    mockIsSecurityAlertsAPIEnabled = true;
    mockUseSelector.mockImplementation((selector) => {
      if (selector === getUseExternalServices) {
        return mockIsExternalServicesEnabled;
      }
      if (selector === getIsAddressResolutionEnabled) {
        return mockIsAddressResolutionEnabled;
      }
      throw new Error(`Unexpected selector: ${String(selector)}`);
    });
  });

  it('returns no data until the scan resolves, then the scan result', async () => {
    const scan = {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      result_type: AddressScanResultType.Benign,
      label: 'Relay',
    };
    mockFetchEvmAddressScan.mockResolvedValue(scan);

    const { result } = renderHook(
      () => useAddressLabel({ address: relayAddress, chainId: arbitrum }),
      { wrapper: createWrapper() },
    );

    expect(result.current.data).toBeUndefined();
    await waitFor(() => expect(result.current.data).toEqual(scan));
    expect(mockFetchEvmAddressScan).toHaveBeenCalledWith(
      arbitrum,
      relayAddress,
    );
  });

  it('returns the scan result for malicious addresses', async () => {
    const scan = {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      result_type: AddressScanResultType.Malicious,
      label: 'Relay',
    };
    mockFetchEvmAddressScan.mockResolvedValue(scan);

    const { result } = renderHook(
      () => useAddressLabel({ address: relayAddress, chainId: arbitrum }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.data).toEqual(scan));
  });

  it('does not fetch when external services are disabled', () => {
    mockIsExternalServicesEnabled = false;

    const { result } = renderHook(
      () => useAddressLabel({ address: relayAddress, chainId: arbitrum }),
      { wrapper: createWrapper() },
    );

    expect(result.current.data).toBeUndefined();
    expect(mockFetchEvmAddressScan).not.toHaveBeenCalled();
  });

  it('does not fetch when address resolution is disabled', () => {
    mockIsAddressResolutionEnabled = false;

    const { result } = renderHook(
      () => useAddressLabel({ address: relayAddress, chainId: arbitrum }),
      { wrapper: createWrapper() },
    );

    expect(result.current.data).toBeUndefined();
    expect(mockFetchEvmAddressScan).not.toHaveBeenCalled();
  });

  it('does not fetch when the security alerts API is disabled', () => {
    mockIsSecurityAlertsAPIEnabled = false;

    const { result } = renderHook(
      () => useAddressLabel({ address: relayAddress, chainId: arbitrum }),
      { wrapper: createWrapper() },
    );

    expect(result.current.data).toBeUndefined();
    expect(mockFetchEvmAddressScan).not.toHaveBeenCalled();
  });

  it('does not fetch when disabled by the caller', () => {
    const { result } = renderHook(
      () =>
        useAddressLabel({
          address: relayAddress,
          chainId: arbitrum,
          enabled: false,
        }),
      { wrapper: createWrapper() },
    );

    expect(result.current.data).toBeUndefined();
    expect(mockFetchEvmAddressScan).not.toHaveBeenCalled();
  });

  it('returns an already cached scan result on the first render', async () => {
    mockFetchEvmAddressScan.mockResolvedValue({
      // eslint-disable-next-line @typescript-eslint/naming-convention
      result_type: AddressScanResultType.Benign,
      label: 'Relay',
    });
    const wrapper = createWrapper();

    const first = renderHook(
      () => useAddressLabel({ address: relayAddress, chainId: arbitrum }),
      { wrapper },
    );
    await waitFor(() => expect(first.result.current.data?.label).toBe('Relay'));

    const second = renderHook(
      () => useAddressLabel({ address: relayAddress, chainId: arbitrum }),
      { wrapper },
    );

    expect(second.result.current.data?.label).toBe('Relay');
    expect(mockFetchEvmAddressScan).toHaveBeenCalledTimes(1);
  });

  it('does not fetch without an address', () => {
    const { result } = renderHook(
      () => useAddressLabel({ address: '', chainId: arbitrum }),
      { wrapper: createWrapper() },
    );

    expect(result.current.data).toBeUndefined();
    expect(mockFetchEvmAddressScan).not.toHaveBeenCalled();
  });

  it('does not fetch for non-EVM chains', () => {
    const { result } = renderHook(
      () =>
        useAddressLabel({
          address: 'So11111111111111111111111111111111111111112',
          chainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
        }),
      { wrapper: createWrapper() },
    );

    expect(result.current.data).toBeUndefined();
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
      () => useAddressLabel({ address: relayAddress, chainId: arbitrum }),
      { wrapper },
    );
    renderHook(
      () =>
        useAddressLabel({
          address: relayAddress.toUpperCase().replace('0X', '0x'),
          chainId: arbitrum,
        }),
      { wrapper },
    );

    await waitFor(() => expect(mockFetchEvmAddressScan).toHaveBeenCalled());
    expect(mockFetchEvmAddressScan).toHaveBeenCalledTimes(1);
  });
});

import { renderHook } from '@testing-library/react';
import { useQueries } from '@tanstack/react-query';
import { useTokenTrustSignalsForAddresses } from './useTokenTrustSignals';
import { TrustSignalDisplayState } from './useTrustSignals';

jest.mock('@tanstack/react-query', () => ({
  useQueries: jest.fn(),
}));

// `useTrustSignals` reaches the selectors barrel, which pulls in far more of
// the app than this hook needs.
jest.mock('../store/actions', () => ({}));
jest.mock('../ducks/metamask/metamask', () => ({}));
jest.mock('../selectors', () => ({}));

const CHAIN_ID_MOCK = '0x1';
const SOLANA_CHAIN_ID_MOCK = 'solana';
const TOKEN_ADDRESS_1 = '0x1234567890123456789012345678901234567890';
const TOKEN_ADDRESS_2 = '0x9876543210987654321098765432109876543210';
const SOLANA_TOKEN_ADDRESS = 'BadMint111';

describe('useTokenTrustSignals', () => {
  const useQueriesMock = jest.mocked(useQueries);

  // Scan results served by the mocked PhishingDataService queries, keyed by
  // the token address in the query key.
  let scanResultsByToken: Record<string, { result_type: string } | undefined>;

  beforeEach(() => {
    jest.clearAllMocks();
    scanResultsByToken = {};
    useQueriesMock.mockImplementation(
      (options) =>
        (
          options as unknown as { queries: { queryKey: unknown[] }[] }
        ).queries.map((query) => ({
          data: scanResultsByToken[String(query.queryKey[2])],
        })) as never,
    );
  });

  describe('useTokenTrustSignalsForAddresses', () => {
    it('returns empty array when chainId is undefined', () => {
      const { result } = renderHook(() =>
        useTokenTrustSignalsForAddresses(undefined, [TOKEN_ADDRESS_1]),
      );

      expect(result.current).toEqual([]);
      expect(useQueriesMock).toHaveBeenCalledWith({ queries: [] });
    });

    it('returns empty array when tokenAddresses is empty', () => {
      const { result } = renderHook(() =>
        useTokenTrustSignalsForAddresses(CHAIN_ID_MOCK, []),
      );

      expect(result.current).toEqual([]);
      expect(useQueriesMock).toHaveBeenCalledWith({ queries: [] });
    });

    it('queries the resolved chain name with a lowercased EVM address', () => {
      renderHook(() =>
        useTokenTrustSignalsForAddresses('0X1', [
          TOKEN_ADDRESS_1.toUpperCase(),
        ]),
      );

      expect(useQueriesMock).toHaveBeenCalledWith({
        queries: [
          {
            queryKey: [
              'PhishingDataService:scanToken',
              'ethereum',
              TOKEN_ADDRESS_1,
            ],
            enabled: true,
            staleTime: 0,
            retry: false,
          },
        ],
      });
    });

    it('preserves address case on non-EVM chains', () => {
      renderHook(() =>
        useTokenTrustSignalsForAddresses(SOLANA_CHAIN_ID_MOCK, [
          SOLANA_TOKEN_ADDRESS,
        ]),
      );

      expect(useQueriesMock).toHaveBeenCalledWith({
        queries: [
          {
            queryKey: [
              'PhishingDataService:scanToken',
              'solana',
              SOLANA_TOKEN_ADDRESS,
            ],
            enabled: true,
            staleTime: 0,
            retry: false,
          },
        ],
      });
    });

    it('disables the query when the chain has no scan support', () => {
      renderHook(() =>
        useTokenTrustSignalsForAddresses('0xdeadbeef', [TOKEN_ADDRESS_1]),
      );

      expect(useQueriesMock).toHaveBeenCalledWith({
        queries: [
          {
            queryKey: ['PhishingDataService:scanToken', '', TOKEN_ADDRESS_1],
            enabled: false,
            staleTime: 0,
            retry: false,
          },
        ],
      });
    });

    it('returns unknown state for token with no scan result', () => {
      const { result } = renderHook(() =>
        useTokenTrustSignalsForAddresses(CHAIN_ID_MOCK, [TOKEN_ADDRESS_1]),
      );

      expect(result.current).toEqual([
        {
          state: TrustSignalDisplayState.Unknown,
          label: null,
        },
      ]);
    });

    it('returns malicious state for token with malicious result type', () => {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      scanResultsByToken[TOKEN_ADDRESS_1] = { result_type: 'Malicious' };

      const { result } = renderHook(() =>
        useTokenTrustSignalsForAddresses(CHAIN_ID_MOCK, [TOKEN_ADDRESS_1]),
      );

      expect(result.current).toEqual([
        {
          state: TrustSignalDisplayState.Malicious,
          label: null,
        },
      ]);
    });

    it('returns warning state for token with warning result type', () => {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      scanResultsByToken[TOKEN_ADDRESS_1] = { result_type: 'Warning' };

      const { result } = renderHook(() =>
        useTokenTrustSignalsForAddresses(CHAIN_ID_MOCK, [TOKEN_ADDRESS_1]),
      );

      expect(result.current).toEqual([
        {
          state: TrustSignalDisplayState.Warning,
          label: null,
        },
      ]);
    });

    it('handles multiple token addresses correctly', () => {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      scanResultsByToken[TOKEN_ADDRESS_1] = { result_type: 'Malicious' };
      // eslint-disable-next-line @typescript-eslint/naming-convention
      scanResultsByToken[TOKEN_ADDRESS_2] = { result_type: 'Benign' };

      const { result } = renderHook(() =>
        useTokenTrustSignalsForAddresses(CHAIN_ID_MOCK, [
          TOKEN_ADDRESS_1,
          TOKEN_ADDRESS_2,
        ]),
      );

      expect(result.current).toEqual([
        {
          state: TrustSignalDisplayState.Malicious,
          label: null,
        },
        {
          state: TrustSignalDisplayState.Unknown,
          label: null,
        },
      ]);
    });
  });
});

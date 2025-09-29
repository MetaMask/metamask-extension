import { renderHook } from '@testing-library/react-hooks';
import { getTokenScanResultsForAddresses } from '../selectors/selectors';
import { useTokenTrustSignalsForAddresses } from './useTokenTrustSignals';
import { TrustSignalDisplayState } from './useTrustSignals';

jest.mock('react-redux', () => ({
  useSelector: jest.fn((selector) => selector()),
}));

jest.mock('../selectors/selectors', () => ({
  getTokenScanResultsForAddresses: jest.fn(),
}));

jest.mock('./useTrustSignals', () => ({
  TrustSignalDisplayState: {
    Unknown: 'unknown',
    Malicious: 'malicious',
    Warning: 'warning',
  },
}));

jest.mock('../store/actions', () => ({}));
jest.mock('../ducks/metamask/metamask', () => ({}));
jest.mock('../selectors', () => ({}));

const CHAIN_ID_MOCK = '0x1';
const TOKEN_ADDRESS_1 = '0x1234567890123456789012345678901234567890';
const TOKEN_ADDRESS_2 = '0x9876543210987654321098765432109876543210';
const TIMESTAMP_MOCK = 1234567890;

describe('useTokenTrustSignals', () => {
  const getTokenScanResultsForAddressesMock = jest.mocked(
    getTokenScanResultsForAddresses,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useTokenTrustSignalsForAddresses', () => {
    it('returns empty array when chainId is undefined', () => {
      getTokenScanResultsForAddressesMock.mockReturnValue({});

      const { result } = renderHook(() =>
        useTokenTrustSignalsForAddresses(undefined, [TOKEN_ADDRESS_1]),
      );

      expect(result.current).toEqual([]);
      expect(getTokenScanResultsForAddressesMock).toHaveBeenCalledWith(
        undefined,
        undefined,
        [TOKEN_ADDRESS_1],
      );
    });

    it('returns empty array when tokenAddresses is empty', () => {
      getTokenScanResultsForAddressesMock.mockReturnValue({});

      const { result } = renderHook(() =>
        useTokenTrustSignalsForAddresses(CHAIN_ID_MOCK, []),
      );

      expect(result.current).toEqual([]);
    });

    it('returns unknown state for token with no scan result', () => {
      getTokenScanResultsForAddressesMock.mockReturnValue({});

      const { result } = renderHook(() =>
        useTokenTrustSignalsForAddresses(CHAIN_ID_MOCK, [TOKEN_ADDRESS_1]),
      );

      expect(result.current).toEqual([
        {
          state: TrustSignalDisplayState.Unknown,
          label: null,
        },
      ]);
      expect(getTokenScanResultsForAddressesMock).toHaveBeenCalledWith(
        undefined,
        CHAIN_ID_MOCK,
        [TOKEN_ADDRESS_1],
      );
    });

    it('returns malicious state for token with malicious result type', () => {
      const cacheKey = `${CHAIN_ID_MOCK.toLowerCase()}:${TOKEN_ADDRESS_1.toLowerCase()}`;
      getTokenScanResultsForAddressesMock.mockReturnValue({
        [cacheKey]: {
          data: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            result_type: 'Malicious',
          },
          timestamp: TIMESTAMP_MOCK,
        },
      });

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
      const cacheKey = `${CHAIN_ID_MOCK.toLowerCase()}:${TOKEN_ADDRESS_1.toLowerCase()}`;
      getTokenScanResultsForAddressesMock.mockReturnValue({
        [cacheKey]: {
          data: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            result_type: 'Warning',
          },
          timestamp: TIMESTAMP_MOCK,
        },
      });

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
      const cacheKey1 = `${CHAIN_ID_MOCK.toLowerCase()}:${TOKEN_ADDRESS_1.toLowerCase()}`;
      const cacheKey2 = `${CHAIN_ID_MOCK.toLowerCase()}:${TOKEN_ADDRESS_2.toLowerCase()}`;

      getTokenScanResultsForAddressesMock.mockReturnValue({
        [cacheKey1]: {
          data: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            result_type: 'Malicious',
          },
          timestamp: TIMESTAMP_MOCK,
        },
        [cacheKey2]: {
          data: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            result_type: 'Benign',
          },
          timestamp: TIMESTAMP_MOCK,
        },
      });

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

    it('generates correct cache keys with case normalization', () => {
      const upperCaseChainId = '0X1';
      const upperCaseTokenAddress =
        '0X1234567890123456789012345678901234567890';
      const expectedCacheKey = `${upperCaseChainId.toLowerCase()}:${upperCaseTokenAddress.toLowerCase()}`;

      getTokenScanResultsForAddressesMock.mockReturnValue({
        [expectedCacheKey]: {
          data: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            result_type: 'Benign',
          },
          timestamp: TIMESTAMP_MOCK,
        },
      });

      const { result } = renderHook(() =>
        useTokenTrustSignalsForAddresses(upperCaseChainId, [
          upperCaseTokenAddress,
        ]),
      );

      expect(result.current).toEqual([
        {
          state: TrustSignalDisplayState.Unknown,
          label: null,
        },
      ]);
    });
  });
});

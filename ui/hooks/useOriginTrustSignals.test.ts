import { renderHook } from '@testing-library/react';
import { useQuery } from '@metamask/react-data-query';
import { RecommendedAction } from '@metamask/phishing-controller';
import { TrustSignalDisplayState } from './useTrustSignals';
import { useOriginTrustSignals } from './useOriginTrustSignals';

jest.mock('@metamask/react-data-query', () => ({
  useQuery: jest.fn(),
}));

// `useTrustSignals` reaches the selectors barrel, which pulls in far more of
// the app than this hook needs.
jest.mock('../store/actions', () => ({}));
jest.mock('../ducks/metamask/metamask', () => ({}));
jest.mock('../selectors', () => ({}));

const ORIGIN_MOCK = 'https://example.com';
const DOMAIN_NAME_MOCK = 'example.com';

describe('useOriginTrustSignals', () => {
  const useQueryMock = jest.mocked(useQuery);

  /**
   * Serves a scan result from the mocked PhishingDataService query.
   *
   * @param recommendedAction - The action the scan resolved to, if any.
   */
  function mockScanResult(recommendedAction?: string) {
    useQueryMock.mockReturnValue({
      data: recommendedAction === undefined ? undefined : { recommendedAction },
    } as never);
  }

  beforeEach(() => {
    jest.clearAllMocks();
    mockScanResult();
  });

  it('queries the scan result for the origin hostname', () => {
    renderHook(() => useOriginTrustSignals(ORIGIN_MOCK));

    expect(useQueryMock).toHaveBeenCalledWith({
      queryKey: ['PhishingDataService:scanUrl', DOMAIN_NAME_MOCK],
      enabled: true,
    });
  });

  it('appends the path for shared gateway hostnames', () => {
    renderHook(() => useOriginTrustSignals('https://ipfs.io/ipfs/QmHash'));

    expect(useQueryMock).toHaveBeenCalledWith({
      queryKey: ['PhishingDataService:scanUrl', 'ipfs.io/ipfs/QmHash'],
      enabled: true,
    });
  });

  it('returns unknown state and disables the query when origin is empty', () => {
    const { result } = renderHook(() => useOriginTrustSignals(''));

    expect(result.current).toStrictEqual({
      state: TrustSignalDisplayState.Unknown,
      label: null,
    });
    expect(useQueryMock).toHaveBeenCalledWith({
      queryKey: ['PhishingDataService:scanUrl', ''],
      enabled: false,
    });
  });

  it('returns unknown state and disables the query when origin is an invalid URL', () => {
    const { result } = renderHook(() =>
      useOriginTrustSignals('not-a-valid-url'),
    );

    expect(result.current).toStrictEqual({
      state: TrustSignalDisplayState.Unknown,
      label: null,
    });
    expect(useQueryMock).toHaveBeenCalledWith({
      queryKey: ['PhishingDataService:scanUrl', ''],
      enabled: false,
    });
  });

  it('returns malicious state when recommendedAction is Block', () => {
    mockScanResult(RecommendedAction.Block);

    const { result } = renderHook(() => useOriginTrustSignals(ORIGIN_MOCK));

    expect(result.current).toStrictEqual({
      state: TrustSignalDisplayState.Malicious,
      label: null,
    });
  });

  it('returns warning state when recommendedAction is Warn', () => {
    mockScanResult(RecommendedAction.Warn);

    const { result } = renderHook(() => useOriginTrustSignals(ORIGIN_MOCK));

    expect(result.current).toStrictEqual({
      state: TrustSignalDisplayState.Warning,
      label: null,
    });
  });

  it('returns verified state when recommendedAction is Verified', () => {
    mockScanResult(RecommendedAction.Verified);

    const { result } = renderHook(() => useOriginTrustSignals(ORIGIN_MOCK));

    expect(result.current).toStrictEqual({
      state: TrustSignalDisplayState.Verified,
      label: null,
    });
  });

  it('returns unknown state when recommendedAction is None', () => {
    mockScanResult(RecommendedAction.None);

    const { result } = renderHook(() => useOriginTrustSignals(ORIGIN_MOCK));

    expect(result.current).toStrictEqual({
      state: TrustSignalDisplayState.Unknown,
      label: null,
    });
  });

  it('returns unknown state when the scan result has no recommendedAction', () => {
    useQueryMock.mockReturnValue({ data: {} } as never);

    const { result } = renderHook(() => useOriginTrustSignals(ORIGIN_MOCK));

    expect(result.current).toStrictEqual({
      state: TrustSignalDisplayState.Unknown,
      label: null,
    });
  });

  it('returns unknown state for an unrecognized recommendedAction', () => {
    mockScanResult('UNKNOWN_ACTION');

    const { result } = renderHook(() => useOriginTrustSignals(ORIGIN_MOCK));

    expect(result.current).toStrictEqual({
      state: TrustSignalDisplayState.Unknown,
      label: null,
    });
  });
});

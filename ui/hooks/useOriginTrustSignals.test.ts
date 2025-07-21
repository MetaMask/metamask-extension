import { RecommendedAction } from '@metamask/phishing-controller';
import { getUrlScanCacheResult } from '../selectors/selectors';
import { TrustSignalDisplayState } from './useTrustSignals';
import { useOriginTrustSignals } from './useOriginTrustSignals';

jest.mock('react-redux', () => ({
  useSelector: jest.fn((selector) => selector()),
}));

jest.mock('../selectors/selectors', () => ({
  getUrlScanCacheResult: jest.fn(),
}));

jest.mock('../store/actions', () => ({}));
jest.mock('../ducks/metamask/metamask', () => ({}));
jest.mock('../selectors', () => ({}));

const ORIGIN_MOCK = 'https://example.com';
const DOMAIN_NAME_MOCK = 'example.com';
const TIMESTAMP_MOCK = 1234567890;

describe('useOriginTrustSignals', () => {
  const getUrlScanCacheResultMock = jest.mocked(getUrlScanCacheResult);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns unknown state when selector returns undefined', () => {
    getUrlScanCacheResultMock.mockReturnValue(undefined);

    const result = useOriginTrustSignals('');

    expect(result).toStrictEqual({
      state: TrustSignalDisplayState.Unknown,
      label: null,
    });
    expect(getUrlScanCacheResultMock).toHaveBeenCalledWith(
      undefined,
      undefined,
    );
  });

  it('returns malicious state when recommendedAction is Block', () => {
    getUrlScanCacheResultMock.mockReturnValue({
      result: {
        domainName: DOMAIN_NAME_MOCK,
        recommendedAction: RecommendedAction.Block,
      },
      timestamp: TIMESTAMP_MOCK,
    });

    const result = useOriginTrustSignals(ORIGIN_MOCK);

    expect(result).toStrictEqual({
      state: TrustSignalDisplayState.Malicious,
      label: null,
    });
    expect(getUrlScanCacheResultMock).toHaveBeenCalledWith(
      undefined,
      DOMAIN_NAME_MOCK,
    );
  });

  it('returns warning state when recommendedAction is Warn', () => {
    getUrlScanCacheResultMock.mockReturnValue({
      result: {
        domainName: DOMAIN_NAME_MOCK,
        recommendedAction: RecommendedAction.Warn,
      },
      timestamp: TIMESTAMP_MOCK,
    });

    const result = useOriginTrustSignals(ORIGIN_MOCK);

    expect(result).toStrictEqual({
      state: TrustSignalDisplayState.Warning,
      label: null,
    });
  });

  it('returns verified state when recommendedAction is Verified', () => {
    getUrlScanCacheResultMock.mockReturnValue({
      result: {
        domainName: DOMAIN_NAME_MOCK,
        recommendedAction: RecommendedAction.Verified,
      },
      timestamp: TIMESTAMP_MOCK,
    });

    const result = useOriginTrustSignals(ORIGIN_MOCK);

    expect(result).toStrictEqual({
      state: TrustSignalDisplayState.Verified,
      label: null,
    });
  });

  it('returns unknown state when recommendedAction is None', () => {
    getUrlScanCacheResultMock.mockReturnValue({
      result: {
        domainName: DOMAIN_NAME_MOCK,
        recommendedAction: RecommendedAction.None,
      },
      timestamp: TIMESTAMP_MOCK,
    });

    const result = useOriginTrustSignals(ORIGIN_MOCK);

    expect(result).toStrictEqual({
      state: TrustSignalDisplayState.Unknown,
      label: null,
    });
  });

  it('returns unknown state when cache result has no recommendedAction', () => {
    getUrlScanCacheResultMock.mockReturnValue({
      result: {
        domainName: DOMAIN_NAME_MOCK,
        recommendedAction: undefined,
      },
      timestamp: TIMESTAMP_MOCK,
    });

    const result = useOriginTrustSignals(ORIGIN_MOCK);

    expect(result).toStrictEqual({
      state: TrustSignalDisplayState.Unknown,
      label: null,
    });
  });

  it('returns unknown state for unrecognized recommendedAction', () => {
    getUrlScanCacheResultMock.mockReturnValue({
      result: {
        domainName: DOMAIN_NAME_MOCK,
        recommendedAction: 'UNKNOWN_ACTION',
      },
      timestamp: TIMESTAMP_MOCK,
    });

    const result = useOriginTrustSignals(ORIGIN_MOCK);

    expect(result).toStrictEqual({
      state: TrustSignalDisplayState.Unknown,
      label: null,
    });
  });

  it('returns unknown state when origin is invalid URL', () => {
    getUrlScanCacheResultMock.mockReturnValue(undefined);

    const result = useOriginTrustSignals('not-a-valid-url');

    expect(result).toStrictEqual({
      state: TrustSignalDisplayState.Unknown,
      label: null,
    });
    expect(getUrlScanCacheResultMock).toHaveBeenCalledWith(
      undefined,
      undefined,
    );
  });
});

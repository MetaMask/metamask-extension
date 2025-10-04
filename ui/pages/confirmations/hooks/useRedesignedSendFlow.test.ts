import mockState from '../../../../test/data/mock-state.json';
import { renderHookWithProvider } from '../../../../test/lib/render-helpers';
import { getRemoteFeatureFlags } from '../../../selectors/remote-feature-flags';
import { useRedesignedSendFlow } from './useRedesignedSendFlow';

const mockGetRemoteFeatureFlags = jest.mocked(getRemoteFeatureFlags);

jest.mock('../../../selectors/remote-feature-flags');

describe('useRedesignedSendFlow', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  const renderHook = () => {
    const { result } = renderHookWithProvider(useRedesignedSendFlow, mockState);
    return result.current;
  };

  it('returns enabled false when development environment override is not active', () => {
    mockGetRemoteFeatureFlags.mockReturnValue({
      sendRedesign: { enabled: false },
    });

    const result = renderHook();

    expect(result).toEqual({ enabled: false });
  });

  it('returns enabled false when not in development environment', () => {
    mockGetRemoteFeatureFlags.mockReturnValue({
      sendRedesign: { enabled: false },
    });

    const result = renderHook();

    expect(result).toEqual({ enabled: false });
  });

  it('returns enabled true when feature flag is undefined', () => {
    mockGetRemoteFeatureFlags.mockReturnValue({});

    const result = renderHook();

    expect(result).toEqual({ enabled: true });
  });

  it('returns enabled true when remote feature flags is null', () => {
    mockGetRemoteFeatureFlags.mockReturnValue({
      sendRedesign: null,
    });

    const result = renderHook();

    expect(result).toEqual({ enabled: true });
  });
});

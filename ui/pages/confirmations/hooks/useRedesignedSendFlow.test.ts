import { ENVIRONMENT } from '../../../../development/build/constants';
import mockState from '../../../../test/data/mock-state.json';
import { renderHookWithProvider } from '../../../../test/lib/render-helpers';
import { getRemoteFeatureFlags } from '../../../selectors/remote-feature-flags';
import { getIsMultichainAccountsState2Enabled } from '../../../selectors/multichain-accounts/feature-flags';
import { useRedesignedSendFlow } from './useRedesignedSendFlow';

const mockGetRemoteFeatureFlags = jest.mocked(getRemoteFeatureFlags);
const mockGetIsMultichainAccountsState2Enabled = jest.mocked(
  getIsMultichainAccountsState2Enabled,
);

jest.mock('../../../selectors/remote-feature-flags');
jest.mock('../../../selectors/multichain-accounts/feature-flags');

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

  it('returns enabled true when development environment override is active', () => {
    process.env.SEND_REDESIGN_ENABLED = 'true';
    process.env.METAMASK_ENVIRONMENT = ENVIRONMENT.DEVELOPMENT;

    mockGetRemoteFeatureFlags.mockReturnValue({
      sendRedesign: { enabled: false },
    });
    mockGetIsMultichainAccountsState2Enabled.mockReturnValue(false);

    const result = renderHook();

    expect(result).toEqual({ enabled: true });
  });

  it('returns enabled false when development environment override is not active', () => {
    process.env.SEND_REDESIGN_ENABLED = 'false';
    process.env.METAMASK_ENVIRONMENT = ENVIRONMENT.DEVELOPMENT;

    mockGetRemoteFeatureFlags.mockReturnValue({
      sendRedesign: { enabled: false },
    });
    mockGetIsMultichainAccountsState2Enabled.mockReturnValue(false);

    const result = renderHook();

    expect(result).toEqual({ enabled: false });
  });

  it('returns enabled false when not in development environment', () => {
    process.env.SEND_REDESIGN_ENABLED = 'true';
    process.env.METAMASK_ENVIRONMENT = ENVIRONMENT.PRODUCTION;

    mockGetRemoteFeatureFlags.mockReturnValue({
      sendRedesign: { enabled: false },
    });
    mockGetIsMultichainAccountsState2Enabled.mockReturnValue(false);

    const result = renderHook();

    expect(result).toEqual({ enabled: false });
  });

  it('returns enabled true when feature flag is enabled and multichain accounts are enabled', () => {
    delete process.env.SEND_REDESIGN_ENABLED;
    delete process.env.METAMASK_ENVIRONMENT;

    mockGetRemoteFeatureFlags.mockReturnValue({
      sendRedesign: { enabled: true },
    });
    mockGetIsMultichainAccountsState2Enabled.mockReturnValue(true);

    const result = renderHook();

    expect(result).toEqual({ enabled: true });
  });

  it('returns enabled false when feature flag is enabled but multichain accounts are disabled', () => {
    delete process.env.SEND_REDESIGN_ENABLED;
    delete process.env.METAMASK_ENVIRONMENT;

    mockGetRemoteFeatureFlags.mockReturnValue({
      sendRedesign: { enabled: true },
    });
    mockGetIsMultichainAccountsState2Enabled.mockReturnValue(false);

    const result = renderHook();

    expect(result).toEqual({ enabled: false });
  });

  it('returns enabled false when feature flag is disabled', () => {
    delete process.env.SEND_REDESIGN_ENABLED;
    delete process.env.METAMASK_ENVIRONMENT;

    mockGetRemoteFeatureFlags.mockReturnValue({
      sendRedesign: { enabled: false },
    });
    mockGetIsMultichainAccountsState2Enabled.mockReturnValue(true);

    const result = renderHook();

    expect(result).toEqual({ enabled: false });
  });

  it('returns enabled false when feature flag is undefined', () => {
    delete process.env.SEND_REDESIGN_ENABLED;
    delete process.env.METAMASK_ENVIRONMENT;

    mockGetRemoteFeatureFlags.mockReturnValue({});
    mockGetIsMultichainAccountsState2Enabled.mockReturnValue(true);

    const result = renderHook();

    expect(result).toEqual({ enabled: false });
  });

  it('returns enabled false when remote feature flags is null', () => {
    delete process.env.SEND_REDESIGN_ENABLED;
    delete process.env.METAMASK_ENVIRONMENT;

    mockGetRemoteFeatureFlags.mockReturnValue({
      sendRedesign: null,
    });
    mockGetIsMultichainAccountsState2Enabled.mockReturnValue(true);

    const result = renderHook();

    expect(result).toEqual({ enabled: false });
  });

  it('prioritizes development environment override over feature flags', () => {
    process.env.SEND_REDESIGN_ENABLED = 'true';
    process.env.METAMASK_ENVIRONMENT = ENVIRONMENT.DEVELOPMENT;

    mockGetRemoteFeatureFlags.mockReturnValue({
      sendRedesign: { enabled: true },
    });
    mockGetIsMultichainAccountsState2Enabled.mockReturnValue(false);

    const result = renderHook();

    expect(result).toEqual({ enabled: true });
    expect(mockGetIsMultichainAccountsState2Enabled).toHaveBeenCalled();
  });
});

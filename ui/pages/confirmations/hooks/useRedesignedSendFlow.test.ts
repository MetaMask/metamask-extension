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

  it('returns enabled false when not enabled in remote flag', () => {
    mockGetRemoteFeatureFlags.mockReturnValue({
      sendRedesign: { enabled: false },
    });
    mockGetIsMultichainAccountsState2Enabled.mockReturnValue(false);

    const result = renderHook();

    expect(result).toEqual({ enabled: false });
  });

  it('returns enabled true when feature flag is enabled', () => {
    mockGetRemoteFeatureFlags.mockReturnValue({
      sendRedesign: { enabled: true },
    });
    mockGetIsMultichainAccountsState2Enabled.mockReturnValue(true);

    const result = renderHook();

    expect(result).toEqual({ enabled: true });
  });
});

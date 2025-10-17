import {
  PRODUCT_TYPES,
  SUBSCRIPTION_STATUSES,
} from '@metamask/subscription-controller';
import { renderHookWithProvider } from '../../../../../test/lib/render-helpers';
import { useEnableShieldCoverageChecks } from './useEnableShieldCoverageChecks';

jest.mock('../../../../hooks/subscription/useSubscription', () => ({
  useUserSubscriptions: jest.fn(() => ({
    subscriptions: [],
    loading: false,
    error: null,
  })),
}));

describe('useEnableShieldCoverageChecks', () => {
  const { useUserSubscriptions } = jest.requireMock(
    '../../../../hooks/subscription/useSubscription',
  ) as { useUserSubscriptions: jest.Mock };

  beforeEach(() => {
    jest.resetModules();
    process.env.METAMASK_SHIELD_ENABLED = 'true';
    useUserSubscriptions.mockReturnValue({
      subscriptions: [],
      loading: false,
      error: null,
    });
  });

  afterAll(() => {
    process.env.METAMASK_SHIELD_ENABLED = 'false';
  });

  it('returns true when user has a SHIELD subscription', () => {
    useUserSubscriptions.mockReturnValue({
      subscriptions: [
        {
          products: [{ name: PRODUCT_TYPES.SHIELD }],
          status: SUBSCRIPTION_STATUSES.active,
        },
      ],
      loading: false,
      error: null,
    });

    const { result } = renderHookWithProvider(() =>
      useEnableShieldCoverageChecks(),
    );

    expect(result.current).toBe(true);
  });

  it('returns false when user has no SHIELD subscription and env flag is not true', () => {
    process.env.METAMASK_SHIELD_ENABLED = 'false';
    useUserSubscriptions.mockReturnValue({
      subscriptions: [],
      loading: false,
      error: null,
    });

    const { result } = renderHookWithProvider(() =>
      useEnableShieldCoverageChecks(),
    );

    expect(result.current).toBe(false);
  });

  it('returns false when env flag is false (even with active subscription)', () => {
    process.env.METAMASK_SHIELD_ENABLED = 'false';
    useUserSubscriptions.mockReturnValue({
      subscriptions: [
        {
          products: [{ name: PRODUCT_TYPES.SHIELD }],
          status: SUBSCRIPTION_STATUSES.active,
        },
      ],
      loading: false,
      error: null,
    });

    const { result } = renderHookWithProvider(() =>
      useEnableShieldCoverageChecks(),
    );

    expect(result.current).toBe(false);
  });
});

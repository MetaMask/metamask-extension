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

  it('returns true when user has a SHIELD subscription and basic functionality is enabled', () => {
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

    const { result } = renderHookWithProvider(
      () => useEnableShieldCoverageChecks(),
      {
        metamask: {
          useExternalServices: true,
        },
      },
    );

    expect(result.current.isEnabled).toBe(true);
    expect(result.current.isPaused).toBe(false);
  });

  it('returns false when user has a SHIELD subscription but Basic Functionality is disabled', () => {
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

    const { result } = renderHookWithProvider(
      () => useEnableShieldCoverageChecks(),
      {
        metamask: {
          useExternalServices: false,
        },
      },
    );

    expect(result.current.isEnabled).toBe(false);
    expect(result.current.isPaused).toBe(false);
  });

  it('returns false when user has no SHIELD subscription and env flag is not true', () => {
    process.env.METAMASK_SHIELD_ENABLED = 'false';
    useUserSubscriptions.mockReturnValue({
      subscriptions: [],
      loading: false,
      error: null,
    });

    const { result } = renderHookWithProvider(
      () => useEnableShieldCoverageChecks(),
      {
        metamask: {
          useExternalServices: true,
        },
      },
    );

    expect(result.current.isEnabled).toBe(false);
    expect(result.current.isPaused).toBe(false);
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

    const { result } = renderHookWithProvider(
      () => useEnableShieldCoverageChecks(),
      {
        metamask: {
          useExternalServices: true,
        },
      },
    );

    expect(result.current.isEnabled).toBe(false);
    expect(result.current.isPaused).toBe(false);
  });
});

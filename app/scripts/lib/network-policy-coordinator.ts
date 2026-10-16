import type { AuthConnection } from '../../../shared/constants/onboarding';
import {
  normalizeNetworkPolicy,
  type NetworkPolicy,
} from '../../../shared/lib/network-policy';
import type { NetworkPolicyEnforcement } from './network-policy-enforcement';
import {
  getSocialOnboardingDomains,
  type SocialOnboardingNetworkPolicy,
} from './social-onboarding-network-policy';

export type NetworkPolicyCoordinator = Pick<
  NetworkPolicyEnforcement,
  'update' | 'allowRpcValidation'
> &
  SocialOnboardingNetworkPolicy;

const BLOCKED_POLICY = normalizeNetworkPolicy({
  mode: 'blocked',
  allowedDomains: [],
  allowedRpcUrls: [],
});

/**
 * Combines controller policy with the user's transient onboarding choice.
 * Keep the returned authority in trusted background application code.
 *
 * @param enforcement - Native browser enforcement captured before LavaMoat.
 * @returns Serialized policy and narrowly scoped onboarding capabilities.
 */
export function createNetworkPolicyCoordinator(
  enforcement: NetworkPolicyEnforcement,
): NetworkPolicyCoordinator {
  let basePolicy = BLOCKED_POLICY;
  let onboardingDomains: readonly string[] | undefined;
  let requestedMode: NetworkPolicy['mode'] = 'blocked';
  let updateRevision = 0;
  let closingRevision = 0;
  let socialRevision = 0;
  let pending: Promise<void> = Promise.resolve();

  const enqueue = <Result>(action: () => Promise<Result>): Promise<Result> => {
    const result = pending.then(action);
    pending = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  };

  const closeAfterFailure = async (error: unknown): Promise<never> => {
    basePolicy = BLOCKED_POLICY;
    onboardingDomains = undefined;
    requestedMode = 'blocked';
    closingRevision += 1;
    socialRevision += 1;
    try {
      await enforcement.update(BLOCKED_POLICY);
    } catch (closingError) {
      throw new AggregateError(
        [error, closingError],
        'Network policy coordination and fail-closed recovery failed',
      );
    }
    throw error;
  };

  const apply = async (
    nextBasePolicy: NetworkPolicy,
    nextOnboardingDomains: readonly string[] | undefined,
  ): Promise<void> => {
    const effectivePolicy =
      nextBasePolicy.mode === 'blocked' && nextOnboardingDomains
        ? normalizeNetworkPolicy({
            mode: 'allowlist',
            allowedDomains: nextOnboardingDomains,
            allowedRpcUrls: [],
          })
        : nextBasePolicy;
    try {
      await enforcement.update(effectivePolicy);
      basePolicy = nextBasePolicy;
      onboardingDomains = nextOnboardingDomains;
    } catch (error) {
      await closeAfterFailure(error);
    }
  };

  return Object.freeze({
    update: (policy: NetworkPolicy) => {
      updateRevision += 1;
      const revision = updateRevision;
      let normalized: NetworkPolicy;
      try {
        // Copy immediately so queued callers cannot alter a future grant.
        normalized = normalizeNetworkPolicy(policy);
      } catch (error) {
        requestedMode = 'blocked';
        closingRevision += 1;
        return enqueue(() => closeAfterFailure(error));
      }
      requestedMode = normalized.mode;
      if (normalized.mode === 'blocked') {
        closingRevision += 1;
      } else {
        socialRevision += 1;
      }
      return enqueue(async () => {
        if (revision !== updateRevision) {
          throw new Error('Network policy update was superseded');
        }
        await apply(
          normalized,
          normalized.mode === 'blocked' ? onboardingDomains : undefined,
        );
        if (revision === updateRevision) {
          requestedMode = normalized.mode;
        }
      });
    },
    beginSocialOnboarding: (authConnection: AuthConnection) => {
      socialRevision += 1;
      const revision = socialRevision;
      let domains: readonly string[];
      try {
        domains = getSocialOnboardingDomains(authConnection);
      } catch (error) {
        requestedMode = 'blocked';
        closingRevision += 1;
        return enqueue(() => closeAfterFailure(error));
      }
      return enqueue(async () => {
        if (revision !== socialRevision) {
          throw new Error('Social onboarding was cancelled');
        }
        await apply(
          basePolicy,
          basePolicy.mode === 'blocked' ? domains : undefined,
        );
        if (revision !== socialRevision) {
          await apply(basePolicy, undefined);
          throw new Error('Social onboarding was cancelled');
        }
      });
    },
    endSocialOnboarding: () => {
      socialRevision += 1;
      return enqueue(() => apply(basePolicy, undefined));
    },
    allowRpcValidation: (
      options: Parameters<NetworkPolicyEnforcement['allowRpcValidation']>[0],
    ) => {
      // A pending restrictive update must take precedence over a new probe.
      const revision = closingRevision;
      if (basePolicy.mode === 'blocked' || requestedMode === 'blocked') {
        return Promise.reject(
          new Error('RPC validation is unavailable before onboarding'),
        );
      }
      const snapshot = { ...options };
      return enqueue(async () => {
        if (
          revision !== closingRevision ||
          basePolicy.mode === 'blocked' ||
          requestedMode === 'blocked'
        ) {
          throw new Error('RPC validation is unavailable before onboarding');
        }
        try {
          const revoke = await enforcement.allowRpcValidation(snapshot);
          if (revision !== closingRevision) {
            await revoke();
            throw new Error('RPC validation was cancelled by a policy change');
          }
          let revocation: Promise<void> | undefined;
          return () => {
            revocation ??= enqueue(async () => {
              try {
                await revoke();
              } catch (error) {
                await closeAfterFailure(error);
              }
            });
            return revocation;
          };
        } catch (error) {
          return closeAfterFailure(error);
        }
      });
    },
  });
}

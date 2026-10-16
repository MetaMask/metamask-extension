import { BaseController, type StateMetadata } from '@metamask/base-controller';
import { normalizeNetworkPolicy } from '../../../../shared/lib/network-policy';
import type {
  NetworkPolicyControllerMessenger,
  NetworkPolicyControllerState,
  NetworkPolicyDomainPolicyApplier,
} from './network-policy-controller.types';

const controllerName = 'NetworkPolicyController';

const controllerMetadata: StateMetadata<NetworkPolicyControllerState> = {
  postOnboardingNetworkDomains: {
    includeInDebugSnapshot: false,
    includeInStateLogs: false,
    persist: true,
    usedInUi: false,
  },
};

/** Return a fresh default network policy state. */
export function getDefaultNetworkPolicyControllerState(): NetworkPolicyControllerState {
  return { postOnboardingNetworkDomains: '*' };
}

/**
 * Validate and copy the configured exact hostnames.
 *
 * @param domains - The approved wildcard or exact hostnames.
 * @returns A canonical copy for the controller's immutable state.
 */
function normalizeDomains(
  domains: NetworkPolicyControllerState['postOnboardingNetworkDomains'],
): NetworkPolicyControllerState['postOnboardingNetworkDomains'] {
  if (domains === '*') {
    return domains;
  }
  return [
    ...normalizeNetworkPolicy({
      mode: 'allowlist',
      allowedDomains: domains,
      allowedRpcUrls: [],
    }).allowedDomains,
  ];
}

/** Persist post-onboarding domain authorization under background authority. */
export class NetworkPolicyController extends BaseController<
  typeof controllerName,
  NetworkPolicyControllerState,
  NetworkPolicyControllerMessenger
> {
  readonly #applyDomainPolicy: NetworkPolicyDomainPolicyApplier;

  /**
   * Initialize and validate the persisted authorization.
   *
   * @param options - The controller options.
   * @param options.messenger - The private controller messenger.
   * @param options.state - Previously persisted authorization.
   * @param options.applyDomainPolicy - Private browser policy coordination.
   */
  constructor({
    messenger,
    state = {},
    applyDomainPolicy,
  }: {
    messenger: NetworkPolicyControllerMessenger;
    state?: Partial<NetworkPolicyControllerState>;
    applyDomainPolicy: NetworkPolicyDomainPolicyApplier;
  }) {
    super({
      name: controllerName,
      messenger,
      metadata: controllerMetadata,
      state: {
        postOnboardingNetworkDomains: normalizeDomains(
          state.postOnboardingNetworkDomains === undefined
            ? getDefaultNetworkPolicyControllerState()
                .postOnboardingNetworkDomains
            : state.postOnboardingNetworkDomains,
        ),
      },
    });
    this.#applyDomainPolicy = applyDomainPolicy;
    this.messenger.registerActionHandler(
      'NetworkPolicyController:configurePostOnboardingDomains',
      this.configurePostOnboardingDomains.bind(this),
    );
  }

  /**
   * Authorize wildcard network access or an exact domain list after onboarding.
   * Trusted UI and delegated background callers wait for browser enforcement.
   *
   * @param domains - Wildcard access or the complete approved domain list.
   */
  async configurePostOnboardingDomains(
    domains: NetworkPolicyControllerState['postOnboardingNetworkDomains'],
  ): Promise<void> {
    const normalized = normalizeDomains(domains);
    await this.#applyDomainPolicy(normalized, () => {
      this.update((state) => {
        state.postOnboardingNetworkDomains = normalized;
      });
    });
  }
}

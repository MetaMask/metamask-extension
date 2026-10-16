import { AuthConnection } from '../../../shared/constants/onboarding';
import type { NetworkPolicy } from '../../../shared/lib/network-policy';
import { createNetworkPolicyCoordinator } from './network-policy-coordinator';
import type { NetworkPolicyEnforcement } from './network-policy-enforcement';

jest.mock('./social-onboarding-network-policy', () => ({
  getSocialOnboardingDomains: (connection: AuthConnection) => {
    if (connection !== 'google') {
      throw new Error('Unsupported provider');
    }
    return ['accounts.google.com', 'auth.example'];
  },
}));

function deferred<Result>() {
  let resolve: (value: Result) => void = jest.fn();
  const promise = new Promise<Result>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

function setup() {
  const revoke = jest.fn(async (): Promise<void> => undefined);
  const enforcement = {
    update: jest.fn(async (_policy: NetworkPolicy): Promise<void> => undefined),
    allowRpcValidation: jest.fn(
      async (
        _options: Parameters<NetworkPolicyEnforcement['allowRpcValidation']>[0],
      ): Promise<() => Promise<void>> => revoke,
    ),
  } satisfies NetworkPolicyEnforcement;
  return {
    coordinator: createNetworkPolicyCoordinator(enforcement),
    enforcement,
    revoke,
  };
}

const blocked: NetworkPolicy = {
  mode: 'blocked',
  allowedDomains: [],
  allowedRpcUrls: [],
};

const allowAll: NetworkPolicy = {
  mode: 'allow-all',
  allowedDomains: [],
  allowedRpcUrls: [],
};

describe('createNetworkPolicyCoordinator', () => {
  describe('social onboarding', () => {
    it('authorizes only the explicitly selected path while onboarding is blocked', async () => {
      const { coordinator, enforcement } = setup();

      await coordinator.beginSocialOnboarding(AuthConnection.Google);

      expect(enforcement.update).toHaveBeenLastCalledWith({
        mode: 'allowlist',
        allowedDomains: ['accounts.google.com', 'auth.example'],
        allowedRpcUrls: [],
      });
    });

    it('retains the selected path across pre-onboarding state updates', async () => {
      const { coordinator, enforcement } = setup();
      await coordinator.beginSocialOnboarding(AuthConnection.Google);

      await coordinator.update(blocked);

      expect(enforcement.update).toHaveBeenLastCalledWith({
        mode: 'allowlist',
        allowedDomains: ['accounts.google.com', 'auth.example'],
        allowedRpcUrls: [],
      });
    });

    it('revokes the path on cancellation', async () => {
      const { coordinator, enforcement } = setup();
      await coordinator.beginSocialOnboarding(AuthConnection.Google);

      await coordinator.endSocialOnboarding();
      await coordinator.update(blocked);

      expect(enforcement.update).toHaveBeenLastCalledWith(blocked);
    });

    it('forgets onboarding privileges after completion', async () => {
      const { coordinator, enforcement } = setup();
      await coordinator.beginSocialOnboarding(AuthConnection.Google);
      await coordinator.update(allowAll);

      await coordinator.update(blocked);

      expect(enforcement.update).toHaveBeenLastCalledWith(blocked);
    });

    it('rejects a pending authorization when the UI closes during installation', async () => {
      const { coordinator, enforcement } = setup();
      const installation = deferred<void>();
      enforcement.update.mockImplementationOnce(() => installation.promise);
      const begin = coordinator.beginSocialOnboarding(AuthConnection.Google);
      await Promise.resolve();
      const end = coordinator.endSocialOnboarding();

      installation.resolve();

      await expect(begin).rejects.toThrow('Social onboarding was cancelled');
      await end;
      expect(enforcement.update).toHaveBeenLastCalledWith(blocked);
    });
  });

  describe('policy updates', () => {
    it('does not install a queued broad policy superseded by a blocking update', async () => {
      const { coordinator, enforcement } = setup();
      const installation = deferred<void>();
      enforcement.update.mockImplementationOnce(() => installation.promise);
      const first = coordinator.update(blocked);
      await Promise.resolve();
      const stale = coordinator.update(allowAll);
      const staleResult = expect(stale).rejects.toThrow(
        'Network policy update was superseded',
      );
      const latest = coordinator.update(blocked);

      installation.resolve();
      await first;
      await staleResult;
      await latest;

      expect(
        enforcement.update.mock.calls.map(([snapshot]) => snapshot),
      ).toStrictEqual([blocked, blocked]);
    });

    it('snapshots a domain allowlist before queued work can mutate it', async () => {
      const { coordinator, enforcement } = setup();
      const domains = ['approved.example'];
      const update = coordinator.update({
        mode: 'allowlist',
        allowedDomains: domains,
        allowedRpcUrls: ['https://rpc.example/v1'],
      });
      domains.push('unapproved.example');

      await update;

      expect(enforcement.update).toHaveBeenCalledWith({
        mode: 'allowlist',
        allowedDomains: ['approved.example'],
        allowedRpcUrls: ['https://rpc.example/v1'],
      });
    });

    it('serializes policy installation and onboarding grants', async () => {
      const { coordinator, enforcement } = setup();
      const installation = deferred<void>();
      enforcement.update.mockImplementationOnce(() => installation.promise);
      const update = coordinator.update(blocked);
      const begin = coordinator.beginSocialOnboarding(AuthConnection.Google);

      await Promise.resolve();
      expect(enforcement.update).toHaveBeenCalledTimes(1);
      installation.resolve();
      await update;
      await begin;

      expect(enforcement.update).toHaveBeenCalledTimes(2);
      expect(enforcement.update).toHaveBeenLastCalledWith({
        mode: 'allowlist',
        allowedDomains: ['accounts.google.com', 'auth.example'],
        allowedRpcUrls: [],
      });
    });

    it('fails closed after an installation failure and allows a later retry', async () => {
      const { coordinator, enforcement } = setup();
      await coordinator.update(allowAll);
      enforcement.update.mockRejectedValueOnce(new Error('Browser failure'));

      await expect(coordinator.update(allowAll)).rejects.toThrow(
        'Browser failure',
      );

      expect(enforcement.update).toHaveBeenLastCalledWith(blocked);
      await expect(
        coordinator.allowRpcValidation({
          tabId: 7,
          url: 'https://rpc.example',
        }),
      ).rejects.toThrow('RPC validation is unavailable before onboarding');

      await coordinator.update(allowAll);
      expect(enforcement.update).toHaveBeenLastCalledWith(allowAll);
    });

    it('fails closed after an invalid policy input', async () => {
      const { coordinator, enforcement } = setup();
      await coordinator.update(allowAll);

      await expect(
        coordinator.update({
          ...allowAll,
          mode: 'invalid',
        } as unknown as NetworkPolicy),
      ).rejects.toThrow('Invalid network policy');

      expect(enforcement.update).toHaveBeenLastCalledWith(blocked);
    });

    it('reports a failed recovery instead of silently retaining permission', async () => {
      const { coordinator, enforcement } = setup();
      enforcement.update
        .mockRejectedValueOnce(new Error('Installation failed'))
        .mockRejectedValueOnce(new Error('Recovery failed'));

      await expect(coordinator.update(allowAll)).rejects.toThrow(
        'Network policy coordination and fail-closed recovery failed',
      );
    });
  });

  describe('RPC validation', () => {
    it('rejects probes before onboarding even with a social path grant', async () => {
      const { coordinator, enforcement } = setup();
      await coordinator.beginSocialOnboarding(AuthConnection.Google);

      await expect(
        coordinator.allowRpcValidation({
          tabId: 7,
          url: 'https://rpc.example',
        }),
      ).rejects.toThrow('RPC validation is unavailable before onboarding');

      expect(enforcement.allowRpcValidation).not.toHaveBeenCalled();
    });

    it('delegates a post-onboarding grant and serializes idempotent revocation', async () => {
      const { coordinator, enforcement, revoke } = setup();
      await coordinator.update(allowAll);

      const removeGrant = await coordinator.allowRpcValidation({
        tabId: 7,
        url: 'https://rpc.example',
      });
      await Promise.all([removeGrant(), removeGrant()]);

      expect(enforcement.allowRpcValidation).toHaveBeenCalledWith({
        tabId: 7,
        url: 'https://rpc.example',
      });
      expect(revoke).toHaveBeenCalledTimes(1);
    });

    it('rejects new probes as soon as a blocking update is requested', async () => {
      const { coordinator, enforcement } = setup();
      await coordinator.update(allowAll);
      const installation = deferred<void>();
      enforcement.update.mockImplementationOnce(() => installation.promise);
      const update = coordinator.update(blocked);

      await expect(
        coordinator.allowRpcValidation({
          tabId: 7,
          url: 'https://rpc.example',
        }),
      ).rejects.toThrow('RPC validation is unavailable before onboarding');

      expect(enforcement.allowRpcValidation).not.toHaveBeenCalled();
      installation.resolve();
      await update;
    });

    it('revokes a pending native grant when a blocking update arrives', async () => {
      const { coordinator, enforcement, revoke } = setup();
      await coordinator.update(allowAll);
      const installation = deferred<() => Promise<void>>();
      enforcement.allowRpcValidation.mockImplementationOnce(
        () => installation.promise,
      );
      const validation = coordinator.allowRpcValidation({
        tabId: 7,
        url: 'https://rpc.example',
      });
      await Promise.resolve();
      const close = coordinator.update(blocked);

      installation.resolve(revoke);

      await expect(validation).rejects.toThrow(
        'RPC validation was cancelled by a policy change',
      );
      await close;
      expect(revoke).toHaveBeenCalledTimes(1);
      expect(enforcement.update).toHaveBeenLastCalledWith(blocked);
    });

    it('fails closed if a native validation grant cannot be revoked', async () => {
      const { coordinator, enforcement, revoke } = setup();
      await coordinator.update(allowAll);
      const removeGrant = await coordinator.allowRpcValidation({
        tabId: 7,
        url: 'https://rpc.example',
      });
      revoke.mockRejectedValueOnce(new Error('Revocation failed'));

      await expect(removeGrant()).rejects.toThrow('Revocation failed');

      expect(enforcement.update).toHaveBeenLastCalledWith(blocked);
    });
  });
});

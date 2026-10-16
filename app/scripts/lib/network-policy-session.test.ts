import { AuthConnection } from '../../../shared/constants/onboarding';
import { createNetworkPolicySession } from './network-policy-session';
import type { NetworkPolicyCoordinator } from './network-policy-coordinator';

function buildSession() {
  const cleanup = jest.fn().mockResolvedValue(undefined);
  const coordinator: jest.Mocked<NetworkPolicyCoordinator> = {
    update: jest.fn().mockResolvedValue(undefined),
    beginSocialOnboarding: jest.fn().mockResolvedValue(undefined),
    endSocialOnboarding: jest.fn().mockResolvedValue(undefined),
    allowRpcValidation: jest.fn().mockResolvedValue(cleanup),
  };
  return { coordinator, cleanup, ...createNetworkPolicySession(coordinator) };
}

describe('createNetworkPolicySession', () => {
  it('delegates active controller authority without exposing the coordinator', async () => {
    const { coordinator, policy } = buildSession();
    const snapshot = {
      mode: 'blocked' as const,
      allowedDomains: [],
      allowedRpcUrls: [],
    };
    const details = { tabId: 42, url: 'https://rpc.example' };

    await policy.update(snapshot);
    await policy.beginSocialOnboarding(AuthConnection.Google);
    await policy.endSocialOnboarding();
    await policy.allowRpcValidation(details);

    expect(coordinator.update).toHaveBeenCalledWith(snapshot);
    expect(coordinator.beginSocialOnboarding).toHaveBeenCalledWith(
      AuthConnection.Google,
    );
    expect(coordinator.endSocialOnboarding).toHaveBeenCalledTimes(1);
    expect(coordinator.allowRpcValidation).toHaveBeenCalledWith(details);
    expect(Object.isFrozen(policy)).toBe(true);
    expect(policy).not.toBe(coordinator);
  });

  it('rejects every policy capability retained by a replaced controller', async () => {
    const { coordinator, policy, revoke } = buildSession();
    revoke();
    revoke();

    await expect(
      policy.update({
        mode: 'allow-all',
        allowedDomains: [],
        allowedRpcUrls: [],
      }),
    ).rejects.toThrow('revoked');
    await expect(
      policy.beginSocialOnboarding(AuthConnection.Google),
    ).rejects.toThrow('revoked');
    await expect(policy.endSocialOnboarding()).rejects.toThrow('revoked');
    await expect(
      policy.allowRpcValidation({ tabId: 42, url: 'https://rpc.example' }),
    ).rejects.toThrow('revoked');

    for (const method of Object.values(coordinator)) {
      expect(method).not.toHaveBeenCalled();
    }
  });

  it('permits cleanup of a previously accepted validation grant after revocation', async () => {
    const { cleanup, policy, revoke } = buildSession();
    const removeGrant = await policy.allowRpcValidation({
      tabId: 42,
      url: 'https://rpc.example',
    });
    revoke();

    await removeGrant();

    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it('preserves the result of work accepted before the controller was replaced', async () => {
    const { coordinator, policy, revoke } = buildSession();
    let finish: () => void = () => undefined;
    coordinator.update.mockReturnValue(
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
    );
    const accepted = policy.update({
      mode: 'blocked',
      allowedDomains: [],
      allowedRpcUrls: [],
    });
    revoke();
    finish();

    await expect(accepted).resolves.toBeUndefined();
  });

  it('preserves coordinator failures without reopening a revoked session', async () => {
    const { coordinator, policy, revoke } = buildSession();
    coordinator.endSocialOnboarding.mockRejectedValueOnce(
      new Error('Browser rule update failed'),
    );

    await expect(policy.endSocialOnboarding()).rejects.toThrow(
      'Browser rule update failed',
    );
    revoke();
    await expect(policy.endSocialOnboarding()).rejects.toThrow('revoked');

    expect(coordinator.endSocialOnboarding).toHaveBeenCalledTimes(1);
  });
});

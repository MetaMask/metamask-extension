import { Messenger } from '@metamask/messenger';
import { NetworkPolicyController } from '../../controllers/network-policy/network-policy-controller';
import type { NetworkPolicyControllerActions } from '../../controllers/network-policy/network-policy-controller.types';
import { getRootMessenger } from '../../lib/messenger';
import { getNetworkPolicyControllerMessenger } from './network-policy-controller-messenger';

describe('getNetworkPolicyControllerMessenger', () => {
  it('creates the policy messenger with authority retained by the root', async () => {
    const root = getRootMessenger();
    const messenger = getNetworkPolicyControllerMessenger(root);
    const controller = new NetworkPolicyController({
      messenger,
      applyDomainPolicy: async (_domains, commit) => commit(),
    });

    await root.call('NetworkPolicyController:configurePostOnboardingDomains', [
      'approved.example',
    ]);

    expect(messenger).toBeInstanceOf(Messenger);
    expect(controller.state.postOnboardingNetworkDomains).toStrictEqual([
      'approved.example',
    ]);
  });

  it('does not delegate policy changes to another namespace', () => {
    const root = getRootMessenger();
    const messenger = getNetworkPolicyControllerMessenger(root);
    const controller = new NetworkPolicyController({
      messenger,
      applyDomainPolicy: async (_domains, commit) => commit(),
    });
    const dependency = new Messenger<
      'Dependency',
      NetworkPolicyControllerActions,
      never,
      typeof root
    >({
      namespace: 'Dependency',
      parent: root,
    });

    expect(controller.state.postOnboardingNetworkDomains).toBe('*');
    expect(() =>
      dependency.call(
        'NetworkPolicyController:configurePostOnboardingDomains',
        '*',
      ),
    ).toThrow();
  });
});

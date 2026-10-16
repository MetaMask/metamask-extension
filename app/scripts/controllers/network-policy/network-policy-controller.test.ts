import { it } from '@jest/globals';
import { deriveStateFromMetadata } from '@metamask/base-controller';
import { Messenger } from '@metamask/messenger';
import {
  NetworkPolicyController,
  getDefaultNetworkPolicyControllerState,
} from './network-policy-controller';
import type {
  NetworkPolicyControllerMessenger,
  NetworkPolicyControllerState,
  NetworkPolicyDomainPolicyApplier,
} from './network-policy-controller.types';

describe('NetworkPolicyController', () => {
  function createController(
    state?: Partial<NetworkPolicyControllerState>,
    applyDomainPolicy: NetworkPolicyDomainPolicyApplier = async (
      _domains,
      commit,
    ) => commit(),
  ) {
    const messenger: NetworkPolicyControllerMessenger = new Messenger({
      namespace: 'NetworkPolicyController',
    });
    const controller = new NetworkPolicyController({
      messenger,
      state,
      applyDomainPolicy,
    });
    return { controller, messenger };
  }

  describe('constructor', () => {
    it('starts with wildcard authorization for completed onboarding', () => {
      const { controller } = createController();

      expect(controller.state).toStrictEqual(
        getDefaultNetworkPolicyControllerState(),
      );
    });

    it('validates and normalizes persisted exact hostnames', () => {
      const domains = ['RPC.EXAMPLE.', 'rpc.example', 'xn--bcher-kva.example'];
      const { controller } = createController({
        postOnboardingNetworkDomains: domains,
      });

      expect(controller.state.postOnboardingNetworkDomains).toStrictEqual([
        'rpc.example',
        'xn--bcher-kva.example',
      ]);
      expect(controller.state.postOnboardingNetworkDomains).not.toBe(domains);
      expect(domains).toStrictEqual([
        'RPC.EXAMPLE.',
        'rpc.example',
        'xn--bcher-kva.example',
      ]);
    });

    it('rejects a malformed persisted domain instead of granting wildcard access', () => {
      expect(() =>
        createController({
          postOnboardingNetworkDomains: ['https://rpc.example/path'],
        }),
      ).toThrow('bare hostnames');
    });

    it('persists authorization without exposing it to diagnostics or UI', () => {
      const { controller } = createController({
        postOnboardingNetworkDomains: ['private.example'],
      });

      expect(
        deriveStateFromMetadata(
          controller.state,
          controller.metadata,
          'persist',
        ),
      ).toStrictEqual({ postOnboardingNetworkDomains: ['private.example'] });
      for (const metadataKey of [
        'includeInDebugSnapshot',
        'includeInStateLogs',
        'usedInUi',
      ] as const) {
        expect(
          deriveStateFromMetadata(
            controller.state,
            controller.metadata,
            metadataKey,
          ),
        ).toStrictEqual({});
      }
    });
  });

  describe('configurePostOnboardingDomains', () => {
    it('publishes canonical authorization through the private messenger action', async () => {
      const { controller, messenger } = createController();
      const listener = jest.fn();
      messenger.subscribe('NetworkPolicyController:stateChange', listener);
      const domains = ['RPC.EXAMPLE', 'rpc.example'];

      await messenger.call(
        'NetworkPolicyController:configurePostOnboardingDomains',
        domains,
      );
      domains.push('unapproved.example');

      expect(controller.state.postOnboardingNetworkDomains).toStrictEqual([
        'rpc.example',
      ]);
      expect(listener).toHaveBeenCalledWith(
        controller.state,
        expect.any(Array),
      );
    });

    it('supports an empty allowlist without treating it as wildcard access', async () => {
      const { controller } = createController();

      await controller.configurePostOnboardingDomains([]);

      expect(controller.state.postOnboardingNetworkDomains).toStrictEqual([]);
    });

    it('replaces an exact domain list with wildcard authorization', async () => {
      const { controller } = createController({
        postOnboardingNetworkDomains: ['rpc.example'],
      });

      await controller.configurePostOnboardingDomains('*');

      expect(controller.state.postOnboardingNetworkDomains).toBe('*');
    });

    it.each(['*.example', 'rpc.example:443', 'https://rpc.example'])(
      'rejects %s without changing the active authorization',
      async (domain) => {
        const { controller } = createController({
          postOnboardingNetworkDomains: ['approved.example'],
        });

        await expect(
          controller.configurePostOnboardingDomains([domain]),
        ).rejects.toThrow();
        expect(controller.state.postOnboardingNetworkDomains).toStrictEqual([
          'approved.example',
        ]);
      },
    );

    it('rejects non-array authorization from an untyped caller', async () => {
      const { controller } = createController();

      await expect(
        controller.configurePostOnboardingDomains(
          'rpc.example' as unknown as string[],
        ),
      ).rejects.toThrow('Invalid network policy');
    });

    it('waits for browser enforcement before committing or acknowledging a change', async () => {
      let browserApplied: () => void = () => undefined;
      const enforced = new Promise<void>((resolve) => {
        browserApplied = resolve;
      });
      let completeAcknowledgement: () => void = () => undefined;
      const acknowledgement = new Promise<void>((resolve) => {
        completeAcknowledgement = resolve;
      });
      const applyDomainPolicy = jest.fn<
        ReturnType<NetworkPolicyDomainPolicyApplier>,
        Parameters<NetworkPolicyDomainPolicyApplier>
      >(async (_domains, commit) => {
        await enforced;
        commit();
        await acknowledgement;
      });
      const { controller, messenger } = createController(
        { postOnboardingNetworkDomains: '*' },
        applyDomainPolicy,
      );
      const acknowledged = jest.fn();

      const changing = messenger
        .call('NetworkPolicyController:configurePostOnboardingDomains', [
          'APPROVED.EXAMPLE',
        ])
        .then(acknowledged);

      expect(controller.state.postOnboardingNetworkDomains).toBe('*');
      expect(applyDomainPolicy).toHaveBeenCalledWith(
        ['approved.example'],
        expect.any(Function),
      );
      expect(acknowledged).not.toHaveBeenCalled();

      browserApplied();
      await enforced;
      expect(controller.state.postOnboardingNetworkDomains).toStrictEqual([
        'approved.example',
      ]);
      expect(acknowledged).not.toHaveBeenCalled();

      completeAcknowledgement();
      await changing;
      expect(acknowledged).toHaveBeenCalledTimes(1);
    });

    it('preserves persisted authorization when the browser rejects new rules', async () => {
      const applyDomainPolicy = jest
        .fn()
        .mockRejectedValue(new Error('Browser rejected rule update'));
      const { controller, messenger } = createController(
        { postOnboardingNetworkDomains: '*' },
        applyDomainPolicy,
      );

      await expect(
        messenger.call(
          'NetworkPolicyController:configurePostOnboardingDomains',
          ['approved.example'],
        ),
      ).rejects.toThrow('Browser rejected rule update');

      expect(controller.state.postOnboardingNetworkDomains).toBe('*');
    });
  });
});

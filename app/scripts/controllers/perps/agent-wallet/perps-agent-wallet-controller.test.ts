/**
 * @jest-environment node
 */

import type { MessengerActions, MessengerEvents } from '@metamask/messenger';
import { Messenger } from '@metamask/messenger';
import log from 'loglevel';
import { getRootMessenger } from '../../../lib/messenger';
import { getPerpsAgentWalletControllerMessenger } from '../../../messenger-client-init/messengers/perps-agent-wallet-controller-messenger';
import type { AgentKeyHandle } from './agent-secret-store';
import {
  PerpsAgentWalletController,
  getDefaultPerpsAgentWalletControllerState,
} from './perps-agent-wallet-controller';
import type {
  AgentRegistration,
  PerpsAgentWalletControllerMessenger,
  PerpsAgentWalletControllerState,
} from './types';

const MASTER = '0x1111111111111111111111111111111111111111';
const PASSWORD = 'correct horse battery staple';

const buildController = (
  state: Partial<PerpsAgentWalletControllerState> = {},
) => {
  const keyringCalls: string[] = [];
  // Real root messenger. A child messenger owns the KeyringController
  // namespace (mirroring the real KeyringController) with recorded stubs for
  // every action the restricted messenger is allowed to call, so tests can
  // prove this controller never touches the keyring (the agent key is not an
  // account).
  const rootMessenger = getRootMessenger<
    MessengerActions<PerpsAgentWalletControllerMessenger>,
    MessengerEvents<PerpsAgentWalletControllerMessenger>
  >();
  const keyringMessenger = new Messenger({
    namespace: 'KeyringController',
    parent: rootMessenger,
  });
  const keyringStubs: Record<string, (...args: never[]) => unknown> = {
    'KeyringController:addNewKeyring': () => undefined,
    'KeyringController:getKeyringsByType': () => [],
    'KeyringController:signTypedMessage': () => Promise.resolve('0x'),
    'KeyringController:getState': () => ({}),
  };
  for (const [actionType, handler] of Object.entries(keyringStubs)) {
    keyringMessenger.registerActionHandler(
      actionType as never,
      ((...args: never[]) => {
        keyringCalls.push(actionType);
        return handler(...args);
      }) as never,
    );
  }

  const messenger = getPerpsAgentWalletControllerMessenger(rootMessenger);
  const controller = new PerpsAgentWalletController({ messenger, state });
  return { controller, messenger, keyringCalls };
};

const completeAgentSetup = async (
  controller: PerpsAgentWalletController,
  masterAccountAddress: string = MASTER,
  password: string = PASSWORD,
): Promise<{ handle: AgentKeyHandle; registration: AgentRegistration }> => {
  const handle = await controller.beginSetup(masterAccountAddress);
  const registration: AgentRegistration = {
    agentAddress: handle.address,
    agentName: 'metamask-perps',
    masterAccountAddress,
    createdAt: 1_700_000_000_000,
  };
  await controller.completeSetup(masterAccountAddress, registration, password);
  return { handle, registration };
};

describe('PerpsAgentWalletController', () => {
  it('returns a fresh default state object on every call', () => {
    expect(getDefaultPerpsAgentWalletControllerState()).not.toBe(
      getDefaultPerpsAgentWalletControllerState(),
    );
  });

  describe('beginSetup', () => {
    it('generates a keypair, moves status to awaiting-approval, touches no keyring, and keeps plaintext only in the secret store', async () => {
      const { controller, keyringCalls } = buildController();
      const handle = await controller.beginSetup(MASTER);
      expect(handle.address).toMatch(/^0x[0-9a-fA-F]{40}$/u);
      expect(controller.state.setupStatusByAccount[MASTER]).toBe(
        'awaiting-approval',
      );
      expect(JSON.stringify(controller.state)).not.toContain(handle.privateKey);
      // No KeyringController action may be called: the agent key is not an account
      expect(keyringCalls).toHaveLength(0);
    });
  });

  describe('completeSetup', () => {
    it('persists ciphertext and registration metadata, sets active, and emits agentActivated', async () => {
      const { controller, messenger } = buildController();
      const events: { masterAccountAddress: string; agentAddress: string }[] =
        [];
      messenger.subscribe(
        'PerpsAgentWalletController:agentActivated',
        (payload) => {
          events.push(payload);
        },
      );
      const { handle } = await completeAgentSetup(controller);
      expect(controller.state.agentsByAccount[MASTER]?.agentAddress).toBe(
        handle.address,
      );
      expect(controller.state.agentKeyVaultByAccount[MASTER]).not.toContain(
        handle.privateKey.slice(2),
      );
      expect(controller.state.setupStatusByAccount[MASTER]).toBe('active');
      expect(controller.getAgentSigner(MASTER)?.address).toBe(handle.address);
      expect(events).toEqual([
        { masterAccountAddress: MASTER, agentAddress: handle.address },
      ]);
    });

    it('throws when setup was not started for the account', async () => {
      const { controller } = buildController();
      await expect(
        controller.completeSetup(
          MASTER,
          {
            agentAddress: '0x2222222222222222222222222222222222222222',
            agentName: 'metamask-perps',
            masterAccountAddress: MASTER,
            createdAt: 1,
          },
          PASSWORD,
        ),
      ).rejects.toThrow('setup not started');
    });
  });

  describe('failSetup', () => {
    it('marks the setup as failed for the account', async () => {
      const { controller } = buildController();
      await controller.beginSetup(MASTER);
      controller.failSetup(MASTER, 'user rejected');
      expect(controller.state.setupStatusByAccount[MASTER]).toBe('failed');
      expect(controller.getActiveAgent(MASTER)).toBeNull();
    });
  });

  describe('onLock / onUnlock', () => {
    it('clears plaintext on lock and restores it on unlock with the password', async () => {
      const { controller } = buildController();
      const { handle } = await completeAgentSetup(controller);
      controller.onLock();
      expect(controller.getAgentSigner(MASTER)).toBeNull();
      await controller.onUnlock({ password: PASSWORD });
      expect(controller.getAgentSigner(MASTER)?.address).toBe(handle.address);
    });

    it('skips blobs that fail to decrypt and leaves them inactive', async () => {
      const warnSpy = jest
        .spyOn(log, 'warn')
        .mockImplementation(() => undefined);
      const { controller } = buildController();
      await completeAgentSetup(controller);
      controller.onLock();
      await controller.onUnlock({ password: 'wrong password' });
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(controller.getAgentSigner(MASTER)).toBeNull();
      // The registration survives; only signing stays inactive.
      expect(controller.getActiveAgent(MASTER)).not.toBeNull();
      warnSpy.mockRestore();
    });
  });

  describe('onPasswordChange', () => {
    it('re-encrypts stored blobs with the new password', async () => {
      const { controller } = buildController();
      const { handle } = await completeAgentSetup(controller);
      const oldCiphertext = controller.state.agentKeyVaultByAccount[MASTER];
      await controller.onPasswordChange({ password: 'new password' });
      expect(controller.state.agentKeyVaultByAccount[MASTER]).not.toBe(
        oldCiphertext,
      );
      controller.onLock();
      await controller.onUnlock({ password: 'new password' });
      expect(controller.getAgentSigner(MASTER)?.address).toBe(handle.address);
    });
  });

  describe('getActiveAgent', () => {
    it('returns null for accounts with no completed setup', () => {
      const { controller } = buildController();
      expect(
        controller.getActiveAgent('0x9999999999999999999999999999999999999999'),
      ).toBeNull();
    });

    it('returns the persisted registration after a restart with an empty setup status map, and resolves a working signer after onUnlock', async () => {
      // Instance 1: complete setup to produce a real registration + ciphertext.
      const first = buildController();
      const { handle, registration } = await completeAgentSetup(
        first.controller,
      );
      const persistedState = {
        agentsByAccount: { [MASTER]: registration },
        agentKeyVaultByAccount: {
          [MASTER]: first.controller.state.agentKeyVaultByAccount[MASTER],
        },
      };

      // Instance 2: app restart — registration and vault persisted,
      // setupStatusByAccount empty (persist: false).
      const { controller } = buildController(persistedState);
      expect(controller.state.setupStatusByAccount[MASTER]).toBeUndefined();
      expect(controller.getActiveAgent(MASTER)).toEqual(registration);
      // Locked: no plaintext in memory yet, so no signer despite activity.
      expect(controller.getAgentSigner(MASTER)).toBeNull();
      await controller.onUnlock({ password: PASSWORD });
      const signer = controller.getAgentSigner(MASTER);
      expect(signer?.address).toBe(handle.address);
      // The restored signer actually signs with the agent key.
      const signature = await signer?.signTypedData(
        { name: 'Test', version: '1', chainId: 1 },
        { Test: [{ name: 'value', type: 'string' }] },
        { value: 'restart' },
      );
      expect(typeof signature).toBe('string');
      expect(signature).toMatch(/^0x[0-9a-fA-F]+$/u);
    });

    it.each([
      'generating',
      'awaiting-approval',
      'submitting',
    ] as const)(
      'returns null while setup is mid-flight (%s) even with an existing registration',
      async (midFlightStatus) => {
        const first = buildController();
        const { registration } = await completeAgentSetup(first.controller);
        const { controller } = buildController({
          agentsByAccount: { [MASTER]: registration },
          setupStatusByAccount: { [MASTER]: midFlightStatus },
        });
        expect(controller.getActiveAgent(MASTER)).toBeNull();
      },
    );

    it('returns null while re-running setup (awaiting-approval) over an existing registration', async () => {
      const { controller } = buildController();
      await completeAgentSetup(controller);
      await controller.beginSetup(MASTER);
      expect(controller.state.setupStatusByAccount[MASTER]).toBe(
        'awaiting-approval',
      );
      expect(controller.getActiveAgent(MASTER)).toBeNull();
    });

    it('still returns the registration when the status is failed (a failed re-setup does not disable the agent)', async () => {
      const { controller } = buildController();
      const { registration } = await completeAgentSetup(controller);
      controller.failSetup(MASTER, 're-setup rejected');
      expect(controller.state.setupStatusByAccount[MASTER]).toBe('failed');
      expect(controller.getActiveAgent(MASTER)).toEqual(registration);
    });
  });
});

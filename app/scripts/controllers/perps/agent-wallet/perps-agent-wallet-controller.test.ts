/**
 * @jest-environment node
 */

import type { MessengerActions, MessengerEvents } from '@metamask/messenger';
import { Messenger } from '@metamask/messenger';
import type { KeyringControllerAccountRemovedEvent } from '@metamask/keyring-controller';
import log from 'loglevel';
import { getRootMessenger, type RootMessenger } from '../../../lib/messenger';
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
  PerpsAgentWalletSetupStatus,
} from './types';

const MASTER = '0x1111111111111111111111111111111111111111';
const PASSWORD = 'correct horse battery staple';

// The setup flow emits perps agent setup metrics; stub delivery so these
// tests never depend on (or trip) the unconfigured analytics singleton.
const mockTrackEvent = jest.fn();

jest.mock('../../analytics', () => ({
  createEventBuilder:
    jest.requireActual('../../analytics').createEventBuilder,
  trackEvent: (...args: unknown[]) => mockTrackEvent(...args),
}));

// The setup flow is wrapped so the setupAgentWallet tests can assert what the
// controller forwards into it. When the wrapper has no stubbed return value
// it delegates to the real flow, so the existing end-to-end tests run
// unchanged.
const mockSetupAgentWalletFlow = jest.fn();

jest.mock('./agent-setup-flow', () => {
  const actual = jest.requireActual('./agent-setup-flow');
  return {
    ...actual,
    setupAgentWallet: (...args: unknown[]) =>
      mockSetupAgentWalletFlow(...args) ?? actual.setupAgentWallet(...args),
  };
});

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
  // Typed with the one keyring event the harness publishes (and the root
  // messenger as parent) so the publish payload typechecks; action stubs stay
  // registered via `as never` casts.
  const keyringMessenger = new Messenger<
    'KeyringController',
    never,
    KeyringControllerAccountRemovedEvent,
    RootMessenger<
      MessengerActions<PerpsAgentWalletControllerMessenger>,
      MessengerEvents<PerpsAgentWalletControllerMessenger>
    >
  >({
    namespace: 'KeyringController',
    parent: rootMessenger,
  });
  const keyringStubs: Record<string, (...args: never[]) => unknown> = {
    'KeyringController:addNewKeyring': () => undefined,
    'KeyringController:getKeyringsByType': () => [],
    'KeyringController:signTypedMessage': () =>
      // Valid 132-char signature (0x + 130 hex): the setup flow rejects
      // malformed signatures before submitting to the exchange.
      Promise.resolve(`0x${'11'.repeat(32)}${'22'.repeat(32)}1c`),
    'KeyringController:getState': () => ({}),
    'KeyringController:verifyPassword': () => Promise.resolve(true),
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
  return { controller, messenger, keyringCalls, keyringMessenger };
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

    it('throws and leaves state unchanged when registration.agentAddress does not match the generated keypair', async () => {
      const { controller } = buildController();
      await controller.beginSetup(MASTER);
      await expect(
        controller.completeSetup(
          MASTER,
          {
            agentAddress: '0x2222222222222222222222222222222222222222',
            agentName: 'metamask-perps',
            masterAccountAddress: MASTER,
            createdAt: 1_700_000_000_000,
          },
          PASSWORD,
        ),
      ).rejects.toThrow(/AGENT_ADDRESS_MISMATCH/u);
      expect(controller.state.agentsByAccount).toEqual({});
      expect(controller.state.agentKeyVaultByAccount).toEqual({});
      // Still mid-flight: the held plaintext stays valid for a corrected retry.
      expect(controller.state.setupStatusByAccount[MASTER]).toBe(
        'awaiting-approval',
      );
    });

    it('throws and leaves state unchanged when registration.masterAccountAddress does not match the setup account', async () => {
      const { controller } = buildController();
      const handle = await controller.beginSetup(MASTER);
      await expect(
        controller.completeSetup(
          MASTER,
          {
            agentAddress: handle.address,
            agentName: 'metamask-perps',
            masterAccountAddress: '0x9999999999999999999999999999999999999999',
            createdAt: 1_700_000_000_000,
          },
          PASSWORD,
        ),
      ).rejects.toThrow(/MASTER_ACCOUNT_MISMATCH/u);
      expect(controller.state.agentsByAccount).toEqual({});
      expect(controller.state.agentKeyVaultByAccount).toEqual({});
      expect(controller.state.setupStatusByAccount[MASTER]).toBe(
        'awaiting-approval',
      );
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

  describe('removeAgent', () => {
    it('deletes the registration, ciphertext, and setup status, clears plaintext, and emits agentDeactivated', async () => {
      const { controller, messenger } = buildController();
      const events: { masterAccountAddress: string; reason: string }[] =
        [];
      messenger.subscribe(
        'PerpsAgentWalletController:agentDeactivated',
        (payload: { masterAccountAddress: string; reason: string }) => {
          events.push(payload);
        },
      );
      const master = '0x1111111111111111111111111111111111111111';
      const handle = await controller.beginSetup(master);
      await controller.completeSetup(
        master,
        {
          agentAddress: handle.address,
          agentName: 'metamask-perps',
          masterAccountAddress: master,
          createdAt: 1_700_000_000_000,
        },
        'correct horse battery staple',
      );
      expect(controller.getAgentSigner(master)).not.toBeNull();

      controller.removeAgent(master, 'user');

      expect(controller.state.agentsByAccount[master]).toBeUndefined();
      expect(controller.state.agentKeyVaultByAccount[master]).toBeUndefined();
      expect(controller.state.setupStatusByAccount[master]).toBeUndefined();
      expect(controller.getAgentSigner(master)).toBeNull();
      expect(events).toEqual([
        { masterAccountAddress: master, reason: 'user' },
      ]);
    });

    it('is a no-op (no event) for an account with no registration', () => {
      const { controller, messenger } = buildController();
      const events: string[] = [];
      messenger.subscribe('PerpsAgentWalletController:agentDeactivated', () => {
        events.push('fired');
      });
      controller.removeAgent('0x3333333333333333333333333333333333333333', 'user');
      expect(events).toHaveLength(0);
    });

    it('cleans up when KeyringController:accountRemoved fires for a registered account', async () => {
      const { controller, keyringMessenger } = buildController();
      const master = '0x1111111111111111111111111111111111111111';
      const handle = await controller.beginSetup(master);
      await controller.completeSetup(
        master,
        {
          agentAddress: handle.address,
          agentName: 'metamask-perps',
          masterAccountAddress: master,
          createdAt: 1_700_000_000_000,
        },
        'correct horse battery staple',
      );

      keyringMessenger.publish('KeyringController:accountRemoved', master);

      expect(controller.state.agentsByAccount[master]).toBeUndefined();
      expect(controller.state.agentKeyVaultByAccount[master]).toBeUndefined();
      expect(controller.getAgentSigner(master)).toBeNull();
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

  describe('onInaccessibleKeys', () => {
    it('clears all agent registrations, ciphertexts, and in-memory plaintext, logging a warning', async () => {
      const warnSpy = jest
        .spyOn(log, 'warn')
        .mockImplementation(() => undefined);
      const { controller, messenger } = buildController();
      await completeAgentSetup(controller);
      expect(controller.getActiveAgent(MASTER)).not.toBeNull();
      expect(controller.state.agentKeyVaultByAccount[MASTER]).toBeDefined();

      // Called via the messenger: proves the action is registered externally.
      expect(
        messenger.call('PerpsAgentWalletController:onInaccessibleKeys'),
      ).toBeUndefined();

      expect(controller.state.agentsByAccount).toEqual({});
      expect(controller.state.agentKeyVaultByAccount).toEqual({});
      // Signing is dead even if a registration somehow remained: the
      // plaintext is gone.
      expect(controller.getAgentSigner(MASTER)).toBeNull();
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('inaccessible'),
      );
      warnSpy.mockRestore();
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

    // Plain `it` inside a loop instead of `it.each`: @types/mocha shadows
    // `it.each` in this repo's type environment (see encryption-public-key
    // tests for the @ts-expect-error workaround we avoid here).
    const midFlightStatuses: PerpsAgentWalletSetupStatus[] = [
      'generating',
      'awaiting-approval',
      'submitting',
    ];
    for (const midFlightStatus of midFlightStatuses) {
      it(`returns null while setup is mid-flight (${midFlightStatus}) even with an existing registration`, async () => {
        const first = buildController();
        const { registration } = await completeAgentSetup(first.controller);
        const { controller } = buildController({
          agentsByAccount: { [MASTER]: registration },
          setupStatusByAccount: { [MASTER]: midFlightStatus },
        });
        expect(controller.getActiveAgent(MASTER)).toBeNull();
      });
    }

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

  describe('canSetupAgentWallet', () => {
    it('starts false', () => {
      const { controller } = buildController();
      expect(controller.canSetupAgentWallet()).toBe(false);
    });

    it('is true after a password unlock and false again after lock', async () => {
      const { controller } = buildController();
      await controller.onUnlock({ password: PASSWORD });
      expect(controller.canSetupAgentWallet()).toBe(true);
      controller.onLock();
      expect(controller.canSetupAgentWallet()).toBe(false);
    });

    it('is true after a successful setupAgentWallet (password verified by the flow)', async () => {
      const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'ok' }),
      } as never);
      const { controller } = buildController();
      expect(controller.canSetupAgentWallet()).toBe(false);
      await controller.setupAgentWallet({
        masterAccountAddress: MASTER,
        isTestnet: false,
        password: PASSWORD,
      });
      expect(controller.canSetupAgentWallet()).toBe(true);
      fetchMock.mockRestore();
    });

    it('stays false when setupAgentWallet fails before completing', async () => {
      const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        json: async () => ({ status: 'err', response: 'bad' }),
      } as never);
      const { controller } = buildController();
      await expect(
        controller.setupAgentWallet({
          masterAccountAddress: MASTER,
          isTestnet: false,
          password: PASSWORD,
        }),
      ).rejects.toThrow();
      expect(controller.canSetupAgentWallet()).toBe(false);
      fetchMock.mockRestore();
    });
  });

  describe('setupAgentWallet', () => {
    it('passes isRotation true to the flow when the account already has an agent', async () => {
      mockSetupAgentWalletFlow.mockReset();
      const registration: AgentRegistration = {
        agentAddress: '0x2222222222222222222222222222222222222222',
        agentName: 'metamask-perps',
        masterAccountAddress: MASTER,
        createdAt: 1_700_000_000_000,
      };
      const { controller, messenger } = buildController({
        agentsByAccount: { [MASTER]: registration },
      });
      mockSetupAgentWalletFlow.mockResolvedValue({
        agentAddress: '0x3333333333333333333333333333333333333333',
      });

      await controller.setupAgentWallet({
        masterAccountAddress: MASTER,
        isTestnet: false,
        password: PASSWORD,
      });

      expect(mockSetupAgentWalletFlow).toHaveBeenCalledTimes(1);
      expect(mockSetupAgentWalletFlow).toHaveBeenCalledWith(
        controller,
        messenger,
        {
          masterAccountAddress: MASTER,
          isTestnet: false,
          password: PASSWORD,
          isRotation: true,
        },
      );
    });

    it('passes isRotation false to the flow when the account has no agent', async () => {
      mockSetupAgentWalletFlow.mockReset();
      const { controller, messenger } = buildController();
      mockSetupAgentWalletFlow.mockResolvedValue({
        agentAddress: '0x3333333333333333333333333333333333333333',
      });

      await controller.setupAgentWallet({
        masterAccountAddress: MASTER,
        isTestnet: false,
        password: PASSWORD,
      });

      expect(mockSetupAgentWalletFlow).toHaveBeenCalledTimes(1);
      expect(mockSetupAgentWalletFlow).toHaveBeenCalledWith(
        controller,
        messenger,
        {
          masterAccountAddress: MASTER,
          isTestnet: false,
          password: PASSWORD,
          isRotation: false,
        },
      );
    });
  });
});

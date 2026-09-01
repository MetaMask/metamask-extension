import { BaseController } from '@metamask/base-controller';
// `@ethersproject/wallet` is only a transitive dependency in this repo, which
// trips `import-x/no-extraneous-dependencies`; the `ethers` umbrella
// re-exports the exact same `Wallet` class (see agent-secret-store.ts).
import { Wallet } from 'ethers';
import log from 'loglevel';
import { encryptorFactory } from '../../../lib/encryptor-factory';
import { AgentSecretStore, generateAgentKeypair } from './agent-secret-store';
import type { AgentKeyHandle } from './agent-secret-store';
import type {
  AgentRegistration,
  PerpsAgentSigner,
  PerpsAgentWalletControllerMessenger,
  PerpsAgentWalletControllerState,
} from './types';

const CONTROLLER_NAME = 'PerpsAgentWalletController';

// Same iteration count as the keyring encryptor factory usage elsewhere
// (e.g. SnapController init).
const ENCRYPTOR_ITERATIONS = 600_000;

const perpsAgentWalletControllerMetadata = {
  agentsByAccount: {
    includeInDebugSnapshot: true,
    includeInStateLogs: true,
    persist: true,
    usedInUi: true,
  },
  setupStatusByAccount: {
    includeInDebugSnapshot: true,
    includeInStateLogs: true,
    persist: false,
    usedInUi: true,
  },
  // Ciphertext only — never state-logged or included in debug snapshots.
  agentKeyVaultByAccount: {
    includeInDebugSnapshot: false,
    includeInStateLogs: false,
    persist: true,
    usedInUi: false,
  },
} as const;

const MESSENGER_EXPOSED_METHODS = [
  'getActiveAgent',
  'beginSetup',
  'completeSetup',
  'failSetup',
  'onUnlock',
  'onPasswordChange',
  'onLock',
] as const;

export function getDefaultPerpsAgentWalletControllerState(): PerpsAgentWalletControllerState {
  return {
    agentsByAccount: {},
    setupStatusByAccount: {},
    agentKeyVaultByAccount: {},
  };
}

/**
 * Registry and lifecycle manager for HyperLiquid perps agent wallets.
 *
 * Each agent key is a standalone keypair generated during setup; it is never
 * registered with the KeyringController. The private key lives only in the
 * in-memory {@link AgentSecretStore} while the wallet is unlocked, and is
 * persisted exclusively as a password-encrypted blob in state.
 */
export class PerpsAgentWalletController extends BaseController<
  typeof CONTROLLER_NAME,
  PerpsAgentWalletControllerState,
  PerpsAgentWalletControllerMessenger
> {
  readonly #store: AgentSecretStore = new AgentSecretStore(
    encryptorFactory(ENCRYPTOR_ITERATIONS),
  );

  constructor({
    messenger,
    state,
  }: {
    messenger: PerpsAgentWalletControllerMessenger;
    state?: Partial<PerpsAgentWalletControllerState>;
  }) {
    super({
      name: CONTROLLER_NAME,
      metadata: perpsAgentWalletControllerMetadata,
      messenger,
      state: {
        ...getDefaultPerpsAgentWalletControllerState(),
        ...state,
      },
    });

    this.messenger.registerMethodActionHandlers(
      this,
      MESSENGER_EXPOSED_METHODS,
    );

    this.messenger.subscribe('KeyringController:lock', () => this.onLock());
  }

  /**
   * Returns the completed agent registration for the given master account, or
   * null when the account has no registration or a setup is currently
   * mid-flight for it.
   *
   * Activity derives from the persisted registration, not the transient setup
   * status ({@link PerpsAgentWalletControllerState.setupStatusByAccount} is
   * `persist:false`, so it is empty after a restart while registrations
   * survive). Only a setup that is currently mid-flight suppresses the
   * registration — including a failed re-setup, which must not disable an
   * already-registered agent.
   *
   * @param masterAccountAddress - The master account address.
   * @returns The agent registration, or null.
   */
  getActiveAgent(masterAccountAddress: string): AgentRegistration | null {
    const agent = this.state.agentsByAccount[masterAccountAddress];
    if (!agent) {
      return null;
    }
    const status = this.state.setupStatusByAccount[masterAccountAddress];
    const isSetupMidFlight =
      status === 'generating' ||
      status === 'awaiting-approval' ||
      status === 'submitting';
    return isSetupMidFlight ? null : agent;
  }

  /**
   * Local signer for the injected signing seam; null while locked or inactive.
   *
   * @param masterAccountAddress - The master account address.
   * @returns A signer bound to the agent key, or null.
   */
  getAgentSigner(masterAccountAddress: string): PerpsAgentSigner | null {
    const agent = this.getActiveAgent(masterAccountAddress);
    const privateKey = this.#store.getPlaintext(masterAccountAddress);
    if (!agent || !privateKey) {
      return null;
    }
    const wallet = new Wallet(privateKey);
    return {
      address: agent.agentAddress,
      signTypedData: (domain, types, value) =>
        wallet._signTypedData(domain as never, types as never, value as never),
    };
  }

  /**
   * Begins agent setup: generates a fresh keypair and holds its plaintext in
   * the secret store only. The keyring is never touched.
   *
   * @param masterAccountAddress - The master account the agent is created for.
   * @returns The generated agent key handle.
   */
  async beginSetup(masterAccountAddress: string): Promise<AgentKeyHandle> {
    this.update((state) => {
      state.setupStatusByAccount[masterAccountAddress] = 'generating';
    });
    const handle = generateAgentKeypair();
    this.#store.setPlaintext(masterAccountAddress, handle.privateKey);
    this.update((state) => {
      state.setupStatusByAccount[masterAccountAddress] = 'awaiting-approval';
    });
    return handle;
  }

  /**
   * Completes agent setup: encrypts the held plaintext with the wallet
   * password, persists the ciphertext plus registration metadata, marks the
   * agent active, and emits `agentActivated`.
   *
   * @param masterAccountAddress - The master account the agent belongs to.
   * @param registration - The registration metadata to persist.
   * @param password - The wallet password used to encrypt the agent key.
   */
  async completeSetup(
    masterAccountAddress: string,
    registration: AgentRegistration,
    password: string,
  ): Promise<void> {
    const privateKey = this.#store.getPlaintext(masterAccountAddress);
    if (!privateKey) {
      throw new Error('setup not started');
    }
    const ciphertext = await this.#store.encrypt(
      password,
      masterAccountAddress,
      { address: registration.agentAddress, privateKey },
    );
    this.update((state) => {
      state.agentsByAccount[masterAccountAddress] = registration;
      state.agentKeyVaultByAccount[masterAccountAddress] = ciphertext;
      state.setupStatusByAccount[masterAccountAddress] = 'active';
    });
    this.messenger.publish('PerpsAgentWalletController:agentActivated', {
      masterAccountAddress,
      agentAddress: registration.agentAddress,
    });
  }

  /**
   * Marks an in-flight setup as failed for the given master account.
   *
   * @param masterAccountAddress - The master account whose setup failed.
   * @param _reason - Unused; reserved for future failure reporting.
   */
  failSetup(masterAccountAddress: string, _reason: string): void {
    this.update((state) => {
      state.setupStatusByAccount[masterAccountAddress] = 'failed';
    });
  }

  /**
   * Called from the password unlock hook; decrypts all stored ciphertexts
   * back into the in-memory store. Wrong/corrupt blobs are logged and skipped
   * — the vault already unlocked successfully, so this indicates a stale or
   * corrupt blob rather than a bad password.
   *
   * Limitation: on `encryptionKey` unlocks (passkey / social login) there is
   * no password; agent signing stays inactive for that session and perps
   * falls back to master signing.
   *
   * @param payload - The unlock payload.
   * @param payload.password - The wallet password that unlocked the vault.
   */
  async onUnlock(payload: { password: string }): Promise<void> {
    for (const [master, ciphertext] of Object.entries(
      this.state.agentKeyVaultByAccount,
    )) {
      try {
        this.#store.setPlaintext(
          master,
          await this.#store.decrypt(payload.password, ciphertext),
        );
      } catch (error) {
        log.warn(
          'PerpsAgentWalletController: agent key decrypt failed for',
          master,
          error,
        );
      }
    }
  }

  /**
   * Re-encrypts every stored blob with the new password after a successful
   * password change (called best-effort from the changePassword hook). Blobs
   * whose plaintext is not in memory (locked or never decrypted) are skipped.
   *
   * @param payload - The payload.
   * @param payload.password - The new wallet password.
   */
  async onPasswordChange(payload: { password: string }): Promise<void> {
    const reencrypted: Record<string, string> = {};
    for (const master of Object.keys(this.state.agentKeyVaultByAccount)) {
      const privateKey = this.#store.getPlaintext(master); // unlocked ⇒ plaintext available
      const agent = this.state.agentsByAccount[master];
      if (!privateKey || !agent) {
        continue;
      }
      reencrypted[master] = await this.#store.encrypt(
        payload.password,
        master,
        { address: agent.agentAddress, privateKey },
      );
    }
    if (Object.keys(reencrypted).length > 0) {
      this.update((state) => {
        state.agentKeyVaultByAccount = {
          ...state.agentKeyVaultByAccount,
          ...reencrypted,
        };
      });
    }
  }

  /** Clears all in-memory plaintext keys. */
  onLock(): void {
    this.#store.clearPlaintext();
  }
}

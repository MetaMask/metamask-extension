import { BaseController } from '@metamask/base-controller';
// `@ethersproject/wallet` is only a transitive dependency in this repo, which
// trips `import-x/no-extraneous-dependencies`; the `ethers` umbrella
// re-exports the exact same `Wallet` class (see agent-secret-store.ts).
import { Wallet } from 'ethers';
import log from 'loglevel';
import { encryptorFactory } from '../../../lib/encryptor-factory';
import { AgentSecretStore, generateAgentKeypair } from './agent-secret-store';
import type { AgentKeyHandle } from './agent-secret-store';
import { setupAgentWallet } from './agent-setup-flow';
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
  'getAgentSigner',
  'canSetupAgentWallet',
  'onUnlock',
  'onPasswordChange',
  'onInaccessibleKeys',
] as const;

// Error codes thrown by `completeSetup` before any state mutation.
const SETUP_NOT_STARTED = 'setup not started';
const AGENT_ADDRESS_MISMATCH = 'AGENT_ADDRESS_MISMATCH';
const MASTER_ACCOUNT_MISMATCH = 'MASTER_ACCOUNT_MISMATCH';

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

  /**
   * True only while the current session was unlocked with the wallet
   * password (or an agent setup has verified it). Passkey/social-login
   * (`encryptionKey`) unlocks leave this false for the session, so the
   * agent setup CTA stays hidden and perps falls back to master signing.
   */
  #canSetupAgentWallet = false;

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
   * Completes agent setup: validates the registration against the held
   * keypair, encrypts the held plaintext with the wallet password, persists
   * the ciphertext plus registration metadata, marks the agent active, and
   * emits `agentActivated`.
   *
   * Throws before any state mutation when: setup was not started, the
   * registration's `agentAddress` does not match the address derived from
   * the held plaintext (case-insensitive), or the registration's
   * `masterAccountAddress` does not match the setup account. A mismatched
   * registration must never be persisted — `getAgentSigner` would otherwise
   * advertise one address while signing with another.
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
      throw new Error(SETUP_NOT_STARTED);
    }
    // Validate everything before the first `this.update` so a rejected
    // registration can never leave partial state behind.
    const derivedAddress = new Wallet(privateKey).address;
    if (registration.agentAddress.toLowerCase() !== derivedAddress.toLowerCase()) {
      throw new Error(
        `${AGENT_ADDRESS_MISMATCH}: registration.agentAddress (${registration.agentAddress}) does not match the address derived from the generated agent key (${derivedAddress})`,
      );
    }
    if (registration.masterAccountAddress !== masterAccountAddress) {
      throw new Error(
        `${MASTER_ACCOUNT_MISMATCH}: registration.masterAccountAddress (${registration.masterAccountAddress}) does not match the setup account (${masterAccountAddress})`,
      );
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
   * Whether agent setup is possible in this session: true only when the
   * session was password-unlocked (see {@link onUnlock}) or a setup flow has
   * successfully verified the password. Ruling R1: passkey/social-login
   * unlocks provide no password, so agent key encryption is unavailable and
   * the UI must not offer agent setup.
   *
   * @returns True when agent setup is possible.
   */
  canSetupAgentWallet(): boolean {
    return this.#canSetupAgentWallet;
  }

  /**
   * Orchestration entry point for the full agent setup flow: verifies the
   * wallet password, generates the agent keypair, has the MASTER account sign
   * the Hyperliquid `approveAgent` typed data via
   * `KeyringController:signTypedMessage`, submits the action to the exchange,
   * and — on success — activates and persists the agent (emitting
   * `agentActivated`).
   *
   * Throws {@link AgentSetupRejectionError} when the password is wrong or the
   * master signature is rejected, and {@link AgentSetupSubmissionError} when
   * the exchange submission fails; a mid-flight setup is marked failed via
   * {@link failSetup} in both cases.
   *
   * @param params - The setup parameters.
   * @param params.masterAccountAddress - The master account the agent is created for.
   * @param params.isTestnet - Whether the agent targets Hyperliquid testnet.
   * @param params.password - The wallet password (gates encryption of the agent key).
   * @returns The activated agent address.
   */
  async setupAgentWallet(params: {
    masterAccountAddress: string;
    isTestnet: boolean;
    password: string;
  }): Promise<{ agentAddress: `0x${string}` }> {
    const result = await setupAgentWallet(this, this.messenger, params);
    // A completed setup proves the flow's password verification succeeded,
    // so agent setup is possible in this session even if the unlock used an
    // encryption key.
    this.#canSetupAgentWallet = true;
    return result;
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
    // The unlock hook is only invoked for password unlocks (the encryptionKey
    // passkey/social-login path never reaches it), so reaching this point
    // proves the session is password-unlocked and agent setup is possible.
    this.#canSetupAgentWallet = true;
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

  /** Clears all in-memory plaintext keys and revokes this session's setup eligibility. */
  onLock(): void {
    this.#canSetupAgentWallet = false;
    this.#store.clearPlaintext();
  }

  /**
   * Clears all agent registrations and encrypted key material after a wallet
   * password change that did not go through {@link onPasswordChange}.
   *
   * Passkey-verified password changes never provide the old password, so no
   * plaintext agent key exists in memory to re-encrypt: once the vault key
   * rotates, the stored ciphertexts can never be decrypted again. Per the
   * controller ruling, the safe degradation is to clear the now-unreadable
   * state — the agent goes inert and the user re-runs setup; funds remain
   * master-custodied throughout. Called best-effort from the service and must
   * never be allowed to fail the password change.
   */
  onInaccessibleKeys(): void {
    log.warn(
      'PerpsAgentWalletController: agent keys are inaccessible after the password change (passkey path — no plaintext in memory to re-encrypt); clearing agent registrations',
    );
    this.update((state) => {
      state.agentsByAccount = {};
      state.agentKeyVaultByAccount = {};
    });
    this.#store.clearPlaintext();
  }
}

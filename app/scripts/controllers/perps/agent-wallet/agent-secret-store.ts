// `@ethersproject/wallet` is only a transitive dependency in this repo, which trips
// `import-x/no-extraneous-dependencies`; the `ethers` umbrella re-exports the exact
// same `Wallet` class (ethers v5 wraps @ethersproject/* 5.x).
import { Wallet } from 'ethers';
import type { Encryptor } from '@metamask/keyring-controller';

export type AgentKeyHandle = { address: `0x${string}`; privateKey: string };

export function generateAgentKeypair(): AgentKeyHandle {
  const wallet = Wallet.createRandom();
  return {
    address: wallet.address as `0x${string}`,
    privateKey: wallet.privateKey,
  };
}

/** Ciphertext-at-rest store; plaintext lives only in memory while unlocked. */
export class AgentSecretStore {
  #encryptor: Encryptor;

  #plaintext = new Map<string, string>();

  constructor(encryptor: Encryptor) {
    this.#encryptor = encryptor;
  }

  async encrypt(
    password: string,
    _masterAccountAddress: string,
    handle: AgentKeyHandle,
  ): Promise<string> {
    return this.#encryptor.encrypt(password, { privateKey: handle.privateKey });
  }

  async decrypt(password: string, ciphertext: string): Promise<string> {
    const blob = (await this.#encryptor.decrypt(password, ciphertext)) as {
      privateKey: string;
    };
    return blob.privateKey;
  }

  setPlaintext(masterAccountAddress: string, privateKey: string): void {
    this.#plaintext.set(masterAccountAddress, privateKey);
  }

  getPlaintext(masterAccountAddress: string): string | null {
    return this.#plaintext.get(masterAccountAddress) ?? null;
  }

  clearPlaintext(): void {
    this.#plaintext.clear();
  }

  /**
   * Clears the in-memory plaintext for one master account (revoke/removal).
   * @param masterAccountAddress
   */
  clearPlaintextFor(masterAccountAddress: string): void {
    this.#plaintext.delete(masterAccountAddress);
  }
}

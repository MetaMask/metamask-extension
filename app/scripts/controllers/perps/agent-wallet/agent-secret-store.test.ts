/**
 * @jest-environment node
 */

import { encryptorFactory } from '../../../lib/encryptor-factory';
import { generateAgentKeypair, AgentSecretStore } from './agent-secret-store';

const PASSWORD = 'correct horse battery staple';
const MASTER = '0x1111111111111111111111111111111111111111';

describe('AgentSecretStore', () => {
  it('round-trips an agent key through encrypt/decrypt', async () => {
    const store = new AgentSecretStore(encryptorFactory(600_000));
    const handle = generateAgentKeypair();
    const ciphertext = await store.encrypt(PASSWORD, MASTER, handle);
    expect(ciphertext).not.toContain(handle.privateKey.slice(2));
    expect(await store.decrypt(PASSWORD, ciphertext)).toBe(handle.privateKey);
  });

  it('fails decryption with the wrong password', async () => {
    const store = new AgentSecretStore(encryptorFactory(600_000));
    const ciphertext = await store.encrypt(
      PASSWORD,
      MASTER,
      generateAgentKeypair(),
    );
    await expect(store.decrypt('wrong', ciphertext)).rejects.toThrow();
  });

  it('holds plaintext only in memory and clears it on lock', () => {
    const store = new AgentSecretStore(encryptorFactory(600_000));
    const handle = generateAgentKeypair();
    store.setPlaintext(MASTER, handle.privateKey);
    expect(store.getPlaintext(MASTER)).toBe(handle.privateKey);
    store.clearPlaintext();
    expect(store.getPlaintext(MASTER)).toBeNull();
  });

  it('generates a unique keypair per call (never-reuse rule)', () => {
    expect(generateAgentKeypair().privateKey).not.toBe(
      generateAgentKeypair().privateKey,
    );
  });
});

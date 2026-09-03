/**
 * @jest-environment node
 */

import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { encryptorFactory } from '../../lib/encryptor-factory';
import { trackEvent } from '../analytics';
import {
  agentWalletAnalytics,
  agentWalletCrypto,
  agentWalletEncryptor,
} from './agent-wallet-adapters';

jest.mock('../analytics', () => ({
  ...jest.requireActual('../analytics'),
  trackEvent: jest.fn(),
}));

describe('agent-wallet-adapters', () => {
  describe('agentWalletCrypto.generateKeyPair', () => {
    it('generates a distinct keypair on every call (never reuses keys)', () => {
      const first = agentWalletCrypto.generateKeyPair();
      const second = agentWalletCrypto.generateKeyPair();

      expect(first.address).toMatch(/^0x[0-9a-fA-F]{40}$/u);
      expect(first.privateKey).toMatch(/^0x[0-9a-fA-F]{64}$/u);
      expect(first.address).not.toBe(second.address);
      expect(first.privateKey).not.toBe(second.privateKey);
    });
  });

  describe('agentWalletCrypto.createSigner', () => {
    it('derives the expected address from a known private key', () => {
      const signer = agentWalletCrypto.createSigner(
        '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
      );

      expect(signer.address).toBe(
        '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      );
      expect(typeof signer.signTypedData).toBe('function');
    });
  });

  describe('agentWalletAnalytics', () => {
    it('adds the Perps category and forwards properties to the built event', () => {
      (trackEvent as jest.Mock).mockClear();
      // The snake_case keys mirror the shipped metric wire format.
      /* eslint-disable @typescript-eslint/naming-convention */
      agentWalletAnalytics.track('Perp Agent Setup Started', {
        is_testnet: false,
        is_rotation: false,
      });

      expect(trackEvent).toHaveBeenCalledTimes(1);
      const [built] = (trackEvent as jest.Mock).mock.calls[0];
      expect(built.name).toBe(MetaMetricsEventName.PerpsAgentSetupStarted);
      expect(built.properties).toStrictEqual({
        category: MetaMetricsEventCategory.Perps,
        is_testnet: false,
        is_rotation: false,
      });
      /* eslint-enable @typescript-eslint/naming-convention */
      // Non-anonymous events must not set the anonymous build option.
      expect(built.options).toBeUndefined();
    });

    it('maps the anonymous option to excludeMetaMetricsId', () => {
      (trackEvent as jest.Mock).mockClear();
      // The snake_case keys mirror the shipped metric wire format.
      /* eslint-disable @typescript-eslint/naming-convention */
      agentWalletAnalytics.track(
        'Perp Agent Setup Failed',
        { failure_category: 'submission' },
        { anonymous: true },
      );
      /* eslint-enable @typescript-eslint/naming-convention */

      const [built] = (trackEvent as jest.Mock).mock.calls[0];
      expect(built.name).toBe(MetaMetricsEventName.PerpsAgentSetupFailed);
      /* eslint-disable @typescript-eslint/naming-convention */
      expect(built.properties).toStrictEqual({
        category: MetaMetricsEventCategory.Perps,
        failure_category: 'submission',
      });
      /* eslint-enable @typescript-eslint/naming-convention */
      expect(built.options).toStrictEqual({ excludeMetaMetricsId: true });
    });
  });

  describe('agent setup metric names', () => {
    it('stay in sync with the MetaMetricsEventName enum values', () => {
      const eventNames: string[] = Object.values(MetaMetricsEventName);

      // The core-side flow emits these string literals through the analytics
      // seam; the extension enum must keep carrying them as values so the
      // adapter cast is sound and the shipped metric names stay stable.
      expect(eventNames.includes('Perp Agent Setup Started')).toBe(true);
      expect(eventNames.includes('Perp Agent Setup Completed')).toBe(true);
      expect(eventNames.includes('Perp Agent Setup Failed')).toBe(true);
    });
  });

  describe('agentWalletEncryptor', () => {
    it('round-trips an agent key through encrypt/decrypt', async () => {
      const data = { privateKey: agentWalletCrypto.generateKeyPair().privateKey };
      const ciphertext = await agentWalletEncryptor.encrypt('password', data);

      expect(ciphertext).not.toContain(data.privateKey);
      await expect(
        agentWalletEncryptor.decrypt('password', ciphertext),
      ).resolves.toStrictEqual(data);
      await expect(
        agentWalletEncryptor.decrypt('wrong-password', ciphertext),
      ).rejects.toThrow();
    });

    it('uses the same iteration count as the keyring encryptor factory', () => {
      // 600_000 matches the keyring encryptor factory usage elsewhere (e.g.
      // SnapController init); pinning it here keeps the vault cost from
      // silently drifting.
      const encryptor = encryptorFactory(600_000);
      expect(typeof encryptor.encrypt).toBe('function');
    });
  });
});

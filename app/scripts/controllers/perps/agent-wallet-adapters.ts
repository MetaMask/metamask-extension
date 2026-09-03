// `@ethersproject/wallet` is only a transitive dependency in this repo, which
// trips `import-x/no-extraneous-dependencies`; the `ethers` umbrella
// re-exports the exact same `Wallet` class (ethers v5 wraps
// @ethersproject/* 5.x).
import { Wallet } from 'ethers';
import type {
  AgentCrypto,
  AgentKeyEncryptor,
  AgentSigner,
  AgentWalletAnalytics,
} from '@metamask/perps-controller';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { createEventBuilder, trackEvent } from '../analytics';
import { encryptorFactory } from '../../lib/encryptor-factory';

/**
 * Platform crypto adapter for the agent wallet controller: ethers-v5 based
 * keypair generation and signer construction. Core owns the flow logic; this
 * adapter only supplies the key material handling the package cannot (no
 * ethers dependency in core).
 */
export const agentWalletCrypto: AgentCrypto = {
  generateKeyPair(): { address: `0x${string}`; privateKey: string } {
    const wallet = Wallet.createRandom();
    return {
      address: wallet.address as `0x${string}`,
      privateKey: wallet.privateKey,
    };
  },

  createSigner(privateKey: string): AgentSigner {
    const wallet = new Wallet(privateKey);
    return {
      address: wallet.address as `0x${string}`,
      signTypedData: (domain, types, value) =>
        wallet._signTypedData(domain as never, types as never, value as never),
    };
  },
};

/**
 * Platform analytics adapter for the agent setup metrics. The core-side flow
 * emits bare event names; this adapter restores the shipped metric shape by
 * re-adding the `Perps` category and mapping the seam's `anonymous` option to
 * the extension's `excludeMetaMetricsId`, so payloads stay byte-equivalent to
 * pre-migration. `trackEvent` never throws (it swallows and reports delivery
 * failures internally), which the flow relies on: it calls the seam outside
 * try/catch.
 */
export const agentWalletAnalytics: AgentWalletAnalytics = {
  track(name, properties, options) {
    trackEvent(
      createEventBuilder(name as MetaMetricsEventName)
        .addCategory(MetaMetricsEventCategory.Perps)
        .addProperties(properties)
        .build(options?.anonymous ? { excludeMetaMetricsId: true } : undefined),
    );
  },
};

// Same iteration count as the keyring encryptor factory usage elsewhere
// (e.g. SnapController init).
const ENCRYPTOR_ITERATIONS = 600_000;

const encryptor = encryptorFactory(ENCRYPTOR_ITERATIONS);

/**
 * Platform encryption adapter for persisting agent private keys: the
 * password-encryptor factory used by the keyring, narrowed to the package's
 * `AgentKeyEncryptor` shape.
 */
export const agentWalletEncryptor: AgentKeyEncryptor = {
  encrypt: (password, data) => encryptor.encrypt(password, data),
  decrypt: async <Payload extends object>(
    password: string,
    ciphertext: string,
  ) => (await encryptor.decrypt(password, ciphertext)) as Payload,
};

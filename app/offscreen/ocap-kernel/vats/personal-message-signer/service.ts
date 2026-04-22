// @ts-expect-error - ESM/CJS incompatibility complaint
import { E } from '@endo/eventual-send';
import { makeDiscoverableExo } from '@metamask/kernel-utils/discoverable';

import type { HostApiProxy } from '../../types';

export const PERSONAL_MESSAGE_SIGNER_DESCRIPTION =
  'Signs personal messages with a MetaMask wallet account and enumerates the available accounts.';

/**
 * Build the PersonalMessageSigner service exo.
 *
 * Wraps MetaMask's AccountsController, NetworkController, and
 * SignatureController via the host API proxy to implement a minimal
 * wallet-signing surface.
 *
 * @param options - Construction options.
 * @param options.hostApiProxy - Proxy to MetaMask controller actions.
 * @returns A discoverable exo with `getAccounts` and `signMessage` methods.
 */
export function makePersonalMessageSigner(options: {
  hostApiProxy: HostApiProxy;
}) {
  const { hostApiProxy } = options;
  return makeDiscoverableExo(
    'PersonalMessageSigner',
    {
      async getAccounts(): Promise<unknown> {
        return E(hostApiProxy).invoke('AccountsController:listAccounts');
      },
      async signMessage(
        address: string,
        message: string,
        chainId = '0x1',
      ): Promise<unknown> {
        const networkClientId = await E(hostApiProxy).invoke(
          'NetworkController:findNetworkClientIdByChainId',
          [chainId],
        );
        if (!networkClientId) {
          throw new Error(`No network client found for chainId: ${chainId}`);
        }
        return E(hostApiProxy).invoke(
          'SignatureController:newUnsignedPersonalMessage',
          [{ from: address, data: message }, { networkClientId }],
        );
      },
    },
    {
      getAccounts: {
        description: 'Return the list of accounts available in the wallet.',
        args: {},
        returns: {
          type: 'array',
          items: { type: 'string' },
        },
      },
      signMessage: {
        description:
          'Request a personal_sign signature from the wallet. Triggers a user-approval prompt.',
        args: {
          address: {
            type: 'string',
            description: '0x-prefixed wallet address to sign with.',
          },
          message: {
            type: 'string',
            description: 'Message to sign (typically UTF-8 or hex).',
          },
          chainId: {
            type: 'string',
            description: '0x-prefixed hex chain ID, e.g. "0x1" for mainnet.',
          },
        },
        returns: {
          type: 'string',
          description: 'Hex-encoded ECDSA signature.',
        },
      },
    },
  );
}

import { makeDefaultExo } from '@metamask/kernel-utils/exo';
import type { LlmResponse } from '../types';

const STOCK_RESPONSE: LlmResponse = {
  capabilityName: 'PersonalMessageSigner',
  sourceCode: `makeDiscoverableExo(
  'PersonalMessageSigner',
  {
    async getAccounts() {
      return E(hostApiProxy).invoke('AccountsController:listAccounts');
    },
    async signMessage(address, message, chainId = '0x1') {
      const networkClientId = await E(hostApiProxy).invoke(
        'NetworkController:findNetworkClientIdByChainId',
        [chainId],
      );
      if (!networkClientId) {
        throw new Error(\`No network client found for chainId: \${chainId}\`);
      }
      return E(hostApiProxy).invoke(
        'SignatureController:newUnsignedPersonalMessage',
        [{ from: address, data: message }, { networkClientId }],
      );
    },
  },
  {
    getAccounts: {
      description: 'Returns the list of the available accounts in the wallet.',
      returns: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
    },
    signMessage: {
      description: 'Initiates a new personal_sign request. Returns the signature.',
      args: {
        address: { type: 'string' },
        message: { type: 'string' },
        chainId: { type: 'string', description: '0x-prefixed hex chain ID (e.g., "0x1")' },
      },
      returns: {
        type: 'string',
      },
    },
  },
)`,
  description:
    'A capability that lists wallet accounts and initiates personal message signing requests.',
  methodNames: ['getAccounts', 'signMessage'],
};

/**
 * Creates the LLM service exo. For MVP, this returns a hardcoded
 * stock capability response regardless of the prompt input.
 *
 * @returns An exo with a `prompt` method that returns structured LLM output.
 */
export function makeLlmService() {
  return makeDefaultExo('llmService', {
    async prompt(_request: string): Promise<LlmResponse> {
      return STOCK_RESPONSE;
    },
  });
}

import { makeDefaultExo } from '@metamask/kernel-utils/exo';
import type { LlmResponse } from '../types';

const STOCK_RESPONSE: LlmResponse = {
  capabilityName: 'AccountMessageSigner',
  sourceCode: `makeDefaultExo('AccountMessageSigner', {
  async getAccounts() {
    return E(hostApiProxy).invoke('AccountsController:listAccounts');
  },
  async signMessage(address, message) {
    return E(hostApiProxy).invoke(
      'SignatureController:newUnsignedMessage',
      { from: address, data: message },
    );
  },
})`,
  description:
    'A capability that lists wallet accounts and initiates message signing requests.',
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

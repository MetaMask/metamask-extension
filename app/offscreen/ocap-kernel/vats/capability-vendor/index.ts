// @ts-expect-error - ESM / CJS incompatibility
import { E } from '@endo/eventual-send';
import { makeDefaultExo } from '@metamask/kernel-utils/exo';
import type { Baggage } from '@metamask/ocap-kernel';
import type {
  CapabilityRecord,
  HostApiProxy,
  LlmResponse,
  LlmService,
} from '../../types';

type Services = {
  hostApiProxy: HostApiProxy;
  llmService: LlmService;
  methodCatalog: unknown;
};

export function buildRootObject(
  _vatPowers: unknown,
  _parameters: Record<string, unknown>,
  _baggage: Baggage,
) {
  let hostApiProxy: HostApiProxy;
  let llmService: LlmService;
  let nextId = 0;

  // In-memory capability registry (MVP: no persistence)
  const capabilities = new Map<string, CapabilityRecord>();

  const publicFacet = makeDefaultExo('vendorPublicFacet', {
    async vendCapability(request: string): Promise<CapabilityRecord> {
      const llmResponse: LlmResponse = await E(llmService).prompt(request);

      // Evaluate the LLM-produced source in a Compartment with limited endowments
      const endowments = harden({ E, makeDefaultExo, hostApiProxy });
      const compartment = new Compartment(endowments);

      const exo = compartment.evaluate(llmResponse.sourceCode);

      const id = `cap:${nextId}`;
      nextId += 1;

      const record: CapabilityRecord = harden({
        id,
        name: llmResponse.capabilityName,
        description: llmResponse.description,
        methodNames: llmResponse.methodNames,
        exo,
        sourceCode: llmResponse.sourceCode,
      });

      capabilities.set(id, record);

      return record;
    },
  });

  return makeDefaultExo('vendorAdmin', {
    async bootstrap(
      _vats: Record<string, unknown>,
      services: Services,
    ): Promise<void> {
      hostApiProxy = services.hostApiProxy;
      llmService = services.llmService;
    },

    getPublicFacet() {
      return publicFacet;
    },

    async vendCapability(request: string): Promise<CapabilityRecord> {
      return publicFacet.vendCapability(request);
    },

    getCapabilities(): CapabilityRecord[] {
      return [...capabilities.values()];
    },

    revokeCapability(capabilityId: string): boolean {
      if (!capabilities.has(capabilityId)) {
        return false;
      }
      capabilities.delete(capabilityId);
      return true;
    },
  });
}

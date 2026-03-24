// @ts-expect-error - ESM / CJS incompatibility
import { E } from '@endo/eventual-send';
import { makeDiscoverableExo } from '@metamask/kernel-utils/discoverable';
import { makeDefaultExo } from '@metamask/kernel-utils/exo';
import type { Baggage } from '@metamask/ocap-kernel';
import type {
  CapabilityApprovalResult,
  CapabilityRecord,
  HostApiProxy,
  LlmResponse,
  LlmService,
  OcapURLIssuerService,
} from '../../types';

type Services = {
  hostApiProxy: HostApiProxy;
  llmService: LlmService;
  methodCatalog: unknown;
  ocapURLIssuerService: OcapURLIssuerService;
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
    async requestCapability(request: string): Promise<CapabilityRecord> {
      const llmResponse: LlmResponse = await E(llmService).prompt(request);

      // Gate on user approval
      const approvalResult = (await E(hostApiProxy).invoke(
        'ApprovalController:addRequest',
        [
          {
            origin: 'metamask',
            type: 'ocap:capabilityApproval',
            requestData: {
              capabilityName: llmResponse.capabilityName,
              description: llmResponse.description,
              methodNames: llmResponse.methodNames,
              sourceCode: llmResponse.sourceCode,
            },
          },
          true,
        ],
      )) as CapabilityApprovalResult | undefined;

      if (!approvalResult || !approvalResult.approved) {
        throw new Error('Capability rejected by user');
      }

      // Use (potentially edited) values from approval
      const { capabilityName, description, methodNames, sourceCode } =
        approvalResult as Required<CapabilityApprovalResult>;

      // Evaluate the user-approved source in a Compartment with limited endowments
      const endowments = harden({ E, makeDiscoverableExo, hostApiProxy });
      const compartment = new Compartment(endowments);

      const exo = compartment.evaluate(sourceCode);

      const id = `cap:${nextId}`;
      nextId += 1;

      const record: CapabilityRecord = harden({
        id,
        name: capabilityName,
        description,
        methodNames,
        exo,
        sourceCode,
      });

      capabilities.set(id, record);

      return record;
    },
  });

  return makeDefaultExo('vendorAdmin', {
    async bootstrap(_vats: Record<string, unknown>, services: Services) {
      hostApiProxy = services.hostApiProxy;
      llmService = services.llmService;

      if (!services.ocapURLIssuerService) {
        throw new Error('ocapURLIssuerService is required');
      }

      const ocapURL = await E(services.ocapURLIssuerService).issue(publicFacet);
      return harden({ ocapURL });
    },

    getPublicFacet() {
      return publicFacet;
    },

    async requestCapability(request: string): Promise<CapabilityRecord> {
      return publicFacet.requestCapability(request);
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

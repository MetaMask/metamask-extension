// @ts-expect-error - ESM/CJS incompatibility complaint
import { E } from '@endo/eventual-send';
import { makeDefaultExo } from '@metamask/kernel-utils/exo';
import type {
  Baggage,
  OcapURLIssuerService,
  OcapURLRedemptionService,
} from '@metamask/ocap-kernel';
import type { ServicePoint } from '@metamask/service-discovery-types';

import type { HostApiProxy } from '../../types.ts';
import {
  getRemotableSpec,
  makeContactEndpoint,
  makeRegistrationToken,
  registerServicesWithMatcher,
} from '../../vat-lib/index.ts';
import {
  makePersonalMessageSigner,
  PERSONAL_MESSAGE_SIGNER_DESCRIPTION,
} from './service.ts';

const SERVICE_NAME = 'PersonalMessageSigner';

type Services = {
  hostApiProxy: HostApiProxy;
  ocapURLIssuerService: OcapURLIssuerService;
  ocapURLRedemptionService: OcapURLRedemptionService;
};

export function buildRootObject(
  _vatPowers: unknown,
  parameters: Record<string, unknown>,
  _baggage: Baggage,
) {
  const matcherUrl =
    typeof parameters?.matcherUrl === 'string' ? parameters.matcherUrl : '';
  let contactUrl = '';

  return makeDefaultExo(`${SERVICE_NAME}VatRoot`, {
    async bootstrap(_vats: Record<string, unknown>, services: Services) {
      const serviceExo = makePersonalMessageSigner({
        hostApiProxy: services.hostApiProxy,
      });
      const remotableSpec = await getRemotableSpec(
        serviceExo,
        PERSONAL_MESSAGE_SIGNER_DESCRIPTION,
      );
      const registrationToken = makeRegistrationToken();
      const contact = makeContactEndpoint({
        name: SERVICE_NAME,
        service: serviceExo as unknown as ServicePoint,
        description: PERSONAL_MESSAGE_SIGNER_DESCRIPTION,
        remotableSpec,
        getContactUrl: () => contactUrl,
        expectedToken: registrationToken,
      });
      contactUrl = await E(services.ocapURLIssuerService).issue(contact);

      registerServicesWithMatcher({
        matcherUrl,
        ocapURLRedemptionService: services.ocapURLRedemptionService,
        entries: [{ name: SERVICE_NAME, contact, registrationToken }],
      }).catch((error) => {
        console.error(`[${SERVICE_NAME}] Matcher registration failed:`, error);
      });

      return harden({ name: SERVICE_NAME, contactUrl });
    },

    getContactUrl() {
      return contactUrl;
    },
  });
}

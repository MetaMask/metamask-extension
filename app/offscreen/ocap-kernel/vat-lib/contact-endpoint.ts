import { makeDefaultExo } from '@metamask/kernel-utils/exo';
import type {
  ContactPoint,
  ContactResponse,
  RemotableSpec,
  ServiceContactInfo,
  ServiceDescription,
  ServicePoint,
} from '@metamask/service-discovery-types';

/**
 * Build a ContactPoint exo for a service with the Public access model.
 *
 * The returned exo reports its ServiceDescription on demand from
 * `getServiceDescription()`, computing the description lazily so the
 * contact URL (set post-issuance via the `getContactUrl` closure) is
 * always current. It validates the matcher's registration callback via
 * `confirmServiceRegistration(token)` by comparing against `expectedToken`,
 * and returns `service` directly from `initiateContact()` (Public model).
 *
 * Registration tokens are single-use in this phase; once consumed,
 * subsequent confirmation attempts throw.
 *
 * @param options - Construction options.
 * @param options.name - Exo name, used in alleged type tags and the
 * top-level spec property.
 * @param options.service - The service exo to vend on `initiateContact()`.
 * @param options.description - Natural-language description of the
 * service as a whole.
 * @param options.remotableSpec - Pre-computed remotable API spec.
 * @param options.getContactUrl - Closure returning this endpoint's URL.
 * Typically captures a `let` in the vat root that is assigned after
 * `ocapURLIssuerService.issue(...)` resolves.
 * @param options.expectedToken - The registration token the matcher must
 * present to validate registration.
 * @param options.providerTag - The provider-local identifier for the
 * service. Must be unique among services hosted by this provider and
 * must persist across restarts of the same logical service; the matcher
 * uses (peerId, providerTag) as the dedup key when re-registrations
 * arrive.
 * @returns A ContactPoint exo.
 */
export function makeContactEndpoint(options: {
  name: string;
  service: ServicePoint;
  description: string;
  remotableSpec: RemotableSpec;
  getContactUrl: () => string;
  expectedToken: string;
  providerTag: string;
}): ContactPoint {
  const {
    name,
    service,
    description,
    remotableSpec,
    getContactUrl,
    expectedToken,
    providerTag,
  } = options;
  let consumed = false;

  return makeDefaultExo(`${name}ContactEndpoint`, {
    async getServiceDescription(): Promise<ServiceDescription> {
      const contact: ServiceContactInfo[] = [
        { contactType: 'public', contactUrl: getContactUrl() },
      ];
      return harden({
        apiSpec: harden({
          properties: harden({
            service: harden({
              description: `The ${name} service.`,
              type: harden({
                kind: 'remotable' as const,
                spec: remotableSpec,
              }),
            }),
          }),
        }),
        description,
        contact: harden(contact),
        providerTag,
      });
    },

    async confirmServiceRegistration(registrationToken: string): Promise<void> {
      if (consumed) {
        throw new Error(
          `Registration token for ${name} has already been confirmed.`,
        );
      }
      if (registrationToken !== expectedToken) {
        throw new Error(
          `Registration token mismatch for ${name}: matcher presented an unrecognized token.`,
        );
      }
      consumed = true;
    },

    async initiateContact(): Promise<ContactResponse> {
      return service;
    },
  }) as unknown as ContactPoint;
}

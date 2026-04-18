// @ts-expect-error - ESM/CJS incompatibility complaint
import { E } from '@endo/eventual-send';
import type { MethodSchema } from '@metamask/kernel-utils';
import { GET_DESCRIPTION } from '@metamask/kernel-utils/discoverable';
import {
  methodsToRemotableSpec,
  type RemotableSpec,
} from '@metamask/service-discovery-types';

/**
 * Build a `RemotableSpec` describing `service`'s API by invoking the
 * discoverable-exo sigil `__getDescription__` and mapping the result into
 * the wire-format spec.
 *
 * @param service - The discoverable service exo.
 * @param description - Natural-language description to attach to the
 * resulting RemotableSpec.
 * @returns A RemotableSpec describing the service's methods.
 */
export async function getRemotableSpec(
  service: unknown,
  description: string,
): Promise<RemotableSpec> {
  const presence = E(service) as unknown as Record<
    string,
    (...args: unknown[]) => Promise<unknown>
  >;
  const methods = (await presence[GET_DESCRIPTION]()) as Record<
    string,
    MethodSchema
  >;
  return methodsToRemotableSpec({ methods, description });
}

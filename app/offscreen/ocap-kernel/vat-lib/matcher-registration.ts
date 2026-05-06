// @ts-expect-error - ESM/CJS incompatibility complaint
import { E } from '@endo/eventual-send';
import type { OcapURLRedemptionService } from '@metamask/ocap-kernel';
import type {
  ContactPoint,
  ServiceMatcher,
} from '@metamask/service-discovery-types';

/**
 * A single service ready to register with a matcher.
 */
export type RegistrationEntry = {
  name: string;
  contact: ContactPoint;
  registrationToken: string;
};

/**
 * Register a service (or group of services) with a matcher.
 *
 * If `matcherUrl` is empty/undefined, logs and returns without contacting
 * any matcher. This is the normal path when the matcher has not yet been
 * deployed (Phase 1 operates without one). Otherwise redeems `matcherUrl`
 * via the kernel's redemption service and calls
 * `registerServiceByRef(contact, token)` for each entry sequentially.
 * Registration failures are logged but do not abort the remaining
 * registrations.
 *
 * @param options - Registration options.
 * @param options.matcherUrl - Ocap URL of the matcher, or empty/undefined
 * to skip registration entirely.
 * @param options.ocapURLRedemptionService - Kernel service used to redeem
 * the matcher URL.
 * @param options.entries - Services to register.
 */
export async function registerServicesWithMatcher(options: {
  matcherUrl: string | undefined;
  ocapURLRedemptionService: OcapURLRedemptionService;
  entries: RegistrationEntry[];
}): Promise<void> {
  const { matcherUrl, ocapURLRedemptionService, entries } = options;

  if (!matcherUrl) {
    console.log(
      '[vat] MATCHER_OCAP_URL not set; skipping matcher registration.',
    );
    return;
  }

  let matcher: ServiceMatcher;
  try {
    matcher = (await E(ocapURLRedemptionService).redeem(
      matcherUrl,
    )) as ServiceMatcher;
  } catch (cause) {
    console.error(`[vat] Failed to redeem matcher URL ${matcherUrl}:`, cause);
    return;
  }

  for (const entry of entries) {
    try {
      await E(matcher).registerServiceByRef(
        entry.contact,
        entry.registrationToken,
      );
      console.log(`[vat] Registered service "${entry.name}" with matcher.`);
    } catch (cause) {
      console.error(`[vat] Failed to register "${entry.name}":`, cause);
    }
  }
}

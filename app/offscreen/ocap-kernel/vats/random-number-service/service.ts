import { makeDiscoverableExo } from '@metamask/kernel-utils/discoverable';

export const RANDOM_NUMBER_SERVICE_DESCRIPTION =
  'Returns pseudo-random numbers. Intended for testing and demos; not suitable for cryptographic use.';

// Fallback counter used when no crypto source is available inside the
// vat's compartment. Module-scoped so it persists across calls.
let fallbackCounter = 0;

/**
 * Draw a uniform random float in [0, 1).
 *
 * Prefers `crypto.getRandomValues` (available in the iframe vat-worker
 * context). Falls back to a counter-based sequence in SES environments
 * where no crypto source is endowed — sufficient for a demo service but
 * not for anything caller-observable.
 *
 * @returns A float in [0, 1).
 */
function drawRandomFloat(): number {
  // eslint-disable-next-line n/no-unsupported-features/node-builtins
  const cryptoSource = globalThis.crypto;
  if (cryptoSource?.getRandomValues) {
    const bytes = new Uint32Array(1);
    cryptoSource.getRandomValues(bytes);
    // 32-bit resolution is more than enough for a demo service.
    return (bytes[0] ?? 0) / 4294967296;
  }
  fallbackCounter += 1;
  return (fallbackCounter % 1_000_000) / 1_000_000;
}

/**
 * Build a RandomNumber service exo. Deliberately trivial; its role is to
 * give the service matcher an unambiguous alternative to the wallet
 * service when testing discovery.
 *
 * @returns A discoverable exo with `randomInt` and `randomFloat` methods.
 */
export function makeRandomNumberService() {
  return makeDiscoverableExo(
    'RandomNumberService',
    {
      async randomInt(min: number, max: number): Promise<number> {
        if (!Number.isFinite(min) || !Number.isFinite(max) || min > max) {
          throw new Error(
            'randomInt: min and max must be finite with min ≤ max',
          );
        }
        const lo = Math.ceil(min);
        const hi = Math.floor(max);
        return Math.floor(drawRandomFloat() * (hi - lo + 1)) + lo;
      },
      async randomFloat(): Promise<number> {
        return drawRandomFloat();
      },
    },
    {
      randomInt: {
        description:
          'Return a pseudo-random integer in [min, max] (inclusive).',
        args: {
          min: { type: 'number', description: 'Lower bound, inclusive.' },
          max: { type: 'number', description: 'Upper bound, inclusive.' },
        },
        returns: {
          type: 'number',
          description: 'Integer in the requested range.',
        },
      },
      randomFloat: {
        description:
          'Return a pseudo-random floating-point number uniformly in [0, 1).',
        args: {},
        returns: { type: 'number' },
      },
    },
  );
}

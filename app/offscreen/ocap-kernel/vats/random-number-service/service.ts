import { makeDiscoverableExo } from '@metamask/kernel-utils/discoverable';

export const RANDOM_NUMBER_SERVICE_DESCRIPTION =
  'Returns pseudo-random numbers. Intended for testing and demos; not suitable for cryptographic use.';

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
        return Math.floor(Math.random() * (hi - lo + 1)) + lo;
      },
      async randomFloat(): Promise<number> {
        return Math.random();
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

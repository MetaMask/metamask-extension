import { makeDiscoverableExo } from '@metamask/kernel-utils/discoverable';

export const ECHO_SERVICE_DESCRIPTION =
  'Echoes back whatever text it is given. Useful for testing connectivity and round-trip latency.';

/**
 * Build a trivial Echo service exo. Used during development to give the
 * service matcher at least one meaningful alternative to rank alongside
 * the real wallet service.
 *
 * @returns A discoverable exo with an `echo` method.
 */
export function makeEchoService() {
  return makeDiscoverableExo(
    'EchoService',
    {
      async echo(message: string): Promise<string> {
        return message;
      },
    },
    {
      echo: {
        description: 'Return the input message unchanged.',
        args: {
          message: {
            type: 'string',
            description: 'Any text.',
          },
        },
        returns: {
          type: 'string',
          description: 'The same text, returned to the caller.',
        },
      },
    },
  );
}

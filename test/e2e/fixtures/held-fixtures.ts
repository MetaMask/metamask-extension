import { withFixtures } from '../helpers';

type WithFixturesOptions = Parameters<typeof withFixtures>[0];
type WithFixturesTestSuite = Parameters<typeof withFixtures>[1];
export type HeldFixturesContext = Parameters<WithFixturesTestSuite>[0];

export type HeldFixturesSession = {
  context: HeldFixturesContext;
  release: (error?: unknown) => Promise<void>;
};

/**
 * Starts `withFixtures` and keeps the browser session open until `release`
 * is called. Pair with Mocha `before`/`after` so several `it` blocks can
 * share one extension start.
 *
 * @param options - The same options as `withFixtures`.
 * @returns The live fixture context and a `release` function that lets
 * `withFixtures` finish (and tear down) once the suite is done.
 */
export async function startHeldFixtures(
  options: WithFixturesOptions,
): Promise<HeldFixturesSession> {
  let resolveHold: () => void = () => undefined;
  let rejectHold: (error: unknown) => void = () => undefined;
  const hold = new Promise<void>((resolve, reject) => {
    resolveHold = resolve;
    rejectHold = reject;
  });

  let resolveContext: (context: HeldFixturesContext) => void = () => undefined;
  let rejectContext: (error: unknown) => void = () => undefined;
  const contextReady = new Promise<HeldFixturesContext>((resolve, reject) => {
    resolveContext = resolve;
    rejectContext = reject;
  });

  const fixturesRun = withFixtures(options, async (context) => {
    resolveContext(context);
    await hold;
  }).catch((error: unknown) => {
    rejectContext(error);
    throw error;
  });

  try {
    const context = await contextReady;
    return {
      context,
      release: async (error?: unknown) => {
        if (error) {
          rejectHold(error);
        } else {
          resolveHold();
        }
        await fixturesRun;
      },
    };
  } catch (error) {
    await fixturesRun.catch(() => undefined);
    throw error;
  }
}

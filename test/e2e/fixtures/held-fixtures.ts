import { withFixtures } from '../helpers';

type WithFixturesTestSuite = Parameters<typeof withFixtures>[1];
export type HeldFixturesContext = Parameters<WithFixturesTestSuite>[0];

export type HeldSession<TContext> = {
  context: TContext;
  release: (error?: unknown) => Promise<void>;
};

export type HeldFixturesSession = HeldSession<HeldFixturesContext>;

type HeldSessionRun<TContext> = (
  callback: (context: TContext) => Promise<void>,
) => Promise<void>;

/**
 * Starts a fixture runner (`withFixtures`, `withTronFixtures`, …) and keeps
 * it open until `release` is called. Pair with Mocha `before`/`after` so
 * several `it` blocks can share one extension start.
 *
 * @param run - Fixture runner that calls `callback` with the live context.
 * @returns The live fixture context and a `release` function that lets
 * the runner finish (and tear down) once the suite is done.
 */
export async function startHeldSession<TContext>(
  run: HeldSessionRun<TContext>,
): Promise<HeldSession<TContext>> {
  let resolveHold: () => void = () => undefined;
  let rejectHold: (error: unknown) => void = () => undefined;
  const hold = new Promise<void>((resolve, reject) => {
    resolveHold = resolve;
    rejectHold = reject;
  });

  let resolveContext: (context: TContext) => void = () => undefined;
  let rejectContext: (error: unknown) => void = () => undefined;
  const contextReady = new Promise<TContext>((resolve, reject) => {
    resolveContext = resolve;
    rejectContext = reject;
  });

  const fixturesRun = run(async (context) => {
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

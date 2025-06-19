import 'navigator.locks';
import {
  Backup,
  PersistenceError,
  PersistenceManager,
} from '../stores/persistence-manager';
import {
  METHOD_DISPLAY_STATE_CORRUPTION_ERROR,
  METHOD_REPAIR_DATABASE,
} from '../../../../shared/constants/state-corruption';
import {
  waitForMicrotask,
  PortPolyfill,
  generateScenarios,
} from './state-corruption-recovery.test.ts-utils.test';
import { CorruptionHandler } from './state-corruption-recovery';

/**
 * Creates a connected mock Port objects with a background<->ui connection.
 *
 * @param uiCount - The number of UI port pairs to create.
 */
function createConnectedPorts(uiCount: number) {
  const portPairs: { background: PortPolyfill; ui: PortPolyfill }[] = [];
  for (let i = 0; i < uiCount; i++) {
    const background = new PortPolyfill(`background-${i}`);
    const ui = new PortPolyfill(`ui-${i}`);
    portPairs.push({ background, ui });
    background.addPeer(ui);
    ui.addPeer(background);
  }
  return portPairs;
}

const mockPersistence = (backup: unknown): PersistenceManager =>
  ({
    getBackup: jest.fn().mockResolvedValue(Promise.resolve(backup)),
  } as unknown as PersistenceManager);

const mockBrokenPersistence = (error: Error): PersistenceManager =>
  ({
    getBackup: jest.fn().mockRejectedValue(error),
  } as unknown as PersistenceManager);

describe('CorruptionHandler.handleStateCorruptionError', () => {
  let corruptionHandler: CorruptionHandler;
  beforeEach(() => {
    corruptionHandler = new CorruptionHandler();
  });

  generateScenarios().forEach(
    ({
      repairValue,
      name,
      backup,
      backupHasErr,
      uiCount,
      clickedUiCount,
      earlyDisconnectUiCount,
      result,
    }) => {
      // `name` is: 'handles vault recovery flow with params: ...'
      it(name, async () => {
        expect.hasAssertions();

        const corruptionFn = jest.fn();
        const reloadFn = jest.fn((port: chrome.runtime.Port) => {
          return port.disconnect();
        });
        const repairCallback =
          repairValue instanceof Error
            ? jest.fn().mockRejectedValue(repairValue)
            : jest.fn().mockResolvedValue(undefined);

        const portPairs = createConnectedPorts(uiCount);
        // set up UI listeners
        portPairs.forEach(({ ui }) => {
          ui.onMessage.addListener((message, port) => {
            if (message.data.method === METHOD_DISPLAY_STATE_CORRUPTION_ERROR) {
              corruptionFn(message.data.params);
              // make sure the background doesn't just process _any_ message
              port.postMessage({
                data: {
                  method: '__INVALID__',
                },
              });
            } else if (message.data.method === 'RELOAD') {
              reloadFn(ui);
            }
          });
        });

        // simulate clicking UIs
        for (let i = 0; i < clickedUiCount; i++) {
          const clickedUi = portPairs[i].ui;
          clickedUi.onMessage.addListener((message, port) => {
            if (message.data.method === METHOD_DISPLAY_STATE_CORRUPTION_ERROR) {
              port.postMessage({
                data: {
                  method: METHOD_REPAIR_DATABASE,
                },
              });
            }
          });
        }

        // some cases of Corruption detection will have a `backup` already
        // present in the `error` object, this sets that case up.
        const error = new PersistenceError(
          'Corrupted',
          // `backup` is not always a `Backup`, but in reality that is also true
          backupHasErr ? (backup as Backup) : null,
        );

        // handle the case where `getBackup` function returns an error. We can't
        // let DB errors with `handleStateCorruptionError` stop us -- since a
        // DB error is what led us here in the first place.
        const database =
          backup instanceof Error
            ? mockBrokenPersistence(backup)
            : mockPersistence(backup);

        // simulate closing UIs early
        for (
          let i = clickedUiCount;
          // only close the ones that are *not* going to be clicked
          i < clickedUiCount + earlyDisconnectUiCount;
          i++
        ) {
          const disconnectUi = portPairs[i].ui;
          disconnectUi.disconnect(); // simulate closing the UI
        }

        const handledResults = await Promise.allSettled(
          // run the background's `handleStateCorruptionError` function for
          // *all* UIs, even ones that are closed early. We do this because the
          // `port` we already have might be disconnected while the background
          // is still processing everything.
          portPairs.map(({ background: port }) =>
            corruptionHandler.handleStateCorruptionError({
              port,
              error,
              database,
              repairCallback,
            }),
          ),
        );

        // wait for all port listeners to be called, since they are async
        await waitForMicrotask();

        // if `repairValue` is an `Error` object, the very _first_ UI should
        // reject with it, all other UIs should return `undefined`.
        if (repairValue instanceof Error) {
          const firstResult = handledResults.shift() as PromiseRejectedResult;
          expect(firstResult.status).toBe('rejected');
          expect(firstResult.reason).toEqual(repairValue);
        }
        for (const handledResult of handledResults as PromiseFulfilledResult<void>[]) {
          expect(handledResult.status).toBe('fulfilled');
          expect(handledResult.value).toEqual(undefined);
        }

        // check that all UIs should have "restarted" (which was simulated by
        // calling `port.disconnect()` in our case)
        expect(corruptionHandler.connectedPorts.size).toBe(0);

        // make sure all *connected* UIs were notified of the error
        expect(corruptionFn).toHaveBeenCalledTimes(
          uiCount - earlyDisconnectUiCount,
        );

        // make sure the `corruptionFn` was called with the expected error
        // message
        expect(corruptionFn).toHaveBeenCalledWith({
          error: {
            message: error.message,
            name: error.name,
            stack: error.stack,
          },
          ...result,
        });

        // make sure the `repairFn` was called the expected number of times
        // (which is the number of UIs that were connected when the "Repair"
        // button was clicked)
        expect(reloadFn).toHaveBeenCalledTimes(
          uiCount - earlyDisconnectUiCount,
        );
      });
    },
  );
});

import 'navigator.locks';
import log from 'loglevel';

import { CorruptionHandler } from './state-corruption-recovery';
import {
  METHOD_DISPLAY_STATE_CORRUPTION_ERROR,
  METHOD_REPAIR_DATABASE,
} from '../../../../shared/lib/state-corruption-utils';
import { PersistenceManager } from '../stores/persistence-manager';
import {
  waitForMicrotask,
  PortPolyfill,
  generateScenarios,
} from './test-utils.test';

// Mock loglevel
jest.spyOn(log, 'error').mockImplementation(() => {});

/**
 * Creates a connected mock Port objects wth a background<->window relationship.
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

describe('State Corruption Utilities', () => {
  // Before each test, overwrite navigator.locks with the mock
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('CorruptionHandler.handleStateCorruptionError', () => {
    let corruptionHandler: CorruptionHandler;
    beforeEach(() => {
      corruptionHandler = new CorruptionHandler();
    });
    const runFlow = async (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      backup: any,
      database: PersistenceManager | undefined,
      background: PortPolyfill,
      windows: PortPolyfill[],
      windowAction: (port: PortPolyfill, windows: PortPolyfill[]) => void,
    ) => {
      // default to an empty database
      database = database || mockPersistence(null);

      const error = new Error('corrupted');
      if (backup) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (error as any).backup = backup;
      }

      const repair = jest.fn().mockResolvedValue(undefined);
      const reload = jest.fn();
      const displayError = jest.fn();

      windows.forEach((w) =>
        w.onMessage.addListener((message, port) => {
          if (message.data.method === METHOD_DISPLAY_STATE_CORRUPTION_ERROR) {
            displayError(message.data.params);

            windowAction(w, windows);
          } else if (message.data.method === 'RELOAD') {
            reload();
            port.disconnect();
          }
        }),
      );

      const result = await handleStateCorruptionError(
        background,
        error,
        database,
        repair,
      );
      // postMessage messages are sent in the next tick, so we need to wait a
      // bit before checking if the reload was called
      await waitForMicrotask();

      return {
        error,
        repair,
        reload,
        displayError,
        windows,
        result,
      };
    };

    const queries = generateScenarios();
    // create matrix

    queries.forEach(
      ({
        repairValue,
        name,
        backup,
        onError,
        uiCount,
        clickedUiCount,
        earlyDisconnectUiCount,
        result,
      }) => {
        // if (name !== 'B[undef v:∅ l:∅] | ui:5 clicked:4 earlyDisc:0') return;
        // console.log({
        //   name,
        //   backup,
        //   onError,
        //   uiCount,
        //   clickedUiCount,
        //   earlyDisconnectUiCount,
        //   result,
        // });
        it(name, async () => {
          const corruptionFn = jest.fn();
          const reloadFn = jest.fn((port: chrome.runtime.Port) => {
            return port.disconnect();
          });
          const repairFn =
            repairValue instanceof Error
              ? jest.fn().mockRejectedValue(repairValue)
              : jest.fn().mockResolvedValue(undefined);

          const portPairs = createConnectedPorts(uiCount);
          // set up UI listeners
          portPairs.forEach(({ ui }) => {
            ui.onMessage.addListener((message, port) => {
              if (
                message.data.method === METHOD_DISPLAY_STATE_CORRUPTION_ERROR
              ) {
                corruptionFn(message.data.params);
                // make sure the background doesn't just process _any_ message
                // that comes from the UI
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
              if (
                message.data.method === METHOD_DISPLAY_STATE_CORRUPTION_ERROR
              ) {
                port.postMessage({
                  data: {
                    method: METHOD_REPAIR_DATABASE,
                  },
                });
              }
            });
          }

          const error = new Error('Corrupted');
          // some cases of Corruption detection will have a `backup` already
          // present in the `error` object, this sets that case up.
          if (onError) {
            (error as any).backup = backup;
          }
          // if the `getBackup` function returns an error make sure we can still
          // process the reset operations
          const database =
            backup instanceof Error
              ? mockBrokenPersistence(backup)
              : mockPersistence(backup);

          // simulate closing UIs early (only close the ones that are not going
          // to be clicked)
          for (
            let i = clickedUiCount;
            i < clickedUiCount + earlyDisconnectUiCount;
            i++
          ) {
            const disconnectUi = portPairs[i].ui;
            disconnectUi.disconnect();
          }

          // run the background's `handleStateCorruptionError` function for
          // *all* UIs, even ones that are closed. We do this because the `port`
          // could be disconnected while the background is processing things.
          const handledResult = await Promise.allSettled(
            portPairs.map(({ background }) =>
              corruptionHandler.handleStateCorruptionError(
                background,
                error,
                database,
                repairFn,
              ),
            ),
          );

          // wait for all port listeners to be called (they are async)
          await waitForMicrotask();

          // if `repairValue` is an Error object, only the very _first_ UI
          // should reject with it, otherwise all UIs should return `undefined`
          if (repairValue instanceof Error) {
            const firstResult = handledResult.shift() as PromiseRejectedResult;
            expect(firstResult.status).toBe('rejected');
            expect(firstResult.reason).toEqual(repairValue);
            for (const result of handledResult as PromiseFulfilledResult<void>[]) {
              expect(result.status).toBe('fulfilled');
              expect(result.value).toEqual(undefined);
            }
          }

          for (const result of handledResult as PromiseFulfilledResult<void>[]) {
            expect(result.status).toBe('fulfilled');
            expect(result.value).toEqual(undefined);
          }

          // all UIs should have "restarted" (we simulate by calling port.disconnect())
          expect(corruptionHandler.connectedPorts.size).toBe(0);

          expect(corruptionFn).toHaveBeenCalledTimes(
            uiCount - earlyDisconnectUiCount,
          );

          expect(corruptionFn).toHaveBeenCalledWith({
            error: {
              message: error.message,
              name: error.name,
              stack: error.stack,
            },
            ...result,
          });

          expect(reloadFn).toHaveBeenCalledTimes(
            uiCount - earlyDisconnectUiCount,
          );
        });
      },
    );

    // const windowCounts = [1, 3];
    // const databases = [
    //   [null],
    //   [undefined],
    //   [{}],
    //   [null, mockPersistence({ KeyringController: { vault: 'data' } })],
    //   [undefined, mockPersistence({ KeyringController: { vault: 'data' } })],
    //   [null, mockPersistence({ AppMetadataController: {} })],
    //   [undefined, mockPersistence({ AppMetadataController: {} })],
    //   [null, mockBrokenPersistence()],
    //   [undefined, mockBrokenPersistence()],
    //   [{ KeyringController: { vault: 'data' } }],
    //   [{ KeyringController: { vault: null } }],
    //   [{ KeyringController: { vault: undefined } }],
    //   // TODO: PreferencesController used to be in the backup list, but it was
    //   // removed. Should it be added back so we can try to use the current
    //   // locale?
    //   [{ PreferencesController: {} }],
    //   [{ PreferencesController: { currentLocale: 'en' } }],
    //   [
    //     {
    //       PreferencesController: { currentLocale: 'en' },
    //       KeyringController: { vault: 'data' },
    //     },
    //   ],
    //   [
    //     {
    //       PreferencesController: { currentLocale: 'en' },
    //       KeyringController: { vault: undefined },
    //     },
    //   ],
    //   [
    //     {
    //       PreferencesController: { currentLocale: 'en' },
    //       KeyringController: { vault: null },
    //     },
    //   ],
    // ] as [any, PersistenceManager | undefined][];
    // const scenarios = windowCounts.flatMap((windowCount) =>
    //   databases.map((databases) => ({
    //     windowCount,
    //     databases,
    //   })),
    // );
    // type Scenario = (typeof scenarios)[0];

    // @ts-expect-error This function is missing from the Jest type definitions
    // it.each(scenarios)(
    //   'handles error with one confirmation',
    //   async ({ databases: [backup, database], windowCount }: Scenario) => {
    //     // eslint-disable-next-line @typescript-eslint/no-explicit-any
    //     const { error, repair, reload, displayError, windows, result } =
    //       await runFlow(backup, database, windowCount, (window, windows) => {
    //         // simulate user clicking "Repair" or "Restore" on a single window
    //         if (windows.indexOf(window) === 0) {
    //           window.postMessage({
    //             data: {
    //               method: METHOD_REPAIR_DATABASE,
    //             },
    //           });
    //         }
    //       });

    //     const repairValue =
    //       error.backup ??
    //       (await database?.getBackup().catch(() => null)) ??
    //       null;

    //     expect(result).toBeUndefined();
    //     expect(repair).toHaveBeenCalledTimes(1);
    //     expect(repair).toHaveBeenCalledWith(repairValue);
    //     expect(reload).toHaveBeenCalledTimes(windowCount);
    //     expect(displayError).toHaveBeenCalledTimes(windowCount);
    //     expect(displayError).toHaveBeenCalledWith({
    //       error: {
    //         message: error.message,
    //         name: error.name,
    //         stack: error.stack,
    //       },
    //       currentLocale:
    //         repairValue?.PreferencesController?.currentLocale ?? null,
    //       hasBackup: Boolean(repairValue?.KeyringController?.vault),
    //     });
    //   },
    // );

    // // @ts-expect-error This function is missing from the Jest type definitions
    // it.each(scenarios)(
    //   'handles error with multiple confirmations',
    //   async ({ databases: [backup, database], windowCount }: Scenario) => {
    //     const { error, repair, reload, displayError, windows, result } =
    //       await runFlow(backup, database, windowCount, (window) => {
    //         // simulate user clicking "Repair" or "Restore" on each windows
    //         window.postMessage({
    //           data: {
    //             method: METHOD_REPAIR_DATABASE,
    //           },
    //         });
    //       });

    //     const repairValue =
    //       error.backup ??
    //       (await database?.getBackup().catch(() => null)) ??
    //       null;

    //     expect(result).toBeUndefined();
    //     expect(repair).toHaveBeenCalledTimes(1);
    //     expect(repair).toHaveBeenCalledWith(repairValue);
    //     expect(reload).toHaveBeenCalledTimes(windowCount);
    //     expect(displayError).toHaveBeenCalledTimes(windowCount);
    //     expect(displayError).toHaveBeenCalledWith({
    //       error: {
    //         message: error.message,
    //         name: error.name,
    //         stack: error.stack,
    //       },
    //       currentLocale:
    //         repairValue?.PreferencesController?.currentLocale ?? null,
    //       hasBackup: Boolean(repairValue?.KeyringController?.vault),
    //     });
    //   },
    // );

    // @ts-expect-error This function is missing from the Jest type definitions
    // it.each(scenarios)(
    //   'handles error with multiple confirmations after a window is closed',
    //   async ({ databases: [backup, database], windowCount }: Scenario) => {
    //     if (windowCount <= 1) {
    //       return;
    //     }
    //     const ports = createConnectedPorts(windowCount);

    //     const action = jest.fn((window, windows) => {
    //       // last window sends the repair message
    //       if (windows.indexOf(window) === windows.length - 1) {
    //         // simulate user clicking "Repair" or "Restore" on all windows
    //         window.postMessage({
    //           data: {
    //             method: METHOD_REPAIR_DATABASE,
    //           },
    //         });
    //         // first window disconnects
    //       } else if (windows.indexOf(window) === 0) {
    //         window.disconnect();
    //       }
    //     });

    //     const { error, repair, reload, displayError, result } = await runFlow(
    //       backup,
    //       database,
    //       background,
    //       windows,
    //       action,
    //     );

    //     await waitForMicrotask();
    //     await waitForMicrotask();
    //     await waitForMicrotask();

    //     const repairValue =
    //       error.backup ??
    //       (await database?.getBackup().catch(() => null)) ??
    //       null;

    //     expect(result).toBeUndefined();
    //     expect(repair).toHaveBeenCalledTimes(1);
    //     expect(repair).toHaveBeenCalledWith(repairValue);
    //     expect(reload).toHaveBeenCalledTimes(windowCount - 1);
    //     expect(displayError).toHaveBeenCalledTimes(windowCount);
    //     expect(displayError).toHaveBeenCalledWith({
    //       error: {
    //         message: error.message,
    //         name: error.name,
    //         stack: error.stack,
    //       },
    //       currentLocale:
    //         repairValue?.PreferencesController?.currentLocale ?? null,
    //       hasBackup: Boolean(repairValue?.KeyringController?.vault),
    //     });
    //   },
    // );

    // it.skip.each(scenarios)(
    //   'handles error with multiple confirmations after a window is closed',
    //   async ({ databases: [backup, database], windowCount }: Scenario) => {
    //     if (windowCount <= 1) {
    //       return;
    //     }
    //     const { background, windows } = createConnectedPorts(windowCount);
    //     windows[0].disconnect();

    //     const action = jest.fn((window, windows) => {
    //       window.postMessage({
    //         data: {
    //           method: METHOD_REPAIR_DATABASE,
    //         },
    //       });
    //     });

    //     const { error, repair, reload, displayError, result } = await runFlow(
    //       backup,
    //       database,
    //       background,
    //       windows,
    //       action,
    //     );

    //     await waitForMicrotask();

    //     const repairValue =
    //       error.backup ??
    //       (await database?.getBackup().catch(() => null)) ??
    //       null;

    //     expect(result).toBeUndefined();
    //     expect(repair).toHaveBeenCalledTimes(1);
    //     expect(repair).toHaveBeenCalledWith(repairValue);
    //     expect(reload).toHaveBeenCalledTimes(windowCount - 1);
    //     expect(displayError).toHaveBeenCalledTimes(windowCount - 1);
    //     expect(displayError).toHaveBeenCalledWith({
    //       error: {
    //         message: error.message,
    //         name: error.name,
    //         stack: error.stack,
    //       },
    //       currentLocale:
    //         repairValue?.PreferencesController?.currentLocale ?? null,
    //       hasBackup: Boolean(repairValue?.KeyringController?.vault),
    //     });
    //   },
    // );
  });
});

export const waitForMicrotask = () =>
  new Promise<void>((r) => process.nextTick(r));

// #region PortPolyfill
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Message = any;
type MessageListener = (msg: Message, port: chrome.runtime.Port) => void;
type DisconnectListener = (port: chrome.runtime.Port) => void;

/**
 * A mock implementation of the `chrome.runtime.Port` interface. This is used
 * to simulate the behavior of a port in tests. It allows for sending messages
 * between two ports and handling disconnections.
 */
export class PortPolyfill implements chrome.runtime.Port {
  name: string;

  sender?: chrome.runtime.MessageSender = undefined;

  private _onMessageListeners = new Set<MessageListener>();

  private _onDisconnectListeners = new Set<DisconnectListener>();

  private _disconnected = false;

  private peer: PortPolyfill | null = null;

  constructor(name: string) {
    this.name = name;
  }

  addPeer(port: PortPolyfill): void {
    if (this.peer) {
      throw new Error('Port already has a peer');
    }
    this.peer = port;
  }

  postMessage(message: Message): void {
    const { peer } = this;
    if (this._disconnected || peer?._disconnected) {
      throw new Error('Port is disconnected');
    }
    peer?._onMessageListeners.forEach((listener) => {
      // simulate async message delivery
      process.nextTick(listener, message, peer);
    });
  }

  disconnect(): void {
    if (this._disconnected) {
      return;
    }
    this._disconnected = true;

    for (const listener of this._onDisconnectListeners) {
      listener(this);
    }

    this._onMessageListeners.clear();
    this._onDisconnectListeners.clear();
    if (this.peer) {
      this.peer.disconnect();
      this.peer = null;
    }
  }

  get onMessage(): chrome.runtime.Port['onMessage'] {
    return {
      getRules: () => {
        throw new Error('not implemented');
      },
      removeRules: () => {
        throw new Error('not implemented');
      },
      addRules: () => {
        throw new Error('not implemented');
      },
      hasListeners: () => {
        throw new Error('not implemented');
      },
      addListener: (fn: MessageListener) => this._onMessageListeners.add(fn),
      removeListener: (fn: MessageListener) =>
        this._onMessageListeners.delete(fn),
      hasListener: (fn: MessageListener) => this._onMessageListeners.has(fn),
    };
  }

  get onDisconnect(): chrome.runtime.Port['onDisconnect'] {
    return {
      getRules: () => {
        throw new Error('not implemented');
      },
      removeRules: () => {
        throw new Error('not implemented');
      },
      addRules: () => {
        throw new Error('not implemented');
      },
      hasListeners: () => {
        throw new Error('not implemented');
      },
      addListener: (fn: DisconnectListener) => {
        this._onDisconnectListeners.add(fn);
      },
      removeListener: (fn: DisconnectListener) =>
        this._onDisconnectListeners.delete(fn),
      hasListener: (fn: DisconnectListener) =>
        this._onDisconnectListeners.has(fn),
    };
  }
}
// #endregion PortPolyfill

// #region Scenarios
export type OneOrFive = 1 | 5;

export type Scenario = {
  /**
   * Representation of `backup` state.
   */
  backup: Record<string, unknown> | null | undefined | Error;

  /**
   * Whether the `backup` value is added to `error` object passed to
   * `handleStateCorruptionError`
   */
  backupHasErr: boolean;

  /**
   * The number of MetaMask UI windows should receive the error message.
   */
  uiCount: OneOrFive;

  /**
   * The number of `uiCount` windows that should "click" their `Repair` button.
   */
  clickedUiCount: number;

  /**
   * The number of `uiCount` windows that will disconnect before the background
   * sends its messages.
   */
  earlyDisconnectUiCount: number;

  /**
   * The expected values received by all connected UI windows.
   */
  result: {
    hasBackup: boolean;
    currentLocale: string | null;
  };

  /**
   * Pretty name used for test title
   */
  name: string;

  /**
   * The value (or Error) that the repair callback (passed to
   * `handleStateCorruptionError`) should resolve with (in case of `Error`, it
   * will reject instead of resolve)
   */
  repairValue: null | Error;
};

type RootState = 'object' | null | undefined | Error;
// a "partial" vault is a vault that has _some_ keys, but not enough; i.e. it has the `KeyringController` property but no `vault` property
type VaultState = 'partial' | 'missing' | 'data' | null | undefined;
type LocaleState = 'missing' | 'en' | null | undefined;
type RepairState = null | Error;

const ROOT_STATES: RootState[] = [
  'object',
  null,
  undefined,
  new Error('Simulated backup error'),
];
const VAULT_STATES: VaultState[] = ['partial', 'data', null, undefined];
const LOCALE_STATES: LocaleState[] = ['en', null, undefined];
const REPAIR_STATES: RepairState[] = [
  null,
  new Error('Simulated repair error'),
];
const UI_COUNTS: OneOrFive[] = [1, 5];

// #region Scenarios.Helpers
/**
 * Creates the simulated state object.
 *
 * @param vault - the vault state
 * @param locale - the locale state
 * @returns
 */
function buildStore(
  vault: VaultState,
  locale: LocaleState,
): Record<string, unknown> {
  const store: Record<string, unknown> = {};

  if (vault === 'partial') {
    store.KeyringController = {};
  } else if (vault !== 'missing') {
    store.KeyringController = { vault };
  }

  if (locale !== 'missing') {
    store.PreferencesController = { currentLocale: locale };
  }

  return Object.keys(store).length ? store : {};
}

/**
 * Generates shorthand labels for create the test titles
 *
 * @param value - the full value
 * @param ok - the value to use if `value` is not a special case
 * @returns the shorthand label for the given value
 */
function getShortLabel(value: unknown, ok: string): string {
  switch (value) {
    case 'missing':
      return '∅';
    case null:
      return 'null';
    case undefined:
      return 'undf';
    default: {
      if (value instanceof Error) {
        return '⚠';
      }
      return ok; // 'data' / 'en'
    }
  }
}
// #endregion Scenarios.Helpers

/**
 * Generates an exhaustive list of scenarios for testing the state corruption
 * recovery process.
 *
 * @returns An array of scenarios, each representing a unique combination of
 * backup state, UI count, clicked UI count, early disconnect UI count,
 * expected result, and error triggers.
 */
export function generateScenarios(): Scenario[] {
  const scenarios: Scenario[] = [];

  for (const backupHasErr of [false, true] as const) {
    for (const root of ROOT_STATES) {
      const vaultOpts =
        root === 'object' ? VAULT_STATES : (['missing'] as const);
      const localeOpts =
        root === 'object' ? LOCALE_STATES : (['missing'] as const);

      for (const vault of vaultOpts) {
        for (const locale of localeOpts) {
          let backup: Scenario['backup'];
          if (root === 'object') {
            backup = buildStore(vault, locale);
          } else {
            backup = root; // null | undefined | Error
          }

          const hasBackup = root === 'object' && vault === 'data';

          const currentLocale =
            root === 'object' && locale === 'en' ? 'en' : null;

          const baseResult = {
            hasBackup,
            currentLocale,
          };

          const baseName = `vault:${getShortLabel(
            vault,
            'data',
          )} locale:${getShortLabel(locale, 'en')}`;

          for (const repairValue of REPAIR_STATES) {
            for (const uiCount of UI_COUNTS) {
              for (
                let clickedUiCount = 1;
                clickedUiCount <= uiCount;
                clickedUiCount++
              ) {
                for (
                  let earlyDisconnectUiCount = 0;
                  earlyDisconnectUiCount < uiCount - clickedUiCount;
                  earlyDisconnectUiCount++
                ) {
                  scenarios.push({
                    repairValue,
                    backup,
                    backupHasErr,
                    uiCount,
                    clickedUiCount,
                    earlyDisconnectUiCount,
                    result: baseResult,
                    name:
                      `handles vault recovery flow with params: ${baseName}` +
                      ` backupHasErr:${backupHasErr ? '✓' : '✗'}` +
                      ` | ui:${uiCount}` +
                      ` click:${clickedUiCount}` +
                      ` close:${earlyDisconnectUiCount}` +
                      ` repair:${getShortLabel(repairValue, '')}`,
                  });
                }
              }
            }
          }
        }
      }
    }
  }

  return scenarios;
}
// #endregion Scenarios

// To see all scenarios you can uncomment the following line
// and run this file via `yarn tsx test-utils.test.ts`. It will generate a `scenarios.json` file
// in the current directory with all the scenarios.
// require("fs").writeFileSync("scenarios.json", JSON.stringify(generateScenarios(), null, 2));

it('should generate scenarios', () => {
  // jest requires this file to actually have a test in it:
  const scenarios = generateScenarios();
  expect(scenarios.length).toBeGreaterThan(0);
});

export const waitForMicrotask = () =>
  new Promise<void>((r) => process.nextTick(r));

type MessageListener = (msg: any, port: chrome.runtime.Port) => void;
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
    if (this.peer) throw new Error('Port already has a peer');
    this.peer = port;
  }

  postMessage(message: any): void {
    const peer = this.peer;
    if (this._disconnected || peer?._disconnected) {
      throw new Error('Port is disconnected');
    }
    peer?._onMessageListeners.forEach((listener) => {
      // simulate async message delivery
      process.nextTick(listener, message, peer);
    });
  }

  disconnect(): void {
    if (this._disconnected) return;
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
      getRules: () => {},
      removeRules: () => {},
      addRules: () => {},
      hasListeners: () => true,
      addListener: (fn: MessageListener) => this._onMessageListeners.add(fn),
      removeListener: (fn: MessageListener) =>
        this._onMessageListeners.delete(fn),
      hasListener: (fn: MessageListener) => this._onMessageListeners.has(fn),
    };
  }

  get onDisconnect(): chrome.runtime.Port['onDisconnect'] {
    return {
      getRules: () => {},
      removeRules: () => {},
      addRules: () => {},
      hasListeners: () => true,
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

/* -----------------------------------------------------------
 * TYPES
 * --------------------------------------------------------- */

export type OneThreeFive = 1 | 3 | 5;

export interface Scenario {
  /* — parameters fed into handleStateCorruptionError — */
  backup: Record<string, any> | null | undefined | Error;
  onError: boolean;

  /* — extra UI‑contention knobs (do NOT affect result) — */
  uiCount: OneThreeFive;
  clickedUiCount: number;
  earlyDisconnectUiCount: number;

  /* — what we expect handleStateCorruptionError to return — */
  result: {
    hasBackup: boolean;
    currentLocale: string | null;
  };

  /* — pretty name that appears in Jest’s output — */
  name: string;

  repairValue: null | Error;
}

/* -----------------------------------------------------------
 * HELPER CONSTANTS
 * --------------------------------------------------------- */

type RootState = 'object' | null | undefined | 'error';
type VaultState = 'partial' | 'missing' | 'data' | null | undefined;
type LocaleState = 'missing' | 'en' | null | undefined;
type RepairState = null | Error;

const ROOT_STATES_BASE: RootState[] = ['object', null];
const VAULT_STATES: VaultState[] = [
  'partial',
  'missing',
  'data',
  null,
  undefined,
];
const LOCALE_STATES: LocaleState[] = ['missing', 'en', null, undefined];
const REPAIR_STATES: RepairState[] = [
  null,
  new Error('Simulated repair error'),
];
const UI_COUNTS: OneThreeFive[] = [1, 3, 5];

/* -----------------------------------------------------------
 * SMALL HELPERS
 * --------------------------------------------------------- */

/** Build one of the little “controller” objects */
function buildStore(
  vault: VaultState,
  locale: LocaleState,
): Record<string, any> {
  const store: Record<string, any> = {};

  if (vault === 'partial') store.KeyringController = {};
  else if (vault !== 'missing') store.KeyringController = { vault };

  if (locale !== 'missing')
    store.PreferencesController = { currentLocale: locale };

  return Object.keys(store).length ? store : {};
}

/** Micro‑labels for the scenario name */
function lbl(value: any, ok: string): string {
  return value === 'missing'
    ? '∅'
    : value === null
    ? 'null'
    : value === undefined
    ? 'undef'
    : value === 'error'
    ? 'err'
    : ok; // 'data' / 'en'
}

/* -----------------------------------------------------------
 * SCENARIO GENERATOR
 * --------------------------------------------------------- */

export function generateScenarios(): Scenario[] {
  const scenarios: Scenario[] = [];
  for (const onError of [false, true] as const) {
    // When onError is false, swap the third root state from `undefined` to `'error'`
    const ROOT_STATES: RootState[] = onError
      ? [...ROOT_STATES_BASE, undefined]
      : [...ROOT_STATES_BASE, 'error'];
    /* ───────────────────────────────────────
     * Build the corruption × UI matrix
     * ─────────────────────────────────────── */
    for (const bRoot of ROOT_STATES) {
      const bVaultOpts =
        bRoot === 'object' ? VAULT_STATES : (['missing'] as const);
      const bLocaleOpts =
        bRoot === 'object' ? LOCALE_STATES : (['missing'] as const);

      for (const bVault of bVaultOpts)
        for (const bLocale of bLocaleOpts) {
          /* ---------- assemble backup ---------- */
          const backup: Scenario['backup'] =
            bRoot === 'object'
              ? buildStore(bVault, bLocale)
              : bRoot === 'error'
              ? new Error('simulated backup error')
              : bRoot; // null | undefined

          /* ---------- expected result ---------- */
          const hasBackup = bRoot === 'object' && bVault === 'data';

          const currentLocale =
            bRoot === 'object' && bLocale === 'en' ? 'en' : null;

          const baseResult = {
            hasBackup,
            currentLocale,
          };

          /* ---------- name skeleton ---------- */
          const baseName = `B[${lbl(bRoot, 'obj')} v:${lbl(
            bVault,
            'data',
          )} l:${lbl(bLocale, 'en')}]`;

          /* ---------- onError duplication ---------- */
          const backupHasNonNil =
            bRoot === 'object' &&
            (bVault === 'data' || typeof bLocale === 'string');

          const onErrorVariants = backupHasNonNil ? [false, true] : [false];

          /* ───────────────────────────────────────
           * Cross‑multiply by onError + UI counts
           * ─────────────────────────────────────── */
          for (const repairValue of REPAIR_STATES)
            for (const onError of onErrorVariants)
              for (const uiCount of UI_COUNTS)
                for (
                  let clickedUiCount = 1;
                  clickedUiCount <= uiCount;
                  clickedUiCount++
                )
                  for (
                    let earlyDisconnectUiCount = 0;
                    earlyDisconnectUiCount < uiCount - clickedUiCount;
                    earlyDisconnectUiCount++
                  )
                    scenarios.push({
                      repairValue,
                      backup,
                      onError,
                      uiCount,
                      clickedUiCount,
                      earlyDisconnectUiCount,
                      result: baseResult,
                      name:
                        `${baseName}` +
                        ` | ui:${uiCount}` +
                        ` clicked:${clickedUiCount}` +
                        ` earlyDisc:${earlyDisconnectUiCount}` +
                        (onError ? ' (err)' : ''),
                    });
        }
    }
  }

  return scenarios;
}

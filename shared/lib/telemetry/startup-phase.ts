import browser from 'webextension-polyfill';
import { isManifestV3 } from '../mv3.utils';

/**
 * How the current background init was entered.
 *
 * Deduced in {@link setStartupPhase} from `storage.session`.
 */
export enum StartupFlavor {
  Cold = 'cold',
  Warm = 'warm',
  Repair = 'repair',
}

/**
 * Logical lifecycle step. Call sites always pass these names.
 * {@link getStartupPhase} reports a prefixed string from the deduced flavor.
 *
 * Sequence: `initializing` → `setting-up-controller` → `initialized`
 *
 * Repair path: `repairing` → (`resetting`) → then the same sequence with a
 * `repair-` prefix.
 */
export enum StartupPhase {
  Initializing = 'initializing',
  SettingUpController = 'setting-up-controller',
  Initialized = 'initialized',
  Repairing = 'repairing',
  Resetting = 'resetting',
  ShuttingDown = 'shutting-down',
  Unknown = 'unknown',
}

/**
 * Value written to `state.write.startup_phase`.
 *
 * Cold: `initializing` → `setting-up-controller` → `initialized`
 * Warm: `reinitializing` → `resetting-up-controller` → `reinitialized`
 * Repair: `repairing` → (`repair-resetting`) → `repair-initializing` →
 * `repair-setting-up-controller` → `repair-initialized`
 */
export type ReportedStartupPhase =
  | 'initializing'
  | 'setting-up-controller'
  | 'initialized'
  | 'reinitializing'
  | 'resetting-up-controller'
  | 'reinitialized'
  | 'repairing'
  | 'repair-resetting'
  | 'repair-initializing'
  | 'repair-setting-up-controller'
  | 'repair-initialized'
  | 'shutting-down'
  | 'unknown';

const REPORTED_BY_FLAVOR: Record<
  StartupFlavor,
  Partial<Record<StartupPhase, ReportedStartupPhase>>
> = {
  [StartupFlavor.Cold]: {
    [StartupPhase.Initializing]: 'initializing',
    [StartupPhase.SettingUpController]: 'setting-up-controller',
    [StartupPhase.Initialized]: 'initialized',
  },
  [StartupFlavor.Warm]: {
    [StartupPhase.Initializing]: 'reinitializing',
    [StartupPhase.SettingUpController]: 'resetting-up-controller',
    [StartupPhase.Initialized]: 'reinitialized',
  },
  [StartupFlavor.Repair]: {
    [StartupPhase.Repairing]: 'repairing',
    [StartupPhase.Resetting]: 'repair-resetting',
    [StartupPhase.Initializing]: 'repair-initializing',
    [StartupPhase.SettingUpController]: 'repair-setting-up-controller',
    [StartupPhase.Initialized]: 'repair-initialized',
  },
};

/**
 * Single session key for init flavor.
 *
 * - absent → cold (first init in this browser session)
 * - `warm` → set when init reaches `setting-up-controller` (next SW start is warm)
 * - `repair` → set by {@link StartupPhase.Repairing}
 */
const STARTUP_FLAVOR_SESSION_KEY = 'startupFlavor';

/** Logical phase. Starts as `unknown` until the background sets it. */
let phase: StartupPhase = StartupPhase.Unknown;

/**
 * Flavor cached when entering `repairing` / `initializing`. Used by sync
 * {@link getStartupPhase}.
 */
let flavor: StartupFlavor = StartupFlavor.Cold;

/**
 * Deduce cold / warm / repair from the session flavor key.
 *
 * - `repair` + fresh SW (`phase === unknown`) → warm (stale leftover key)
 * - `repair` + same SW (`phase !== unknown`) → repair
 * - `warm` + `phase === unknown` → warm (MV3 SW warm restart)
 * - otherwise → cold
 * - MV2: no session. Unknown → cold, else → repair
 */
async function deduceFlavor(): Promise<StartupFlavor> {
  if (!isManifestV3) {
    return phase === StartupPhase.Unknown
      ? StartupFlavor.Cold
      : StartupFlavor.Repair;
  }
  try {
    const sessionData = await browser.storage.session.get([
      STARTUP_FLAVOR_SESSION_KEY,
    ]);
    const sessionFlavor = sessionData?.[STARTUP_FLAVOR_SESSION_KEY];
    if (sessionFlavor === StartupFlavor.Repair) {
      // Leftover key after a failed repair vs same-SW repair continuation.
      return phase === StartupPhase.Unknown
        ? StartupFlavor.Warm
        : StartupFlavor.Repair;
    }
    if (
      sessionFlavor === StartupFlavor.Warm &&
      phase === StartupPhase.Unknown
    ) {
      return StartupFlavor.Warm;
    }
  } catch {
    // Telemetry must not block startup when session storage is unavailable.
  }
  return StartupFlavor.Cold;
}

/**
 * Best-effort persist of flavor in session (MV3). No-op on MV2. Failures are
 * ignored so startup / repair are not blocked by telemetry storage errors.
 *
 * @param next - Flavor to store.
 */
async function setSessionFlavor(next: StartupFlavor): Promise<void> {
  if (!isManifestV3) {
    return;
  }
  try {
    await browser.storage.session.set({
      [STARTUP_FLAVOR_SESSION_KEY]: next,
    });
  } catch {
    // Keep in-memory phase/flavor. Missed session write only affects later
    // warm/repair classification for telemetry.
  }
}

/**
 * Sets the logical lifecycle phase for state-write telemetry.
 *
 * {@link StartupPhase.Repairing} writes `repair` to session.
 * {@link StartupPhase.SettingUpController} writes `warm`.
 * {@link StartupPhase.Resetting} only updates the phase (call after Repairing).
 *
 * @param next - Logical phase being entered.
 */
export async function setStartupPhase(next: StartupPhase): Promise<void> {
  switch (next) {
    case StartupPhase.Repairing:
      flavor = StartupFlavor.Repair;
      phase = next;
      await setSessionFlavor(StartupFlavor.Repair);
      return;

    case StartupPhase.Initializing:
      flavor = await deduceFlavor();
      phase = next;
      return;

    case StartupPhase.SettingUpController:
      phase = next;
      await setSessionFlavor(StartupFlavor.Warm);
      return;

    default:
      phase = next;
  }
}

/**
 * Telemetry phase for the current flavor + logical phase.
 *
 * @returns The reported {@link ReportedStartupPhase}.
 */
export function getStartupPhase(): ReportedStartupPhase {
  if (phase === StartupPhase.Unknown || phase === StartupPhase.ShuttingDown) {
    return phase;
  }
  return REPORTED_BY_FLAVOR[flavor][phase] ?? StartupPhase.Unknown;
}

import type { ReportedStartupPhase } from './startup-phase';
import type { LastActivityContext } from './last-activity';
import {
  EXTERNAL_RPC_GRACE_MS,
  UI_CLOSE_GRACE_MS,
  UI_INTERACTION_GRACE_MS,
  type CurrentActivity,
  type IdleStatus,
  getIdleStatus,
} from './idle-status';

const STEADY_STATE_PHASES: ReportedStartupPhase[] = [
  'initialized',
  'reinitialized',
  'repair-initialized',
];

const NON_STEADY_STATE_PHASES: [ReportedStartupPhase, IdleStatus][] = [
  ['initializing', 'active_initializing'],
  ['setting-up-controller', 'active_setting_up_controller'],
  ['reinitializing', 'active_reinitializing'],
  ['resetting-up-controller', 'active_resetting_up_controller'],
  ['repairing', 'active_repairing'],
  ['repair-resetting', 'active_repair_resetting'],
  ['repair-initializing', 'active_repair_initializing'],
  ['repair-setting-up-controller', 'active_repair_setting_up_controller'],
  ['shutting-down', 'active_shutting_down'],
  ['unknown', 'active_unknown_startup_phase'],
];

const EMPTY_LAST_ACTIVITY: LastActivityContext = {};

function steadyActivity(overrides: CurrentActivity = {}): CurrentActivity {
  return { startupPhase: 'initialized', ...overrides };
}

describe('getIdleStatus', () => {
  it('returns unknown when startupPhase is undefined', () => {
    expect(getIdleStatus({}, EMPTY_LAST_ACTIVITY)).toBe('unknown');
  });

  // @ts-expect-error This function is missing from the Mocha type definitions
  it.each(NON_STEADY_STATE_PHASES)(
    'returns %s for startup phase %s',
    (startupPhase: ReportedStartupPhase, expectedStatus: IdleStatus) => {
      expect(getIdleStatus({ startupPhase }, EMPTY_LAST_ACTIVITY)).toBe(
        expectedStatus,
      );
    },
  );

  // @ts-expect-error This function is missing from the Mocha type definitions
  it.each(STEADY_STATE_PHASES)(
    'returns idle for steady-state phase %s with no other activity',
    (startupPhase: ReportedStartupPhase) => {
      expect(getIdleStatus({ startupPhase }, EMPTY_LAST_ACTIVITY)).toBe('idle');
    },
  );

  it('returns active_pending_confirmation when a notification is open', () => {
    expect(
      getIdleStatus(
        steadyActivity({ notificationIsOpen: true }),
        EMPTY_LAST_ACTIVITY,
      ),
    ).toBe('active_pending_confirmation');
  });

  it('returns active_recent_ui_closed just inside the grace window', () => {
    expect(
      getIdleStatus(steadyActivity(), {
        msSinceLastUiClosed: UI_CLOSE_GRACE_MS - 1,
      }),
    ).toBe('active_recent_ui_closed');
  });

  it('returns idle once past the ui-closed grace window', () => {
    expect(
      getIdleStatus(steadyActivity(), {
        msSinceLastUiClosed: UI_CLOSE_GRACE_MS,
      }),
    ).toBe('idle');
  });

  it('returns active_recent_ui_interaction just inside the grace window', () => {
    expect(
      getIdleStatus(steadyActivity(), {
        msSinceLastUiInteraction: UI_INTERACTION_GRACE_MS - 1,
      }),
    ).toBe('active_recent_ui_interaction');
  });

  it('returns idle once past the ui-interaction grace window', () => {
    expect(
      getIdleStatus(steadyActivity(), {
        msSinceLastUiInteraction: UI_INTERACTION_GRACE_MS,
      }),
    ).toBe('idle');
  });

  it('returns active_recent_dapp_rpc just inside the grace window', () => {
    expect(
      getIdleStatus(steadyActivity(), {
        msSinceLastDappRpc: EXTERNAL_RPC_GRACE_MS - 1,
      }),
    ).toBe('active_recent_dapp_rpc');
  });

  it('returns active_recent_snap_rpc just inside the grace window', () => {
    expect(
      getIdleStatus(steadyActivity(), {
        msSinceLastSnapRpc: EXTERNAL_RPC_GRACE_MS - 1,
      }),
    ).toBe('active_recent_snap_rpc');
  });

  it('returns active_recent_external_extension_rpc just inside the grace window', () => {
    expect(
      getIdleStatus(steadyActivity(), {
        msSinceLastExternalExtensionRpc: EXTERNAL_RPC_GRACE_MS - 1,
      }),
    ).toBe('active_recent_external_extension_rpc');
  });

  it('returns idle once past every RPC grace window', () => {
    expect(
      getIdleStatus(steadyActivity(), {
        msSinceLastDappRpc: EXTERNAL_RPC_GRACE_MS,
        msSinceLastSnapRpc: EXTERNAL_RPC_GRACE_MS,
        msSinceLastExternalExtensionRpc: EXTERNAL_RPC_GRACE_MS,
      }),
    ).toBe('idle');
  });

  it('does not treat an unset signal as recent', () => {
    expect(
      getIdleStatus(steadyActivity(), {
        msSinceLastUiClosed: undefined,
        msSinceLastUiInteraction: undefined,
        msSinceLastDappRpc: undefined,
        msSinceLastSnapRpc: undefined,
        msSinceLastExternalExtensionRpc: undefined,
      }),
    ).toBe('idle');
  });

  it('prioritizes startup phase over every other signal', () => {
    expect(
      getIdleStatus(
        { startupPhase: 'initializing', notificationIsOpen: true },
        { msSinceLastUiInteraction: 0 },
      ),
    ).toBe('active_initializing');
  });

  it('prioritizes a pending confirmation over recent activity signals', () => {
    expect(
      getIdleStatus(steadyActivity({ notificationIsOpen: true }), {
        msSinceLastDappRpc: 0,
      }),
    ).toBe('active_pending_confirmation');
  });

  it('reports the first matching signal when several are recent at once', () => {
    expect(
      getIdleStatus(steadyActivity(), {
        msSinceLastUiClosed: 0,
        msSinceLastUiInteraction: 0,
        msSinceLastDappRpc: 0,
        msSinceLastSnapRpc: 0,
        msSinceLastExternalExtensionRpc: 0,
      }),
    ).toBe('active_recent_ui_closed');

    expect(
      getIdleStatus(steadyActivity(), {
        msSinceLastUiInteraction: 0,
        msSinceLastDappRpc: 0,
        msSinceLastSnapRpc: 0,
        msSinceLastExternalExtensionRpc: 0,
      }),
    ).toBe('active_recent_ui_interaction');

    expect(
      getIdleStatus(steadyActivity(), {
        msSinceLastDappRpc: 0,
        msSinceLastSnapRpc: 0,
        msSinceLastExternalExtensionRpc: 0,
      }),
    ).toBe('active_recent_dapp_rpc');

    expect(
      getIdleStatus(steadyActivity(), {
        msSinceLastSnapRpc: 0,
        msSinceLastExternalExtensionRpc: 0,
      }),
    ).toBe('active_recent_snap_rpc');
  });

  it('ignores msSinceLastWindowEvent', () => {
    expect(getIdleStatus(steadyActivity(), { msSinceLastWindowEvent: 0 })).toBe(
      'idle',
    );
  });
});

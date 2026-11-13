import { buildActivityAttributes } from './activity-attributes';
import type { CurrentActivity } from './idle-status';
import type { LastActivityContext } from './last-activity';

const FULL_ACTIVITY: CurrentActivity = {
  fullscreenCount: 0,
  notificationIsOpen: true,
  popupCount: 2,
  sidePanelCount: 0,
  startupPhase: 'initialized',
};

const FULL_LAST_ACTIVITY: LastActivityContext = {
  msSinceLastAppStart: 5_000,
  msSinceLastWrite: 1_000,
  msSinceLastUiOpen: 2_000,
  msSinceLastUiClosed: 2_500,
  msSinceLastUiInteraction: 4_000,
  msSinceLastWindowEvent: 3_000,
  msSinceLastDappRpc: 6_000,
  msSinceLastConnectedDappRpc: 6_500,
  msSinceLastSnapRpc: 7_000,
  msSinceLastExternalExtensionRpc: 8_000,
  msSinceLastServiceWorkerReload: 9_000,
  serviceWorkerReloadCount: 2,
};

describe('buildActivityAttributes', () => {
  it('flattens a full activity snapshot into bare keys', () => {
    expect(
      buildActivityAttributes(
        FULL_ACTIVITY,
        FULL_LAST_ACTIVITY,
        'idle',
        'popup',
      ),
    ).toStrictEqual(
      Object.fromEntries([
        ['environment_type', 'popup'],
        ['idle_status', 'idle'],
        ['startup_phase', 'initialized'],
        ['notification_is_open', true],
        ['ui_count.popup', 2],
        ['ui_count.fullscreen', 0],
        ['ui_count.sidepanel', 0],
        ['ms_since_app_start', 5_000],
        ['ms_since_last_write', 1_000],
        ['ms_since_ui_open', 2_000],
        ['ms_since_ui_closed', 2_500],
        ['ms_since_ui_interaction', 4_000],
        ['ms_since_window_event', 3_000],
        ['ms_since_dapp_rpc', 6_000],
        ['ms_since_connected_dapp_rpc', 6_500],
        ['ms_since_snap_rpc', 7_000],
        ['ms_since_external_extension_rpc', 8_000],
        ['ms_since_last_service_worker_reload', 9_000],
        ['service_worker_reload_count', 2],
      ]),
    );
  });

  it('always includes idle status and environment type', () => {
    expect(buildActivityAttributes({}, {}, 'unknown', 'unknown')).toStrictEqual(
      Object.fromEntries([
        ['environment_type', 'unknown'],
        ['idle_status', 'unknown'],
      ]),
    );
  });

  it('omits unset current-activity fields', () => {
    const attributes = buildActivityAttributes(
      { startupPhase: 'shutting-down' },
      {},
      'active_shutting_down',
      'background',
    );

    expect(attributes.startup_phase).toBe('shutting-down');
    expect(attributes).not.toHaveProperty('notification_is_open');
    expect(attributes).not.toHaveProperty('ui_count.popup');
    expect(attributes).not.toHaveProperty('ui_count.fullscreen');
    expect(attributes).not.toHaveProperty('ui_count.sidepanel');
  });

  it('omits unset last-activity signals', () => {
    const attributes = buildActivityAttributes(
      {},
      { msSinceLastUiInteraction: 10 },
      'active_recent_ui_interaction',
      'popup',
    );

    expect(attributes.ms_since_ui_interaction).toBe(10);
    expect(attributes).not.toHaveProperty('ms_since_app_start');
    expect(attributes).not.toHaveProperty('ms_since_ui_closed');
    expect(attributes).not.toHaveProperty('ms_since_dapp_rpc');
    expect(attributes).not.toHaveProperty('ms_since_connected_dapp_rpc');
    expect(attributes).not.toHaveProperty('ms_since_snap_rpc');
    expect(attributes).not.toHaveProperty('ms_since_external_extension_rpc');
    expect(attributes).not.toHaveProperty(
      'ms_since_last_service_worker_reload',
    );
    expect(attributes).not.toHaveProperty('service_worker_reload_count');
  });
});

import type { PreferencesControllerState } from '../controllers/preferences-controller';
import type { RootMessenger } from '../lib/messenger';
import type { Preferences } from '../../../shared/types/preferences';

export type SidePanelToolbarBehaviorController = {
  preferencesController?: {
    state?: {
      preferences?: Pick<Preferences, 'useSidePanelAsDefault'>;
    };
  };
  controllerMessenger?: Pick<RootMessenger, 'subscribe'>;
};

export type SidePanelToolbarBehaviorDeps = {
  getController: () => SidePanelToolbarBehaviorController | null | undefined;
  waitUntilInitialized: Promise<void>;
};

export type SidePanelBehaviorApi = {
  setPanelBehavior?: (behavior: {
    openPanelOnActionClick: boolean;
  }) => Promise<void>;
};

function getSidePanelApi(
  sidePanel: SidePanelBehaviorApi | undefined = chrome.sidePanel,
): SidePanelBehaviorApi | undefined {
  if (typeof sidePanel?.setPanelBehavior !== 'function') {
    return undefined;
  }
  return sidePanel;
}

function getUseSidePanelAsDefault(
  controller: SidePanelToolbarBehaviorController | null | undefined,
): boolean {
  return (
    controller?.preferencesController?.state?.preferences
      ?.useSidePanelAsDefault ?? true
  );
}

/**
 * Prefer opening the side panel on toolbar click as soon as the service worker starts.
 * Without this, the first click after a cold start can use manifest `default_popup` until
 * {@link setupSidePanelToolbarBehavior} runs after initialization.
 *
 * @param sidePanel - Optional side panel API override for tests.
 */
export function applyEarlySidePanelToolbarBehavior(
  sidePanel: SidePanelBehaviorApi | undefined = chrome.sidePanel,
): void {
  const sidePanelApi = getSidePanelApi(sidePanel);
  if (!sidePanelApi?.setPanelBehavior) {
    return;
  }
  sidePanelApi.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {
    // Non-fatal: `applyToolbarSidePanelBehavior` applies persisted preference once ready.
  });
}

export async function applyToolbarSidePanelBehavior(
  getController: SidePanelToolbarBehaviorDeps['getController'],
  sidePanel: SidePanelBehaviorApi | undefined = chrome.sidePanel,
): Promise<void> {
  const sidePanelApi = getSidePanelApi(sidePanel);
  if (!sidePanelApi?.setPanelBehavior) {
    return;
  }
  const useSidePanelAsDefault = getUseSidePanelAsDefault(getController());
  await sidePanelApi.setPanelBehavior({
    openPanelOnActionClick: useSidePanelAsDefault,
  });
}

/**
 * Sets initial side panel toolbar behavior after startup, then subscribes only to
 * `useSidePanelAsDefault` changes (not every PreferencesController update).
 *
 * @param deps - Injected controller accessor and initialization gate.
 * @param sidePanel - Optional side panel API override for tests.
 */
export async function setupSidePanelToolbarBehavior(
  deps: SidePanelToolbarBehaviorDeps,
  sidePanel: SidePanelBehaviorApi | undefined = chrome.sidePanel,
): Promise<void> {
  const sidePanelApi = getSidePanelApi(sidePanel);
  if (!sidePanelApi) {
    return;
  }

  try {
    await deps.waitUntilInitialized;
    await applyToolbarSidePanelBehavior(deps.getController, sidePanelApi);

    const controller = deps.getController();
    controller?.controllerMessenger?.subscribe(
      'PreferencesController:stateChange',
      (useSidePanelAsDefault) => {
        if (getSidePanelApi(sidePanel)?.setPanelBehavior) {
          getSidePanelApi(sidePanel)
            ?.setPanelBehavior?.({
              openPanelOnActionClick: useSidePanelAsDefault,
            })
            .catch((error) =>
              console.error('Error updating panel behavior:', error),
            );
        }
      },
      (preferencesControllerState: PreferencesControllerState) =>
        preferencesControllerState.preferences?.useSidePanelAsDefault ?? true,
    );
  } catch (error) {
    console.error('Error setting side panel toolbar behavior:', error);
  }
}

applyEarlySidePanelToolbarBehavior();

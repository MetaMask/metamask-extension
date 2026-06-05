import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import browser from 'webextension-polyfill';
import {
  ENVIRONMENT_TYPE_POPUP,
  ENVIRONMENT_TYPE_SIDEPANEL,
} from '../../shared/constants/app';
import { getEnvironmentType } from '../../shared/lib/environment-type';
import { getIsSidePanelFeatureEnabled } from '../../shared/lib/environment';
import { setBackgroundConnection } from './background-connection';
import { toggleDefaultView } from './actions';

jest.mock('webextension-polyfill', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: {
    tabs: {
      query: jest.fn(),
    },
    sidePanel: {
      open: jest.fn(),
    },
  },
}));

jest.mock('../../shared/lib/environment-type', () => ({
  ...jest.requireActual('../../shared/lib/environment-type'),
  getEnvironmentType: jest.fn(),
}));

jest.mock('../../shared/lib/environment', () => ({
  ...jest.requireActual('../../shared/lib/environment'),
  getIsSidePanelFeatureEnabled: jest.fn(),
}));

const mockGetEnvironmentType = jest.mocked(getEnvironmentType);
const mockGetIsSidePanelFeatureEnabled = jest.mocked(
  getIsSidePanelFeatureEnabled,
);

const browserMock = browser as unknown as {
  tabs: { query: jest.Mock };
  sidePanel: { open: jest.Mock };
};

const middleware = [thunk];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockStore = configureStore<any>(middleware);

/**
 * Reads the `(preference, value)` pairs passed to the background `setPreference`
 * RPC, ignoring the trailing trace-context argument that may be appended.
 *
 * @param setPreferenceMock - The mocked background `setPreference` method.
 */
function setPreferenceCalls(setPreferenceMock: jest.Mock) {
  return setPreferenceMock.mock.calls.map((args) => [args[0], args[1]]);
}

describe('toggleDefaultView', () => {
  let setPreferenceBackground: jest.Mock;
  let closeSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    setPreferenceBackground = jest.fn().mockResolvedValue({});
    setBackgroundConnection({
      setPreference: setPreferenceBackground,
    } as never);

    closeSpy = jest.spyOn(window, 'close').mockImplementation(() => undefined);

    mockGetIsSidePanelFeatureEnabled.mockReturnValue(true);
    browserMock.tabs.query.mockResolvedValue([{ windowId: 1 }]);
    browserMock.sidePanel.open.mockResolvedValue(undefined);
  });

  afterEach(() => {
    closeSpy.mockRestore();
  });

  it('does nothing when the side panel feature is disabled', async () => {
    mockGetIsSidePanelFeatureEnabled.mockReturnValue(false);
    mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_POPUP);
    const store = mockStore();

    await store.dispatch(toggleDefaultView() as never);

    expect(browserMock.sidePanel.open).not.toHaveBeenCalled();
    expect(setPreferenceBackground).not.toHaveBeenCalled();
    expect(closeSpy).not.toHaveBeenCalled();
  });

  describe('from side panel to popup', () => {
    it('persists the preference as false and closes the side panel window', async () => {
      mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_SIDEPANEL);
      const store = mockStore();

      await store.dispatch(toggleDefaultView() as never);

      expect(setPreferenceCalls(setPreferenceBackground)).toContainEqual([
        'useSidePanelAsDefault',
        false,
      ]);
      expect(browserMock.sidePanel.open).not.toHaveBeenCalled();
      expect(closeSpy).toHaveBeenCalled();
    });
  });

  describe('from popup to side panel', () => {
    it('opens the side panel, persists the preference as true, and closes the popup', async () => {
      mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_POPUP);
      const store = mockStore();

      await store.dispatch(toggleDefaultView() as never);

      expect(browserMock.sidePanel.open).toHaveBeenCalledWith({ windowId: 1 });
      expect(setPreferenceCalls(setPreferenceBackground)).toContainEqual([
        'useSidePanelAsDefault',
        true,
      ]);
      expect(closeSpy).toHaveBeenCalled();
    });

    // Regression test for https://github.com/MetaMask/metamask-extension/issues/43060
    // The previous implementation gated success on a single `chrome.runtime.getContexts`
    // probe 500ms after opening. After a side panel -> popup -> side panel round-trip that
    // probe races with context teardown/setup and could report no context even though the
    // panel opened, leaving both the popup and side panel open and the preference unchanged.
    it('persists the preference and closes the popup without probing side panel contexts', async () => {
      const getContextsSpy = jest.fn().mockResolvedValue([]);
      // @ts-expect-error chrome is not typed on the test global
      global.chrome = { runtime: { getContexts: getContextsSpy } };
      mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_POPUP);
      const store = mockStore();

      await store.dispatch(toggleDefaultView() as never);

      expect(getContextsSpy).not.toHaveBeenCalled();
      expect(setPreferenceCalls(setPreferenceBackground)).toContainEqual([
        'useSidePanelAsDefault',
        true,
      ]);
      expect(closeSpy).toHaveBeenCalled();
    });

    it('stays in popup view and does not persist the preference when opening the side panel fails', async () => {
      browserMock.sidePanel.open.mockRejectedValue(
        new Error('side panel unavailable'),
      );
      mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_POPUP);
      const store = mockStore();

      await store.dispatch(toggleDefaultView() as never);

      expect(browserMock.sidePanel.open).toHaveBeenCalledWith({ windowId: 1 });
      expect(setPreferenceCalls(setPreferenceBackground)).not.toContainEqual([
        'useSidePanelAsDefault',
        true,
      ]);
      expect(closeSpy).not.toHaveBeenCalled();
    });

    it('does nothing when there is no active window to open the side panel in', async () => {
      browserMock.tabs.query.mockResolvedValue([]);
      mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_POPUP);
      const store = mockStore();

      await store.dispatch(toggleDefaultView() as never);

      expect(browserMock.sidePanel.open).not.toHaveBeenCalled();
      expect(setPreferenceBackground).not.toHaveBeenCalled();
      expect(closeSpy).not.toHaveBeenCalled();
    });
  });
});

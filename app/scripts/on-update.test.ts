import { it } from '@jest/globals';
import type { RemoteFeatureFlagControllerState } from '@metamask/remote-feature-flag-controller';
import { PLATFORM_CHROME, PLATFORM_FIREFOX } from '#shared/constants/app';
import * as manifestFlags from '#shared/lib/manifestFlags';
import { getPlatform } from './lib/util';
import { onUpdate } from './on-update';

jest.mock('./lib/util', () => ({ getPlatform: jest.fn() }));

type Flags = RemoteFeatureFlagControllerState['remoteFeatureFlags'];

function setup(remoteFeatureFlags: Flags = {}) {
  const controller = {
    store: {} as Parameters<typeof onUpdate>[0]['store'],
    appStateController: {
      state: { lastUpdatedFromVersion: null as string | null },
      setLastUpdatedAt: jest.fn(),
      setLastUpdatedFromVersion: jest.fn(),
      setPendingExtensionVersion: jest.fn(),
    },
    remoteFeatureFlagController: { state: { remoteFeatureFlags } },
  };
  const platform = { getVersion: jest.fn(() => '13.49.0') };
  const requestSafeReload = jest.fn();
  return { controller, platform, requestSafeReload };
}

describe('onUpdate', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-09-17T12:00:00Z'));
    jest.mocked(getPlatform).mockReturnValue(PLATFORM_CHROME);
    jest.spyOn(manifestFlags, 'getManifestFlags').mockReturnValue({});
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it.each([
    ['absent', {}],
    ['enabled', { automaticReloadAfterUpdate: true }],
    ['null', { automaticReloadAfterUpdate: null }],
    ['a string', { automaticReloadAfterUpdate: 'false' }],
    ['a number', { automaticReloadAfterUpdate: 0 }],
    ['an object', { automaticReloadAfterUpdate: {} }],
  ] satisfies [string, Flags][])(
    'defers the reload when the flag is %s',
    (_label, flags) => {
      const { controller, platform, requestSafeReload } = setup(flags);

      onUpdate(controller, platform, '13.48.0', requestSafeReload);

      expect(requestSafeReload).not.toHaveBeenCalled();
      expect(jest.getTimerCount()).toBe(1);
      jest.runAllTimers();
      expect(requestSafeReload).toHaveBeenCalledTimes(1);
    },
  );

  it('does not schedule a reload when the flag is false', () => {
    const { controller, platform, requestSafeReload } = setup({
      automaticReloadAfterUpdate: false,
    });

    onUpdate(controller, platform, '13.48.0', requestSafeReload);

    expect(jest.getTimerCount()).toBe(0);
    jest.runAllTimers();
    expect(requestSafeReload).not.toHaveBeenCalled();
  });

  it.each([true, false])(
    'records update bookkeeping before timers run with the flag set to %s',
    (automaticReloadAfterUpdate) => {
      const { controller, platform, requestSafeReload } = setup({
        automaticReloadAfterUpdate,
      });

      onUpdate(controller, platform, '13.48.0', requestSafeReload);

      expect(
        controller.appStateController.setLastUpdatedAt,
      ).toHaveBeenCalledWith(Date.now());
      expect(
        controller.appStateController.setLastUpdatedFromVersion,
      ).toHaveBeenCalledWith('13.48.0');
      expect(
        controller.appStateController.setPendingExtensionVersion,
      ).toHaveBeenCalledWith(null);
      expect(requestSafeReload).not.toHaveBeenCalled();
    },
  );

  it.each([true, false])(
    'skips a previously handled update with the flag set to %s',
    (automaticReloadAfterUpdate) => {
      const { controller, platform, requestSafeReload } = setup({
        automaticReloadAfterUpdate,
      });
      controller.appStateController.state.lastUpdatedFromVersion = '13.48.0';

      onUpdate(controller, platform, '13.48.0', requestSafeReload);
      jest.runAllTimers();

      expect(requestSafeReload).not.toHaveBeenCalled();
      expect(
        controller.appStateController.setLastUpdatedAt,
      ).not.toHaveBeenCalled();
      expect(
        controller.appStateController.setLastUpdatedFromVersion,
      ).not.toHaveBeenCalled();
      expect(
        controller.appStateController.setPendingExtensionVersion,
      ).not.toHaveBeenCalled();
    },
  );

  it.each([undefined, true, false])(
    'never reloads Firefox with the flag set to %s',
    (automaticReloadAfterUpdate) => {
      jest.mocked(getPlatform).mockReturnValue(PLATFORM_FIREFOX);
      const { controller, platform, requestSafeReload } = setup(
        automaticReloadAfterUpdate === undefined
          ? {}
          : { automaticReloadAfterUpdate },
      );

      onUpdate(controller, platform, '13.48.0', requestSafeReload);
      jest.runAllTimers();

      expect(requestSafeReload).not.toHaveBeenCalled();
      expect(
        controller.appStateController.setPendingExtensionVersion,
      ).toHaveBeenCalledWith(null);
    },
  );

  it.each([true, false])(
    'honors a manifest override of %s over the cached remote value',
    (automaticReloadAfterUpdate) => {
      jest.mocked(manifestFlags.getManifestFlags).mockReturnValue({
        remoteFeatureFlags: { automaticReloadAfterUpdate },
      });
      const { controller, platform, requestSafeReload } = setup({
        automaticReloadAfterUpdate: !automaticReloadAfterUpdate,
      });

      onUpdate(controller, platform, '13.48.0', requestSafeReload);
      jest.runAllTimers();

      expect(requestSafeReload).toHaveBeenCalledTimes(
        automaticReloadAfterUpdate ? 1 : 0,
      );
    },
  );
});

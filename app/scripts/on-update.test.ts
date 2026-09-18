/**
 * @jest-environment node
 */

import { jest } from '@jest/globals';
import { PLATFORM_CHROME, PLATFORM_FIREFOX } from '../../shared/constants/app';
import * as util from './lib/util';
import { onUpdate } from './on-update';

jest.mock('loglevel', () => ({
  debug: jest.fn(),
  info: jest.fn(),
}));

function createController(lastUpdatedFromVersion: string | null = null) {
  const appStateController = {
    state: { lastUpdatedFromVersion },
    setLastUpdatedAt: jest.fn(),
    setLastUpdatedFromVersion: jest.fn(),
    setPendingExtensionVersion: jest.fn(),
  };

  return {
    appStateController,
    controller: {
      appStateController,
    } as unknown as Parameters<typeof onUpdate>[0],
  };
}

const platform = {
  getVersion: jest.fn(() => '2.0.0'),
} as unknown as Parameters<typeof onUpdate>[1];

describe('onUpdate', () => {
  let requestSafeReload: jest.Mock<() => Promise<void>>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(util, 'getPlatform').mockReturnValue(PLATFORM_CHROME);
    requestSafeReload = jest.fn<() => Promise<void>>(async () => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('records update metadata and schedules the Chromium recovery reload', async () => {
    const { appStateController, controller } = createController();

    await expect(
      onUpdate(controller, platform, '1.0.0', requestSafeReload, true),
    ).resolves.toBe(true);

    expect(appStateController.setLastUpdatedAt).toHaveBeenCalledWith(
      expect.any(Number),
    );
    expect(appStateController.setLastUpdatedFromVersion).toHaveBeenCalledWith(
      '1.0.0',
    );
    expect(appStateController.setPendingExtensionVersion).toHaveBeenCalledWith(
      null,
    );
    expect(requestSafeReload).toHaveBeenCalledTimes(1);
  });

  it('does not reload after recording a Firefox update', async () => {
    const { appStateController, controller } = createController();
    jest.spyOn(util, 'getPlatform').mockReturnValue(PLATFORM_FIREFOX);

    await expect(
      onUpdate(controller, platform, '1.0.0', requestSafeReload, true),
    ).resolves.toBe(false);

    expect(appStateController.setLastUpdatedFromVersion).toHaveBeenCalledWith(
      '1.0.0',
    );
    expect(requestSafeReload).not.toHaveBeenCalled();
  });

  it('does not reload when the recovery reload was not started', async () => {
    const { appStateController, controller } = createController();

    await expect(
      onUpdate(controller, platform, '1.0.0', requestSafeReload, false),
    ).resolves.toBe(false);

    expect(appStateController.setLastUpdatedFromVersion).toHaveBeenCalledWith(
      '1.0.0',
    );
    expect(requestSafeReload).not.toHaveBeenCalled();
  });

  it('ignores a duplicate update event', async () => {
    const { appStateController, controller } = createController('1.0.0');

    await expect(
      onUpdate(controller, platform, '1.0.0', requestSafeReload, true),
    ).resolves.toBe(false);

    expect(appStateController.setLastUpdatedAt).not.toHaveBeenCalled();
    expect(appStateController.setLastUpdatedFromVersion).not.toHaveBeenCalled();
    expect(
      appStateController.setPendingExtensionVersion,
    ).not.toHaveBeenCalled();
    expect(requestSafeReload).not.toHaveBeenCalled();
  });

  it('rejects when the recovery reload cannot be scheduled', async () => {
    const { controller } = createController();
    const error = new Error('reload failed');
    requestSafeReload.mockRejectedValue(error);

    await expect(
      onUpdate(controller, platform, '1.0.0', requestSafeReload, true),
    ).rejects.toThrow(error);
  });
});

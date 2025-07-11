import { renderHookWithProvider } from '../../../test/lib/render-helpers';

import useDeFiPolling from './useDeFiPolling';
import { deFiStartPolling, deFiStopPolling } from './defiPollingActions';

let mockPromises: Promise<string>[];

jest.mock('./defiPollingActions', () => ({
  deFiStartPolling: jest.fn().mockImplementation(() => {
    const promise = Promise.resolve('detection');
    mockPromises.push(promise);
    return promise;
  }),
  deFiStopPolling: jest.fn(),
}));

describe('useDeFiPolling', () => {
  beforeEach(() => {
    mockPromises = [];
    jest.clearAllMocks();
  });

  it('should not poll when locked', async () => {
    const state = {
      metamask: {
        isUnlocked: false,
        completedOnboarding: true,
        networkConfigurationsByChainId: {
          '0x1': {},
        },
      },
    };

    renderHookWithProvider(() => useDeFiPolling(), state);

    await Promise.all(mockPromises);
    expect(deFiStartPolling).toHaveBeenCalledTimes(0);
    expect(deFiStopPolling).toHaveBeenCalledTimes(0);
  });

  it('should poll defi when enabled and stop on dismount', async () => {
    const state = {
      metamask: {
        isUnlocked: true,
        completedOnboarding: true,
      },
    };

    const { unmount } = renderHookWithProvider(() => useDeFiPolling(), state);

    // Should poll
    await Promise.all(mockPromises);
    expect(deFiStartPolling).toHaveBeenCalledTimes(1);
    expect(deFiStartPolling).toHaveBeenCalledWith(null);

    // Stop polling on dismount
    unmount();
    expect(deFiStopPolling).toHaveBeenCalledTimes(1);
    expect(deFiStopPolling).toHaveBeenCalledWith('detection');
  });

  it('should not poll if onboarding is not completed', async () => {
    const state = {
      metamask: {
        completedOnboarding: false,
      },
    };

    renderHookWithProvider(() => useDeFiPolling(), state);

    await Promise.all(mockPromises);
    expect(deFiStartPolling).toHaveBeenCalledTimes(0);
    expect(deFiStopPolling).toHaveBeenCalledTimes(0);
  });
});

import { waitFor } from '@testing-library/react';
import browser from 'webextension-polyfill';
import { renderHookWithProvider } from '../../test/lib/render-helpers-navigate';
import { useContinuityId } from './useContinuityId';

jest.mock('webextension-polyfill', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: {
    tabs: {
      getCurrent: jest.fn(),
    },
  },
}));

describe('useContinuityId', () => {
  const browserMock = browser as unknown as {
    tabs: {
      getCurrent: jest.Mock;
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the continuity ID for the current tab', async () => {
    browserMock.tabs.getCurrent.mockResolvedValue({ id: 42 });

    const state = {
      metamask: {
        continuityIdsByTabId: {
          '42': 'continuity-id-42',
        },
      },
    };

    const { result } = renderHookWithProvider(() => useContinuityId(), state);

    await waitFor(() => {
      expect(result.current).toBe('continuity-id-42');
    });
  });

  it('returns undefined when current context has no tab ID', async () => {
    browserMock.tabs.getCurrent.mockResolvedValue(undefined);

    const state = {
      metamask: {
        continuityIdsByTabId: {
          '42': 'continuity-id-42',
        },
      },
    };

    const { result } = renderHookWithProvider(() => useContinuityId(), state);

    await waitFor(() => {
      expect(result.current).toBeUndefined();
    });
  });

  it('returns undefined when reading current tab fails', async () => {
    browserMock.tabs.getCurrent.mockRejectedValue(new Error('boom'));

    const state = {
      metamask: {
        continuityIdsByTabId: {
          '42': 'continuity-id-42',
        },
      },
    };

    const { result } = renderHookWithProvider(() => useContinuityId(), state);

    await waitFor(() => {
      expect(result.current).toBeUndefined();
    });
  });
});

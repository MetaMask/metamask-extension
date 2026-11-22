import { renderHook, act, waitFor } from '@testing-library/react';
import browser from 'webextension-polyfill';

import { EXTENSION_MESSAGES } from '#shared/constants/messages';
import { ENVIRONMENT_TYPE_SIDEPANEL } from '#shared/constants/app';
import { getEnvironmentType } from '#shared/lib/environment-type';

import { useNavigateRouteListener } from './useNavigateRouteListener';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('#shared/lib/environment-type');

jest.mock('webextension-polyfill', () => ({
  runtime: {
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
    sendMessage: jest.fn(),
  },
  windows: {
    getCurrent: jest.fn(),
  },
}));

const mockGetEnvironmentType = jest.mocked(getEnvironmentType);
const mockBrowser = jest.mocked(browser);

describe('useNavigateRouteListener', () => {
  let messageListener: ((message: unknown) => unknown) | undefined;

  beforeEach(() => {
    mockNavigate.mockReset();
    messageListener = undefined;
    mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_SIDEPANEL);

    (mockBrowser.runtime.onMessage.addListener as jest.Mock).mockImplementation(
      (listener) => {
        messageListener = listener as (message: unknown) => unknown;
      },
    );
    (
      mockBrowser.runtime.onMessage.removeListener as jest.Mock
    ).mockImplementation(() => undefined);
    (mockBrowser.runtime.sendMessage as jest.Mock).mockResolvedValue({
      type: EXTENSION_MESSAGES.CONSUME_PENDING_ROUTE,
      body: { path: null, search: null },
    });
    (mockBrowser.windows.getCurrent as jest.Mock).mockResolvedValue({
      id: 123,
      focused: true,
      alwaysOnTop: false,
      incognito: false,
      type: 'normal' as browser.Windows.WindowType,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('consumes pending route on mount', async () => {
    (mockBrowser.runtime.sendMessage as jest.Mock).mockResolvedValue({
      type: EXTENSION_MESSAGES.CONSUME_PENDING_ROUTE,
      body: { path: '/asset/eth', search: '' },
    });

    renderHook(() => useNavigateRouteListener());

    await waitFor(() => {
      expect(mockBrowser.runtime.sendMessage).toHaveBeenCalledWith({
        type: EXTENSION_MESSAGES.CONSUME_PENDING_ROUTE,
        body: { windowId: 123 },
      });
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({
        pathname: '/asset/eth',
        search: '',
      });
    });
  });

  it('consumes on OPEN_ROUTE nudge for its own window', async () => {
    renderHook(() => useNavigateRouteListener());

    await waitFor(() => {
      expect(mockBrowser.windows.getCurrent).toHaveBeenCalled();
    });

    (mockBrowser.runtime.sendMessage as jest.Mock).mockResolvedValue({
      type: EXTENSION_MESSAGES.CONSUME_PENDING_ROUTE,
      body: { path: '/swap', search: '' },
    });

    act(() => {
      messageListener?.({
        type: EXTENSION_MESSAGES.OPEN_ROUTE,
        body: { windowId: 123 },
      });
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({
        pathname: '/swap',
        search: '',
      });
    });
  });

  it('ignores OPEN_ROUTE nudges for other windows', async () => {
    renderHook(() => useNavigateRouteListener());

    await waitFor(() => {
      expect(mockBrowser.windows.getCurrent).toHaveBeenCalled();
    });

    const navigateCallCount = mockNavigate.mock.calls.length;

    act(() => {
      messageListener?.({
        type: EXTENSION_MESSAGES.OPEN_ROUTE,
        body: { windowId: 456 },
      });
    });

    await act(async () => undefined);

    expect(mockNavigate).toHaveBeenCalledTimes(navigateCallCount);
  });

  it('does not navigate when no pending route is consumed', async () => {
    renderHook(() => useNavigateRouteListener());

    await waitFor(() => {
      expect(mockBrowser.runtime.sendMessage).toHaveBeenCalled();
    });

    await act(async () => undefined);

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('does nothing in non-sidepanel environment', async () => {
    jest.clearAllMocks();
    mockGetEnvironmentType.mockReturnValue('popup');

    renderHook(() => useNavigateRouteListener());

    await act(async () => undefined);

    expect(mockBrowser.windows.getCurrent).not.toHaveBeenCalled();
    expect(mockBrowser.runtime.sendMessage).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('handles getCurrent rejection gracefully', async () => {
    (mockBrowser.windows.getCurrent as jest.Mock).mockRejectedValue(
      new Error('getCurrent failed'),
    );

    renderHook(() => useNavigateRouteListener());

    await act(async () => undefined);

    expect(mockBrowser.windows.getCurrent).toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('handles sendMessage rejection in nudge gracefully', async () => {
    renderHook(() => useNavigateRouteListener());

    await waitFor(() => {
      expect(mockBrowser.windows.getCurrent).toHaveBeenCalled();
    });

    (mockBrowser.runtime.sendMessage as jest.Mock).mockRejectedValue(
      new Error('sendMessage failed'),
    );

    act(() => {
      messageListener?.({
        type: EXTENSION_MESSAGES.OPEN_ROUTE,
        body: { windowId: 123 },
      });
    });

    await act(async () => undefined);

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('pushes on both mount and nudge for correct history behavior', async () => {
    (mockBrowser.runtime.sendMessage as jest.Mock).mockResolvedValue({
      type: EXTENSION_MESSAGES.CONSUME_PENDING_ROUTE,
      body: { path: '/asset/eth', search: '' },
    });

    renderHook(() => useNavigateRouteListener());

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({
        pathname: '/asset/eth',
        search: '',
      });
    });

    mockNavigate.mockClear();

    (mockBrowser.runtime.sendMessage as jest.Mock).mockResolvedValue({
      type: EXTENSION_MESSAGES.CONSUME_PENDING_ROUTE,
      body: { path: '/swap', search: '' },
    });

    act(() => {
      messageListener?.({
        type: EXTENSION_MESSAGES.OPEN_ROUTE,
        body: { windowId: 123 },
      });
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({
        pathname: '/swap',
        search: '',
      });
    });
  });
});

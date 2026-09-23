import { renderHook, act } from '@testing-library/react';
import browser from 'webextension-polyfill';
import { EXTENSION_MESSAGES } from '../../shared/constants/messages';
import { getIsUnlocked } from '../ducks/metamask/base-selectors';
import { useNavigateRouteListener } from './useNavigateRouteListener';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../ducks/metamask/base-selectors', () => ({
  ...jest.requireActual('../ducks/metamask/base-selectors'),
  getIsUnlocked: jest.fn(),
}));

jest.mock('../store/hooks', () => ({
  useAppSelector: (selector: (state: unknown) => unknown) => selector({}),
}));

const mockGetIsUnlocked = jest.mocked(getIsUnlocked);

describe('useNavigateRouteListener', () => {
  let messageListener: ((message: unknown) => unknown) | undefined;

  beforeEach(() => {
    mockNavigate.mockReset();
    messageListener = undefined;
    mockGetIsUnlocked.mockReturnValue(true);
    jest
      .spyOn(browser.runtime.onMessage, 'addListener')
      .mockImplementation((listener) => {
        messageListener = listener as (message: unknown) => unknown;
      });
    jest
      .spyOn(browser.runtime.onMessage, 'removeListener')
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('navigates when OPEN_ROUTE is received while unlocked', () => {
    renderHook(() => useNavigateRouteListener());

    act(() => {
      messageListener?.({
        type: EXTENSION_MESSAGES.OPEN_ROUTE,
        body: {
          path: '/cross-chain/swaps/prepare-bridge-page',
          search: '?to=eip155:1/slip44:60',
        },
      });
    });

    expect(mockNavigate).toHaveBeenCalledWith({
      pathname: '/cross-chain/swaps/prepare-bridge-page',
      search: '?to=eip155:1/slip44:60',
    });
  });

  it('defers navigation until unlocked', () => {
    mockGetIsUnlocked.mockReturnValue(false);
    const { rerender } = renderHook(() => useNavigateRouteListener());

    act(() => {
      messageListener?.({
        type: EXTENSION_MESSAGES.OPEN_ROUTE,
        body: { path: '/asset/eip155:1/slip44:60' },
      });
    });

    expect(mockNavigate).not.toHaveBeenCalled();

    mockGetIsUnlocked.mockReturnValue(true);
    rerender();

    expect(mockNavigate).toHaveBeenCalledWith({
      pathname: '/asset/eip155:1/slip44:60',
      search: '',
    });
  });

  it('ignores messages without a valid path', () => {
    renderHook(() => useNavigateRouteListener());

    act(() => {
      messageListener?.({
        type: EXTENSION_MESSAGES.OPEN_ROUTE,
        body: { path: 'swaps' },
      });
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('ignores non-object messages', () => {
    renderHook(() => useNavigateRouteListener());

    act(() => {
      messageListener?.(null);
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

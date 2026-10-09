import React, { StrictMode } from 'react';
import { renderHook } from '@testing-library/react';
import {
  observeUsefulScreenNavigation,
  signalUsefulScreenReady,
} from '../helpers/utils/useful-screen-ready';
import {
  useUsefulScreenReady,
  useUsefulScreenReadyNavigation,
  UsefulScreenReadyContext,
} from './useUsefulScreenReady';

let mockKey = 'initial';

const Wrapper = ({ children }: React.PropsWithChildren) => {
  return (
    <UsefulScreenReadyContext.Provider value={mockKey}>
      {children}
    </UsefulScreenReadyContext.Provider>
  );
};
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => ({ key: mockKey, pathname: '/' }),
  useNavigationType: () => 'POP',
}));
jest.mock('../helpers/utils/useful-screen-ready', () => ({
  observeUsefulScreenNavigation: jest.fn(),
  signalUsefulScreenReady: jest.fn(),
}));

describe('useUsefulScreenReady', () => {
  const cleanup = jest.fn();
  beforeEach(() => {
    jest.clearAllMocks();
    mockKey = 'initial';
    jest.mocked(signalUsefulScreenReady).mockReturnValue(cleanup);
  });

  it('signals only after a ready commit and withdraws readiness when it becomes unavailable', () => {
    const { rerender } = renderHook(
      ({ ready }) =>
        useUsefulScreenReady({
          screen: 'unlock',
          section: 'form',
          generation: 'unlock',
          ready,
        }),
      { initialProps: { ready: false }, wrapper: Wrapper },
    );
    expect(signalUsefulScreenReady).not.toHaveBeenCalled();
    rerender({ ready: true });
    expect(signalUsefulScreenReady).toHaveBeenCalledWith('initial', {
      screen: 'unlock',
      section: 'form',
      generation: 'unlock',
    });
    rerender({ ready: false });
    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it('does not register again for ordinary rerenders', () => {
    const { rerender } = renderHook(
      () =>
        useUsefulScreenReady({
          screen: 'home',
          section: 'assets',
          generation: 'account-a',
          ready: true,
        }),
      { wrapper: Wrapper },
    );
    rerender();
    expect(signalUsefulScreenReady).toHaveBeenCalledTimes(1);
  });

  it('withdraws the old request before registering a new request', () => {
    const { rerender } = renderHook(
      ({ generation }) =>
        useUsefulScreenReady({
          screen: 'confirmation',
          section: 'details',
          generation,
          ready: true,
        }),
      { initialProps: { generation: 'request-a' }, wrapper: Wrapper },
    );
    rerender({ generation: 'request-b' });
    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(signalUsefulScreenReady).toHaveBeenLastCalledWith('initial', {
      screen: 'confirmation',
      section: 'details',
      generation: 'request-b',
    });
  });

  it('withdraws readiness before a new route registers', () => {
    const { rerender, unmount } = renderHook(
      () =>
        useUsefulScreenReady({
          screen: 'home',
          section: 'account',
          generation: 'account-a',
          ready: true,
        }),
      { wrapper: Wrapper },
    );
    mockKey = 'next';
    rerender();
    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(signalUsefulScreenReady).toHaveBeenLastCalledWith(
      'next',
      expect.any(Object),
    );
    unmount();
    expect(cleanup).toHaveBeenCalledTimes(2);
  });

  it('cleans up StrictMode effect replay', () => {
    const { unmount } = renderHook(
      () =>
        useUsefulScreenReady({
          screen: 'unlock',
          section: 'form',
          generation: 'unlock',
          ready: true,
        }),
      {
        wrapper: ({ children }) => (
          <StrictMode>
            <Wrapper>{children}</Wrapper>
          </StrictMode>
        ),
      },
    );
    expect(signalUsefulScreenReady).toHaveBeenCalledTimes(2);
    expect(cleanup).toHaveBeenCalledTimes(1);
    unmount();
    expect(cleanup).toHaveBeenCalledTimes(2);
  });
});

describe('useUsefulScreenReadyNavigation', () => {
  it('observes router commits before the section effects run', () => {
    jest.clearAllMocks();
    mockKey = 'initial';
    renderHook(
      () => {
        useUsefulScreenReadyNavigation();
        useUsefulScreenReady({
          screen: 'home',
          section: 'account',
          generation: 'account-a',
          ready: true,
        });
      },
      { wrapper: Wrapper },
    );
    expect(observeUsefulScreenNavigation).toHaveBeenCalledWith({
      key: 'initial',
      pathname: '/',
      navigationType: 'POP',
    });
    expect(
      jest.mocked(observeUsefulScreenNavigation).mock.invocationCallOrder[0],
    ).toBeLessThan(
      jest.mocked(signalUsefulScreenReady).mock.invocationCallOrder[0],
    );
  });
});

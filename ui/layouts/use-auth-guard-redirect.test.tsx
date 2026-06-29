import React from 'react';
import { render } from '@testing-library/react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { ONBOARDING_ROUTE, UNLOCK_ROUTE } from '../helpers/constants/routes';
import { useAuthGuardRedirect } from './use-auth-guard-redirect';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

const mockUseLocation = jest.fn();
jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useLocation: () => mockUseLocation(),
    Navigate: jest.fn(({ to }: { to: string }) => (
      <div data-testid="navigate" data-to={to} />
    )),
  };
});

const mockUseSelector = jest.mocked(useSelector);

const TestComponent = () => {
  const redirect = useAuthGuardRedirect();
  return redirect ?? <div data-testid="no-redirect" />;
};

describe('useAuthGuardRedirect', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocation.mockReturnValue({ pathname: '/', search: '', hash: '' });
  });

  it('redirects to onboarding when onboarding is not completed', () => {
    const state = { metamask: { completedOnboarding: false, isUnlocked: false } };
    mockUseSelector.mockImplementation((selector) => selector(state as never));

    const { getByTestId } = render(<TestComponent />);

    expect(getByTestId('navigate')).toHaveAttribute('data-to', ONBOARDING_ROUTE);
  });

  it('redirects to unlock when onboarding is complete but wallet is locked', () => {
    const state = { metamask: { completedOnboarding: true, isUnlocked: false } };
    mockUseLocation.mockReturnValue({
      pathname: '/settings',
      search: '',
      hash: '',
    });
    mockUseSelector.mockImplementation((selector) => selector(state as never));

    render(<TestComponent />);

    expect(Navigate).toHaveBeenCalledWith(
      expect.objectContaining({
        to: UNLOCK_ROUTE,
        replace: true,
        state: { from: expect.objectContaining({ pathname: '/settings' }) },
      }),
      expect.anything(),
    );
  });

  it('returns null when onboarding is complete and wallet is unlocked', () => {
    const state = { metamask: { completedOnboarding: true, isUnlocked: true } };
    mockUseSelector.mockImplementation((selector) => selector(state as never));

    const { getByTestId, queryByTestId } = render(<TestComponent />);

    expect(getByTestId('no-redirect')).toBeInTheDocument();
    expect(queryByTestId('navigate')).not.toBeInTheDocument();
  });

  it('passes the current location as state when redirecting to unlock', () => {
    const state = { metamask: { completedOnboarding: true, isUnlocked: false } };
    mockUseLocation.mockReturnValue({
      pathname: '/bridge/prepare',
      search: '?foo=bar',
      hash: '#ignored',
    });
    mockUseSelector.mockImplementation((selector) => selector(state as never));

    render(<TestComponent />);

    expect(Navigate).toHaveBeenCalledWith(
      expect.objectContaining({
        to: UNLOCK_ROUTE,
        replace: true,
        state: {
          from: expect.objectContaining({
            pathname: '/bridge/prepare',
            search: '?foo=bar',
          }),
        },
      }),
      expect.anything(),
    );
  });

  it('uses replace navigation for all redirects', () => {
    const state = { metamask: { completedOnboarding: true, isUnlocked: false } };
    mockUseSelector.mockImplementation((selector) => selector(state as never));

    render(<TestComponent />);

    expect(Navigate).toHaveBeenCalledWith(
      expect.objectContaining({ replace: true }),
      expect.anything(),
    );
  });

  it('prioritises onboarding redirect over unlock redirect when both conditions apply', () => {
    const state = { metamask: { completedOnboarding: false, isUnlocked: false } };
    mockUseSelector.mockImplementation((selector) => selector(state as never));

    const { getByTestId } = render(<TestComponent />);

    expect(getByTestId('navigate')).toHaveAttribute('data-to', ONBOARDING_ROUTE);
  });
});

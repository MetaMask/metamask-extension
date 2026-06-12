import React from 'react';
import { render } from '@testing-library/react';
import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import { ONBOARDING_ROUTE, UNLOCK_ROUTE } from '../helpers/constants/routes';
import { RequireAuthenticated } from './require-authenticated';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

const mockUseLocation = jest.fn();
jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useLocation: () => mockUseLocation(),
    Navigate: jest.fn(({ to }) => <div data-testid="navigate" data-to={to} />),
  };
});

jest.mock('./root-layout', () => ({
  RootLayout: jest.fn(() => <div data-testid="root-layout" />),
}));

const mockUseSelector = jest.mocked(useSelector);

describe('RequireAuthenticated', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('redirects to onboarding when onboarding is not completed', () => {
    const state = {
      metamask: {
        completedOnboarding: false,
        isUnlocked: false,
      },
    };

    mockUseLocation.mockReturnValue({ pathname: '/', search: '', hash: '' });
    mockUseSelector.mockImplementation((selector) => selector(state as never));

    const { getByTestId } = render(<RequireAuthenticated />);

    expect(getByTestId('navigate')).toHaveAttribute(
      'data-to',
      ONBOARDING_ROUTE,
    );
  });

  it('redirects to unlock with location state when locked', () => {
    const state = {
      metamask: {
        completedOnboarding: true,
        isUnlocked: false,
      },
    };

    mockUseLocation.mockReturnValue({
      pathname: '/bridge/prepare',
      search: '?foo=bar',
      hash: '#ignored',
    } as ReturnType<typeof useLocation>);
    mockUseSelector.mockImplementation((selector) => selector(state as never));

    render(<RequireAuthenticated />);

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

  it('renders RootLayout when onboarding is completed and unlocked', () => {
    const state = {
      metamask: {
        completedOnboarding: true,
        isUnlocked: true,
      },
    };

    mockUseLocation.mockReturnValue({ pathname: '/', search: '', hash: '' });
    mockUseSelector.mockImplementation((selector) => selector(state as never));

    const { getByTestId, queryByTestId } = render(<RequireAuthenticated />);

    expect(getByTestId('root-layout')).toBeInTheDocument();
    expect(queryByTestId('navigate')).not.toBeInTheDocument();
  });

  it('uses replace navigation when redirecting', () => {
    const state = {
      metamask: {
        completedOnboarding: true,
        isUnlocked: false,
      },
    };

    mockUseLocation.mockReturnValue({
      pathname: '/settings',
      search: '',
      hash: '',
    });
    mockUseSelector.mockImplementation((selector) => selector(state as never));

    render(<RequireAuthenticated />);

    expect(Navigate).toHaveBeenCalledWith(
      expect.objectContaining({
        to: UNLOCK_ROUTE,
        replace: true,
        state: {
          from: expect.objectContaining({
            pathname: '/settings',
            search: '',
          }),
        },
      }),
      expect.anything(),
    );
  });
});

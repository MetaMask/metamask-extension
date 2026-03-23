import React from 'react';
import { render } from '@testing-library/react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '../store/store';
import { ONBOARDING_ROUTE } from '../helpers/constants/routes';
import { RequireOnboarded } from './require-onboarded';

jest.mock('../store/store', () => ({
  useAppSelector: jest.fn(),
}));

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    Navigate: jest.fn(({ to }) => <div data-testid="navigate" data-to={to} />),
    Outlet: jest.fn(() => <div data-testid="outlet" />),
  };
});

const mockUseAppSelector = jest.mocked(useAppSelector);

describe('RequireOnboarded', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('redirects to onboarding when onboarding is not completed', () => {
    const state = {
      metamask: {
        completedOnboarding: false,
      },
    };

    mockUseAppSelector.mockImplementation((selector) =>
      selector(state as never),
    );

    const { getByTestId, queryByTestId } = render(<RequireOnboarded />);

    expect(getByTestId('navigate')).toHaveAttribute(
      'data-to',
      ONBOARDING_ROUTE,
    );
    expect(queryByTestId('outlet')).not.toBeInTheDocument();
  });

  it('renders Outlet when onboarding is completed', () => {
    const state = {
      metamask: {
        completedOnboarding: true,
      },
    };

    mockUseAppSelector.mockImplementation((selector) =>
      selector(state as never),
    );

    const { getByTestId, queryByTestId } = render(<RequireOnboarded />);

    expect(getByTestId('outlet')).toBeInTheDocument();
    expect(queryByTestId('navigate')).not.toBeInTheDocument();
  });

  it('uses replace navigation when redirecting', () => {
    const state = {
      metamask: {
        completedOnboarding: false,
      },
    };

    mockUseAppSelector.mockImplementation((selector) =>
      selector(state as never),
    );

    render(<RequireOnboarded />);

    expect(Navigate).toHaveBeenCalledWith(
      expect.objectContaining({
        to: ONBOARDING_ROUTE,
        replace: true,
      }),
      expect.anything(),
    );
    expect(Outlet).not.toHaveBeenCalled();
  });
});

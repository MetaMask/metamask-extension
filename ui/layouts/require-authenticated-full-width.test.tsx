import React from 'react';
import { render } from '@testing-library/react';
import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import { ONBOARDING_ROUTE, UNLOCK_ROUTE } from '../helpers/constants/routes';
import { RequireAuthenticatedFullWidth } from './require-authenticated-full-width';

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
    Outlet: jest.fn(() => <div data-testid="full-width-outlet" />),
  };
});

const mockUseSelector = jest.mocked(useSelector);

describe('RequireAuthenticatedFullWidth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocation.mockReturnValue({ pathname: '/', search: '', hash: '' });
  });

  it('redirects to onboarding when onboarding is not completed', () => {
    mockUseSelector.mockImplementation((selector) =>
      selector({
        metamask: {
          completedOnboarding: false,
          isUnlocked: false,
        },
      } as never),
    );

    const { getByTestId } = render(<RequireAuthenticatedFullWidth />);

    expect(getByTestId('navigate')).toHaveAttribute(
      'data-to',
      ONBOARDING_ROUTE,
    );
  });

  it('redirects to unlock with location state when locked', () => {
    const location = {
      pathname: '/perps/market-expanded/BTC',
      search: '',
      hash: '',
    } as ReturnType<typeof useLocation>;
    mockUseLocation.mockReturnValue(location);
    mockUseSelector.mockImplementation((selector) =>
      selector({
        metamask: {
          completedOnboarding: true,
          isUnlocked: false,
        },
      } as never),
    );

    render(<RequireAuthenticatedFullWidth />);

    expect(Navigate).toHaveBeenCalledWith(
      expect.objectContaining({
        to: UNLOCK_ROUTE,
        replace: true,
        state: { from: location },
      }),
      expect.anything(),
    );
  });

  it('renders only the outlet when unlocked', () => {
    mockUseSelector.mockImplementation((selector) =>
      selector({
        metamask: {
          completedOnboarding: true,
          isUnlocked: true,
        },
      } as never),
    );

    const { getByTestId, queryByTestId } = render(
      <RequireAuthenticatedFullWidth />,
    );

    expect(getByTestId('full-width-outlet')).toBeInTheDocument();
    expect(queryByTestId('navigate')).not.toBeInTheDocument();
  });
});

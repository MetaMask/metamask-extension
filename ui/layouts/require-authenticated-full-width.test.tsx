import React from 'react';
import { render } from '@testing-library/react';
import { RequireAuthenticatedFullWidth } from './require-authenticated-full-width';

const mockUseAuthGuardRedirect = jest.fn();
jest.mock('./use-auth-guard-redirect', () => ({
  useAuthGuardRedirect: () => mockUseAuthGuardRedirect(),
}));

jest.mock('./full-width-layout', () => ({
  FullWidthLayout: () => <div data-testid="full-width-layout" />,
}));

describe('RequireAuthenticatedFullWidth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders FullWidthLayout when there is no redirect', () => {
    mockUseAuthGuardRedirect.mockReturnValue(null);

    const { getByTestId } = render(<RequireAuthenticatedFullWidth />);

    expect(getByTestId('full-width-layout')).toBeInTheDocument();
  });

  it('renders the redirect element when useAuthGuardRedirect returns one', () => {
    const redirect = <div data-testid="redirect-element" />;
    mockUseAuthGuardRedirect.mockReturnValue(redirect);

    const { getByTestId, queryByTestId } = render(
      <RequireAuthenticatedFullWidth />,
    );

    expect(getByTestId('redirect-element')).toBeInTheDocument();
    expect(queryByTestId('full-width-layout')).not.toBeInTheDocument();
  });

  it('does not render FullWidthLayout when redirecting', () => {
    const redirect = <div data-testid="redirect-element" />;
    mockUseAuthGuardRedirect.mockReturnValue(redirect);

    const { queryByTestId } = render(<RequireAuthenticatedFullWidth />);

    expect(queryByTestId('full-width-layout')).not.toBeInTheDocument();
  });
});

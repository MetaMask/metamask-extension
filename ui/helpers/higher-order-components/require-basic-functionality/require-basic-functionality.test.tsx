import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { render } from '@testing-library/react';
import RequireBasicFunctionality from './require-basic-functionality';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  Navigate: jest.fn(({ to }) => <div data-testid="navigate" data-to={to} />),
}));

const mockUseSelector = jest.mocked(useSelector);

describe('RequireBasicFunctionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when useExternalServices is true', () => {
    it('renders children', () => {
      mockUseSelector.mockReturnValue(true);

      const { getByText, queryByTestId } = render(
        <RequireBasicFunctionality>
          <span>Child content</span>
        </RequireBasicFunctionality>,
      );

      expect(getByText('Child content')).toBeInTheDocument();
      expect(queryByTestId('navigate')).not.toBeInTheDocument();
    });
  });

  describe('when useExternalServices is false', () => {
    const featureUnavailableRoute = '/feature-unavailable';

    it('redirects to the feature unavailable page', () => {
      mockUseSelector.mockReturnValue(false);

      const { getByTestId, queryByText } = render(
        <RequireBasicFunctionality>
          <span>Child content</span>
        </RequireBasicFunctionality>,
      );

      expect(getByTestId('navigate')).toBeInTheDocument();
      expect(getByTestId('navigate')).toHaveAttribute(
        'data-to',
        featureUnavailableRoute,
      );
      expect(queryByText('Child content')).not.toBeInTheDocument();
    });

    it('uses replace navigation', () => {
      mockUseSelector.mockReturnValue(false);

      render(
        <RequireBasicFunctionality>
          <span>Child content</span>
        </RequireBasicFunctionality>,
      );

      expect(Navigate).toHaveBeenCalledWith(
        expect.objectContaining({
          to: featureUnavailableRoute,
          replace: true,
        }),
        expect.anything(),
      );
    });
  });
});

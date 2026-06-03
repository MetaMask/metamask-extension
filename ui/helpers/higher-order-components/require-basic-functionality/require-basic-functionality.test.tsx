import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { render } from '@testing-library/react';
import { SWAP_PATH } from '../../constants/routes';
import BasicFunctionalityRequired from './require-basic-functionality';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

const mockUseLocation = jest.fn();
jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useLocation: () => mockUseLocation(),
    Outlet: jest.fn(() => <div data-testid="outlet" />),
    Navigate: jest.fn(({ to }) => <div data-testid="navigate" data-to={to} />),
  };
});

const mockUseSelector = jest.mocked(useSelector);

describe('BasicFunctionalityRequired', () => {
  const basicFunctionalityOffRoute = '/basic-functionality-off';

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocation.mockReturnValue({
      pathname: SWAP_PATH,
      state: null,
      key: '',
      search: '',
      hash: '',
    } as ReturnType<typeof useLocation>);
  });

  describe('when useExternalServices is true', () => {
    it('renders Outlet', () => {
      mockUseSelector.mockReturnValue(true);

      const { getByTestId, queryByTestId } = render(
        <BasicFunctionalityRequired />,
      );

      expect(getByTestId('outlet')).toBeInTheDocument();
      expect(queryByTestId('navigate')).not.toBeInTheDocument();
    });
  });

  describe('when useExternalServices is undefined (e.g. during hydration or old state)', () => {
    it('redirects to basic-functionality-off to be conservative', () => {
      mockUseSelector.mockReturnValue(undefined);

      const { getByTestId, queryByTestId } = render(
        <BasicFunctionalityRequired />,
      );

      expect(getByTestId('navigate')).toBeInTheDocument();
      expect(getByTestId('navigate')).toHaveAttribute(
        'data-to',
        basicFunctionalityOffRoute,
      );
      expect(Navigate).toHaveBeenCalledWith(
        expect.objectContaining({
          to: basicFunctionalityOffRoute,
          state: {
            blockedRoutePath: SWAP_PATH,
          },
        }),
        expect.anything(),
      );
      expect(queryByTestId('outlet')).not.toBeInTheDocument();
    });
  });

  describe('when useExternalServices is false', () => {
    it('redirects to the basic functionality off page', () => {
      mockUseSelector.mockReturnValue(false);

      const { getByTestId, queryByTestId } = render(
        <BasicFunctionalityRequired />,
      );

      expect(getByTestId('navigate')).toBeInTheDocument();
      expect(getByTestId('navigate')).toHaveAttribute(
        'data-to',
        basicFunctionalityOffRoute,
      );
      expect(queryByTestId('outlet')).not.toBeInTheDocument();
    });

    it('uses replace navigation', () => {
      mockUseSelector.mockReturnValue(false);

      render(<BasicFunctionalityRequired />);

      expect(Navigate).toHaveBeenCalledWith(
        expect.objectContaining({
          to: basicFunctionalityOffRoute,
          state: {
            blockedRoutePath: SWAP_PATH,
          },
          replace: true,
        }),
        expect.anything(),
      );
    });

    it('passes current location pathname in state', () => {
      mockUseSelector.mockReturnValue(false);

      render(<BasicFunctionalityRequired />);

      expect(Navigate).toHaveBeenCalledWith(
        expect.objectContaining({
          to: basicFunctionalityOffRoute,
          state: {
            blockedRoutePath: SWAP_PATH,
          },
        }),
        expect.anything(),
      );
    });

    it('includes search and hash in blockedRoutePath so original URL context is restored', () => {
      mockUseSelector.mockReturnValue(false);
      mockUseLocation.mockReturnValue({
        pathname: SWAP_PATH,
        state: null,
        key: '',
        search: '?swaps=true',
        hash: '#section',
      } as ReturnType<typeof useLocation>);

      render(<BasicFunctionalityRequired />);

      expect(Navigate).toHaveBeenCalledWith(
        expect.objectContaining({
          to: basicFunctionalityOffRoute,
          state: {
            blockedRoutePath: `${SWAP_PATH}?swaps=true#section`,
          },
        }),
        expect.anything(),
      );
    });

    it('does not call Outlet when redirecting', () => {
      mockUseSelector.mockReturnValue(false);

      render(<BasicFunctionalityRequired />);

      expect(Outlet).not.toHaveBeenCalled();
    });
  });
});

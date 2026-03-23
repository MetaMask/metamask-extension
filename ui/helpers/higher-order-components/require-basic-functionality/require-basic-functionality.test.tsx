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

describe('RequireBasicFunctionality', () => {
  const encodedSwapPath = encodeURIComponent(SWAP_PATH);

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

  it('renders Outlet when useExternalServices is true', () => {
    mockUseSelector.mockReturnValue(true);

    const { getByTestId, queryByTestId } = render(
      <BasicFunctionalityRequired />,
    );

    expect(getByTestId('outlet')).toBeInTheDocument();
    expect(queryByTestId('navigate')).not.toBeInTheDocument();
  });

  it('redirects to basic-functionality-off with from query when useExternalServices is undefined', () => {
    mockUseSelector.mockReturnValue(undefined);

    const { getByTestId, queryByTestId } = render(
      <BasicFunctionalityRequired />,
    );

    expect(getByTestId('navigate')).toHaveAttribute(
      'data-to',
      `/basic-functionality-off?from=${encodedSwapPath}`,
    );
    expect(queryByTestId('outlet')).not.toBeInTheDocument();
  });

  it('redirects to basic-functionality-off with encoded from query when useExternalServices is false', () => {
    mockUseSelector.mockReturnValue(false);
    mockUseLocation.mockReturnValue({
      pathname: SWAP_PATH,
      state: null,
      key: '',
      search: '?swaps=true',
      hash: '#section',
    } as ReturnType<typeof useLocation>);

    const { getByTestId } = render(<BasicFunctionalityRequired />);

    expect(getByTestId('navigate')).toHaveAttribute(
      'data-to',
      `/basic-functionality-off?from=${encodeURIComponent(
        `${SWAP_PATH}?swaps=true#section`,
      )}`,
    );
  });

  it('uses replace navigation', () => {
    mockUseSelector.mockReturnValue(false);

    render(<BasicFunctionalityRequired />);

    expect(Navigate).toHaveBeenCalledWith(
      expect.objectContaining({
        to: `/basic-functionality-off?from=${encodedSwapPath}`,
        replace: true,
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

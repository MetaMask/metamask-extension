import React from 'react';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { useMainNavBars } from '../hooks/useMainNavBars';
import { MainLayout } from './main-layout';

jest.mock('../hooks/useMainNavBars');

jest.mock('../components/app/side-nav/side-nav', () => ({
  SideNav: () => <div data-testid="side-nav" />,
}));
jest.mock('../components/app/bottom-nav-bar/bottom-nav-bar', () => ({
  BottomNavBar: () => <div data-testid="bottom-nav-bar" />,
}));
jest.mock('../components/multichain/app-header', () => ({
  AppHeader: () => <div data-testid="app-header" />,
}));

const mockUseMainNavBars = jest.mocked(useMainNavBars);

const renderMainLayout = () => {
  const router = createMemoryRouter([
    {
      element: <MainLayout />,
      children: [{ path: '/', element: <div data-testid="page" /> }],
    },
  ]);
  render(
    <RouterProvider
      router={router}
      future={{
        // eslint-disable-next-line @typescript-eslint/naming-convention
        v7_startTransition: true,
      }}
    />,
  );
};

describe('MainLayout', () => {
  beforeEach(() => {
    mockUseMainNavBars.mockReturnValue({
      hasNavBar: false,
      showSideNav: false,
      showBottomNav: false,
    });
  });

  it('renders the page', () => {
    renderMainLayout();

    expect(screen.getByTestId('page')).toBeInTheDocument();
  });

  it('renders no nav or app header when the route has no nav', () => {
    renderMainLayout();

    expect(screen.queryByTestId('side-nav')).not.toBeInTheDocument();
    expect(screen.queryByTestId('bottom-nav-bar')).not.toBeInTheDocument();
    expect(screen.queryByTestId('app-header')).not.toBeInTheDocument();
  });

  it('renders the app header and bottom nav bar when the bottom nav is shown', () => {
    mockUseMainNavBars.mockReturnValue({
      hasNavBar: true,
      showSideNav: false,
      showBottomNav: true,
    });

    renderMainLayout();

    expect(screen.getByTestId('app-header')).toBeInTheDocument();
    expect(screen.getByTestId('bottom-nav-bar')).toBeInTheDocument();
    expect(screen.queryByTestId('side-nav')).not.toBeInTheDocument();
  });

  it('renders the app header and side nav, without the bottom nav bar, when the side nav is shown', () => {
    mockUseMainNavBars.mockReturnValue({
      hasNavBar: true,
      showSideNav: true,
      showBottomNav: false,
    });

    renderMainLayout();

    expect(screen.getByTestId('side-nav')).toBeInTheDocument();
    expect(screen.getByTestId('app-header')).toBeInTheDocument();
    expect(screen.queryByTestId('bottom-nav-bar')).not.toBeInTheDocument();
  });
});

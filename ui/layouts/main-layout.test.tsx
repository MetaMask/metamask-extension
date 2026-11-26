import React from 'react';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { AppLayoutProvider } from '../contexts/app-layout';
import { MainLayout } from './main-layout';

jest.mock('../components/app/side-nav/side-nav', () => ({
  SideNav: () => <div data-testid="side-nav" />,
}));
jest.mock('../components/app/bottom-nav-bar/bottom-nav-bar', () => ({
  BottomNavBar: () => <div data-testid="bottom-nav-bar" />,
}));
jest.mock('../components/multichain/app-header', () => ({
  AppHeader: () => <div data-testid="app-header" />,
}));

const renderMainLayout = (isWideLayout = false) => {
  const router = createMemoryRouter([
    {
      element: (
        <AppLayoutProvider isWideLayout={isWideLayout}>
          <MainLayout />
        </AppLayoutProvider>
      ),
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
  it('renders the page', () => {
    renderMainLayout();

    expect(screen.getByTestId('page')).toBeInTheDocument();
  });

  it('renders the app header and bottom nav bar outside the wide layout', () => {
    renderMainLayout();

    expect(screen.getByTestId('app-header')).toBeInTheDocument();
    expect(screen.getByTestId('bottom-nav-bar')).toBeInTheDocument();
    expect(screen.queryByTestId('side-nav')).not.toBeInTheDocument();
  });

  it('renders the app header and side nav, without the bottom nav bar, in the wide layout', () => {
    renderMainLayout(true);

    expect(screen.getByTestId('side-nav')).toBeInTheDocument();
    expect(screen.getByTestId('app-header')).toBeInTheDocument();
    expect(screen.queryByTestId('bottom-nav-bar')).not.toBeInTheDocument();
  });
});

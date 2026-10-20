import React from 'react';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { useBottomNavBar } from '../hooks/useBottomNavBar';
import { useFullScreenDesign } from '../hooks/useFullScreenDesign';
import { MainLayout } from './main-layout';

jest.mock('../hooks/useBottomNavBar');
jest.mock('../hooks/useFullScreenDesign');

jest.mock('../components/app/side-nav/side-nav', () => ({
  SideNav: () => <div data-testid="side-nav" />,
}));
jest.mock('../components/app/bottom-nav-bar/bottom-nav-bar', () => ({
  BottomNavBar: () => <div data-testid="bottom-nav-bar" />,
}));
jest.mock('../components/multichain/app-header', () => ({
  AppHeader: () => <div data-testid="app-header" />,
}));

const mockUseBottomNavBar = jest.mocked(useBottomNavBar);
const mockUseFullScreenDesign = jest.mocked(useFullScreenDesign);

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
    mockUseBottomNavBar.mockReturnValue(false);
    mockUseFullScreenDesign.mockReturnValue(false);
  });

  it('renders the page', () => {
    renderMainLayout();

    expect(screen.getByTestId('page')).toBeInTheDocument();
  });

  describe('when the fullscreen design is off', () => {
    it('does not render the side nav', () => {
      renderMainLayout();

      expect(screen.queryByTestId('side-nav')).not.toBeInTheDocument();
    });

    it('renders the app header and bottom nav bar when the bottom nav is shown', () => {
      mockUseBottomNavBar.mockReturnValue(true);

      renderMainLayout();

      expect(screen.getByTestId('app-header')).toBeInTheDocument();
      expect(screen.getByTestId('bottom-nav-bar')).toBeInTheDocument();
    });

    it('does not render the app header or bottom nav bar when the bottom nav is hidden', () => {
      renderMainLayout();

      expect(screen.queryByTestId('app-header')).not.toBeInTheDocument();
      expect(screen.queryByTestId('bottom-nav-bar')).not.toBeInTheDocument();
    });
  });

  describe('when the fullscreen design is on', () => {
    beforeEach(() => {
      mockUseFullScreenDesign.mockReturnValue(true);
    });

    it('renders the side nav regardless of the bottom nav', () => {
      renderMainLayout();

      expect(screen.getByTestId('side-nav')).toBeInTheDocument();
    });

    it('does not render the bottom nav bar when the bottom nav is shown', () => {
      mockUseBottomNavBar.mockReturnValue(true);

      renderMainLayout();

      expect(screen.getByTestId('side-nav')).toBeInTheDocument();
      expect(screen.getByTestId('app-header')).toBeInTheDocument();
      expect(screen.queryByTestId('bottom-nav-bar')).not.toBeInTheDocument();
    });
  });
});

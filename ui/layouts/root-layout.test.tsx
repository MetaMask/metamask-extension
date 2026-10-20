import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  createMemoryRouter,
  RouterProvider,
  type RouteObject,
} from 'react-router-dom';
import { useFullScreenDesign } from '../hooks/useFullScreenDesign';
import { RootLayout } from './root-layout';

jest.mock('../hooks/useFullScreenDesign');

const mockUseFullScreenDesign = jest.mocked(useFullScreenDesign);

const renderRootLayout = (childRoute: RouteObject) => {
  const router = createMemoryRouter([
    {
      element: <RootLayout />,
      children: [{ path: '/', ...childRoute }],
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

  return screen.getByTestId('child').parentElement as HTMLElement;
};

const child = <div data-testid="child" />;
const maxWidthClass = 'max-w-[var(--width-max)]';

describe('RootLayout', () => {
  beforeEach(() => {
    mockUseFullScreenDesign.mockReturnValue(false);
  });

  it('caps the width of routes without a side nav', () => {
    const layout = renderRootLayout({ element: child });

    expect(layout).toHaveClass(maxWidthClass);
  });

  it('caps the width of routes without a side nav in the fullscreen design', () => {
    mockUseFullScreenDesign.mockReturnValue(true);

    const layout = renderRootLayout({ element: child });

    expect(layout).toHaveClass(maxWidthClass);
  });

  it('uses the full width of routes with a side nav in the fullscreen design', () => {
    mockUseFullScreenDesign.mockReturnValue(true);

    const layout = renderRootLayout({
      element: child,
      handle: { hasSideNav: true },
    });

    expect(layout).not.toHaveClass(maxWidthClass);
  });
});

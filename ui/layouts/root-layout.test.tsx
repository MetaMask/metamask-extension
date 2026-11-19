import React from 'react';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { useAppLayout } from '../contexts/app-layout';
import { useWideLayoutDesign } from '../hooks/useWideLayoutDesign';
import { RootLayout } from './root-layout';

jest.mock('../hooks/useWideLayoutDesign');
jest.mock('#ui/components/app/rewards/money-referral/ReferralInvite', () => ({
  ReferralInvite: () => null,
}));

const mockUseWideLayoutDesign = jest.mocked(useWideLayoutDesign);

const AppLayoutProbe = () => {
  const { isWideLayout } = useAppLayout();
  return <div data-testid="child" data-wide-layout={String(isWideLayout)} />;
};

const renderRootLayout = () => {
  const router = createMemoryRouter([
    {
      element: <RootLayout />,
      children: [{ path: '/', element: <AppLayoutProbe /> }],
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

describe('RootLayout', () => {
  it('provides the classic layout when the fullscreen design is off', () => {
    mockUseWideLayoutDesign.mockReturnValue(false);

    const layout = renderRootLayout();

    expect(screen.getByTestId('child')).toHaveAttribute(
      'data-wide-layout',
      'false',
    );
    expect(layout).not.toHaveAttribute('data-wide-layout');
  });

  it('provides the wide layout when the fullscreen design is on', () => {
    mockUseWideLayoutDesign.mockReturnValue(true);

    const layout = renderRootLayout();

    expect(screen.getByTestId('child')).toHaveAttribute(
      'data-wide-layout',
      'true',
    );
    expect(layout).toHaveAttribute('data-wide-layout', 'true');
  });
});

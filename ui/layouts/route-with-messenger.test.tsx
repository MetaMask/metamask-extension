import React from 'react';
import { renderWithProvider } from '../../test/lib/render-helpers-navigate';
import * as routeMessengerModule from '../messengers/route-messenger';
import { RouteWithMessenger } from './route-with-messenger';

describe('RouteWithMessenger', () => {
  it('renders children and provides a route messenger', () => {
    const { getByTestId } = renderWithProvider(
      <RouteWithMessenger
        path="/test"
        capabilities={{
          actions: ['SnapController:installSnaps'],
        }}
      >
        <div data-testid="child" />
      </RouteWithMessenger>,
    );

    expect(getByTestId('child')).toBeInTheDocument();
  });

  it('creates a route messenger with the correct path and capabilities', () => {
    const createRouteMessengerSpy = jest.spyOn(
      routeMessengerModule,
      'createRouteMessenger',
    );

    renderWithProvider(
      <RouteWithMessenger
        path="/some/path"
        capabilities={{
          actions: ['SnapController:installSnaps'],
          events: ['SnapController:snapInstalled'],
        }}
      >
        <div />
      </RouteWithMessenger>,
      undefined,
      '/some/path',
    );

    expect(createRouteMessengerSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/some/path',
        capabilities: {
          actions: ['SnapController:installSnaps'],
          events: ['SnapController:snapInstalled'],
        },
      }),
    );
  });
});

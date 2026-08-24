import React from 'react';
import { renderWithProvider } from '../../test/lib/render-helpers-navigate';
import * as routeMessengerModule from '../messengers/route-messenger';
import { RouteMessengerProvider } from './route-messenger';

describe('RouteMessengerProvider', () => {
  it('renders children and provides a route messenger', () => {
    const { getByTestId } = renderWithProvider(
      <RouteMessengerProvider
        path="/test"
        capabilities={{
          actions: ['SnapController:installSnaps'],
        }}
      >
        <div data-testid="child" />
      </RouteMessengerProvider>,
    );

    expect(getByTestId('child')).toBeInTheDocument();
  });

  it('creates a route messenger with the correct path and capabilities', () => {
    const createRouteMessengerSpy = jest.spyOn(
      routeMessengerModule,
      'createRouteMessenger',
    );

    renderWithProvider(
      <RouteMessengerProvider
        path="/some/path"
        capabilities={{
          actions: ['SnapController:installSnaps'],
          events: ['SnapController:snapInstalled'],
        }}
      >
        <div />
      </RouteMessengerProvider>,
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

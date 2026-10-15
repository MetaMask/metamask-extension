import React from 'react';
import { createRouteWithMessenger } from './route-messenger-helpers';

describe('createRouteWithMessenger', () => {
  it('returns a route object with the expected shape', () => {
    const route = createRouteWithMessenger({
      path: '/test',
      element: <div>Test</div>,
      capabilities: {
        actions: ['SnapController:installSnaps'],
        events: ['SnapController:snapInstalled'],
      },
    });

    expect(route).toMatchInlineSnapshot(`
      {
        "element": <RouteMessengerProvider
          capabilities={
            {
              "actions": [
                "SnapController:installSnaps",
              ],
              "events": [
                "SnapController:snapInstalled",
              ],
            }
          }
          path="/test"
        >
          <div>
            Test
          </div>
        </RouteMessengerProvider>,
        "path": "/test",
      }
    `);
  });
});

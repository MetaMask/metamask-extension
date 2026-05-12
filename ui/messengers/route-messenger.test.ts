import * as messengerModule from '@metamask/messenger';
import { it } from '@jest/globals';
import { createMockUIMessenger } from '../../test/lib/mock-ui-messenger';
import {
  createRouteMessenger,
  getRouteMessengerNamespace,
} from './route-messenger';

describe('getRouteMessengerNamespace', () => {
  it.each([
    ['/some/path', 'SomePathRoute'],
    ['/another/example', 'AnotherExampleRoute'],
    ['/path/with/*', 'PathWithWildcardRoute'],
    ['/path/with/:someParameter', 'PathWithSomeParameterRoute'],
    ['/', 'Route'],
  ])(
    'derives the correct namespace from the path "%s"',
    (path, expectedNamespace) => {
      expect(getRouteMessengerNamespace(path)).toBe(expectedNamespace);
    },
  );
});

describe('createRouteMessenger', () => {
  it('creates a route messenger with the correct namespace and capabilities', () => {
    const OriginalMessenger = messengerModule.Messenger;
    const MessengerSpy = jest
      .spyOn(messengerModule, 'Messenger')
      .mockImplementation(
        (...args: ConstructorParameters<typeof messengerModule.Messenger>) =>
          new OriginalMessenger(...args),
      );

    const uiMessenger = createMockUIMessenger();
    jest.spyOn(uiMessenger, 'delegate');

    const routeMessenger = createRouteMessenger({
      path: '/some/path',
      uiMessenger,
      capabilities: {
        actions: ['SnapController:installSnaps'],
        events: ['SnapController:snapInstalled'],
      },
    });

    expect(uiMessenger.delegate).toHaveBeenCalledWith({
      messenger: routeMessenger,
      actions: ['SnapController:installSnaps'],
      events: ['SnapController:snapInstalled'],
    });

    expect(MessengerSpy).toHaveBeenCalledWith({
      namespace: 'SomePathRoute',
      parent: uiMessenger,
    });
  });

  it('throws an error if no actions or events are provided', () => {
    const uiMessenger = createMockUIMessenger();

    expect(() =>
      createRouteMessenger({
        path: '/test',
        uiMessenger,
        capabilities: {},
      }),
    ).toThrow('There are no actions or events to delegate.');
  });
});

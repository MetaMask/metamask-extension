import {
  BaseController,
  ControllerMessenger,
  RestrictedControllerMessengerConstraint,
  ActionConstraint,
  EventConstraint,
} from '@metamask/base-controller';
import ComposableObservableStore from './ComposableObservableStore';

type ExampleControllerState = {
  bar: string;
  baz: string;
};
class ExampleController extends BaseController<
  'ExampleController',
  ExampleControllerState,
  RestrictedControllerMessengerConstraint<'ExampleController'>
> {
  static defaultState = {
    bar: 'bar',
    baz: 'baz',
  };

  static metadata = {
    bar: { persist: true, anonymous: true },
    baz: { persist: false, anonymous: true },
  };

  constructor({
    messenger,
  }: {
    messenger: RestrictedControllerMessengerConstraint<'ExampleController'>;
  }) {
    super({
      messenger,
      name: 'ExampleController',
      metadata: ExampleController.metadata,
      state: ExampleController.defaultState,
    });
  }

  updateBar(contents: ExampleControllerState[keyof ExampleControllerState]) {
    this.update((state) => {
      state.bar = contents;
    });
  }
}

describe('ComposableObservableStore', () => {
  it('should register initial state', () => {
    const controllerMessenger = new ControllerMessenger<
      ActionConstraint,
      EventConstraint
    >();
    const store = new ComposableObservableStore({
      controllerMessenger,
      // @ts-expect-error Intentionally passing in mock value for testing
      state: 'state',
    });
    expect(store.getState()).toStrictEqual('state');
  });

  it('should update structure with BaseController-based controller', () => {
    const controllerMessenger = new ControllerMessenger<
      ActionConstraint,
      EventConstraint
    >();
    const exampleController = new ExampleController({
      messenger: controllerMessenger.getRestricted({
        name: 'ExampleController',
        allowedActions: [],
        allowedEvents: [],
      }),
    });
    const store = new ComposableObservableStore({
      controllerMessenger,
    });
    // @ts-expect-error Intentionally passing in mock value for testing
    store.updateStructure({ Example: exampleController });
    exampleController.updateBar('state');
    expect(store.getState()).toStrictEqual({
      Example: { bar: 'state', baz: 'baz' },
    });
  });

  it('should initialize state with BaseControllerV2 controller', () => {
    const controllerMessenger = new ControllerMessenger<
      ActionConstraint,
      EventConstraint
    >();
    const exampleController = new ExampleController({
      messenger: controllerMessenger.getRestricted({
        name: 'ExampleController',
        allowedActions: [],
        allowedEvents: [],
      }),
    });
    exampleController.updateBar('state');
    const store = new ComposableObservableStore({
      controllerMessenger,
    });

    store.updateStructure({
      // @ts-expect-error Intentionally passing in mock value for testing
      Example: exampleController,
    });

    expect(store.getState()).toStrictEqual({
      Example: { bar: 'state', baz: 'baz' },
    });
  });

  it('should strip non-persisted state from initial state', () => {
    const controllerMessenger = new ControllerMessenger<
      ActionConstraint,
      EventConstraint
    >();
    const exampleController = new ExampleController({
      messenger: controllerMessenger.getRestricted({
        name: 'ExampleController',
        allowedActions: [],
        allowedEvents: [],
      }),
    });
    exampleController.updateBar('state');
    const store = new ComposableObservableStore({
      controllerMessenger,
      persist: true,
    });

    store.updateStructure({
      // @ts-expect-error Intentionally passing in mock value for testing
      Example: exampleController,
    });

    expect(store.getState()).toStrictEqual({
      Example: { bar: 'state' },
    });
  });

  it('should return empty state when not configured', () => {
    const controllerMessenger = new ControllerMessenger<
      ActionConstraint,
      EventConstraint
    >();
    const store = new ComposableObservableStore({
      controllerMessenger,
    });
    expect(store.getState()).toStrictEqual({});
  });

  it('should throw if the controller messenger is omitted and the config includes a BaseControllerV2 controller', () => {
    const controllerMessenger = new ControllerMessenger<
      ActionConstraint,
      EventConstraint
    >();
    const exampleController = new ExampleController({
      messenger: controllerMessenger.getRestricted({
        name: 'ExampleController',
        allowedActions: [],
        allowedEvents: [],
      }),
    });
    expect(
      () =>
        // @ts-expect-error Intentionally passing in invalid input for testing
        new ComposableObservableStore({
          config: {
            Example: exampleController,
          },
        }),
    ).toThrow(`Cannot read properties of undefined (reading 'subscribe')`);
  });

  it('should throw if the controller messenger is omitted and updateStructure called with a BaseControllerV2 controller', () => {
    const controllerMessenger = new ControllerMessenger<
      ActionConstraint,
      EventConstraint
    >();
    const exampleController = new ExampleController({
      messenger: controllerMessenger.getRestricted({
        name: 'ExampleController',
        allowedActions: [],
        allowedEvents: [],
      }),
    });
    // @ts-expect-error Intentionally passing in invalid input for testing
    const store = new ComposableObservableStore({});
    // @ts-expect-error Intentionally passing in mock value for testing
    expect(() => store.updateStructure({ Example: exampleController })).toThrow(
      `Cannot read properties of undefined (reading 'subscribe')`,
    );
  });

  it('should throw if initialized with undefined config entry', () => {
    const controllerMessenger = new ControllerMessenger<
      ActionConstraint,
      EventConstraint
    >();
    expect(
      () =>
        new ComposableObservableStore({
          config: {
            // @ts-expect-error Intentionally passing in mock value for testing
            Example: undefined,
          },
          controllerMessenger,
        }),
    ).toThrow(`Undefined 'Example'`);
  });
});

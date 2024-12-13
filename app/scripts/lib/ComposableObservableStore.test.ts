import { ObservableStore } from '@metamask/obs-store';
import {
  BaseControllerV1,
  BaseController,
  ControllerMessenger,
  BaseConfig,
  BaseState,
  RestrictedControllerMessengerConstraint,
  ActionConstraint,
  EventConstraint,
} from '@metamask/base-controller';
import ComposableObservableStore from './ComposableObservableStore';
import {
  MemStoreControllers,
  MemStoreControllersComposedState,
} from '../../../shared/types/metamask';

type OldExampleControllerState = {
  baz: string;
};

class OldExampleController extends BaseControllerV1<
  BaseConfig & object,
  BaseState & OldExampleControllerState
> {
  name = 'OldExampleController';

  defaultState = {
    baz: 'baz',
  };

  constructor() {
    super();
    this.initialize();
  }

  updateBaz(
    contents: OldExampleControllerState[keyof OldExampleControllerState],
  ) {
    this.update({ baz: contents });
  }
}

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

  it('should register initial structure', () => {
    const controllerMessenger = new ControllerMessenger<
      ActionConstraint,
      EventConstraint
    >();
    const testStore = { store: new ObservableStore({}) };
    const store = new ComposableObservableStore({
      // @ts-expect-error Intentionally passing in mock value for testing
      config: { TestStore: testStore },
      controllerMessenger,
    });
    testStore.store.putState('state');
    expect(store.getState()).toStrictEqual({ TestStore: 'state' });
  });

  it('should update structure with observable store', () => {
    const controllerMessenger = new ControllerMessenger<
      ActionConstraint,
      EventConstraint
    >();
    const testStore = { store: new ObservableStore({}) };
    const store = new ComposableObservableStore({
      controllerMessenger,
    });
    // @ts-expect-error Intentionally passing in mock value for testing
    store.updateStructure({ TestStore: testStore });
    testStore.store.putState('state');
    expect(store.getState()).toStrictEqual({ TestStore: 'state' });
  });

  it('should update structure with BaseControllerV1-based controller', () => {
    const controllerMessenger = new ControllerMessenger<
      ActionConstraint,
      EventConstraint
    >();
    const oldExampleController = new OldExampleController();
    const store = new ComposableObservableStore({
      controllerMessenger,
    });
    // @ts-expect-error Intentionally passing in mock value for testing
    store.updateStructure({ OldExample: oldExampleController });
    oldExampleController.updateBaz('state');
    expect(store.getState()).toStrictEqual({ OldExample: { baz: 'state' } });
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

  it('should update structure with all three types of stores', () => {
    const controllerMessenger = new ControllerMessenger<
      ActionConstraint,
      EventConstraint
    >();
    const exampleStore = { store: new ObservableStore({}) };
    const exampleController = new ExampleController({
      messenger: controllerMessenger.getRestricted({
        name: 'ExampleController',
        allowedActions: [],
        allowedEvents: [],
      }),
    });
    const oldExampleController = new OldExampleController();
    const store = new ComposableObservableStore({
      controllerMessenger,
    });
    store.updateStructure({
      // @ts-expect-error Intentionally passing in mock value for testing
      Example: exampleController,
      OldExample: oldExampleController,
      Store: exampleStore,
    });
    exampleStore.store.putState('state');
    exampleController.updateBar('state');
    oldExampleController.updateBaz('state');
    expect(store.getState()).toStrictEqual({
      Example: { bar: 'state', baz: 'baz' },
      OldExample: { baz: 'state' },
      Store: 'state',
    });
  });

  it('should initialize state with all three types of stores', () => {
    const controllerMessenger = new ControllerMessenger<
      ActionConstraint,
      EventConstraint
    >();
    const exampleStore = { store: new ObservableStore({}) };
    const exampleController = new ExampleController({
      messenger: controllerMessenger.getRestricted({
        name: 'ExampleController',
        allowedActions: [],
        allowedEvents: [],
      }),
    });
    const oldExampleController = new OldExampleController();
    exampleStore.store.putState('state');
    exampleController.updateBar('state');
    oldExampleController.updateBaz('state');
    const store = new ComposableObservableStore({
      controllerMessenger,
    });

    store.updateStructure({
      // @ts-expect-error Intentionally passing in mock value for testing
      Example: exampleController,
      OldExample: oldExampleController,
      Store: exampleStore,
    });

    expect(store.getState()).toStrictEqual({
      Example: { bar: 'state', baz: 'baz' },
      OldExample: { baz: 'state' },
      Store: 'state',
    });
  });

  it('should initialize falsy state', () => {
    const controllerMessenger = new ControllerMessenger<
      ActionConstraint,
      EventConstraint
    >();
    const exampleStore = { store: new ObservableStore({}) };
    exampleStore.store.putState(false);
    const store = new ComposableObservableStore({
      controllerMessenger,
    });

    store.updateStructure({
      // @ts-expect-error Intentionally passing in mock value for testing
      Example: exampleStore,
    });

    expect(store.getState()).toStrictEqual({
      Example: false,
    });
  });

  it('should strip non-persisted state from initial state with all three types of stores', () => {
    const controllerMessenger = new ControllerMessenger<
      ActionConstraint,
      EventConstraint
    >();
    const exampleStore = { store: new ObservableStore({}) };
    const exampleController = new ExampleController({
      messenger: controllerMessenger.getRestricted({
        name: 'ExampleController',
        allowedActions: [],
        allowedEvents: [],
      }),
    });
    const oldExampleController = new OldExampleController();
    exampleStore.store.putState('state');
    exampleController.updateBar('state');
    oldExampleController.updateBaz('state');
    const store = new ComposableObservableStore({
      controllerMessenger,
      persist: true,
    });

    store.updateStructure({
      // @ts-expect-error Intentionally passing in mock value for testing
      Example: exampleController,
      OldExample: oldExampleController,
      Store: exampleStore,
    });

    expect(store.getState()).toStrictEqual({
      Example: { bar: 'state' },
      OldExample: { baz: 'state' },
      Store: 'state',
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
        new ComposableObservableStore({
          config: {
            // @ts-expect-error Intentionally passing in mock value for testing
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
    // @ts-expect-error Intentionally passing in invalid input for testing// @ts-expect-error Intentionally passing in invalid input for testing
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

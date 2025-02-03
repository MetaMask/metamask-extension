import { ObservableStore } from '@metamask/obs-store';
import {
  BaseControllerV1,
  BaseController,
  Messenger,
} from '@metamask/base-controller';
import ComposableObservableStore from './ComposableObservableStore';

class OldExampleController extends BaseControllerV1 {
  name = 'OldExampleController';

  defaultState = {
    baz: 'baz',
  };

  constructor() {
    super();
    this.initialize();
  }

  updateBaz(contents) {
    this.update({ baz: contents });
  }
}
class ExampleController extends BaseController {
  static defaultState = {
    bar: 'bar',
    baz: 'baz',
  };

  static metadata = {
    bar: { persist: true, anonymous: true },
    baz: { persist: false, anonymous: true },
  };

  constructor({ messenger }) {
    super({
      messenger,
      name: 'ExampleController',
      metadata: ExampleController.metadata,
      state: ExampleController.defaultState,
    });
  }

  updateBar(contents) {
    this.update((state) => {
      state.bar = contents;
    });
  }
}

describe('ComposableObservableStore', () => {
  it('should register initial state', () => {
    const messenger = new Messenger();
    const store = new ComposableObservableStore({
      controllerMessenger: messenger,
      state: 'state',
    });
    expect(store.getState()).toStrictEqual('state');
  });

  it('should register initial structure', () => {
    const messenger = new Messenger();
    const testStore = new ObservableStore();
    const store = new ComposableObservableStore({
      config: { TestStore: testStore },
      controllerMessenger: messenger,
    });
    testStore.putState('state');
    expect(store.getState()).toStrictEqual({ TestStore: 'state' });
  });

  it('should update structure with observable store', () => {
    const messenger = new Messenger();
    const testStore = new ObservableStore();
    const store = new ComposableObservableStore({
      controllerMessenger: messenger,
    });
    store.updateStructure({ TestStore: testStore });
    testStore.putState('state');
    expect(store.getState()).toStrictEqual({ TestStore: 'state' });
  });

  it('should update structure with BaseControllerV1-based controller', () => {
    const messenger = new Messenger();
    const oldExampleController = new OldExampleController();
    const store = new ComposableObservableStore({
      controllerMessenger: messenger,
    });
    store.updateStructure({ OldExample: oldExampleController });
    oldExampleController.updateBaz('state');
    expect(store.getState()).toStrictEqual({ OldExample: { baz: 'state' } });
  });

  it('should update structure with BaseController-based controller', () => {
    const messenger = new Messenger();
    const exampleController = new ExampleController({
      messenger,
    });
    const store = new ComposableObservableStore({
      controllerMessenger: messenger,
    });
    store.updateStructure({ Example: exampleController });
    exampleController.updateBar('state');
    expect(store.getState()).toStrictEqual({
      Example: { bar: 'state', baz: 'baz' },
    });
  });

  it('should update structure with all three types of stores', () => {
    const messenger = new Messenger();
    const exampleStore = new ObservableStore();
    const exampleController = new ExampleController({
      messenger,
    });
    const oldExampleController = new OldExampleController();
    const store = new ComposableObservableStore({
      controllerMessenger: messenger,
    });
    store.updateStructure({
      Example: exampleController,
      OldExample: oldExampleController,
      Store: exampleStore,
    });
    exampleStore.putState('state');
    exampleController.updateBar('state');
    oldExampleController.updateBaz('state');
    expect(store.getState()).toStrictEqual({
      Example: { bar: 'state', baz: 'baz' },
      OldExample: { baz: 'state' },
      Store: 'state',
    });
  });

  it('should initialize state with all three types of stores', () => {
    const messenger = new Messenger();
    const exampleStore = new ObservableStore();
    const exampleController = new ExampleController({
      messenger,
    });
    const oldExampleController = new OldExampleController();
    exampleStore.putState('state');
    exampleController.updateBar('state');
    oldExampleController.updateBaz('state');
    const store = new ComposableObservableStore({
      controllerMessenger: messenger,
    });

    store.updateStructure({
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
    const messenger = new Messenger();
    const exampleStore = new ObservableStore();
    exampleStore.putState(false);
    const store = new ComposableObservableStore({
      controllerMessenger: messenger,
    });

    store.updateStructure({
      Example: exampleStore,
    });

    expect(store.getState()).toStrictEqual({
      Example: false,
    });
  });

  it('should strip non-persisted state from initial state with all three types of stores', () => {
    const messenger = new Messenger();
    const exampleStore = new ObservableStore();
    const exampleController = new ExampleController({
      messenger,
    });
    const oldExampleController = new OldExampleController();
    exampleStore.putState('state');
    exampleController.updateBar('state');
    oldExampleController.updateBaz('state');
    const store = new ComposableObservableStore({
      controllerMessenger: messenger,
      persist: true,
    });

    store.updateStructure({
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

  it('should return flattened state', () => {
    const messenger = new Messenger();
    const fooStore = new ObservableStore({ foo: 'foo' });
    const barController = new ExampleController({
      messenger,
    });
    const bazController = new OldExampleController();
    const store = new ComposableObservableStore({
      config: {
        FooStore: fooStore,
        BarStore: barController,
        BazStore: bazController,
      },
      controllerMessenger: messenger,
      state: {
        FooStore: fooStore.getState(),
        BarStore: barController.state,
        BazStore: bazController.state,
      },
    });
    expect(store.getFlatState()).toStrictEqual({
      foo: 'foo',
      bar: 'bar',
      baz: 'baz',
    });
  });

  it('should return empty flattened state when not configured', () => {
    const messenger = new Messenger();
    const store = new ComposableObservableStore({
      controllerMessenger: messenger,
    });
    expect(store.getFlatState()).toStrictEqual({});
  });

  it('should throw if the controller messenger is omitted and the config includes a BaseControllerV2 controller', () => {
    const messenger = new Messenger();
    const exampleController = new ExampleController({
      messenger,
    });
    expect(
      () =>
        new ComposableObservableStore({
          config: {
            Example: exampleController,
          },
        }),
    ).toThrow(`Cannot read properties of undefined (reading 'subscribe')`);
  });

  it('should throw if the controller messenger is omitted and updateStructure called with a BaseControllerV2 controller', () => {
    const messenger = new Messenger();
    const exampleController = new ExampleController({
      messenger,
    });
    const store = new ComposableObservableStore({});
    expect(() => store.updateStructure({ Example: exampleController })).toThrow(
      `Cannot read properties of undefined (reading 'subscribe')`,
    );
  });

  it('should throw if initialized with undefined config entry', () => {
    const messenger = new Messenger();
    expect(
      () =>
        new ComposableObservableStore({
          config: {
            Example: undefined,
          },
          controllerMessenger: messenger,
        }),
    ).toThrow(`Undefined 'Example'`);
  });
});

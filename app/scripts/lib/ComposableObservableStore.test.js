import { ObservableStore } from '@metamask/obs-store';
import { BaseController } from '@metamask/base-controller';
import { MOCK_ANY_NAMESPACE, Messenger } from '@metamask/messenger';
import ComposableObservableStore from './ComposableObservableStore';

const getMessenger = () => {
  return new Messenger({
    namespace: MOCK_ANY_NAMESPACE,
  });
};

class ExampleController extends BaseController {
  static defaultState = {
    bar: 'bar',
    baz: 'baz',
  };

  static metadata = {
    bar: { persist: true, includeInDebugSnapshot: true },
    baz: { persist: false, includeInDebugSnapshot: true },
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

  updateBaz(contents) {
    this.update((state) => {
      state.baz = contents;
    });
  }

  replaceState(state) {
    this.update(() => state);
  }

  updatePropertyMissingFromMetadata(contents) {
    this.update((state) => {
      state.missing = contents;
    });
  }
}

describe('ComposableObservableStore', () => {
  it('should register initial state', () => {
    const messenger = getMessenger();
    const store = new ComposableObservableStore({
      controllerMessenger: messenger,
      state: 'state',
    });
    expect(store.getState()).toStrictEqual('state');
  });

  it('should register initial structure', () => {
    const messenger = getMessenger();
    const testStore = new ObservableStore();
    const store = new ComposableObservableStore({
      config: { TestStore: testStore },
      controllerMessenger: messenger,
    });
    testStore.putState('state');
    expect(store.getState()).toStrictEqual({ TestStore: 'state' });
  });

  it('should update structure with observable store', () => {
    const messenger = getMessenger();
    const testStore = new ObservableStore();
    const store = new ComposableObservableStore({
      controllerMessenger: messenger,
    });
    store.updateStructure({ TestStore: testStore });
    testStore.putState('state');
    expect(store.getState()).toStrictEqual({ TestStore: 'state' });
  });

  it('should update structure with BaseController-based controller', () => {
    const messenger = getMessenger();
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
    const messenger = getMessenger();
    const exampleStore = new ObservableStore();
    const exampleController = new ExampleController({
      messenger,
    });
    const store = new ComposableObservableStore({
      controllerMessenger: messenger,
    });
    store.updateStructure({
      Example: exampleController,
      Store: exampleStore,
    });
    exampleStore.putState('state');
    exampleController.updateBar('state');
    expect(store.getState()).toStrictEqual({
      Example: { bar: 'state', baz: 'baz' },
      Store: 'state',
    });
  });

  it('should initialize state with all three types of stores', () => {
    const messenger = getMessenger();
    const exampleStore = new ObservableStore();
    const exampleController = new ExampleController({
      messenger,
    });
    exampleStore.putState('state');
    exampleController.updateBar('state');
    const store = new ComposableObservableStore({
      controllerMessenger: messenger,
    });

    store.updateStructure({
      Example: exampleController,
      Store: exampleStore,
    });

    expect(store.getState()).toStrictEqual({
      Example: { bar: 'state', baz: 'baz' },
      Store: 'state',
    });
  });

  it('should initialize falsy state', () => {
    const messenger = getMessenger();
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

  describe('not persist', () => {
    it('should emit state change when any state changes', () => {
      const messenger = getMessenger();
      const exampleController = new ExampleController({
        messenger,
      });
      const store = new ComposableObservableStore({
        controllerMessenger: messenger,
      });
      store.updateStructure({
        Example: exampleController,
      });
      const onStateChange = jest.fn();
      store.subscribe(onStateChange);

      exampleController.updateBar('update');
      exampleController.updateBaz('update');

      expect(onStateChange).toHaveBeenCalledTimes(2);
      expect(onStateChange).toHaveBeenNthCalledWith(1, {
        Example: { bar: 'update', baz: 'baz' },
      });
      expect(onStateChange).toHaveBeenNthCalledWith(2, {
        Example: { bar: 'update', baz: 'update' },
      });
    });

    it('includes patches in state change event', () => {
      const messenger = getMessenger();
      const exampleController = new ExampleController({
        messenger,
      });
      const store = new ComposableObservableStore({
        controllerMessenger: messenger,
      });
      store.updateStructure({
        Example: exampleController,
      });
      const onStateChange = jest.fn();
      store.on('stateChange', onStateChange);

      exampleController.updateBar('update');

      expect(onStateChange).toHaveBeenCalledWith({
        controllerKey: 'Example',
        newState: { bar: 'update', baz: 'baz' },
        oldState: { bar: 'bar', baz: 'baz' },
        patches: [
          {
            op: 'replace',
            path: ['bar'],
            value: 'update',
          },
        ],
      });
    });
  });

  describe('persisted', () => {
    it('should emit state change with just persisted state', () => {
      const messenger = getMessenger();
      const exampleController = new ExampleController({
        messenger,
      });
      const store = new ComposableObservableStore({
        controllerMessenger: messenger,
        persist: true,
      });
      store.updateStructure({
        Example: exampleController,
      });
      const onStateChange = jest.fn();
      store.subscribe(onStateChange);

      exampleController.updateBar('update');

      expect(onStateChange).toHaveBeenCalledWith({
        Example: { bar: 'update' },
      });
    });

    it('should emit state change when there is a complete state replacement', () => {
      const messenger = getMessenger();
      const exampleController = new ExampleController({
        messenger,
      });
      const store = new ComposableObservableStore({
        controllerMessenger: messenger,
        persist: true,
      });
      store.updateStructure({
        Example: exampleController,
      });
      const onStateChange = jest.fn();
      store.subscribe(onStateChange);

      exampleController.replaceState({ baz: 'update', bar: 'update' });

      expect(onStateChange).toHaveBeenCalledWith({
        Example: { bar: 'update' },
      });
    });

    it('should emit state change when there is an update to a property missing from metadata', () => {
      const messenger = getMessenger();
      const exampleController = new ExampleController({
        messenger,
      });
      const store = new ComposableObservableStore({
        controllerMessenger: messenger,
        persist: true,
      });
      store.updateStructure({
        Example: exampleController,
      });
      const onStateChange = jest.fn();
      store.subscribe(onStateChange);

      exampleController.updatePropertyMissingFromMetadata('update');

      expect(onStateChange).toHaveBeenCalledWith({
        Example: { bar: 'bar' },
      });
    });

    it('should not emit state change when only non-persisted state changes', () => {
      const messenger = getMessenger();
      const exampleController = new ExampleController({
        messenger,
      });
      const store = new ComposableObservableStore({
        controllerMessenger: messenger,
        persist: true,
      });
      store.updateStructure({
        Example: exampleController,
      });
      const onStateChange = jest.fn();
      store.subscribe(onStateChange);

      exampleController.updateBaz('update');

      expect(onStateChange).not.toHaveBeenCalled();
    });

    it('should strip non-persisted state from initial state with all three types of stores', () => {
      const messenger = getMessenger();
      const exampleStore = new ObservableStore();
      const exampleController = new ExampleController({
        messenger,
      });
      exampleStore.putState('state');
      exampleController.updateBar('state');
      const store = new ComposableObservableStore({
        controllerMessenger: messenger,
        persist: true,
      });

      store.updateStructure({
        Example: exampleController,
        Store: exampleStore,
      });

      expect(store.getState()).toStrictEqual({
        Example: { bar: 'state' },
        Store: 'state',
      });
    });

    it('includes patches in state change event', () => {
      const messenger = getMessenger();

      const exampleController = new ExampleController({
        messenger,
      });

      const store = new ComposableObservableStore({
        controllerMessenger: messenger,
        persist: true,
      });

      store.updateStructure({
        Example: exampleController,
      });

      const onStateChange = jest.fn();
      store.on('stateChange', onStateChange);

      exampleController.updateBar('update');

      expect(onStateChange).toHaveBeenCalledWith({
        controllerKey: 'Example',
        newState: { bar: 'update' },
        oldState: { bar: 'bar' },
        patches: [
          {
            op: 'replace',
            path: ['bar'],
            value: 'update',
          },
        ],
      });
    });
  });

  it('should return flattened state', () => {
    const messenger = getMessenger();
    const fooStore = new ObservableStore({ foo: 'foo' });
    const barController = new ExampleController({
      messenger,
    });
    const store = new ComposableObservableStore({
      config: {
        FooStore: fooStore,
        BarStore: barController,
      },
      controllerMessenger: messenger,
      state: {
        FooStore: fooStore.getState(),
        BarStore: barController.state,
      },
    });
    expect(store.getFlatState()).toStrictEqual({
      foo: 'foo',
      bar: 'bar',
      baz: 'baz',
    });
  });

  it('should return empty flattened state when not configured', () => {
    const messenger = getMessenger();
    const store = new ComposableObservableStore({
      controllerMessenger: messenger,
    });
    expect(store.getFlatState()).toStrictEqual({});
  });

  it('updates flattened state incrementally and keeps controller priority', () => {
    const messenger = getMessenger();
    const firstStore = new ObservableStore({
      shared: 'first',
      onlyFirst: 'only-first',
    });
    const secondStore = new ObservableStore({
      shared: 'second',
      onlySecond: 'only-second',
    });
    const store = new ComposableObservableStore({
      controllerMessenger: messenger,
    });

    store.updateStructure({
      First: firstStore,
      Second: secondStore,
    });

    expect(store.getFlatState()).toStrictEqual({
      shared: 'second',
      onlyFirst: 'only-first',
      onlySecond: 'only-second',
    });

    firstStore.putState({
      shared: 'updated-first',
      onlyFirst: 'only-first',
    });

    expect(store.getFlatState()).toStrictEqual({
      shared: 'second',
      onlyFirst: 'only-first',
      onlySecond: 'only-second',
    });

    secondStore.putState({
      onlySecond: 'only-second',
    });

    expect(store.getFlatState()).toStrictEqual({
      shared: 'updated-first',
      onlyFirst: 'only-first',
      onlySecond: 'only-second',
    });
  });

  it('should throw if the controller messenger is omitted and the config includes a BaseControllerV2 controller', () => {
    const messenger = getMessenger();
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
    const messenger = getMessenger();
    const exampleController = new ExampleController({
      messenger,
    });
    const store = new ComposableObservableStore({});
    expect(() => store.updateStructure({ Example: exampleController })).toThrow(
      `Cannot read properties of undefined (reading 'subscribe')`,
    );
  });

  it('should throw if initialized with undefined config entry', () => {
    const messenger = getMessenger();
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

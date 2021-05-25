import { strict as assert } from 'assert';
import { ObservableStore } from '@metamask/obs-store';
import {
  BaseController,
  BaseControllerV2,
  ControllerMessenger,
} from '@metamask/controllers';
import ComposableObservableStore from './ComposableObservableStore';

class OldExampleController extends BaseController {
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
class ExampleController extends BaseControllerV2 {
  static defaultState = {
    bar: 'bar',
  };

  static metadata = {
    bar: { persist: true, anonymous: true },
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
    this.update(() => {
      return { bar: contents };
    });
  }
}

describe('ComposableObservableStore', function () {
  it('should register initial state', function () {
    const controllerMessenger = new ControllerMessenger();
    const store = new ComposableObservableStore({
      controllerMessenger,
      state: 'state',
    });
    assert.strictEqual(store.getState(), 'state');
  });

  it('should register initial structure', function () {
    const controllerMessenger = new ControllerMessenger();
    const testStore = new ObservableStore();
    const store = new ComposableObservableStore({
      config: { TestStore: testStore },
      controllerMessenger,
    });
    testStore.putState('state');
    assert.deepEqual(store.getState(), { TestStore: 'state' });
  });

  it('should update structure with observable store', function () {
    const controllerMessenger = new ControllerMessenger();
    const testStore = new ObservableStore();
    const store = new ComposableObservableStore({ controllerMessenger });
    store.updateStructure({ TestStore: testStore });
    testStore.putState('state');
    assert.deepEqual(store.getState(), { TestStore: 'state' });
  });

  it('should update structure with BaseController-based controller', function () {
    const controllerMessenger = new ControllerMessenger();
    const oldExampleController = new OldExampleController();
    const store = new ComposableObservableStore({ controllerMessenger });
    store.updateStructure({ OldExample: oldExampleController });
    oldExampleController.updateBaz('state');
    assert.deepEqual(store.getState(), { OldExample: { baz: 'state' } });
  });

  it('should update structure with BaseControllerV2-based controller', function () {
    const controllerMessenger = new ControllerMessenger();
    const exampleController = new ExampleController({
      messenger: controllerMessenger,
    });
    const store = new ComposableObservableStore({ controllerMessenger });
    store.updateStructure({ Example: exampleController });
    exampleController.updateBar('state');
    console.log(exampleController.state);
    assert.deepEqual(store.getState(), { Example: { bar: 'state' } });
  });

  it('should update structure with all three types of stores', function () {
    const controllerMessenger = new ControllerMessenger();
    const exampleStore = new ObservableStore();
    const exampleController = new ExampleController({
      messenger: controllerMessenger,
    });
    const oldExampleController = new OldExampleController();
    const store = new ComposableObservableStore({ controllerMessenger });
    store.updateStructure({
      Example: exampleController,
      OldExample: oldExampleController,
      Store: exampleStore,
    });
    exampleStore.putState('state');
    exampleController.updateBar('state');
    oldExampleController.updateBaz('state');
    assert.deepEqual(store.getState(), {
      Example: { bar: 'state' },
      OldExample: { baz: 'state' },
      Store: 'state',
    });
  });

  it('should return flattened state', function () {
    const controllerMessenger = new ControllerMessenger();
    const fooStore = new ObservableStore({ foo: 'foo' });
    const barController = new ExampleController({
      messenger: controllerMessenger,
    });
    const bazController = new OldExampleController();
    const store = new ComposableObservableStore({
      config: {
        FooStore: fooStore,
        BarStore: barController,
        BazStore: bazController,
      },
      controllerMessenger,
      state: {
        FooStore: fooStore.getState(),
        BarStore: barController.state,
        BazStore: bazController.state,
      },
    });
    assert.deepEqual(store.getFlatState(), {
      foo: 'foo',
      bar: 'bar',
      baz: 'baz',
    });
  });

  it('should return empty flattened state when not configured', function () {
    const controllerMessenger = new ControllerMessenger();
    const store = new ComposableObservableStore({ controllerMessenger });
    assert.deepEqual(store.getFlatState(), {});
  });

  it('should throw if the controller messenger is omitted and the config includes a BaseControllerV2 controller', function () {
    const controllerMessenger = new ControllerMessenger();
    const exampleController = new ExampleController({
      messenger: controllerMessenger,
    });
    assert.throws(
      () =>
        new ComposableObservableStore({
          config: {
            Example: exampleController,
          },
        }),
    );
  });

  it('should throw if the controller messenger is omitted and updateStructure called with a BaseControllerV2 controller', function () {
    const controllerMessenger = new ControllerMessenger();
    const exampleController = new ExampleController({
      messenger: controllerMessenger,
    });
    const store = new ComposableObservableStore({});
    assert.throws(() => store.updateStructure({ Example: exampleController }));
  });

  it('should throw if initialized with undefined config entry', function () {
    const controllerMessenger = new ControllerMessenger();
    assert.throws(
      () =>
        new ComposableObservableStore({
          config: {
            Example: undefined,
          },
          controllerMessenger,
        }),
    );
  });
});

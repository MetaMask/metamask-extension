import assert from 'assert';
import { ObservableStore } from '@metamask/obs-store';
import ComposableObservableStore from './ComposableObservableStore';

describe('ComposableObservableStore', function () {
  it('should register initial state', function () {
    const store = new ComposableObservableStore('state');
    assert.strictEqual(store.getState(), 'state');
  });

  it('should register initial structure', function () {
    const testStore = new ObservableStore();
    const store = new ComposableObservableStore(null, { TestStore: testStore });
    testStore.putState('state');
    assert.deepEqual(store.getState(), { TestStore: 'state' });
  });

  it('should update structure', function () {
    const testStore = new ObservableStore();
    const store = new ComposableObservableStore();
    store.updateStructure({ TestStore: testStore });
    testStore.putState('state');
    assert.deepEqual(store.getState(), { TestStore: 'state' });
  });

  it('should return flattened state', function () {
    const fooStore = new ObservableStore({ foo: 'foo' });
    const barStore = new ObservableStore({ bar: 'bar' });
    const store = new ComposableObservableStore(null, {
      FooStore: fooStore,
      BarStore: barStore,
    });
    assert.deepEqual(store.getFlatState(), { foo: 'foo', bar: 'bar' });
  });
});

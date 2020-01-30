const assert = require('assert')
const ComposableObservableStore = require('../../../app/scripts/lib/ComposableObservableStore')
const ObservableStore = require('obs-store')

describe('ComposableObservableStore', () => {
  it('should register initial state', () => {
    const store = new ComposableObservableStore('state')
    assert.strictEqual(store.getState(), 'state')
  })

  it('should register initial structure', () => {
    const testStore = new ObservableStore()
    const store = new ComposableObservableStore(null, { TestStore: testStore })
    testStore.putState('state')
    assert.deepEqual(store.getState(), { TestStore: 'state' })
  })

  it('should update structure', () => {
    const testStore = new ObservableStore()
    const store = new ComposableObservableStore()
    store.updateStructure({ TestStore: testStore })
    testStore.putState('state')
    assert.deepEqual(store.getState(), { TestStore: 'state' })
  })

  it('should return flattened state', () => {
    const fooStore = new ObservableStore({ foo: 'foo' })
    const barStore = new ObservableStore({ bar: 'bar' })
    const store = new ComposableObservableStore(null, {
      FooStore: fooStore,
      BarStore: barStore,
    })
    assert.deepEqual(store.getFlatState(), { foo: 'foo', bar: 'bar' })
  })
})

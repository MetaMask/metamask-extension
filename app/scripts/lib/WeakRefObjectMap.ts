type WeakRefCompatibleObject<T> = {
  [P in keyof T]: T[P] extends object ? WeakRef<T[P]> : never;
};

/**
 * `WeakRefObjectMap` is a custom map-like structure designed to hold key-value pairs where the values are objects.
 * Unlike a standard `Map`, this implementation stores each property of the value objects as weak references.
 * This means that the properties of the objects are not prevented from being garbage collected when there are no other
 * references to them outside of this map.
 *
 * It is important to note that while the map itself behaves similarly to a standard `Map`, the weak references apply
 * to each property of the objects stored as values. This means that individual properties of these objects may become
 * unavailable (i.e., garbage collected) independently of one another. Users of this map should be prepared to handle
 * cases where a property's value has been collected and is therefore `undefined`.
 *
 * This class was implemented to help with memory management of network client proxies used by the SelectedNetworkController
 * to keep per domain selected networks in sync. The properties of the NetworkClient object (provider and blockTracker) are weakly
 * referenced so that they can be garbage collected if/when a dapp connection ends without effective cleanup.
 */
export class WeakRefObjectMap implements Map<string, object> {
  /**
   * Internal map to store keys and their corresponding weakly referenced object values.
   */
  map: Map<string, WeakRefCompatibleObject<Record<string, object>>>;

  constructor() {
    this.map = new Map();
  }

  /**
   * Associates a key with a value in the map. If the key already exists, its associated value is updated.
   * The values are stored as weak references.
   *
   * @param key - The key under which to store the value.
   * @param value - The value to store under the specified key. Must be an object.
   * @returns The `WeakRefObjectMap` instance.
   */
  set(key: string, value: Record<string, object>): this {
    const weakReffedValueObj: WeakRefCompatibleObject<Record<string, object>> =
      {};
    Object.keys(value).forEach((valueKey) => {
      weakReffedValueObj[valueKey] = new WeakRef(value[valueKey]);
    });
    this.map.set(key, weakReffedValueObj);
    return this;
  }

  /**
   * Retrieves the value associated with the specified key. The value is dereferenced before being returned.
   * If the key does not exist or the value has been garbage collected, `undefined` is returned.
   *
   * @param key - The key whose associated value is to be returned.
   * @returns The dereferenced value associated with the key, or `undefined`.
   */
  get(key: string): { [dereffedValueObjKey: string]: object } | undefined {
    const weakReffedValue = this.map.get(key);
    if (!weakReffedValue) {
      return undefined;
    }

    const dereffedValue: { [dereffedValueObjKey: string]: object } = {};
    for (const weakReffedValueKey of Object.keys(weakReffedValue)) {
      const deref = weakReffedValue[weakReffedValueKey].deref();
      if (deref === undefined) {
        this.map.delete(weakReffedValueKey);
        return undefined;
      }
      dereffedValue[weakReffedValueKey] = deref;
    }

    return dereffedValue;
  }

  /**
   * Checks whether the map contains the specified key.
   *
   * @param key - The key to check for presence in the map.
   * @returns `true` if the map contains the key, otherwise `false`.
   */
  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  /**
   * Removes the specified key and its associated value from the map.
   *
   * @param key - The key to remove along with its associated value.
   * @returns `true` if the element was successfully removed, otherwise `false`.
   */
  delete(key: string): boolean {
    const value = this.get(key);
    if (value !== undefined) {
      return this.map.delete(key);
    }
    return false;
  }

  /**
   * Removes all key-value pairs from the map.
   */
  clear() {
    this.map.clear();
  }

  /**
   * Returns the number of key-value pairs present in the map.
   */
  get size(): number {
    return this.map.size;
  }

  /**
   * Returns a new iterator object that contains an array of `[key, value]` for each element in the map.
   * The values are dereferenced before being returned.
   */
  entries(): IterableIterator<[string, object]> {
    const entries: [string, object][] = [];
    this.map.forEach((_, key) => {
      const derefValue = this.get(key);
      if (derefValue !== undefined) {
        entries.push([key, derefValue]);
      }
    });
    return entries.values();
  }

  /**
   * Returns a new iterator object that contains the keys for each element in the map.
   */
  keys(): IterableIterator<string> {
    return this.map.keys();
  }

  /**
   * Returns a new iterator object that contains the values for each element in the map.
   * The values are dereferenced before being returned.
   */
  values(): IterableIterator<object> {
    const values: object[] = [];
    this.map.forEach((_, key) => {
      const derefValue = this.get(key);
      if (derefValue !== undefined) {
        values.push(derefValue);
      }
    });
    return values.values();
  }

  /**
   * Returns a new iterator object that contains an array of `[key, value]` for each element in the map,
   * making the map itself iterable.
   */
  [Symbol.iterator](): IterableIterator<[string, object]> {
    return this.entries();
  }

  /**
   * Returns a string representing the map. This is used when converting the map to a string,
   * e.g., by `Object.prototype.toString`.
   */
  get [Symbol.toStringTag](): string {
    return 'WeakRefObjectMap';
  }

  /**
   * Executes a provided function once for each key-value pair in the map, in insertion order.
   * Note that the values passed to the callback function are the `WeakRefCompatibleObject`s,
   * not the dereferenced objects. This allows consumers to manage dereferencing according to their needs,
   * acknowledging that some references may have been garbage collected.
   *
   * @param callback - Function to execute for each element, taking three arguments:
   * - `value`: The value part of the key-value pair. Note that this is the weakly referenced object,
   * encapsulated within a `WeakRefCompatibleObject`, allowing for manual dereferencing.
   * -`key`: The key part of the key-value pair.
   * - `map`: The `WeakRefObjectMap` instance that the `forEach` method was called on.
   * @param thisArg - Optional. Value to use as `this` when executing `callback`.
   */
  forEach(
    callback: (
      value: WeakRefCompatibleObject<Record<string, object>>,
      key: string,
      map: Map<string, WeakRefCompatibleObject<Record<string, object>>>,
    ) => void,
    // this is an unbound method, so the this value is unknown.
    // Also the Map type this is based on uses any for this parameter as well.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    thisArg?: any,
  ): void {
    this.map.forEach((value, key) => {
      if (thisArg) {
        callback.call(thisArg, value, key, this.map);
      } else {
        callback(value, key, this.map);
      }
    });
  }
}

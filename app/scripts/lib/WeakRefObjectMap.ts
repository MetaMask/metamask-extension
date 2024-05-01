type WeakRefObject<RecordType extends Record<string, object>> = {
  [P in keyof RecordType]: WeakRef<RecordType[P]>;
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

export class WeakRefObjectMap<RecordType extends Record<string, object>>
  implements Map<string, RecordType>
{
  /**
   * Internal map to store keys and their corresponding weakly referenced object values.
   */
  private map: Map<string, WeakRefObject<RecordType>>;

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
  set(key: string, value: RecordType): this {
    const weakRefValue: Partial<WeakRefObject<RecordType>> = {};
    for (const keyValue in value) {
      if (!Object.hasOwn(value, keyValue)) {
        continue;
      }
      const item: RecordType[typeof keyValue] = value[keyValue];
      if (typeof item === 'object' && item !== null) {
        weakRefValue[keyValue] = new WeakRef(item);
      } else {
        throw new Error(
          `Property ${String(
            keyValue,
          )} is not an object and cannot be weakly referenced.`,
        );
      }
    }
    this.map.set(key, weakRefValue as WeakRefObject<RecordType>);
    return this;
  }

  /**
   * Retrieves the value associated with the specified key. The value is dereferenced before being returned.
   * If the key does not exist or the value has been garbage collected, `undefined` is returned.
   *
   * @param key - The key whose associated value is to be returned.
   * @returns The dereferenced value associated with the key, or `undefined`.
   */
  get(key: string): RecordType | undefined {
    const weakRefValue = this.map.get(key);
    if (!weakRefValue) {
      return undefined;
    }

    const deRefValue: Partial<RecordType> = {};
    for (const keyValue in weakRefValue) {
      if (!Object.hasOwn(weakRefValue, keyValue)) {
        continue;
      }
      const deref = weakRefValue[keyValue].deref();
      if (deref === undefined) {
        this.map.delete(key);
        return undefined;
      }
      deRefValue[keyValue] = deref;
    }

    return deRefValue as RecordType;
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
  entries(): IterableIterator<[string, RecordType]> {
    const entries: [string, RecordType][] = [];
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
  values(): IterableIterator<RecordType> {
    const values: RecordType[] = [];
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
  [Symbol.iterator](): IterableIterator<[string, RecordType]> {
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
   * Note that the values passed to the callback function are the `WeakRefObject`s,
   * not the dereferenced objects. This allows consumers to manage dereferencing according to their needs,
   * acknowledging that some references may have been garbage collected.
   *
   * @param callback - Function to execute for each element, taking three arguments:
   * - `value`: The value part of the key-value pair. Note that this is the weakly referenced object,
   * encapsulated within a `WeakRefObject`, allowing for manual dereferencing.
   * -`key`: The key part of the key-value pair.
   * - `map`: The `WeakRefObjectMap` instance that the `forEach` method was called on.
   * @param thisArg - Optional. Value to use as `this` when executing `callback`.
   */
  forEach(
    callback: (
      value: RecordType,
      key: string,
      map: Map<string, RecordType>,
    ) => void,
    // this is an unbound method, so the this value is unknown.
    // Also the Map type this is based on uses any for this parameter as well.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    thisArg?: any,
  ): void {
    this.map.forEach((_, key) => {
      const deRefValue = this.get(key);
      if (deRefValue === undefined) {
        return;
      }
      if (thisArg) {
        callback.call(thisArg, deRefValue, key, this);
      } else {
        callback(deRefValue, key, this);
      }
    });
  }
}

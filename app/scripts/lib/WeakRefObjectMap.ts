type WeakEntry<RecordType extends Record<string, object>> = {
  keys: (keyof RecordType)[];
  refs: WeakRef<RecordType[keyof RecordType]>[]; // aligned with keys
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
  private readonly map = new Map<string, WeakEntry<RecordType>>();

  /**
   * Associates a key with a value in the map. If the key already exists, its associated value is updated.
   * The values are stored as weak references.
   *
   * @param key - The key under which to store the value.
   * @param value - The value to store under the specified key. Must be an object.
   * @returns The `WeakRefObjectMap` instance.
   */
  set(key: string, value: RecordType): this {
    const keys = Object.keys(value) as (keyof RecordType)[];
    const n = keys.length;
    const refs = new Array<WeakRef<RecordType[keyof RecordType]>>(n);

    for (let i = 0; i < n; i++) {
      const prop = keys[i];
      const item = value[prop];

      if (typeof item !== 'object' || item === null) {
        throw new TypeError(
          `Property ${String(prop)} is not an object and cannot be weakly referenced.`,
        );
      }

      refs[i] = new WeakRef(item);
    }

    this.map.set(key, { keys, refs });
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
    return this.derefEntryOrDelete(key, weakRefValue);
  }

  /**
   * Checks whether the map contains the specified key.
   *
   * @param key - The key to check for presence in the map.
   * @returns `true` if the map contains the key, otherwise `false`.
   */
  has(key: string): boolean {
    const entry = this.map.get(key);
    if (!entry) {
      return false;
    }
    return this.isLiveOrDelete(key, entry);
  }

  /**
   * Removes the specified key and its associated value from the map.
   *
   * @param key - The key to remove along with its associated value.
   * @returns `true` if the element was successfully removed, otherwise `false`.
   */
  delete(key: string): boolean {
    const entry = this.map.get(key);
    if (!entry) {
      return false;
    }

    // keep delete semantics aligned with has/get: stale entries are treated as
    // non-existent and are pruned eagerly.
    if (!this.isLiveOrDelete(key, entry)) {
      return false;
    }

    this.map.delete(key);
    // explicitly return `true` for clarity, as we know at this point the key
    // existed, was "live", and has now been deleted from the map.
    return true;
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
    // make sure we return the correct size by pruning any dead entries first
    this.pruneAllDead();
    return this.map.size;
  }

  /**
   * Returns a new iterator object that contains an array of `[key, value]` for each element in the map.
   * The values are dereferenced before being returned.
   */
  entries(): MapIterator<[string, RecordType]> {
    const it = this.map[Symbol.iterator]();

    return this.createMapIterator(
      (): IteratorResult<[string, RecordType]> => {
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const n = it.next();
          if (n.done) {
            return { done: true, value: undefined };
          }

          const [key, entry] = n.value;
          const value = this.derefEntryOrDelete(key, entry);
          if (value !== undefined) {
            return { done: false, value: [key, value] };
          }
          // dead entry got pruned; continue
        }
      },
      () => it.return?.(),
    );
  }

  /**
   * Returns a new iterator object that contains the keys for each element in the map.
   */
  keys(): MapIterator<string> {
    const it = this.map[Symbol.iterator]();

    return this.createMapIterator(
      (): IteratorResult<string> => {
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const n = it.next();
          if (n.done) {
            return { done: true, value: undefined };
          }

          const [key, entry] = n.value;
          if (this.isLiveOrDelete(key, entry)) {
            return { done: false, value: key };
          }
          // dead entry got pruned; continue
        }
      },
      () => it.return?.(),
    );
  }

  /**
   * Returns a new iterator object that contains the values for each element in
   * the map. The values are dereferenced before being returned.
   */
  values(): MapIterator<RecordType> {
    const it = this.map[Symbol.iterator]();

    return this.createMapIterator(
      (): IteratorResult<RecordType> => {
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const n = it.next();
          if (n.done) {
            return { done: true, value: undefined };
          }

          const [key, entry] = n.value;
          const value = this.derefEntryOrDelete(key, entry);
          if (value !== undefined) {
            return { done: false, value };
          }
          // dead entry got pruned; continue
        }
      },
      () => it.return?.(),
    );
  }

  /**
   * Returns a new iterator object that contains an array of `[key, value]` for each element in the map,
   * making the map itself iterable.
   */
  [Symbol.iterator](): MapIterator<[string, RecordType]> {
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
   * Executes a provided function once for each key-value pair in the map. The
   * values are dereferenced before being passed to the callback. If a value has
   * been garbage collected, its entry is pruned and the callback is not called
   * for that entry.
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
    // This is an unbound method, so the this value is unknown. This matches the
    // signature of `Map.forEach`, which also uses `any` for this parameter.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    thisArg?: any,
  ): void {
    const useThisArg = arguments.length > 1;

    for (const [key, entry] of this.map) {
      const value = this.derefEntryOrDelete(key, entry);
      if (value === undefined) {
        continue;
      }

      if (useThisArg) {
        Reflect.apply(callback, thisArg, [value, key, this]);
      } else {
        callback(value, key, this);
      }
    }
  }

  /**
   * Checks if the entry for the given key is still live (i.e., all weak
   * references are still valid) or deletes it if any reference has been
   * collected.
   *
   * @param key - The key of the entry to check.
   * @param entry - The entry to check.
   * @returns `true` if the entry is still live, `false` if it was deleted.
   */
  private isLiveOrDelete(key: string, entry: WeakEntry<RecordType>): boolean {
    const { refs } = entry;
    for (let i = 0, n = refs.length; i < n; i++) {
      if (refs[i].deref() === undefined) {
        this.map.delete(key);
        return false;
      }
    }
    return true;
  }

  /**
   * Dereferences the entry for the given key. If any reference has been
   * collected, the entry is deleted and `undefined` is returned.
   *
   * @param key - The key of the entry to dereference.
   * @param entry - The entry to dereference.
   * @returns The dereferenced value if all references are still valid, or
   * `undefined` if the entry was deleted due to collected references.
   */
  private derefEntryOrDelete(
    key: string,
    entry: WeakEntry<RecordType>,
  ): RecordType | undefined {
    const { keys, refs } = entry;

    const out: Partial<RecordType> = Object.create(null);
    for (let i = 0, n = keys.length; i < n; i++) {
      const prop = keys[i];
      const v = refs[i].deref();
      if (v === undefined) {
        this.map.delete(key);
        return undefined;
      }
      out[prop] = v as RecordType[typeof prop];
    }
    return out as RecordType;
  }

  /**
   * Prunes all entries in the map that have had any of their weak references
   * collected. This is used to ensure that the `size` property reflects only
   * live entries.
   */
  private pruneAllDead(): void {
    for (const [key, entry] of this.map) {
      this.isLiveOrDelete(key, entry);
    }
  }

  /**
   * Creates a `MapIterator`.
   *
   * @param next - The `next` method for the iterator, which should return the next value in the iteration sequence.
   * @param onDispose - A callback function that is called when the iterator is disposed, allowing for any necessary cleanup.
   */
  private createMapIterator<IteratorValueType>(
    next: () => IteratorResult<IteratorValueType>,
    onDispose: () => void,
  ): MapIterator<IteratorValueType> {
    return {
      [Symbol.iterator]() {
        return this;
      },
      next,
      [Symbol.dispose]() {
        onDispose();
      },
    };
  }
}

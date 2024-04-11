type WeakRefCompatibleObject<T> = {
  [P in keyof T]: T[P] extends object ? WeakRef<T[P]> : never;
};

export class WeakRefObjectMap implements Map<string, object> {
  map: Map<string, WeakRefCompatibleObject<Record<string, object>>>;

  constructor() {
    this.map = new Map();
  }

  set(key: string, value: Record<string, object>): this {
    const weakReffedValueObj: WeakRefCompatibleObject<Record<string, object>> =
      {};
    Object.keys(value).forEach((valueKey) => {
      weakReffedValueObj[valueKey] = new WeakRef(value[valueKey]);
    });
    this.map.set(key, weakReffedValueObj);
    return this;
  }

  get(key: string) {
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

  has(key: string) {
    return this.get(key) !== undefined;
  }

  delete(key: string) {
    const value = this.get(key);
    if (value !== undefined) {
      return this.map.delete(key);
    }
    return false;
  }

  clear() {
    this.map.clear();
  }

  get size(): number {
    return this.map.size;
  }

  entries(): IterableIterator<[string, object]> {
    const entries: Array<[string, object]> = [];
    this.map.forEach((value, key) => {
      const derefValue = this.get(key);
      if (derefValue !== undefined) {
        entries.push([key, derefValue]);
      }
    });
    return entries.values();
  }

  keys(): IterableIterator<string> {
    return this.map.keys();
  }

  values(): IterableIterator<object> {
    const values: Array<object> = [];
    this.map.forEach((_, key) => {
      const derefValue = this.get(key);
      if (derefValue !== undefined) {
        values.push(derefValue);
      }
    });
    return values.values();
  }

  [Symbol.iterator](): IterableIterator<[string, object]> {
    return this.entries();
  }

  get [Symbol.toStringTag](): string {
    return "WeakRefObjectMap";
  }

  forEach(
    callback: (
      value: WeakRefCompatibleObject<Record<string, object>>,
      key: string,
      map: Map<string, WeakRefCompatibleObject<Record<string, object>>>,
    ) => void,
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

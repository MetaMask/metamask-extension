type WeakReffedValueObj = {
  [key: string]: WeakRef<WeakKey>;
};
export class WeakDomainProxyMap {
  map: Map<string, WeakReffedValueObj>;

  constructor() {
    this.map = new Map();
  }

  set(
    key: string,
    value: {
      [key: string]: object;
    },
  ) {
    const weakReffedValueObj = {} as WeakReffedValueObj;
    Object.keys(value).forEach((valueKey) => {
      weakReffedValueObj[valueKey] = new WeakRef(value[valueKey]);
    });
    this.map.set(key, weakReffedValueObj);
  }

  get(key: string) {
    const weakReffedValue = this.map.get(key) as WeakReffedValueObj | undefined;
    if (!weakReffedValue) {
      return undefined;
    }

    const deReffedValue = {} as { [dereffedValueObjKey: string]: WeakKey };
    for (const weakReffedValueKey of Object.keys(weakReffedValue)) {
      const deref = weakReffedValue[weakReffedValueKey].deref();
      if (deref === undefined) {
        this.map.delete(weakReffedValueKey);
        return undefined;
      }
      deReffedValue[weakReffedValueKey] = deref;
    }

    return deReffedValue;
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
}

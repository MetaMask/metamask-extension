export class WeakStringMap {
  map: Map<string, WeakRef<WeakKey>>;

  constructor() {
    this.map = new Map();
  }

  set(key: string, value: any) {
    const weakReffedValue = {} as any
    Object.keys(value).forEach((key) => {
      weakReffedValue[key] = new WeakRef(value[key])
    })
    this.map.set(key, weakReffedValue);
  }

  get(key: string) {
    const weakReffedValue = this.map.get(key) as any;
    if (!weakReffedValue) {
      return undefined;
    }

    const deReffedValue = {} as any
    Object.keys(weakReffedValue).forEach((key) => {
      const deref = weakReffedValue[key].deref()
      if (deref === undefined) {
        this.map.delete(key)
        return undefined
      }
      deReffedValue[key] = deref
    })

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
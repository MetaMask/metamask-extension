export class WeakStringMap {
  map: Map<string, WeakRef<WeakKey>>;

  constructor() {
    this.map = new Map();
  }

  set(key: string, value: object) {
    const ref = new WeakRef(value);
    this.map.set(key, ref);
  }

  get(key: string) {
    const ref = this.map.get(key);
    if (!ref) {
      return undefined;
    }

    const value = ref.deref();
    if (value === undefined) {
      this.map.delete(key);
    }
    return value;
  }

  has(key: string) {
    return this.get(key) !== undefined;
  }

  delete(key: string) {
    return this.map.delete(key);
  }

  clear() {
    this.map.clear();
  }
}

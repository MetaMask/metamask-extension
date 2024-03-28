export class WeakStringMap {
  map: Map<string, WeakRef<WeakKey>>;

  finalizationRegistry: FinalizationRegistry<string>;

  constructor() {
    this.map = new Map();
    this.finalizationRegistry = new FinalizationRegistry((key: string) => {
      if (!this.map.get(key)?.deref()) {
        this.map.delete(key);
      }
    });
  }

  set(key: string, value: object) {
    const ref = new WeakRef(value);
    this.map.set(key, ref);

    this.finalizationRegistry.register(value, key);
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
    const value = this.get(key);
    if (value !== undefined) {
      this.finalizationRegistry.unregister(value);
      return this.map.delete(key);
    }
    return false;
  }

  clear() {
    this.map.clear();
  }
}

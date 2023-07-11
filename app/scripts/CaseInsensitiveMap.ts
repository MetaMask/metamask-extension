export class CaseInsensitiveMap<T> extends Map<string, T> {
  static fromObject<T>(obj: Record<string, T>): CaseInsensitiveMap<T> {
    return new CaseInsensitiveMap(Object.entries(obj));
  }

  toObject(): Record<string, T> {
    return Object.fromEntries(this.entries());
  }

  get(key: string): T | undefined {
    return super.get(key.toLowerCase());
  }

  has(key: string): boolean {
    return super.has(key.toLowerCase());
  }

  set(key: string, value: T): this {
    return super.set(key.toLowerCase(), value);
  }

  delete(key: string): boolean {
    return super.delete(key.toLowerCase());
  }
}

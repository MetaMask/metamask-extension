declare module 'await-semaphore' {
  export class Mutex {
    constructor();
    acquire(): Promise<() => void>;
    use(
      fn: () => Promise<void>,
    ): Promise<void>;
  }
}

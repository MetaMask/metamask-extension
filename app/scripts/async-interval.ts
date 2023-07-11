class SelfIncrementMap<T> extends Map<number, T> {
  key = 0;

  add(value: T): number {
    while (this.has(this.key)) {
      this.key += 1;
    }
    this.set(this.key, value);
    return this.key;
  }
}

const runJob = new SelfIncrementMap<boolean>();

async function runAsyncInterval(
  callback: () => Promise<void>,
  delay: number,
  id: number,
): Promise<void> {
  if (runJob.get(id)) {
    await callback();
    setTimeout(() => {
      runAsyncInterval(callback, delay, id);
    }, delay);
  }
}

export function setAsyncInterval(
  callback: () => Promise<void>,
  delay: number,
): number {
  const id = runJob.add(true);
  runAsyncInterval(callback, delay, id);
  return id;
}

export function clearAsyncInterval(id: number): void {
  runJob.delete(id);
}

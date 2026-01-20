export type ConsoleErrorEntry = {
  timestamp: number;
  message: string;
  source: string;
};

export class ConsoleErrorBuffer {
  private readonly maxEntries: number;

  private entries: ConsoleErrorEntry[] = [];

  constructor(maxEntries: number) {
    this.maxEntries = maxEntries;
  }

  add(entry: ConsoleErrorEntry): void {
    this.entries.push(entry);
    if (this.entries.length > this.maxEntries) {
      this.entries.shift();
    }
  }

  getAll(): ConsoleErrorEntry[] {
    return [...this.entries];
  }

  getRecent(count: number): ConsoleErrorEntry[] {
    if (count <= 0) {
      return [];
    }

    return this.entries.slice(-count);
  }

  get size(): number {
    return this.entries.length;
  }
}

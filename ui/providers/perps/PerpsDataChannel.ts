/**
 * PerpsDataChannel - Generic cached data channel with BehaviorSubject-like behavior
 *
 * Key features:
 * - Caches the last known data
 * - Returns cached data SYNCHRONOUSLY when subscribe() is called
 * - Manages WebSocket connection lifecycle
 * - Supports prewarm to keep data fresh
 *
 * This is the core primitive that enables navigation between Perps views
 * without showing loading skeletons (matching mobile UX).
 */

export type PerpsDataChannelOptions<TData> = {
  /** Function to connect to the data source (returns unsubscribe function) */
  connectFn: (callback: (data: TData) => void) => () => void;
  /** Initial/default value when no cache exists */
  initialValue: TData;
  /** Debug name for logging */
  name?: string;
};

export class PerpsDataChannel<TData> {
  private cache: TData;

  private readonly initialValue: TData;

  private subscribers = new Map<string, (data: TData) => void>();

  private unsubscribeFromSource: (() => void) | null = null;

  private isConnected = false;

  private connectFn: ((callback: (data: TData) => void) => () => void) | null =
    null;

  private prewarmUnsubscribe: (() => void) | null = null;

  private readonly name: string;

  constructor(options: PerpsDataChannelOptions<TData>) {
    this.initialValue = options.initialValue;
    this.cache = options.initialValue;
    this.connectFn = options.connectFn;
    this.name = options.name ?? 'unnamed';
  }

  /**
   * Update the connect function (called when controller is initialized)
   *
   * @param connectFn - The connect function
   */
  setConnectFn(
    connectFn: (callback: (data: TData) => void) => () => void,
  ): void {
    this.connectFn = connectFn;
  }

  /**
   * Subscribe to data updates.
   *
   * KEY BEHAVIOR: If cached data exists, the callback is fired IMMEDIATELY
   * with the cached value (synchronously, before returning).
   *
   * @param callback - Function to call with data updates
   * @returns Unsubscribe function
   */
  subscribe(callback: (data: TData) => void): () => void {
    const id = crypto.randomUUID();
    this.subscribers.set(id, callback);

    // KEY: Immediate callback with cached data (BehaviorSubject pattern)
    // This is what eliminates the loading skeleton on navigation
    if (this.hasCachedData()) {
      callback(this.cache);
    }

    // Connect to source if first subscriber and not already connected
    if (!this.isConnected && this.connectFn) {
      this.connect();
    }

    return () => {
      this.subscribers.delete(id);
      // Disconnect if no subscribers (but keep cache!)
      if (this.subscribers.size === 0 && !this.prewarmUnsubscribe) {
        this.disconnect();
      }
    };
  }

  /**
   * Get the cached data (or initial value if no data received yet)
   */
  getCachedData(): TData {
    return this.cache;
  }

  /**
   * Check if we have received real data (not just initial value)
   * Uses reference equality to check if cache has been updated
   */
  hasCachedData(): boolean {
    return this.cache !== this.initialValue;
  }

  /**
   * Clear the cache back to initial value
   * Called on account/network change
   */
  clearCache(): void {
    this.cache = this.initialValue;
  }

  /**
   * Manually push data into the channel (bypasses WebSocket).
   * Used after REST API calls to immediately reflect changes
   * while waiting for WebSocket to catch up.
   *
   * This is useful when:
   * - An API call succeeds but WebSocket hasn't pushed the update yet
   * - You want to show confirmed data immediately without waiting for stream
   *
   * @param data - The data to push into the cache and notify subscribers
   */
  pushData(data: TData): void {
    this.cache = data;
    this.subscribers.forEach((callback) => {
      callback(data);
    });
  }

  /**
   * Prewarm: Start a subscription that keeps the channel connected
   * and cache updated, even when no UI components are subscribed.
   *
   * @returns Cleanup function to stop prewarming
   */
  prewarm(): () => void {
    if (this.prewarmUnsubscribe) {
      // Already prewarming
      return this.prewarmUnsubscribe;
    }

    // Subscribe with a no-op callback just to keep connection alive
    // eslint-disable-next-line no-empty-function, @typescript-eslint/no-empty-function
    const unsubscribe = this.subscribe(() => {});

    this.prewarmUnsubscribe = () => {
      unsubscribe();
      this.prewarmUnsubscribe = null;
    };

    return this.prewarmUnsubscribe;
  }

  /**
   * Check if channel is currently prewarming
   */
  isPrewarming(): boolean {
    return this.prewarmUnsubscribe !== null;
  }

  /**
   * Connect to the data source
   */
  private connect(): void {
    if (this.isConnected || !this.connectFn) {
      return;
    }

    this.isConnected = true;

    this.unsubscribeFromSource = this.connectFn((data: TData) => {
      // Update cache
      this.cache = data;

      // Notify all subscribers
      this.subscribers.forEach((callback) => {
        callback(data);
      });
    });
  }

  /**
   * Disconnect from the data source (but keep cache!)
   */
  private disconnect(): void {
    if (!this.isConnected) {
      return;
    }

    if (this.unsubscribeFromSource) {
      this.unsubscribeFromSource();
      this.unsubscribeFromSource = null;
    }

    this.isConnected = false;
    // NOTE: We do NOT clear the cache here - it persists for next navigation
  }

  /**
   * Force disconnect and clear (used on account/network change)
   */
  reset(): void {
    this.disconnect();
    this.clearCache();
    if (this.prewarmUnsubscribe) {
      this.prewarmUnsubscribe();
    }
  }
}

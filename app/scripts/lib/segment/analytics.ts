import removeSlash from 'remove-trailing-slash';
import looselyValidate from '@segment/loosely-validate-event';
import { isString } from 'lodash';
import isRetryAllowed from 'is-retry-allowed';
import { generateRandomId } from '../util';

const noop = () => ({});

type AnalyticsCallback = (err?: Error, data?: FlushData) => void;

type QueueItem = {
  message: AnalyticsMessage;
  callback: AnalyticsCallback;
};

type FlushData = {
  batch: AnalyticsMessage[];
  timestamp: Date;
  sentAt: Date;
};

type AnalyticsMessage = {
  type?: string;
  context?: {
    library?: {
      name: string;
    };
    [key: string]: unknown;
  };
  timestamp?: Date;
  messageId?: string;
  anonymousId?: unknown;
  userId?: unknown;
  [key: string]: unknown;
};

type AnalyticsOptions = {
  flushAt?: number;
  flushInterval?: number;
  host?: string;
};

type RequestBody = {
  method: string;
  body: string;
  headers: Record<string, string>;
};

type RetryableError = {
  response?: Response;
  code?: string;
};

// Method below is inspired from axios-retry https://github.com/softonic/axios-retry
function isNetworkError(error: RetryableError): boolean {
  return (
    !error.response &&
    Boolean(error.code) && // Prevents retrying cancelled requests
    error.code !== 'ECONNABORTED' && // Prevents retrying timed out requests
    isRetryAllowed(error as Error)
  ); // Prevents retrying unsafe errors
}

export default class Analytics {
  writeKey: string;

  host: string;

  flushInterval: number;

  flushAt: number;

  queue: QueueItem[];

  path: string;

  maxQueueSize: number;

  flushed: boolean;

  retryCount: number;

  enable!: boolean;

  timer: ReturnType<typeof setTimeout> | null;

  /**
   * Initialize a new `Analytics` with Segment project's `writeKey` and an
   * optional dictionary of `options`.
   *
   * @param writeKey - The Segment project write key.
   * @param options - Optional configuration options.
   * @param options.flushAt - Number of events to queue before flushing (default: 20).
   * @param options.flushInterval - Interval in ms between flushes (default: 10000).
   * @param options.host - The Segment API host (default: 'https://api.segment.io').
   */
  constructor(writeKey: string, options: AnalyticsOptions = {}) {
    this.writeKey = writeKey;

    this.host = removeSlash(options.host || 'https://api.segment.io');
    this.flushInterval = options.flushInterval || 10000;
    this.flushAt =
      options.flushAt === undefined ? 20 : Math.max(options.flushAt, 1);

    this.queue = [];
    this.path = '/v1/batch';
    this.maxQueueSize = 1024 * 450;
    this.flushed = false;
    this.retryCount = 3;
    this.timer = null;

    Object.defineProperty(this, 'enable', {
      configurable: false,
      writable: false,
      enumerable: true,
      value: true,
    });
  }

  _validate(message: AnalyticsMessage, type: string): void {
    looselyValidate(message as Record<string, unknown>, type);
  }

  _message(
    type: string,
    message: AnalyticsMessage,
    callback?: AnalyticsCallback,
  ): this {
    this._validate(message, type);
    this.enqueue(type, message, callback);
    return this;
  }

  /**
   * Send an identify `message`.
   *
   * @param message - The identify message payload.
   * @param callback - Optional callback invoked after the event is flushed.
   * @returns The Analytics instance.
   */
  identify(message: AnalyticsMessage, callback?: AnalyticsCallback): this {
    return this._message('identify', message, callback);
  }

  /**
   * Send a track `message`.
   *
   * @param message - The track message payload.
   * @param callback - Optional callback invoked after the event is flushed.
   * @returns The Analytics instance.
   */
  track(message: AnalyticsMessage, callback?: AnalyticsCallback): this {
    return this._message('track', message, callback);
  }

  /**
   * Send a page `message`.
   *
   * @param message - The page message payload.
   * @param callback - Optional callback invoked after the event is flushed.
   * @returns The Analytics instance.
   */
  page(message: AnalyticsMessage, callback?: AnalyticsCallback): this {
    return this._message('page', message, callback);
  }

  /**
   * Add a `message` of type `type` to the queue and
   * check whether it should be flushed.
   *
   * @param type - The type of the message (e.g. 'track', 'identify', 'page').
   * @param msg - The message payload.
   * @param callback - Optional callback invoked after the event is flushed.
   */
  enqueue(
    type: string,
    msg: AnalyticsMessage,
    callback: AnalyticsCallback = noop,
  ): void {
    if (!this.enable) {
      setImmediate(callback);
      return;
    }

    const message: AnalyticsMessage = { ...msg, type };

    // Specifying library here helps segment to understand structure of request.
    // Currently segment seems to support these source libraries only.
    message.context = {
      ...message.context,
      library: {
        name: 'analytics-node',
      },
    };

    if (!message.timestamp) {
      message.timestamp = new Date();
    }

    if (!message.messageId) {
      message.messageId = generateRandomId();
    }

    if (message.anonymousId && !isString(message.anonymousId)) {
      message.anonymousId = JSON.stringify(message.anonymousId);
    }
    if (message.userId && !isString(message.userId)) {
      message.userId = JSON.stringify(message.userId);
    }
    this.queue.push({ message, callback });

    if (!this.flushed) {
      this.flushed = true;
      this.flush();
      return;
    }

    const hasReachedFlushAt = this.queue.length >= this.flushAt;
    const hasReachedQueueSize =
      this.queue.reduce((acc, item) => acc + JSON.stringify(item).length, 0) >=
      this.maxQueueSize;
    if (hasReachedFlushAt || hasReachedQueueSize) {
      this.flush();
    }

    if (this.flushInterval && !this.timer) {
      this.timer = setTimeout(this.flush.bind(this), this.flushInterval);
    }
  }

  /**
   * Flush the current queue
   *
   * @param callback - Optional callback invoked after the queue is flushed.
   * @returns A promise that resolves when the flush is complete.
   */
  flush(callback: AnalyticsCallback = noop): Promise<void> | undefined {
    if (!this.enable) {
      setImmediate(callback);
      return Promise.resolve();
    }

    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    if (!this.queue.length) {
      setImmediate(callback);
      return Promise.resolve();
    }

    const items = this.queue.splice(0, this.flushAt);
    const callbacks = items.map((item) => item.callback);
    const messages = items.map((item) => item.message);

    const data: FlushData = {
      batch: messages,
      timestamp: new Date(),
      sentAt: new Date(),
    };

    const done = (err?: Error) => {
      setImmediate(() => {
        callbacks.forEach((fn) => fn(err, data));
        callback(err, data);
      });
    };

    const headers: Record<string, string> = {
      Authorization: `Basic ${Buffer.from(this.writeKey, 'utf8').toString(
        'base64',
      )}`,
    };

    return this._sendRequest(
      `${this.host}${this.path}`,
      {
        method: 'POST',
        body: JSON.stringify(data),
        headers,
      },
      done,
      0,
    );
  }

  _retryRequest(
    url: string,
    body: RequestBody,
    done: (err?: Error) => void,
    retryNo: number,
  ): void {
    const delay = Math.pow(2, retryNo) * 100;
    setTimeout(() => {
      this._sendRequest(url, body, done, retryNo + 1);
    }, delay);
  }

  async _sendRequest(
    url: string,
    body: RequestBody,
    done: (err?: Error) => void,
    retryNo: number,
  ): Promise<void> {
    return fetch(url, body)
      .then(async (response) => {
        if (response.ok) {
          done();
        } else if (
          this._isErrorRetryable({ response }) &&
          retryNo <= this.retryCount
        ) {
          this._retryRequest(url, body, done, retryNo);
        } else {
          const error = new Error(response.statusText);
          done(error);
        }
      })
      .catch((error: Error) => {
        if (
          this._isErrorRetryable(error as RetryableError) &&
          retryNo <= this.retryCount
        ) {
          this._retryRequest(url, body, done, retryNo);
        } else {
          done(error);
        }
      });
  }

  _isErrorRetryable(error: RetryableError): boolean {
    // Retry Network Errors.
    if (isNetworkError(error)) {
      return true;
    }

    if (!error.response) {
      // Cannot determine if the request can be retried
      return false;
    }

    // Retry Server Errors (5xx).
    if (error.response.status >= 500 && error.response.status <= 599) {
      return true;
    }

    // Retry if rate limited.
    if (error.response.status === 429) {
      return true;
    }

    return false;
  }
}

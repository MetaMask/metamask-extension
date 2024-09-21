import removeSlash from 'remove-trailing-slash';
import looselyValidate from '@segment/loosely-validate-event';
import { isString } from 'lodash';
import isRetryAllowed from 'is-retry-allowed';
import { generateRandomId } from '../util';

const noop = () => ({});

// Method below is inspired from axios-retry https://github.com/softonic/axios-retry
function isNetworkError(error) {
  return (
    !error.response &&
    Boolean(error.code) && // Prevents retrying cancelled requests
    error.code !== 'ECONNABORTED' && // Prevents retrying timed out requests
    isRetryAllowed(error)
  ); // Prevents retrying unsafe errors
}

export default class Analytics {
  /**
   * Initialize a new `Analytics` with Segment project's `writeKey` and an
   * optional dictionary of `options`.
   *
   * @param {string} writeKey
   * @param {object} [options] - (optional)
   * @property {number} [flushAt] (default: 20)
   * @property {number} [flushInterval] (default: 10000)
   * @property {string} [host] (default: 'https://api.segment.io')
   */
  constructor(writeKey, options = {}) {
    this.writeKey = writeKey;

    this.host = removeSlash(options.host || 'https://api.segment.io');
    this.flushInterval = options.flushInterval || 10000;
    this.flushAt = options.flushAt || Math.max(options.flushAt, 1) || 20;

    this.queue = [];
    this.path = '/v1/batch';
    this.maxQueueSize = 1024 * 450;
    this.flushed = false;
    this.retryCount = 3;

    Object.defineProperty(this, 'enable', {
      configurable: false,
      writable: false,
      enumerable: true,
      value: true,
    });
  }

  _validate(message, type) {
    looselyValidate(message, type);
  }

  _message(type, message, callback) {
    this._validate(message, type);
    this.enqueue(type, message, callback);
    return this;
  }

  /**
   * Send an identify `message`.
   *
   * @param {object} message
   * @param {Function} [callback] - (optional)
   * @returns {Analytics}
   */
  identify(message, callback) {
    return this._message('identify', message, callback);
  }

  /**
   * Send a track `message`.
   *
   * @param {object} message
   * @param {Function} [callback] - (optional)
   * @returns {Analytics}
   */
  track(message, callback) {
    return this._message('track', message, callback);
  }

  /**
   * Send a page `message`.
   *
   * @param {object} message
   * @param {Function} [callback] - (optional)
   * @returns {Analytics}
   */
  page(message, callback) {
    return this._message('page', message, callback);
  }

  /**
   * Add a `message` of type `type` to the queue and
   * check whether it should be flushed.
   *
   * @param {string} type
   * @param {object} msg
   * @param {Function} [callback] - (optional)
   */
  enqueue(type, msg, callback = noop) {
    if (!this.enable) {
      setImmediate(callback);
      return;
    }

    const message = { ...msg, type };

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
   * @param {Function} [callback] - (optional)
   */
  flush(callback = noop) {
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

    const data = {
      batch: messages,
      timestamp: new Date(),
      sentAt: new Date(),
    };

    const done = (err) => {
      setImmediate(() => {
        callbacks.forEach((fn) => fn(err, data));
        callback(err, data);
      });
    };

    const headers = {
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

  _retryRequest(url, body, done, retryNo) {
    const delay = Math.pow(2, retryNo) * 100;
    setTimeout(() => {
      this._sendRequest(url, body, done, retryNo + 1);
    }, delay);
  }

  async _sendRequest(url, body, done, retryNo) {
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
      .catch((error) => {
        if (this._isErrorRetryable(error) && retryNo <= this.retryCount) {
          this._retryRequest(url, body, done, retryNo);
        } else {
          done(error);
        }
      });
  }

  _isErrorRetryable(error) {
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

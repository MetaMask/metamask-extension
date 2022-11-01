import EventEmitter from 'events';
import { isFunction, pullAllBy, throttle } from 'lodash';
import nanoid from 'nanoid';
import { isManifestV3 } from 'shared/modules/mv3.utils';
import {
  HARDWARE_KEYRING_INIT_OPTS,
  HARDWARE_KEYRINGS,
} from 'shared/constants/hardware-wallets';
import { MILLISECOND } from 'shared/constants/time';

/**
 * Determines if error is provoked by manifest v3 changes,
 * e.g. WebUSB incompatibility, WebHID incompatibility,
 * and general DOM access.
 *
 * @param {Error} error - The error to check.
 * @returns {boolean}
 */
const isServiceWorkerMv3Error = (error) => {
  // @TODO, hacky as the MV3 error could be captured and rethrown with a user-set
  // error message. Assess whether we should just only check if it's MV3.

  const isUserSet = Boolean(error.cause);

  if (!isManifestV3 || isUserSet) {
    return false;
  }

  if (error instanceof ReferenceError) {
    const message = error.message.toLowerCase();

    if (message.includes('navigator.usb')) {
      return true;
    }

    if (message.includes('navigator.hid')) {
      return true;
    }

    if (message.includes('document is not defined')) {
      return true;
    }
  }

  return false;
};

/**
 * Returns methods contained in instanstiated classes
 * without the constructor method.
 *
 * @param classInstance
 * @returns {string[]}
 */
const getClassInstanceMethods = (classInstance) =>
  Object.getOwnPropertyNames(Object.getPrototypeOf(classInstance)).filter(
    (method) => method !== 'constructor',
  );

export default class KeyringEventsController extends EventEmitter {
  constructor({ sendPromisifiedClientAction }) {
    super();
    this.eventPool = [];
    this.sendPromisifiedClientAction = sendPromisifiedClientAction;
    this.keyrings = this._getKeyrings();

    // use _.throttle to clear the eventPool every X milliseconds, as there
    // are some limitations as there are some limitations in various browsers
    // based on how often we can emit RPC events.
    this._sendEvents = throttle(this.__sendEvents, 10 * MILLISECOND);
  }

  /**
   * Gets keyring based on manifest version.
   *
   * NOTE: If MV3, a function constructor (not a class) is returned in order
   * to pass data from this context to the HardwareKeyringWrapper instantiation.
   *
   * @returns {[Proxy]|[Keyring]}
   */
  _getKeyrings = () => {
    if (this.keyrings) {
      return this.keyrings;
    }

    // ... otherwise, construct the keyrings
    if (!isManifestV3) {
      return HARDWARE_KEYRINGS;
    }

    const wrappedKeyrings = HARDWARE_KEYRINGS.map((Keyring) =>
      this._wrapKeyring(Keyring),
    );

    return wrappedKeyrings;
  };

  /**
   * Return a proxy within a proxy:
   * This is necessary, as we need to proxy the class
   * to override the constructor while still returning
   * static fields. But we also need an additional proxy
   * of the instance.
   *
   * @param Keyring
   * @returns Proxy<Keyring>
   */
  _wrapKeyring = (Keyring) => {
    const proxy = new Proxy(Keyring, {
      construct: (Target, args) => {
        // Attach arguments that prevent MV3 errors from being thrown immediately
        const newArgs = [
          { ...args[0], ...HARDWARE_KEYRING_INIT_OPTS },
          ...args.slice(1),
        ];
        const instance = new Target(...newArgs);

        // Create an additional proxy, this time for the instance
        // Ensure that a new proxy is created upon every 'new' call
        // of the Keyring's class (i.e., this execution context)
        const instanceProxy = this._getKeyringInstanceProxy(instance);

        if (instanceProxy.init) {
          // ... then call the wrapped version of the method.
          // important distinction, as non-wrapped version
          // will always error.
          instanceProxy.init();
        }

        return instanceProxy;
      },
    });

    return proxy;
  };

  /**
   * Wraps all functions of a keyring instance in a proxy
   * with an error handler.
   *
   * @param {Keyring} instance
   * @private
   */
  _getKeyringInstanceProxy(instance) {
    const keyringInstanceProxy = new Proxy(instance, {
      get: (target, prop) => {
        if (isFunction(target[prop])) {
          const wrappedFunction = (...args) => {
            return this._catchKeyringMethodErrors(target, prop, args);
          };

          return wrappedFunction;
        }

        return target[prop];
      },
    });

    return keyringInstanceProxy;
  }

  /**
   * Adds a failed keyring call to the event pool.
   *
   * @param opts
   * @param {keyring} opts.keyring
   * @param {string|number|symbol} opts.method
   * @param {*[]} opts.args - The arguments passed to the method
   * @param opts.prevState - The state that the client-side should use
   * @param {string} opts.type - The type of keyring
   * @param {(value: *) => void} opts.resolve
   * @param {(value: *) => void} opts.reject
   * @private
   */
  _addToEventPool = ({
    keyring,
    method,
    args,
    prevState,
    type,
    resolve,
    reject,
  }) => {
    this.eventPool.push({
      payload: {
        keyring,
        method,
        args,
        type,
        prevState,
        createdAt: new Date().toISOString(),
      },
      resolve,
      reject,
      id: nanoid(),
    });

    this._sendEvents();
  };

  /**
   * Wraps a keyring-wrapped-method's resolve, allowing
   * us to update the state of the keyring background-side.
   *
   * @param {keyring} keyring
   * @param {(value: *) => void} resolve
   * @private
   */
  _resolveWrapper =
    (keyring, resolve) =>
    async ({ newState, response }) => {
      await keyring.deserialize(newState);

      resolve(response);
    };

  /**
   * Catches errors thrown by keyring methods. If the error is
   * due to MV3 then the error is added to the event pool and the
   * promise stays open until it's resolved client-side.
   *
   * @param {keyring} keyring
   * @param {string|symbol|number} method
   * @param {*[]} args
   * @private
   */
  _catchKeyringMethodErrors = async (keyring, method, args) => {
    // @TODO, delay this function .serialize call until there are no
    // remaining pending promises in the event pool
    const prevState = await keyring.serialize();

    try {
      // Technically this .bind is superfluous but is included for clarity.
      // In the following call stack of this method call, it will only call
      // non-wrapped methods. This is intentional.
      const res = await keyring[method].bind(keyring)(...args);

      return res;
    } catch (e) {
      console.log(isServiceWorkerMv3Error(e), e.cause);

      // if error is due to mv3 then re-open promise
      if (isServiceWorkerMv3Error(e)) {
        const res = await new Promise((resolve, reject) => {
          this._addToEventPool({
            type: this.type,
            method, // @TODO, create a test for calling a symbol method
            args,
            prevState,
            resolve: this._resolveWrapper(keyring, resolve),
            reject, // if rejected again then just allow for error to be thrown
          });
          // Allow promise to hang as it will be resolved by the event pool
        });

        return res;
      }

      // ... otherwise, rethrow error
      throw e;
    }
  };

  /**
   * NOTE: only to be called by _sendEvents
   *
   * Given that multiple threads can interact with this class
   * ensure eventIds are tracked upon each call, so that the
   * eventPool can be cleared precisely, instead of
   *
   * @private
   */
  __sendEvents = () => {
    const sentEvents = [];

    for (const event of this.eventPool) {
      this.sendPromisifiedClientAction(event.payload)
        .then(event.resolve)
        .catch(event.reject);

      sentEvents.push(event);
    }

    this._clearEventPool(sentEvents);
  };

  /**
   * Clears the event pool of events that have been sent.
   *
   * @param {{id: string}[]} sentEvents
   * @private
   */
  _clearEventPool(sentEvents) {
    this.eventPool = pullAllBy(this.eventPool, sentEvents, 'id');
  }
}

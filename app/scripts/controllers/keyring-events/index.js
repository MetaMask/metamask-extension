import EventEmitter from 'events';
import { differenceWith, isFunction } from 'lodash';
import nanoid from 'nanoid';
import { isManifestV3 } from '../../../../shared/modules/mv3.utils';
import {
  HARDWARE_KEYRING_INIT_OPTS,
  HARDWARE_KEYRINGS,
} from '../../../../shared/constants/hardware-wallets';
import { getHardwareMethodHandler } from './handlers';

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

/**
 * Returns true if text resembles MV3 error message.
 *
 * @param {string} _text
 * @returns {boolean}
 */
const isMv3ErrorMessage = (_text) => {
  const text = _text.toLowerCase();
  const mv3ErrorText = [
    'navigator.usb',
    'navigator.hid',
    'document is not defined',
  ];

  return mv3ErrorText.some((errorText) => text.includes(errorText));
};

/**
 * Determines if error is provoked by manifest v3 changes,
 * e.g. WebUSB incompatibility, WebHID incompatibility,
 * and general DOM access.
 *
 * @param {Error} error - The error to check.
 * @returns {boolean}
 */
const isServiceWorkerMv3Error = (error) => {
  console.error('isServiceWorkerMv3Error', { error });

  const isFormOfError = error instanceof Error;
  if (!isManifestV3 || !isFormOfError) {
    return false;
  }

  const isUserSet = Boolean(error.cause);

  if (isUserSet) {
    return isMv3ErrorMessage(error.cause.message);
  }

  const errorText = error.message || error.stack || error.toString();

  return isMv3ErrorMessage(errorText);
};

export default class KeyringEventsController extends EventEmitter {
  constructor({ sendPromisifiedHardwareCall }) {
    super();
    this.eventPool = [];
    this.sendPromisifiedHardwareCall = sendPromisifiedHardwareCall;
    this.keyrings = this._getKeyrings();
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
        console.trace(`Constructing: ${Target.type}`, args);

        // Attach arguments that prevent MV3 errors from being thrown immediately
        const instance = new Target(
          { ...args[0], ...HARDWARE_KEYRING_INIT_OPTS },
          ...args.slice(1),
        );

        // Create an additional proxy, this time for the instance
        // Ensure that a new proxy is created upon every 'new' call
        // of the Keyring's class (i.e., this execution context)
        const instanceProxy = this._getKeyringInstanceProxy(instance);

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
      get: (keyring, prop) => {
        if (isFunction(keyring[prop])) {
          return (...args) => this._keyringMethodWrapper(keyring, prop, args);
        }

        return keyring[prop];
      },
    });

    return keyringInstanceProxy;
  }

  /**
   * Adds a failed keyring call to the `eventPool`.
   *
   * @param opts
   * @param {string|number|symbol} opts.method
   * @param {*[]} opts.args - The arguments passed to the method
   * @param opts.prevState - The state that the client-side should use
   * @param {string} opts.type - The type of keyring
   * @param {(value: *) => void} opts.resolve
   * @param {(value: *) => void} opts.reject
   * @private
   */
  _addToEventPool = ({ type, method, args, prevState, resolve, reject }) => {
    const { callSettings } = getHardwareMethodHandler(type, method);

    this.eventPool.push({
      payload: {
        method,
        args,
        type,
        prevState,
        createdAt: new Date().toISOString(),
        callSettings,
      },
      resolve,
      reject,
      id: nanoid(),
    });

    this._sendEvents();
  };

  /**
   * Wraps a keyring-wrapped-method's `resolve`, allowing
   * us to update the state of the keyring background-side
   * after a keyring method has been fired client-side.
   *
   * @param {*[]} args - The args which were first attempted to be used by the method
   * @param {Keyring} keyring
   * @param {string} method
   * @param {(value: *) => void} resolve
   * @private
   */
  _resolveWrapper =
    (args, keyring, method, resolve) =>
    async ({ newState, response: _response }) => {
      // Sync the state of the background-side keyring with client-side data
      const handler = getHardwareMethodHandler(keyring.type, method);

      await handler.backgroundSync(keyring, newState);
      const response = handler.clientResHandler(
        _response,
        args,
        keyring,
        method,
      );

      resolve(response);
    };

  /**
   * Catches errors thrown by keyring methods. If the error is
   * due to MV3 then the error is added to the event pool and the
   * promise stays open until it's resolved client-side.
   *
   * @param {Keyring} keyring
   * @param {string|symbol|number} method
   * @param {*[]} args
   * @private
   */
  _keyringMethodWrapper = async (keyring, method, args) => {
    // Ensure that we serialize the state before we try
    // to call the method in the background-script
    const prevState = await keyring.serialize();
    const handler = getHardwareMethodHandler(keyring.type, method);
    const forcefullySendToClient = handler.skipBackground || handler.updateAll;
    const clientSidePromise = () => {
      return this._createClientSidePromise(keyring, method, args, prevState);
    };

    if (forcefullySendToClient) {
      console.log(
        `💾🏹🖥️ Forcing client-side execution: ${keyring.type}.${method}`,
      );
      // Intentionally not wrapped in a try/catch
      const clientSideResult = await clientSidePromise();

      if (handler.skipBackground) {
        return clientSideResult;
      }
    }

    // ... otherwise, try to run the method in the background-script first
    try {
      // Technically this .bind is superfluous but is included for clarity.
      // In the following call stack of this method call, it will only call
      // non-wrapped methods. This is intentional.
      const res = await keyring[method].bind(keyring)(...args);

      console.log(
        `✅💾 Keyring method ${keyring.type}.${method} resolved`,
        args,
        res,
      );

      return res;
    } catch (e) {
      console.log(
        `❌💾 Keyring method ${keyring.type}.${method} resolved`,
        args,
        isServiceWorkerMv3Error(e),
      );

      // if error is due to mv3 then re-open the promise
      if (isServiceWorkerMv3Error(e)) {
        const clientSideResult = await clientSidePromise();

        return clientSideResult;
      }

      // ... otherwise, rethrow error
      throw e;
    }
  };

  /**
   * Creates a promise that will be only be resolved by
   * client-side instantiation of the specified keyring.
   *
   * @param {Keyring} keyring
   * @param {string|number|symbol} method
   * @param {*[]} _args
   * @param {object} prevState
   * @returns {Promise<unknown>}
   * @private
   */
  _createClientSidePromise(keyring, method, _args, prevState) {
    return new Promise((resolve, reject) => {
      console.log(`🏹💾 Sending method ${keyring.type}.${method}`, _args);
      const handler = getHardwareMethodHandler(keyring.type, method);
      const args = handler.clientArgsHandler(_args, keyring, method);

      this._addToEventPool({
        type: keyring.type,
        method,
        args,
        prevState,
        resolve: this._resolveWrapper(_args, keyring, method, resolve),
        reject, // if rejected again then just allow for error to be thrown
      });
      // Allow the promise to hang as it will be resolved by the event pool
    });
  }

  /**
   * Given that multiple threads can interact with this class
   * ensure eventIds are tracked upon each call, so that the
   * `eventPool` can be cleared precisely, instead of clearing
   * it in one go with something like `this.eventPool = []`
   *
   * @private
   */
  _sendEvents = () => {
    const sentEvents = [];

    for (const event of this.eventPool) {
      console.log('sending event', event);
      this.sendPromisifiedHardwareCall(event.payload)
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
    this.eventPool = differenceWith(
      this.eventPool,
      sentEvents,
      (a, b) => a.id === b.id,
    );
  }
}

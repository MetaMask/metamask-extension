import EventEmitter from 'events';
import { isFunction, noop, pullAllBy, throttle } from 'lodash';
import nanoid from 'nanoid';
import { isManifestV3 } from '../../../shared/modules/mv3.utils';
import {
  HARDWARE_KEYRING_INIT_OPTS,
  HARDWARE_KEYRINGS,
  KEYRING_TYPES,
} from '../../../shared/constants/hardware-wallets';
import { MILLISECOND } from '../../../shared/constants/time';

const ENFORCE_CLIENT_INVOCATION_METHODS = {
  [KEYRING_TYPES.TREZOR]: [
    'getFirstPage',
    'addAccounts',
    // TrezorKeyring.model isn't a part of serialised data returned
    // back-and-forth, therefore we defer to clientside for this
    // data, by intercepting TrezorKeyring.getModel
    'getModel',
  ],
  [KEYRING_TYPES.LEDGER]: [
    'updateTransportMethod',
    'getFirstPage',
    'addAccounts',
  ],
  [KEYRING_TYPES.QR]: [],
  [KEYRING_TYPES.LATTICE]: [],
};

const IGNORE_METHODS = {
  [KEYRING_TYPES.TREZOR]: ['init'],
  [KEYRING_TYPES.LEDGER]: ['init'],
  [KEYRING_TYPES.QR]: [],
  [KEYRING_TYPES.LATTICE]: [],
};

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
  // @TODO, hacky as the MV3 error could be captured and rethrown with a user-set
  // error message. Assess whether we should just only check if it's MV3.
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
  constructor({ sendPromisifiedHardwareCall }) {
    super();
    this.eventPool = [];
    this.sendPromisifiedHardwareCall = sendPromisifiedHardwareCall;
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
   * Adds a failed keyring call to the `eventPool`.
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
   * Wraps a keyring-wrapped-method's `resolve`, allowing
   * us to update the state of the keyring background-side
   * after a keyring method has been fired client-side.
   *
   * @param {keyring} keyring
   * @param {(value: *) => void} resolve
   * @private
   */
  _resolveWrapper =
    (keyring, resolve) =>
    async ({ newState, response }) => {
      await keyring.deserialize(newState);
      console.log('⬆️ State update for keyring', keyring.type, newState);

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

    const shouldAlwaysRunClientSide =
      ENFORCE_CLIENT_INVOCATION_METHODS[keyring.type]?.includes(method);
    const shouldIgnoreMethod = IGNORE_METHODS[keyring.type]?.includes(method);

    if (shouldIgnoreMethod) {
      return noop;
    }

    // Ensure that we serialize the state before we try
    // to call the method in the background-script
    const prevState = await keyring.serialize();
    const getClientSidePromise = () =>
      this._createClientSidePromise(keyring, method, args, prevState);

    if (shouldAlwaysRunClientSide) {
      const clientSideResult = await getClientSidePromise();

      return clientSideResult;
    }

    // ... otherwise, try to run the method in the background-script first
    try {
      // Technically this .bind is superfluous but is included for clarity.
      // In the following call stack of this method call, it will only call
      // non-wrapped methods. This is intentional.
      const res = await keyring[method].bind(keyring)(...args);

      console.log(
        `✅💾 Keyring method ${keyring.type}.${method} resolved`,
        res,
      );

      return res;
    } catch (e) {
      console.log(
        `❌💾 Keyring method ${keyring.type}.${method} resolved`,
        isServiceWorkerMv3Error(e),
      );

      // if error is due to mv3 then re-open the promise
      if (isServiceWorkerMv3Error(e)) {
        const clientSideResult = await getClientSidePromise();

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
   * @param keyring
   * @param method
   * @param args
   * @param prevState
   * @returns {Promise<unknown>}
   * @private
   */
  _createClientSidePromise(keyring, method, args, prevState) {
    return new Promise((resolve, reject) => {
      console.log(`🏹💾 Sending method ${keyring.type}.${method}`, args);

      this._addToEventPool({
        type: keyring.type,
        method, // @TODO, create a test for calling a symbol method
        args,
        prevState,
        resolve: this._resolveWrapper(keyring, resolve),
        reject, // if rejected again then just allow for error to be thrown
      });
      // Allow the promise to hang as it will be resolved by the event pool
    });
  }

  /**
   * NOTE: only to be called by `_sendEvents`
   *
   * Given that multiple threads can interact with this class
   * ensure eventIds are tracked upon each call, so that the
   * `eventPool` can be cleared precisely, instead of clearing
   * it in one go with something like `this.eventPool = []`
   *
   * @private
   */
  __sendEvents = () => {
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
    this.eventPool = pullAllBy(this.eventPool, sentEvents, 'id');
  }
}

import EventEmitter from 'events';
import { isFunction, isString, noop, pullAllBy, throttle } from 'lodash';
import nanoid from 'nanoid';
import { TransactionFactory } from '@ethereumjs/tx';
import { bufferToHex, toBuffer } from 'ethereumjs-util';
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
    'signTypedData',
    'addAccounts',
    'signTransaction',
    'signPersonalMessage',
    'signMessage',
    // TrezorKeyring.model isn't a part of serialised data returned
    // back-and-forth, therefore we defer to clientside for this
    // data, by intercepting TrezorKeyring.getModel
    'getModel',
  ],
  [KEYRING_TYPES.LEDGER]: [
    'updateTransportMethod',
    'signTypedData',
    'signTransaction',
    'signPersonalMessage',
    'signMessage',
    'getFirstPage',
    'addAccounts',
    'attemptMakeApp',
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
 * Some methods require args that can't be serialised appropriately
 * via JSON-RPC (i.e., via JSON.stringify). This method is used to
 * assist in the serialization process.
 *
 * @param {*[]} args
 * @param {Keyring} keyring
 * @param {string|number|symbol} method
 * @returns {*[]}
 */
const processClientArgs = (args, keyring, method) => {
  if (method === 'signTransaction') {
    console.log('processClientArgs', method, keyring.type);
    const [address, transaction] = args;
    const transactionHex = bufferToHex(transaction.serialize());
    const commonMeta = {
      chain: transaction.common.chainName(),
      hardfork: transaction.common.hardfork(),
      eips: transaction.common.eips(),
    };

    return [
      address,
      {
        transactionHex,
        commonMeta,
      },
      ...args.slice(2),
    ];
  }

  return args;
};

/**
 * Some client-side methods return responses that can't be serialised/deserialised
 * appropriately via JSON-RPC (i.e., via JSON.stringify). This method is used to
 * assist in the deserialization process.
 *
 * @param {*} response
 * @param {*[]} args - the args that were first passed to the background method
 * @param {Keyring} keyring
 * @param {string|number|symbol} method
 */
const processClientResponse = (response, args, keyring, method) => {
  if (method === 'signTransaction') {
    console.log('processClientResponse', method, keyring.type);
    // All Keyrings return a Transaction object client-side when signing a tx
    if (isString(response)) {
      const bufferData = toBuffer(response);
      const [, unsignedTx] = args;

      // recreate signed transaction
      return TransactionFactory.fromSerializedData(bufferData, {
        common: unsignedTx._getCommon(),
      });
    }

    throw new Error(
      'KeyringController - signTransaction - response is not a string',
    );
  }

  return response;
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
      get: (keyring, prop) => {
        if (isFunction(keyring[prop])) {
          const wrappedFunction = (...args) => {
            const shouldIgnoreMethod =
              IGNORE_METHODS[keyring.type]?.includes(prop);

            if (shouldIgnoreMethod) {
              return noop;
            }

            return this._catchKeyringMethodErrors(keyring, prop, args);
          };

          return wrappedFunction;
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
    this.eventPool.push({
      payload: {
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
   * @param {Keyring} keyring
   * @param {*[]} args - The args which were first attempted to be used by the method
   * @param method
   * @param {(value: *) => void} resolve
   * @private
   */
  _resolveWrapper =
    (args, keyring, method, resolve) =>
    async ({ newState, response: _response }) => {
      // Sync the state of the background-side keyring with client-side data
      await keyring.deserialize(newState);
      console.log('⬆️ State update for keyring', keyring.type, newState);
      const response = processClientResponse(_response, args, keyring, method);

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

    // Ensure that we serialize the state before we try
    // to call the method in the background-script
    const prevState = await keyring.serialize();
    const shouldAlwaysRunClientSide =
      ENFORCE_CLIENT_INVOCATION_METHODS[keyring.type]?.includes(method);

    const getClientSidePromise = () => {
      return this._createClientSidePromise(keyring, method, args, prevState);
    };

    if (shouldAlwaysRunClientSide) {
      // Intentionally not wrapped in a try/catch
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

      const args = processClientArgs(_args, keyring, method);

      this._addToEventPool({
        type: keyring.type,
        method, // @TODO, create a test for calling a symbol method
        args,
        prevState,
        resolve: this._resolveWrapper(_args, keyring, method, resolve),
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

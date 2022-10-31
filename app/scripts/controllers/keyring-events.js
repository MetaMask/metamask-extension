import EventEmitter from 'events';
import { throttle } from 'lodash';
import { isManifestV3 } from 'shared/modules/mv3.utils';
import {
  HARDWARE_KEYRING_INIT_OPTS,
  HARDWARE_KEYRINGS,
} from 'shared/constants/hardware-wallets';
import { MILLISECOND } from 'shared/constants/time';

const ADD_TO_EVENT_POOL = 'addToEventPool';

/**
 * Determines if error is provoked by manifest v3 changes,
 * e.g. WebUSB incompatibility, WebHID incompatibility,
 * and general DOM access.
 *
 * @param {Error} error - The error to check.
 * @returns {boolean}
 */
const isServiceWorkerMv3Error = (error) => {
  // @TODO, hacky as the MV3 error could be captured and rethrown with
  // different error message. Assess whether we should just only check if it's MV3

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

class HardwareKeyringWrapper extends EventEmitter {
  constructor(opts = {}, wrapperOpts = {}) {
    super();

    this.keyring = new wrapperOpts.Keyring({
      ...opts,
      // Pass these opts to prevent MV3 errors from
      // being thrown in the class's constructor
      ...HARDWARE_KEYRING_INIT_OPTS,
    });

    // implement all class methods
    const methods = getClassInstanceMethods(this.keyring);

    methods.forEach((method) => {
      if (!this[method]) {
        // only add the method if it isn't already wrapped
        this[method] = this.keyring[method].bind(this.keyring);
      }
    });

    // If keyring manually implements the .init method ...
    if (this.keyring.init) {
      this.init(); // ... then call the wrapped version of the method.
    }
  }

  resolveWrapper = (type, resolve) => (newState, res) => {
    // @TODO, update the state of keyring controller with clientside state
    // before finally resolving the promise

    resolve(res);
  };

  async wrapMethod(method, ...args) {
    if (!this.keyring[method]) {
      throw ReferenceError('Un-implemented method called');
    }

    const prevState = await this.keyring.serialize();

    try {
      const res = await this.keyring[method](...args);

      return res;
    } catch (e) {
      console.log(isServiceWorkerMv3Error(e), e.cause);

      // if error is due to mv3 then re-open promise
      const res = await new Promise((resolve, reject) => {
        this.emit(ADD_TO_EVENT_POOL, {
          type: this.type,
          method,
          args,
          prevState,
          resolve: this.resolveWrapper(this.type, resolve),
          reject,
        });
        // allow promise to hang as it will be resolved by the event pool
      });

      return res;
    }
  }

  // @TODO, dynamically wrap all methods?

  init(...args) {
    return this.wrapMethod('init', ...args);
  }

  unlock(...args) {
    return this.wrapMethod('unlock', ...args);
  }

  // Trezor specific
  dispose(...args) {
    return this.wrapMethod('dispose', ...args);
  }

  // ledger specific
  destroy(...args) {
    return this.wrapMethod('destroy', ...args);
  }

  signTransaction(...args) {
    return this.wrapMethod('signTransaction', ...args);
  }

  signPersonalMessage(...args) {
    return this.wrapMethod('signPersonalMessage', ...args);
  }

  signTypedData(...args) {
    return this.wrapMethod('signTypedData', ...args);
  }

  addAccounts(...args) {
    return this.wrapMethod('addAccounts', ...args);
  }

  __getPage(...args) {
    return this.wrapMethod('__getPage', ...args);
  }

  _setupIframe(...args) {
    return this.wrapMethod('_setupIframe', ...args);
  }
}

export default class KeyringEventsController extends EventEmitter {
  constructor({ sendPromisifiedClientAction }) {
    super();
    this.eventPool = [];
    // @TODO, migrate the below to event emission
    this.sendPromisifiedClientAction = sendPromisifiedClientAction;
    this.keyrings = this._getKeyrings();

    // use _.throttle to clear the eventPool every X milliseconds, as there are some
    // limitations as there are some limitations in various browsers based on
    // how often we can emit (?)
    this.clearEventPool = throttle(this._clearEventPool, 300 * MILLISECOND);
  }

  /**
   * Gets keyring based on manifest version.
   *
   * NOTE: If MV3, a function constructor (not a class) is returned in order
   * to pass data from this context to the HardwareKeyringWrapper instantiation.
   *
   * @returns {(function(*): HardwareKeyringWrapper)[]|[Keyring]}
   */
  _getKeyrings = () => {
    if (this.keyrings) {
      return this.keyrings;
    }

    // ... otherwise, construct the keyrings
    if (!isManifestV3) {
      return HARDWARE_KEYRINGS;
    }

    const wrappedKeyrings = HARDWARE_KEYRINGS.map((Keyring) => (opts) => {
      const keyring = new HardwareKeyringWrapper(opts, { Keyring });

      // add required listeners
      keyring.on(ADD_TO_EVENT_POOL, this.addToEventPool);

      return keyring;
    });

    return wrappedKeyrings;
  };

  /**
   * Adds a failed keyring call to the event pool.
   *
   * @param keyring.keyring
   * @param keyring
   * @param method
   * @param args
   * @param prevState
   * @param type
   * @param resolve
   * @param reject
   * @param keyring.method
   * @param keyring.args
   * @param keyring.prevState
   * @param keyring.type
   * @param keyring.resolve
   * @param keyring.reject
   */
  addToEventPool = ({
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
    });

    this.clearEventPool();
  };

  _clearEventPool = () => {
    // @TODO, allow for sending events in one go as opposed to one by one

    for (const event of this.eventPool) {
      this.sendPromisifiedClientAction(event.payload)
        .then(event.resolve)
        .catch(event.reject);
    }

    // then clear mempool
    this.eventPool = [];
  };
}

(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["TrezorConnect"] = factory();
	else
		root["TrezorConnect"] = factory();
})(window, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "./";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 131);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports) {

// https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
var global = module.exports = typeof window != 'undefined' && window.Math == Math
  ? window : typeof self != 'undefined' && self.Math == Math ? self
  // eslint-disable-next-line no-new-func
  : Function('return this')();
if (typeof __g == 'number') __g = global; // eslint-disable-line no-undef


/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

var store = __webpack_require__(34)('wks');
var uid = __webpack_require__(21);
var Symbol = __webpack_require__(0).Symbol;
var USE_SYMBOL = typeof Symbol == 'function';

var $exports = module.exports = function (name) {
  return store[name] || (store[name] =
    USE_SYMBOL && Symbol[name] || (USE_SYMBOL ? Symbol : uid)('Symbol.' + name));
};

$exports.store = store;


/***/ }),
/* 2 */
/***/ (function(module, exports) {

var core = module.exports = { version: '2.5.7' };
if (typeof __e == 'number') __e = core; // eslint-disable-line no-undef


/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

var isObject = __webpack_require__(4);
module.exports = function (it) {
  if (!isObject(it)) throw TypeError(it + ' is not an object!');
  return it;
};


/***/ }),
/* 4 */
/***/ (function(module, exports) {

module.exports = function (it) {
  return typeof it === 'object' ? it !== null : typeof it === 'function';
};


/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

var global = __webpack_require__(0);
var core = __webpack_require__(2);
var ctx = __webpack_require__(17);
var hide = __webpack_require__(9);
var has = __webpack_require__(6);
var PROTOTYPE = 'prototype';

var $export = function (type, name, source) {
  var IS_FORCED = type & $export.F;
  var IS_GLOBAL = type & $export.G;
  var IS_STATIC = type & $export.S;
  var IS_PROTO = type & $export.P;
  var IS_BIND = type & $export.B;
  var IS_WRAP = type & $export.W;
  var exports = IS_GLOBAL ? core : core[name] || (core[name] = {});
  var expProto = exports[PROTOTYPE];
  var target = IS_GLOBAL ? global : IS_STATIC ? global[name] : (global[name] || {})[PROTOTYPE];
  var key, own, out;
  if (IS_GLOBAL) source = name;
  for (key in source) {
    // contains in native
    own = !IS_FORCED && target && target[key] !== undefined;
    if (own && has(exports, key)) continue;
    // export native or passed
    out = own ? target[key] : source[key];
    // prevent global pollution for namespaces
    exports[key] = IS_GLOBAL && typeof target[key] != 'function' ? source[key]
    // bind timers to global for call from export context
    : IS_BIND && own ? ctx(out, global)
    // wrap global constructors for prevent change them in library
    : IS_WRAP && target[key] == out ? (function (C) {
      var F = function (a, b, c) {
        if (this instanceof C) {
          switch (arguments.length) {
            case 0: return new C();
            case 1: return new C(a);
            case 2: return new C(a, b);
          } return new C(a, b, c);
        } return C.apply(this, arguments);
      };
      F[PROTOTYPE] = C[PROTOTYPE];
      return F;
    // make static versions for prototype methods
    })(out) : IS_PROTO && typeof out == 'function' ? ctx(Function.call, out) : out;
    // export proto methods to core.%CONSTRUCTOR%.methods.%NAME%
    if (IS_PROTO) {
      (exports.virtual || (exports.virtual = {}))[key] = out;
      // export proto methods to core.%CONSTRUCTOR%.prototype.%NAME%
      if (type & $export.R && expProto && !expProto[key]) hide(expProto, key, out);
    }
  }
};
// type bitmap
$export.F = 1;   // forced
$export.G = 2;   // global
$export.S = 4;   // static
$export.P = 8;   // proto
$export.B = 16;  // bind
$export.W = 32;  // wrap
$export.U = 64;  // safe
$export.R = 128; // real proto method for `library`
module.exports = $export;


/***/ }),
/* 6 */
/***/ (function(module, exports) {

var hasOwnProperty = {}.hasOwnProperty;
module.exports = function (it, key) {
  return hasOwnProperty.call(it, key);
};


/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

// Thank's IE8 for his funny defineProperty
module.exports = !__webpack_require__(16)(function () {
  return Object.defineProperty({}, 'a', { get: function () { return 7; } }).a != 7;
});


/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

var anObject = __webpack_require__(3);
var IE8_DOM_DEFINE = __webpack_require__(66);
var toPrimitive = __webpack_require__(38);
var dP = Object.defineProperty;

exports.f = __webpack_require__(7) ? Object.defineProperty : function defineProperty(O, P, Attributes) {
  anObject(O);
  P = toPrimitive(P, true);
  anObject(Attributes);
  if (IE8_DOM_DEFINE) try {
    return dP(O, P, Attributes);
  } catch (e) { /* empty */ }
  if ('get' in Attributes || 'set' in Attributes) throw TypeError('Accessors not supported!');
  if ('value' in Attributes) O[P] = Attributes.value;
  return O;
};


/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

var dP = __webpack_require__(8);
var createDesc = __webpack_require__(23);
module.exports = __webpack_require__(7) ? function (object, key, value) {
  return dP.f(object, key, createDesc(1, value));
} : function (object, key, value) {
  object[key] = value;
  return object;
};


/***/ }),
/* 10 */
/***/ (function(module, exports, __webpack_require__) {

// to indexed object, toObject with fallback for non-array-like ES3 strings
var IObject = __webpack_require__(64);
var defined = __webpack_require__(37);
module.exports = function (it) {
  return IObject(defined(it));
};


/***/ }),
/* 11 */
/***/ (function(module, exports) {

module.exports = {};


/***/ }),
/* 12 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;

var _promise = __webpack_require__(122);

var _promise2 = _interopRequireDefault(_promise);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function (fn) {
  return function () {
    var gen = fn.apply(this, arguments);
    return new _promise2.default(function (resolve, reject) {
      function step(key, arg) {
        try {
          var info = gen[key](arg);
          var value = info.value;
        } catch (error) {
          reject(error);
          return;
        }

        if (info.done) {
          resolve(value);
        } else {
          return _promise2.default.resolve(value).then(function (value) {
            step("next", value);
          }, function (err) {
            step("throw", err);
          });
        }
      }

      return step("next");
    });
  };
};

/***/ }),
/* 13 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(124);


/***/ }),
/* 14 */
/***/ (function(module, exports) {

module.exports = true;


/***/ }),
/* 15 */
/***/ (function(module, exports) {

var toString = {}.toString;

module.exports = function (it) {
  return toString.call(it).slice(8, -1);
};


/***/ }),
/* 16 */
/***/ (function(module, exports) {

module.exports = function (exec) {
  try {
    return !!exec();
  } catch (e) {
    return true;
  }
};


/***/ }),
/* 17 */
/***/ (function(module, exports, __webpack_require__) {

// optional / simple context binding
var aFunction = __webpack_require__(24);
module.exports = function (fn, that, length) {
  aFunction(fn);
  if (that === undefined) return fn;
  switch (length) {
    case 1: return function (a) {
      return fn.call(that, a);
    };
    case 2: return function (a, b) {
      return fn.call(that, a, b);
    };
    case 3: return function (a, b, c) {
      return fn.call(that, a, b, c);
    };
  }
  return function (/* ...args */) {
    return fn.apply(that, arguments);
  };
};


/***/ }),
/* 18 */
/***/ (function(module, exports, __webpack_require__) {

var def = __webpack_require__(8).f;
var has = __webpack_require__(6);
var TAG = __webpack_require__(1)('toStringTag');

module.exports = function (it, tag, stat) {
  if (it && !has(it = stat ? it : it.prototype, TAG)) def(it, TAG, { configurable: true, value: tag });
};


/***/ }),
/* 19 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;

exports.default = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

/***/ }),
/* 20 */
/***/ (function(module, exports) {

exports.f = {}.propertyIsEnumerable;


/***/ }),
/* 21 */
/***/ (function(module, exports) {

var id = 0;
var px = Math.random();
module.exports = function (key) {
  return 'Symbol('.concat(key === undefined ? '' : key, ')_', (++id + px).toString(36));
};


/***/ }),
/* 22 */
/***/ (function(module, exports, __webpack_require__) {

// 19.1.2.14 / 15.2.3.14 Object.keys(O)
var $keys = __webpack_require__(65);
var enumBugKeys = __webpack_require__(33);

module.exports = Object.keys || function keys(O) {
  return $keys(O, enumBugKeys);
};


/***/ }),
/* 23 */
/***/ (function(module, exports) {

module.exports = function (bitmap, value) {
  return {
    enumerable: !(bitmap & 1),
    configurable: !(bitmap & 2),
    writable: !(bitmap & 4),
    value: value
  };
};


/***/ }),
/* 24 */
/***/ (function(module, exports) {

module.exports = function (it) {
  if (typeof it != 'function') throw TypeError(it + ' is not a function!');
  return it;
};


/***/ }),
/* 25 */
/***/ (function(module, exports, __webpack_require__) {

var global = __webpack_require__(0);
var core = __webpack_require__(2);
var LIBRARY = __webpack_require__(14);
var wksExt = __webpack_require__(26);
var defineProperty = __webpack_require__(8).f;
module.exports = function (name) {
  var $Symbol = core.Symbol || (core.Symbol = LIBRARY ? {} : global.Symbol || {});
  if (name.charAt(0) != '_' && !(name in $Symbol)) defineProperty($Symbol, name, { value: wksExt.f(name) });
};


/***/ }),
/* 26 */
/***/ (function(module, exports, __webpack_require__) {

exports.f = __webpack_require__(1);


/***/ }),
/* 27 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;
var IFRAME_HANDSHAKE = exports.IFRAME_HANDSHAKE = 'iframe-handshake';

var TRANSPORT = exports.TRANSPORT = 'ui-no_transport';
var BOOTLOADER = exports.BOOTLOADER = 'ui-device_bootloader_mode';
var INITIALIZE = exports.INITIALIZE = 'ui-device_not_initialized';
var FIRMWARE = exports.FIRMWARE = 'ui-device_firmware_old';
var FIRMWARE_OUTDATED = exports.FIRMWARE_OUTDATED = 'ui-device_firmware_outdated';
var BROWSER_NOT_SUPPORTED = exports.BROWSER_NOT_SUPPORTED = 'ui-browser_not_supported';
var BROWSER_OUTDATED = exports.BROWSER_OUTDATED = 'ui-browser_outdated';
var RECEIVE_BROWSER = exports.RECEIVE_BROWSER = 'ui-receive_browser';

var REQUEST_UI_WINDOW = exports.REQUEST_UI_WINDOW = 'ui-request_window';
var CLOSE_UI_WINDOW = exports.CLOSE_UI_WINDOW = 'ui-close_window';

var REQUEST_PERMISSION = exports.REQUEST_PERMISSION = 'ui-request_permission';
var REQUEST_CONFIRMATION = exports.REQUEST_CONFIRMATION = 'ui-request_confirmation';
var REQUEST_PIN = exports.REQUEST_PIN = 'ui-request_pin';
var INVALID_PIN = exports.INVALID_PIN = 'ui-invalid_pin';
var REQUEST_PASSPHRASE = exports.REQUEST_PASSPHRASE = 'ui-request_passphrase';
var REQUEST_PASSPHRASE_ON_DEVICE = exports.REQUEST_PASSPHRASE_ON_DEVICE = 'ui-request_passphrase_on_device';
var INVALID_PASSPHRASE = exports.INVALID_PASSPHRASE = 'ui-invalid_passphrase';
var INVALID_PASSPHRASE_ACTION = exports.INVALID_PASSPHRASE_ACTION = 'ui-invalid_passphrase_action';
var CONNECT = exports.CONNECT = 'ui-connect';
var LOADING = exports.LOADING = 'ui-loading';
var SET_OPERATION = exports.SET_OPERATION = 'ui-set_operation';
var SELECT_DEVICE = exports.SELECT_DEVICE = 'ui-select_device';
var SELECT_ACCOUNT = exports.SELECT_ACCOUNT = 'ui-select_account';
var SELECT_FEE = exports.SELECT_FEE = 'ui-select_fee';
var UPDATE_CUSTOM_FEE = exports.UPDATE_CUSTOM_FEE = 'ui-update_custom_fee';
var INSUFFICIENT_FUNDS = exports.INSUFFICIENT_FUNDS = 'ui-insufficient_funds';
var REQUEST_BUTTON = exports.REQUEST_BUTTON = 'ui-button';

var RECEIVE_PERMISSION = exports.RECEIVE_PERMISSION = 'ui-receive_permission';
var RECEIVE_CONFIRMATION = exports.RECEIVE_CONFIRMATION = 'ui-receive_confirmation';
var RECEIVE_PIN = exports.RECEIVE_PIN = 'ui-receive_pin';
var RECEIVE_PASSPHRASE = exports.RECEIVE_PASSPHRASE = 'ui-receive_passphrase';
var RECEIVE_DEVICE = exports.RECEIVE_DEVICE = 'ui-receive_device';
var CHANGE_ACCOUNT = exports.CHANGE_ACCOUNT = 'ui-change_account';
var RECEIVE_ACCOUNT = exports.RECEIVE_ACCOUNT = 'ui-receive_account';
var RECEIVE_FEE = exports.RECEIVE_FEE = 'ui-receive_fee';

var CHANGE_SETTINGS = exports.CHANGE_SETTINGS = 'ui-change_settings';

var CUSTOM_MESSAGE_REQUEST = exports.CUSTOM_MESSAGE_REQUEST = 'ui-custom_request';
var CUSTOM_MESSAGE_RESPONSE = exports.CUSTOM_MESSAGE_RESPONSE = 'ui-custom_response';

var LOGIN_CHALLENGE_REQUEST = exports.LOGIN_CHALLENGE_REQUEST = 'ui-login_challenge_request';
var LOGIN_CHALLENGE_RESPONSE = exports.LOGIN_CHALLENGE_RESPONSE = 'ui-login_challenge_response';

var BUNDLE_PROGRESS = exports.BUNDLE_PROGRESS = 'ui-bundle_progress';

/***/ }),
/* 28 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;
var INIT = exports.INIT = 'popup-init';
var BOOTSTRAP = exports.BOOTSTRAP = 'popup-bootstrap';
var EXTENSION_REQUEST = exports.EXTENSION_REQUEST = 'popup-extension_request';
var EXTENSION_USB_PERMISSIONS = exports.EXTENSION_USB_PERMISSIONS = 'open-usb-permissions';
var LOG = exports.LOG = 'popup-log';
var OPENED = exports.OPENED = 'popup-opened';
var OPEN_TIMEOUT = exports.OPEN_TIMEOUT = 'popup-open_timeout';
var HANDSHAKE = exports.HANDSHAKE = 'popup-handshake';
var CLOSE = exports.CLOSE = 'popup-close';
var CLOSED = exports.CLOSED = 'popup-closed';
var CANCEL_POPUP_REQUEST = exports.CANCEL_POPUP_REQUEST = 'ui-cancel-popup-request';

/***/ }),
/* 29 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// 25.4.1.5 NewPromiseCapability(C)
var aFunction = __webpack_require__(24);

function PromiseCapability(C) {
  var resolve, reject;
  this.promise = new C(function ($$resolve, $$reject) {
    if (resolve !== undefined || reject !== undefined) throw TypeError('Bad Promise constructor');
    resolve = $$resolve;
    reject = $$reject;
  });
  this.resolve = aFunction(resolve);
  this.reject = aFunction(reject);
}

module.exports.f = function (C) {
  return new PromiseCapability(C);
};


/***/ }),
/* 30 */
/***/ (function(module, exports, __webpack_require__) {

// 19.1.2.2 / 15.2.3.5 Object.create(O [, Properties])
var anObject = __webpack_require__(3);
var dPs = __webpack_require__(118);
var enumBugKeys = __webpack_require__(33);
var IE_PROTO = __webpack_require__(35)('IE_PROTO');
var Empty = function () { /* empty */ };
var PROTOTYPE = 'prototype';

// Create object with fake `null` prototype: use iframe Object with cleared prototype
var createDict = function () {
  // Thrash, waste and sodomy: IE GC bug
  var iframe = __webpack_require__(39)('iframe');
  var i = enumBugKeys.length;
  var lt = '<';
  var gt = '>';
  var iframeDocument;
  iframe.style.display = 'none';
  __webpack_require__(57).appendChild(iframe);
  iframe.src = 'javascript:'; // eslint-disable-line no-script-url
  // createDict = iframe.contentWindow.Object;
  // html.removeChild(iframe);
  iframeDocument = iframe.contentWindow.document;
  iframeDocument.open();
  iframeDocument.write(lt + 'script' + gt + 'document.F=Object' + lt + '/script' + gt);
  iframeDocument.close();
  createDict = iframeDocument.F;
  while (i--) delete createDict[PROTOTYPE][enumBugKeys[i]];
  return createDict();
};

module.exports = Object.create || function create(O, Properties) {
  var result;
  if (O !== null) {
    Empty[PROTOTYPE] = anObject(O);
    result = new Empty();
    Empty[PROTOTYPE] = null;
    // add "__proto__" for Object.getPrototypeOf polyfill
    result[IE_PROTO] = O;
  } else result = createDict();
  return Properties === undefined ? result : dPs(result, Properties);
};


/***/ }),
/* 31 */
/***/ (function(module, exports) {

var g;

// This works in non-strict mode
g = (function() {
	return this;
})();

try {
	// This works if eval is allowed (see CSP)
	g = g || Function("return this")() || (1, eval)("this");
} catch (e) {
	// This works if the window reference is available
	if (typeof window === "object") g = window;
}

// g can still be undefined, but nothing to do about it...
// We return undefined, instead of nothing here, so it's
// easier to handle this case. if(!global) { ...}

module.exports = g;


/***/ }),
/* 32 */
/***/ (function(module, exports) {

exports.f = Object.getOwnPropertySymbols;


/***/ }),
/* 33 */
/***/ (function(module, exports) {

// IE 8- don't enum bug keys
module.exports = (
  'constructor,hasOwnProperty,isPrototypeOf,propertyIsEnumerable,toLocaleString,toString,valueOf'
).split(',');


/***/ }),
/* 34 */
/***/ (function(module, exports, __webpack_require__) {

var core = __webpack_require__(2);
var global = __webpack_require__(0);
var SHARED = '__core-js_shared__';
var store = global[SHARED] || (global[SHARED] = {});

(module.exports = function (key, value) {
  return store[key] || (store[key] = value !== undefined ? value : {});
})('versions', []).push({
  version: core.version,
  mode: __webpack_require__(14) ? 'pure' : 'global',
  copyright: '© 2018 Denis Pushkarev (zloirock.ru)'
});


/***/ }),
/* 35 */
/***/ (function(module, exports, __webpack_require__) {

var shared = __webpack_require__(34)('keys');
var uid = __webpack_require__(21);
module.exports = function (key) {
  return shared[key] || (shared[key] = uid(key));
};


/***/ }),
/* 36 */
/***/ (function(module, exports) {

// 7.1.4 ToInteger
var ceil = Math.ceil;
var floor = Math.floor;
module.exports = function (it) {
  return isNaN(it = +it) ? 0 : (it > 0 ? floor : ceil)(it);
};


/***/ }),
/* 37 */
/***/ (function(module, exports) {

// 7.2.1 RequireObjectCoercible(argument)
module.exports = function (it) {
  if (it == undefined) throw TypeError("Can't call method on  " + it);
  return it;
};


/***/ }),
/* 38 */
/***/ (function(module, exports, __webpack_require__) {

// 7.1.1 ToPrimitive(input [, PreferredType])
var isObject = __webpack_require__(4);
// instead of the ES6 spec version, we didn't implement @@toPrimitive case
// and the second argument - flag - preferred type is a string
module.exports = function (it, S) {
  if (!isObject(it)) return it;
  var fn, val;
  if (S && typeof (fn = it.toString) == 'function' && !isObject(val = fn.call(it))) return val;
  if (typeof (fn = it.valueOf) == 'function' && !isObject(val = fn.call(it))) return val;
  if (!S && typeof (fn = it.toString) == 'function' && !isObject(val = fn.call(it))) return val;
  throw TypeError("Can't convert object to primitive value");
};


/***/ }),
/* 39 */
/***/ (function(module, exports, __webpack_require__) {

var isObject = __webpack_require__(4);
var document = __webpack_require__(0).document;
// typeof document.createElement is 'object' in old IE
var is = isObject(document) && isObject(document.createElement);
module.exports = function (it) {
  return is ? document.createElement(it) : {};
};


/***/ }),
/* 40 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;

var _regenerator = __webpack_require__(13);

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = __webpack_require__(12);

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

exports.create = create;
exports.createAsync = createAsync;
exports.resolveTimeoutPromise = resolveTimeoutPromise;
exports.rejectTimeoutPromise = rejectTimeoutPromise;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function create(arg, device) {
    var _this = this;

    var localResolve = function localResolve(t) {};
    var localReject = function localReject(e) {};
    var id = void 0;

    var promise = new Promise(function () {
        var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(resolve, reject) {
            return _regenerator2.default.wrap(function _callee$(_context) {
                while (1) {
                    switch (_context.prev = _context.next) {
                        case 0:
                            localResolve = resolve;
                            localReject = reject;

                            if (!(typeof arg === 'function')) {
                                _context.next = 11;
                                break;
                            }

                            _context.prev = 3;
                            _context.next = 6;
                            return arg();

                        case 6:
                            _context.next = 11;
                            break;

                        case 8:
                            _context.prev = 8;
                            _context.t0 = _context['catch'](3);

                            reject(_context.t0);

                        case 11:
                            if (typeof arg === 'string') id = arg;

                        case 12:
                        case 'end':
                            return _context.stop();
                    }
                }
            }, _callee, _this, [[3, 8]]);
        }));

        return function (_x, _x2) {
            return _ref.apply(this, arguments);
        };
    }());

    return {
        id: id,
        device: device,
        resolve: localResolve,
        reject: localReject,
        promise: promise
    };
}

function createAsync(innerFn) {
    var _this2 = this;

    var localResolve = function localResolve(t) {};
    var localReject = function localReject(e) {};

    var promise = new Promise(function (resolve, reject) {
        localResolve = resolve;
        localReject = reject;
    });

    var inner = function () {
        var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2() {
            return _regenerator2.default.wrap(function _callee2$(_context2) {
                while (1) {
                    switch (_context2.prev = _context2.next) {
                        case 0:
                            _context2.next = 2;
                            return innerFn();

                        case 2:
                        case 'end':
                            return _context2.stop();
                    }
                }
            }, _callee2, _this2);
        }));

        return function inner() {
            return _ref2.apply(this, arguments);
        };
    }();

    return {
        resolve: localResolve,
        reject: localReject,
        promise: promise,
        run: function run() {
            inner();
            return promise;
        }
    };
}

function resolveTimeoutPromise(delay, result) {
    return new Promise(function (resolve) {
        setTimeout(function () {
            resolve(result);
        }, delay);
    });
}

function rejectTimeoutPromise(delay, error) {
    return new Promise(function (resolve, reject) {
        setTimeout(function () {
            reject(error);
        }, delay);
    });
}

/***/ }),
/* 41 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;

var _setPrototypeOf = __webpack_require__(87);

var _setPrototypeOf2 = _interopRequireDefault(_setPrototypeOf);

var _create = __webpack_require__(83);

var _create2 = _interopRequireDefault(_create);

var _typeof2 = __webpack_require__(44);

var _typeof3 = _interopRequireDefault(_typeof2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function (subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + (typeof superClass === "undefined" ? "undefined" : (0, _typeof3.default)(superClass)));
  }

  subClass.prototype = (0, _create2.default)(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  if (superClass) _setPrototypeOf2.default ? (0, _setPrototypeOf2.default)(subClass, superClass) : subClass.__proto__ = superClass;
};

/***/ }),
/* 42 */
/***/ (function(module, exports, __webpack_require__) {

var pIE = __webpack_require__(20);
var createDesc = __webpack_require__(23);
var toIObject = __webpack_require__(10);
var toPrimitive = __webpack_require__(38);
var has = __webpack_require__(6);
var IE8_DOM_DEFINE = __webpack_require__(66);
var gOPD = Object.getOwnPropertyDescriptor;

exports.f = __webpack_require__(7) ? gOPD : function getOwnPropertyDescriptor(O, P) {
  O = toIObject(O);
  P = toPrimitive(P, true);
  if (IE8_DOM_DEFINE) try {
    return gOPD(O, P);
  } catch (e) { /* empty */ }
  if (has(O, P)) return createDesc(!pIE.f.call(O, P), O[P]);
};


/***/ }),
/* 43 */
/***/ (function(module, exports, __webpack_require__) {

// 19.1.2.7 / 15.2.3.4 Object.getOwnPropertyNames(O)
var $keys = __webpack_require__(65);
var hiddenKeys = __webpack_require__(33).concat('length', 'prototype');

exports.f = Object.getOwnPropertyNames || function getOwnPropertyNames(O) {
  return $keys(O, hiddenKeys);
};


/***/ }),
/* 44 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;

var _iterator = __webpack_require__(98);

var _iterator2 = _interopRequireDefault(_iterator);

var _symbol = __webpack_require__(96);

var _symbol2 = _interopRequireDefault(_symbol);

var _typeof = typeof _symbol2.default === "function" && typeof _iterator2.default === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof _symbol2.default === "function" && obj.constructor === _symbol2.default && obj !== _symbol2.default.prototype ? "symbol" : typeof obj; };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = typeof _symbol2.default === "function" && _typeof(_iterator2.default) === "symbol" ? function (obj) {
  return typeof obj === "undefined" ? "undefined" : _typeof(obj);
} : function (obj) {
  return obj && typeof _symbol2.default === "function" && obj.constructor === _symbol2.default && obj !== _symbol2.default.prototype ? "symbol" : typeof obj === "undefined" ? "undefined" : _typeof(obj);
};

/***/ }),
/* 45 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;

var _typeof2 = __webpack_require__(44);

var _typeof3 = _interopRequireDefault(_typeof2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function (self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return call && ((typeof call === "undefined" ? "undefined" : (0, _typeof3.default)(call)) === "object" || typeof call === "function") ? call : self;
};

/***/ }),
/* 46 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;
exports.NO_COIN_INFO = exports.BACKEND_NO_URL = exports.WEBUSB_ERROR_MESSAGE = exports.INVALID_PIN_ERROR_MESSAGE = exports.WRONG_PREVIOUS_SESSION_ERROR_MESSAGE = exports.INVALID_STATE = exports.CALL_OVERRIDE = exports.INITIALIZATION_FAILED = exports.DEVICE_USED_ELSEWHERE = exports.PERMISSIONS_NOT_GRANTED = exports.POPUP_CLOSED = exports.INVALID_PARAMETERS = exports.DEVICE_CALL_IN_PROGRESS = exports.DEVICE_NOT_FOUND = exports.WRONG_TRANSPORT_CONFIG = exports.NO_TRANSPORT = exports.BROWSER = exports.POPUP_TIMEOUT = exports.IFRAME_TIMEOUT = exports.IFRAME_INITIALIZED = exports.IFRAME_BLOCKED = exports.NO_IFRAME = exports.invalidParameter = exports.TrezorError = undefined;

var _classCallCheck2 = __webpack_require__(19);

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _possibleConstructorReturn2 = __webpack_require__(45);

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = __webpack_require__(41);

var _inherits3 = _interopRequireDefault(_inherits2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var TrezorError = exports.TrezorError = function (_Error) {
    (0, _inherits3.default)(TrezorError, _Error);

    function TrezorError(code, message) {
        (0, _classCallCheck3.default)(this, TrezorError);

        var _this = (0, _possibleConstructorReturn3.default)(this, _Error.call(this, message));

        _this.code = code;
        _this.message = message;
        return _this;
    }

    return TrezorError;
}(Error);

var invalidParameter = exports.invalidParameter = function invalidParameter(message) {
    return new TrezorError('Connect_InvalidParameter', message);
};

// level 100 error during initialization
var NO_IFRAME = exports.NO_IFRAME = new TrezorError(100, 'TrezorConnect not yet initialized');
var IFRAME_BLOCKED = exports.IFRAME_BLOCKED = new TrezorError('iframe_blocked', 'TrezorConnect iframe was blocked');
var IFRAME_INITIALIZED = exports.IFRAME_INITIALIZED = new TrezorError(101, 'TrezorConnect has been already initialized');
var IFRAME_TIMEOUT = exports.IFRAME_TIMEOUT = new TrezorError(102, 'Iframe timeout');
var POPUP_TIMEOUT = exports.POPUP_TIMEOUT = new TrezorError(103, 'Popup timeout');
var BROWSER = exports.BROWSER = new TrezorError(104, 'Browser not supported');

var NO_TRANSPORT = exports.NO_TRANSPORT = new TrezorError(500, 'Transport is missing');
var WRONG_TRANSPORT_CONFIG = exports.WRONG_TRANSPORT_CONFIG = new TrezorError(5002, 'Wrong config response'); // config_signed
var DEVICE_NOT_FOUND = exports.DEVICE_NOT_FOUND = new TrezorError(501, 'Device not found');
// export const DEVICE_CALL_IN_PROGRESS: TrezorError = new TrezorError(502, "Device call in progress.");
var DEVICE_CALL_IN_PROGRESS = exports.DEVICE_CALL_IN_PROGRESS = new TrezorError(503, 'Device call in progress');
var INVALID_PARAMETERS = exports.INVALID_PARAMETERS = new TrezorError(504, 'Invalid parameters');
var POPUP_CLOSED = exports.POPUP_CLOSED = new Error('Popup closed');

var PERMISSIONS_NOT_GRANTED = exports.PERMISSIONS_NOT_GRANTED = new TrezorError(600, 'Permissions not granted');

var DEVICE_USED_ELSEWHERE = exports.DEVICE_USED_ELSEWHERE = new TrezorError(700, 'Device is used in another window');
var INITIALIZATION_FAILED = exports.INITIALIZATION_FAILED = new TrezorError('Failure_Initialize', 'Initialization failed');

var CALL_OVERRIDE = exports.CALL_OVERRIDE = new TrezorError('Failure_ActionOverride', 'override');
var INVALID_STATE = exports.INVALID_STATE = new TrezorError('Failure_PassphraseState', 'Passphrase is incorrect');

// a slight hack
// this error string is hard-coded
// in both bridge and extension
var WRONG_PREVIOUS_SESSION_ERROR_MESSAGE = exports.WRONG_PREVIOUS_SESSION_ERROR_MESSAGE = 'wrong previous session';
var INVALID_PIN_ERROR_MESSAGE = exports.INVALID_PIN_ERROR_MESSAGE = 'PIN invalid';
var WEBUSB_ERROR_MESSAGE = exports.WEBUSB_ERROR_MESSAGE = 'NetworkError: Unable to claim interface.';

// BlockBook
var BACKEND_NO_URL = exports.BACKEND_NO_URL = new TrezorError('Backend_init', 'Url not found');

var NO_COIN_INFO = exports.NO_COIN_INFO = invalidParameter('Coin not found.');

/***/ }),
/* 47 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


// device list events

exports.__esModule = true;
var CONNECT = exports.CONNECT = 'device-connect';
var CONNECT_UNACQUIRED = exports.CONNECT_UNACQUIRED = 'device-connect_unacquired';
var DISCONNECT = exports.DISCONNECT = 'device-disconnect';
var CHANGED = exports.CHANGED = 'device-changed';
var ACQUIRE = exports.ACQUIRE = 'device-acquire';
var RELEASE = exports.RELEASE = 'device-release';
var ACQUIRED = exports.ACQUIRED = 'device-acquired';
var RELEASED = exports.RELEASED = 'device-released';
var USED_ELSEWHERE = exports.USED_ELSEWHERE = 'device-used_elsewhere';

var LOADING = exports.LOADING = 'device-loading';

// trezor-link events in protobuf format
var BUTTON = exports.BUTTON = 'button';
var PIN = exports.PIN = 'pin';
var PASSPHRASE = exports.PASSPHRASE = 'passphrase';
var PASSPHRASE_ON_DEVICE = exports.PASSPHRASE_ON_DEVICE = 'passphrase_on_device';
var WORD = exports.WORD = 'word';

// custom
var WAIT_FOR_SELECTION = exports.WAIT_FOR_SELECTION = 'device-wait_for_selection';

// this string has different prefix than other constants and it's used as device path
var UNREADABLE = exports.UNREADABLE = 'unreadable-device';

/***/ }),
/* 48 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;
var START = exports.START = 'transport-start';
var ERROR = exports.ERROR = 'transport-error';
var UPDATE = exports.UPDATE = 'transport-update';
var STREAM = exports.STREAM = 'transport-stream';
var REQUEST = exports.REQUEST = 'transport-request_device';
var RECONNECT = exports.RECONNECT = 'transport-reconnect';
var START_PENDING = exports.START_PENDING = 'transport-start_pending';

/***/ }),
/* 49 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;
var CORE_EVENT = exports.CORE_EVENT = 'CORE_EVENT';
var UI_EVENT = exports.UI_EVENT = 'UI_EVENT';
var DEVICE_EVENT = exports.DEVICE_EVENT = 'DEVICE_EVENT';
var TRANSPORT_EVENT = exports.TRANSPORT_EVENT = 'TRANSPORT_EVENT';
var RESPONSE_EVENT = exports.RESPONSE_EVENT = 'RESPONSE_EVENT';

/***/ }),
/* 50 */
/***/ (function(module, exports) {

// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      } else {
        // At least give some kind of context to the user
        var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
        err.context = er;
        throw err;
      }
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    args = Array.prototype.slice.call(arguments, 1);
    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else if (listeners) {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.prototype.listenerCount = function(type) {
  if (this._events) {
    var evlistener = this._events[type];

    if (isFunction(evlistener))
      return 1;
    else if (evlistener)
      return evlistener.length;
  }
  return 0;
};

EventEmitter.listenerCount = function(emitter, type) {
  return emitter.listenerCount(type);
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}


/***/ }),
/* 51 */
/***/ (function(module, exports, __webpack_require__) {

var anObject = __webpack_require__(3);
var isObject = __webpack_require__(4);
var newPromiseCapability = __webpack_require__(29);

module.exports = function (C, x) {
  anObject(C);
  if (isObject(x) && x.constructor === C) return x;
  var promiseCapability = newPromiseCapability.f(C);
  var resolve = promiseCapability.resolve;
  resolve(x);
  return promiseCapability.promise;
};


/***/ }),
/* 52 */
/***/ (function(module, exports) {

module.exports = function (exec) {
  try {
    return { e: false, v: exec() };
  } catch (e) {
    return { e: true, v: e };
  }
};


/***/ }),
/* 53 */
/***/ (function(module, exports, __webpack_require__) {

var ctx = __webpack_require__(17);
var invoke = __webpack_require__(107);
var html = __webpack_require__(57);
var cel = __webpack_require__(39);
var global = __webpack_require__(0);
var process = global.process;
var setTask = global.setImmediate;
var clearTask = global.clearImmediate;
var MessageChannel = global.MessageChannel;
var Dispatch = global.Dispatch;
var counter = 0;
var queue = {};
var ONREADYSTATECHANGE = 'onreadystatechange';
var defer, channel, port;
var run = function () {
  var id = +this;
  // eslint-disable-next-line no-prototype-builtins
  if (queue.hasOwnProperty(id)) {
    var fn = queue[id];
    delete queue[id];
    fn();
  }
};
var listener = function (event) {
  run.call(event.data);
};
// Node.js 0.9+ & IE10+ has setImmediate, otherwise:
if (!setTask || !clearTask) {
  setTask = function setImmediate(fn) {
    var args = [];
    var i = 1;
    while (arguments.length > i) args.push(arguments[i++]);
    queue[++counter] = function () {
      // eslint-disable-next-line no-new-func
      invoke(typeof fn == 'function' ? fn : Function(fn), args);
    };
    defer(counter);
    return counter;
  };
  clearTask = function clearImmediate(id) {
    delete queue[id];
  };
  // Node.js 0.8-
  if (__webpack_require__(15)(process) == 'process') {
    defer = function (id) {
      process.nextTick(ctx(run, id, 1));
    };
  // Sphere (JS game engine) Dispatch API
  } else if (Dispatch && Dispatch.now) {
    defer = function (id) {
      Dispatch.now(ctx(run, id, 1));
    };
  // Browsers with MessageChannel, includes WebWorkers
  } else if (MessageChannel) {
    channel = new MessageChannel();
    port = channel.port2;
    channel.port1.onmessage = listener;
    defer = ctx(port.postMessage, port, 1);
  // Browsers with postMessage, skip WebWorkers
  // IE8 has postMessage, but it's sync & typeof its postMessage is 'object'
  } else if (global.addEventListener && typeof postMessage == 'function' && !global.importScripts) {
    defer = function (id) {
      global.postMessage(id + '', '*');
    };
    global.addEventListener('message', listener, false);
  // IE8-
  } else if (ONREADYSTATECHANGE in cel('script')) {
    defer = function (id) {
      html.appendChild(cel('script'))[ONREADYSTATECHANGE] = function () {
        html.removeChild(this);
        run.call(id);
      };
    };
  // Rest old browsers
  } else {
    defer = function (id) {
      setTimeout(ctx(run, id, 1), 0);
    };
  }
}
module.exports = {
  set: setTask,
  clear: clearTask
};


/***/ }),
/* 54 */
/***/ (function(module, exports, __webpack_require__) {

// 7.3.20 SpeciesConstructor(O, defaultConstructor)
var anObject = __webpack_require__(3);
var aFunction = __webpack_require__(24);
var SPECIES = __webpack_require__(1)('species');
module.exports = function (O, D) {
  var C = anObject(O).constructor;
  var S;
  return C === undefined || (S = anObject(C)[SPECIES]) == undefined ? D : aFunction(S);
};


/***/ }),
/* 55 */
/***/ (function(module, exports, __webpack_require__) {

// getting tag from 19.1.3.6 Object.prototype.toString()
var cof = __webpack_require__(15);
var TAG = __webpack_require__(1)('toStringTag');
// ES3 wrong here
var ARG = cof(function () { return arguments; }()) == 'Arguments';

// fallback for IE11 Script Access Denied error
var tryGet = function (it, key) {
  try {
    return it[key];
  } catch (e) { /* empty */ }
};

module.exports = function (it) {
  var O, T, B;
  return it === undefined ? 'Undefined' : it === null ? 'Null'
    // @@toStringTag case
    : typeof (T = tryGet(O = Object(it), TAG)) == 'string' ? T
    // builtinTag case
    : ARG ? cof(O)
    // ES3 arguments fallback
    : (B = cof(O)) == 'Object' && typeof O.callee == 'function' ? 'Arguments' : B;
};


/***/ }),
/* 56 */
/***/ (function(module, exports, __webpack_require__) {

__webpack_require__(116);
var global = __webpack_require__(0);
var hide = __webpack_require__(9);
var Iterators = __webpack_require__(11);
var TO_STRING_TAG = __webpack_require__(1)('toStringTag');

var DOMIterables = ('CSSRuleList,CSSStyleDeclaration,CSSValueList,ClientRectList,DOMRectList,DOMStringList,' +
  'DOMTokenList,DataTransferItemList,FileList,HTMLAllCollection,HTMLCollection,HTMLFormElement,HTMLSelectElement,' +
  'MediaList,MimeTypeArray,NamedNodeMap,NodeList,PaintRequestList,Plugin,PluginArray,SVGLengthList,SVGNumberList,' +
  'SVGPathSegList,SVGPointList,SVGStringList,SVGTransformList,SourceBufferList,StyleSheetList,TextTrackCueList,' +
  'TextTrackList,TouchList').split(',');

for (var i = 0; i < DOMIterables.length; i++) {
  var NAME = DOMIterables[i];
  var Collection = global[NAME];
  var proto = Collection && Collection.prototype;
  if (proto && !proto[TO_STRING_TAG]) hide(proto, TO_STRING_TAG, NAME);
  Iterators[NAME] = Iterators.Array;
}


/***/ }),
/* 57 */
/***/ (function(module, exports, __webpack_require__) {

var document = __webpack_require__(0).document;
module.exports = document && document.documentElement;


/***/ }),
/* 58 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(9);


/***/ }),
/* 59 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var LIBRARY = __webpack_require__(14);
var $export = __webpack_require__(5);
var redefine = __webpack_require__(58);
var hide = __webpack_require__(9);
var Iterators = __webpack_require__(11);
var $iterCreate = __webpack_require__(119);
var setToStringTag = __webpack_require__(18);
var getPrototypeOf = __webpack_require__(117);
var ITERATOR = __webpack_require__(1)('iterator');
var BUGGY = !([].keys && 'next' in [].keys()); // Safari has buggy iterators w/o `next`
var FF_ITERATOR = '@@iterator';
var KEYS = 'keys';
var VALUES = 'values';

var returnThis = function () { return this; };

module.exports = function (Base, NAME, Constructor, next, DEFAULT, IS_SET, FORCED) {
  $iterCreate(Constructor, NAME, next);
  var getMethod = function (kind) {
    if (!BUGGY && kind in proto) return proto[kind];
    switch (kind) {
      case KEYS: return function keys() { return new Constructor(this, kind); };
      case VALUES: return function values() { return new Constructor(this, kind); };
    } return function entries() { return new Constructor(this, kind); };
  };
  var TAG = NAME + ' Iterator';
  var DEF_VALUES = DEFAULT == VALUES;
  var VALUES_BUG = false;
  var proto = Base.prototype;
  var $native = proto[ITERATOR] || proto[FF_ITERATOR] || DEFAULT && proto[DEFAULT];
  var $default = $native || getMethod(DEFAULT);
  var $entries = DEFAULT ? !DEF_VALUES ? $default : getMethod('entries') : undefined;
  var $anyNative = NAME == 'Array' ? proto.entries || $native : $native;
  var methods, key, IteratorPrototype;
  // Fix native
  if ($anyNative) {
    IteratorPrototype = getPrototypeOf($anyNative.call(new Base()));
    if (IteratorPrototype !== Object.prototype && IteratorPrototype.next) {
      // Set @@toStringTag to native iterators
      setToStringTag(IteratorPrototype, TAG, true);
      // fix for some old engines
      if (!LIBRARY && typeof IteratorPrototype[ITERATOR] != 'function') hide(IteratorPrototype, ITERATOR, returnThis);
    }
  }
  // fix Array#{values, @@iterator}.name in V8 / FF
  if (DEF_VALUES && $native && $native.name !== VALUES) {
    VALUES_BUG = true;
    $default = function values() { return $native.call(this); };
  }
  // Define iterator
  if ((!LIBRARY || FORCED) && (BUGGY || VALUES_BUG || !proto[ITERATOR])) {
    hide(proto, ITERATOR, $default);
  }
  // Plug for library
  Iterators[NAME] = $default;
  Iterators[TAG] = returnThis;
  if (DEFAULT) {
    methods = {
      values: DEF_VALUES ? $default : getMethod(VALUES),
      keys: IS_SET ? $default : getMethod(KEYS),
      entries: $entries
    };
    if (FORCED) for (key in methods) {
      if (!(key in proto)) redefine(proto, key, methods[key]);
    } else $export($export.P + $export.F * (BUGGY || VALUES_BUG), NAME, methods);
  }
  return methods;
};


/***/ }),
/* 60 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var $at = __webpack_require__(120)(true);

// 21.1.3.27 String.prototype[@@iterator]()
__webpack_require__(59)(String, 'String', function (iterated) {
  this._t = String(iterated); // target
  this._i = 0;                // next index
// 21.1.5.2.1 %StringIteratorPrototype%.next()
}, function () {
  var O = this._t;
  var index = this._i;
  var point;
  if (index >= O.length) return { value: undefined, done: true };
  point = $at(O, index);
  this._i += point.length;
  return { value: point, done: false };
});


/***/ }),
/* 61 */
/***/ (function(module, exports) {



/***/ }),
/* 62 */
/***/ (function(module, exports, __webpack_require__) {

// 7.1.13 ToObject(argument)
var defined = __webpack_require__(37);
module.exports = function (it) {
  return Object(defined(it));
};


/***/ }),
/* 63 */
/***/ (function(module, exports, __webpack_require__) {

// 7.1.15 ToLength
var toInteger = __webpack_require__(36);
var min = Math.min;
module.exports = function (it) {
  return it > 0 ? min(toInteger(it), 0x1fffffffffffff) : 0; // pow(2, 53) - 1 == 9007199254740991
};


/***/ }),
/* 64 */
/***/ (function(module, exports, __webpack_require__) {

// fallback for non-array-like ES3 and non-enumerable old V8 strings
var cof = __webpack_require__(15);
// eslint-disable-next-line no-prototype-builtins
module.exports = Object('z').propertyIsEnumerable(0) ? Object : function (it) {
  return cof(it) == 'String' ? it.split('') : Object(it);
};


/***/ }),
/* 65 */
/***/ (function(module, exports, __webpack_require__) {

var has = __webpack_require__(6);
var toIObject = __webpack_require__(10);
var arrayIndexOf = __webpack_require__(126)(false);
var IE_PROTO = __webpack_require__(35)('IE_PROTO');

module.exports = function (object, names) {
  var O = toIObject(object);
  var i = 0;
  var result = [];
  var key;
  for (key in O) if (key != IE_PROTO) has(O, key) && result.push(key);
  // Don't enum bug & hidden keys
  while (names.length > i) if (has(O, key = names[i++])) {
    ~arrayIndexOf(result, key) || result.push(key);
  }
  return result;
};


/***/ }),
/* 66 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = !__webpack_require__(7) && !__webpack_require__(16)(function () {
  return Object.defineProperty(__webpack_require__(39)('div'), 'a', { get: function () { return 7; } }).a != 7;
});


/***/ }),
/* 67 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;

var _assign = __webpack_require__(130);

var _assign2 = _interopRequireDefault(_assign);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = _assign2.default || function (target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i];

    for (var key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key];
      }
    }
  }

  return target;
};

/***/ }),
/* 68 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/***/ }),
/* 69 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/***/ }),
/* 70 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/*
* Public types accessible from npm library
*/

exports.__esModule = true;

var _response = __webpack_require__(69);

Object.keys(_response).forEach(function (key) {
    if (key === "default" || key === "__esModule") return;
    Object.defineProperty(exports, key, {
        enumerable: true,
        get: function get() {
            return _response[key];
        }
    });
});

var _constants = __webpack_require__(49);

var _transport = __webpack_require__(48);

var TRANSPORT = _interopRequireWildcard(_transport);

var _popup = __webpack_require__(28);

var POPUP = _interopRequireWildcard(_popup);

var _ui = __webpack_require__(27);

var UI = _interopRequireWildcard(_ui);

var _device = __webpack_require__(47);

var DEVICE = _interopRequireWildcard(_device);

var _params = __webpack_require__(68);

var P = _interopRequireWildcard(_params);

var R = _interopRequireWildcard(_response);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

/***/ }),
/* 71 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;
exports.parse = exports.DEFAULT_PRIORITY = undefined;

var _extends2 = __webpack_require__(67);

var _extends3 = _interopRequireDefault(_extends2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*
 * Initial settings for connect.
 * It could be changed by passing values into TrezorConnect.init(...) method
 */

var VERSION = '5.0.28';
var versionN = VERSION.split('.').map(function (s) {
    return parseInt(s);
});
var DIRECTORY = '' + versionN[0] + (versionN[1] > 0 ? '.' + versionN[1] : '') + '/';
var DEFAULT_DOMAIN = 'https://connect.trezor.io/';
var SRC = window.__TREZOR_CONNECT_SRC || '' + DEFAULT_DOMAIN + DIRECTORY;

var DEFAULT_PRIORITY = exports.DEFAULT_PRIORITY = 2;

var initialSettings = {
    configSrc: 'data/config.json', // constant
    debug: false,
    origin: null,
    priority: DEFAULT_PRIORITY,
    trustedHost: false,
    connectSrc: SRC,
    iframeSrc: SRC + 'iframe.html',
    popup: true,
    popupSrc: SRC + 'popup.html',
    webusbSrc: SRC + 'webusb.html',
    transportReconnect: false,
    webusb: true,
    pendingTransportEvent: true,
    supportedBrowser: !/Trident|MSIE/.test(navigator.userAgent),
    extension: null
};

var currentSettings = initialSettings;

var parse = exports.parse = function parse(input) {
    if (!input) return currentSettings;

    var settings = (0, _extends3.default)({}, currentSettings);
    if (input.hasOwnProperty('debug')) {
        if (Array.isArray(input)) {
            // enable log with prefix
        }if (typeof input.debug === 'boolean') {
            settings.debug = input.debug;
        } else if (typeof input.debug === 'string') {
            settings.debug = input.debug === 'true';
        }
    }

    if (typeof input.connectSrc === 'string') {
        // TODO: escape string, validate url
        settings.connectSrc = input.connectSrc;
    } else if (typeof window.__TREZOR_CONNECT_SRC === 'string') {
        settings.connectSrc = window.__TREZOR_CONNECT_SRC;
    }
    settings.iframeSrc = settings.connectSrc + 'iframe.html';
    settings.popupSrc = settings.connectSrc + 'popup.html';
    settings.webusbSrc = settings.connectSrc + 'webusb.html';

    if (typeof input.transportReconnect === 'boolean') {
        settings.transportReconnect = input.transportReconnect;
    }

    if (typeof input.webusb === 'boolean') {
        settings.webusb = input.webusb;
    }

    if (typeof input.popup === 'boolean') {
        settings.popup = input.popup;
    }

    if (typeof input.pendingTransportEvent === 'boolean') {
        settings.pendingTransportEvent = input.pendingTransportEvent;
    }

    // local files
    if (window.location.protocol === 'file:') {
        settings.origin = window.location.origin + window.location.pathname;
        settings.webusb = false;
    }

    if (typeof input.extension === 'string') {
        settings.extension = input.extension;
    }

    // $FlowIssue: settings.excludedDevices field is intentionally not defined in flowtype. it's used only in tests to exclude debug-link device.
    settings.excludedDevices = input.excludedDevices;

    currentSettings = settings;
    return currentSettings;
};

/***/ }),
/* 72 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;


// parse MessageEvent .data into CoreMessage
var parseMessage = exports.parseMessage = function parseMessage(messageData) {
    var message = {
        event: messageData.event,
        type: messageData.type,
        payload: messageData.payload
    };

    if (typeof messageData.id === 'number') {
        message.id = messageData.id;
    }

    if (typeof messageData.success === 'boolean') {
        message.success = messageData.success;
    }

    return message;
};

/***/ }),
/* 73 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(global) {

// https://stackoverflow.com/questions/7505623/colors-in-javascript-console
// https://github.com/pimterry/loglevel/blob/master/lib/loglevel.js

// http://www.color-hex.com/color-palette/5016

exports.__esModule = true;
exports.popupConsole = exports.enableByPrefix = exports.getLog = exports.enable = exports.init = undefined;

var _classCallCheck2 = __webpack_require__(19);

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var colors = {
    // green
    'DescriptorStream': 'color: #77ab59',
    'DeviceList': 'color: #36802d',
    'Device': 'color: #bada55',
    'Core': 'color: #c9df8a',
    'IFrame': 'color: #FFFFFF; background: #f4a742;',
    'Popup': 'color: #f48a00'
};

var Log = function () {
    function Log(prefix) {
        var enabled = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
        (0, _classCallCheck3.default)(this, Log);

        this.prefix = prefix;
        this.enabled = enabled;
        this.messages = [];
        this.css = colors[prefix] || 'color: #000000; background: #FFFFFF;';
    }

    Log.prototype.addMessage = function addMessage(level, prefix) {
        for (var _len = arguments.length, args = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
            args[_key - 2] = arguments[_key];
        }

        this.messages.push({
            level: level,
            prefix: prefix,
            message: args,
            timestamp: new Date().getTime()
        });
    };

    Log.prototype.log = function log() {
        for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
            args[_key2] = arguments[_key2];
        }

        this.addMessage.apply(this, ['log', this.prefix].concat(args));
        if (this.enabled) {
            var _console;

            (_console = console).log.apply(_console, [this.prefix].concat(args));
        }
    };

    Log.prototype.error = function error() {
        for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
            args[_key3] = arguments[_key3];
        }

        this.addMessage.apply(this, ['error', this.prefix].concat(args));
        if (this.enabled) {
            var _console2;

            (_console2 = console).error.apply(_console2, [this.prefix].concat(args));
        }
    };

    Log.prototype.warn = function warn() {
        for (var _len4 = arguments.length, args = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
            args[_key4] = arguments[_key4];
        }

        this.addMessage.apply(this, ['warn', this.prefix].concat(args));
        if (this.enabled) {
            var _console3;

            (_console3 = console).warn.apply(_console3, [this.prefix].concat(args));
        }
    };

    Log.prototype.debug = function debug() {
        for (var _len5 = arguments.length, args = Array(_len5), _key5 = 0; _key5 < _len5; _key5++) {
            args[_key5] = arguments[_key5];
        }

        this.addMessage.apply(this, ['debug', this.prefix].concat(args));
        if (this.enabled) {
            var _console4;

            (_console4 = console).log.apply(_console4, ['%c' + this.prefix, this.css].concat(args));
        }
    };

    return Log;
}();

exports.default = Log;


var _logs = {};

var init = exports.init = function init(prefix, enabled) {
    var enab = typeof enabled === 'boolean' ? enabled : false;
    var instance = new Log(prefix, enab);
    _logs[prefix] = instance;
    return instance;
};

var enable = exports.enable = function enable(enabled) {
    for (var _iterator = Object.keys(_logs), _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
        var _ref;

        if (_isArray) {
            if (_i >= _iterator.length) break;
            _ref = _iterator[_i++];
        } else {
            _i = _iterator.next();
            if (_i.done) break;
            _ref = _i.value;
        }

        var l = _ref;

        _logs[l].enabled = enabled;
    }
};

var getLog = exports.getLog = function getLog(args) {
    // if
    var logs = [];
    for (var _iterator2 = Object.keys(_logs), _isArray2 = Array.isArray(_iterator2), _i2 = 0, _iterator2 = _isArray2 ? _iterator2 : _iterator2[Symbol.iterator]();;) {
        var _ref2;

        if (_isArray2) {
            if (_i2 >= _iterator2.length) break;
            _ref2 = _iterator2[_i2++];
        } else {
            _i2 = _iterator2.next();
            if (_i2.done) break;
            _ref2 = _i2.value;
        }

        var l = _ref2;

        logs = logs.concat(_logs[l].messages);
    }
    logs.sort(function (a, b) {
        return a.timestamp - b.timestamp;
    });
    return logs;
};

var enableByPrefix = exports.enableByPrefix = function enableByPrefix(prefix, enabled) {
    if (_logs[prefix]) {
        _logs[prefix].enabled = enabled;
    }
};

// TODO: enable/disable log at runtime
var popupConsole = exports.popupConsole = function popupConsole(tag, postMessage) {
    var c = global.console;
    var orig = {
        error: c.error,
        // warn: c.warn,
        info: c.info,
        debug: c.debug,
        log: c.log
    };
    var log = [];

    var inject = function inject(method, level) {
        return function () {
            for (var _len6 = arguments.length, args = Array(_len6), _key6 = 0; _key6 < _len6; _key6++) {
                args[_key6] = arguments[_key6];
            }

            // args.unshift('[popup.js]');
            var time = new Date().toUTCString();
            log.push([level, time].concat(args));
            postMessage.apply(undefined, [{ type: tag, level: level, time: time, args: JSON.stringify(args) }]
            // { type: 'LOG', level: level, time: time, args: JSON.stringify(deepClone(args)) }
            );
            return method.apply(c, args);
        };
    };

    for (var _level in orig) {
        c[_level] = inject(orig[_level], _level);
    }
};
/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(31)))

/***/ }),
/* 74 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;
var render = function render(className, url, origin) {
    var query = className || '.trezor-webusb-button';
    var buttons = document.querySelectorAll(query);
    var src = url + '?' + Date.now();

    buttons.forEach(function (b) {
        if (b.getElementsByTagName('iframe').length < 1) {
            var bounds = b.getBoundingClientRect();
            var btnIframe = document.createElement('iframe');
            btnIframe.frameBorder = '0';
            btnIframe.width = Math.round(bounds.width) + 'px';
            btnIframe.height = Math.round(bounds.height) + 'px';
            btnIframe.style.position = 'absolute';
            btnIframe.style.top = '0px';
            btnIframe.style.left = '0px';
            btnIframe.style.zIndex = '1';
            // btnIframe.style.opacity = '0'; // this makes click impossible on cross-origin
            btnIframe.setAttribute('allow', 'usb');
            btnIframe.setAttribute('scrolling', 'no');
            btnIframe.onload = function () {
                btnIframe.contentWindow.postMessage({
                    // style: JSON.stringify( window.getComputedStyle(b) ),
                    // outer: b.outerHTML,
                    // inner: b.innerHTML
                }, origin);
            };
            btnIframe.src = src;

            // inject iframe into button
            b.append(btnIframe);
        }
    });
};

exports.default = render;

/***/ }),
/* 75 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;
var css = '.trezorconnect-container{position:fixed!important;display:-webkit-box!important;display:-webkit-flex!important;display:-ms-flexbox!important;display:flex!important;-webkit-box-orient:vertical!important;-webkit-box-direction:normal!important;-webkit-flex-direction:column!important;-ms-flex-direction:column!important;flex-direction:column!important;-webkit-box-align:center!important;-webkit-align-items:center!important;-ms-flex-align:center!important;align-items:center!important;z-index:10000!important;width:100%!important;height:100%!important;top:0!important;left:0!important;background:rgba(0,0,0,.35)!important;overflow:auto!important;padding:20px!important;margin:0!important}.trezorconnect-container .trezorconnect-window{position:relative!important;display:block!important;width:370px!important;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif!important;margin:auto!important;border-radius:3px!important;background-color:#fff!important;text-align:center!important;overflow:hidden!important}.trezorconnect-container .trezorconnect-window .trezorconnect-head{text-align:left;padding:12px 24px!important;display:-webkit-box!important;display:-webkit-flex!important;display:-ms-flexbox!important;display:flex!important;-webkit-box-align:center!important;-webkit-align-items:center!important;-ms-flex-align:center!important;align-items:center!important}.trezorconnect-container .trezorconnect-window .trezorconnect-head .trezorconnect-logo{-webkit-box-flex:1;-webkit-flex:1;-ms-flex:1;flex:1}.trezorconnect-container .trezorconnect-window .trezorconnect-head .trezorconnect-close{cursor:pointer!important;height:24px!important}.trezorconnect-container .trezorconnect-window .trezorconnect-head .trezorconnect-close svg{fill:#757575;-webkit-transition:fill .3s ease-in-out!important;transition:fill .3s ease-in-out!important}.trezorconnect-container .trezorconnect-window .trezorconnect-head .trezorconnect-close:hover svg{fill:#494949}.trezorconnect-container .trezorconnect-window .trezorconnect-body{padding:24px 24px 32px!important;background:#FBFBFB!important;border-top:1px solid #EBEBEB}.trezorconnect-container .trezorconnect-window .trezorconnect-body h3{color:#505050!important;font-size:16px!important;font-weight:500!important}.trezorconnect-container .trezorconnect-window .trezorconnect-body p{margin:8px 0 24px!important;font-weight:400!important;color:#A9A9A9!important;font-size:12px!important}.trezorconnect-container .trezorconnect-window .trezorconnect-body button{width:100%!important;padding:12px 24px!important;margin:0!important;border-radius:3px!important;font-size:14px!important;font-weight:300!important;cursor:pointer!important;background:#01B757!important;color:#fff!important;border:0!important;-webkit-transition:background-color .3s ease-in-out!important;transition:background-color .3s ease-in-out!important}.trezorconnect-container .trezorconnect-window .trezorconnect-body button:hover{background-color:#00AB51!important}.trezorconnect-container .trezorconnect-window .trezorconnect-body button:active{background-color:#009546!important}/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImlucHV0IiwiJHN0ZGluIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQWNBLHlCQUNJLFNBQUEsZ0JBQ0EsUUFBQSxzQkFDQSxRQUFBLHVCQUNBLFFBQUEsc0JBRUEsUUFBQSxlQUNBLG1CQUFBLG1CQUNBLHNCQUFBLGlCQUNBLHVCQUFBLGlCQUNBLG1CQUFBLGlCQUNBLGVBQUEsaUJBRUEsa0JBQUEsaUJBQ0Esb0JBQUEsaUJBQ0EsZUFBQSxpQkNmTSxZQUFhLGlCREFyQixRQUFTLGdCQWtCSCxNQUFBLGVBQ0EsT0FBQSxlQUNBLElBQUEsWUFDQSxLQUFBLFlBQ0EsV0FBQSwwQkFDQSxTQUFBLGVBQ0EsUUFBQSxlQUNBLE9BQUEsWUNkUiwrQ0RYRSxTQUFVLG1CQTZCQSxRQUFBLGdCQUNBLE1BQUEsZ0JBQ0EsWUFBQSxjQUFBLG1CQUFBLFdBQUEsT0FBQSxpQkFBQSxNQUFBLHFCQUNBLE9BQUEsZUNmVixjQUFlLGNEakJmLGlCQWlCRSxlQWtCWSxXQUFBLGlCQ2ZkLFNBQVUsaUJEbUJJLG1FQUNBLFdBQUEsS0NoQmQsUUFBUyxLQUFLLGVEeEJkLFFBQVMsc0JBMENTLFFBQUEsdUJBQ0EsUUFBQSxzQkNmbEIsUUFBUyxlRGlCSyxrQkE1QlosaUJBOEJvQixvQkFBQSxpQkNoQmxCLGVBQWdCLGlCRC9CWixZQWlCTixpQkFzQ1EsdUZBQ0EsaUJBQUEsRUNwQlYsYUFBYyxFRHBDVixTQUFVLEVBMkRBLEtBQUEsRUFFQSx3RkNwQmQsT0FBUSxrQkR6Q1IsT0FBUSxlQWlFTSw0RkFDQSxLQUFBLFFBQ0EsbUJBQUEsS0FBQSxJQUFBLHNCQ3BCZCxXQUFZLEtBQUssSUFBSyxzQkR3QlIsa0dBQ0EsS0FBQSxRQUVBLG1FQUNBLFFBQUEsS0FBQSxLQUFBLGVBQ0EsV0FBQSxrQkFDQSxXQUFBLElBQUEsTUFBQSxRQUVBLHNFQUNBLE1BQUEsa0JBQ0EsVUFBQSxlQ3JCZCxZQUFhLGNEd0JLLHFFQ3JCbEIsT0FBUSxJQUFJLEVBQUksZUR3QkYsWUFBQSxjQUNJLE1BQUEsa0JDdEJsQixVQUFXLGVBRWIsMEVBQ0UsTUFBTyxlQUNQLFFBQVMsS0FBSyxlQUNkLE9BQVEsWUFDUixjQUFlLGNBQ2YsVUFBVyxlQUNYLFlBQWEsY0FDYixPQUFRLGtCQUNSLFdBQVksa0JBQ1osTUFBTyxlQUNQLE9BQVEsWUFDUixtQkFBb0IsaUJBQWlCLElBQUssc0JBQzFDLFdBQVksaUJBQWlCLElBQUssc0JBRXBDLGdGQUNFLGlCQUFrQixrQkFFcEIsaUZBQ0UsaUJBQWtCIn0= */';exports.default = css;

/***/ }),
/* 76 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;
exports.clearTimeout = exports.dispose = exports.postMessage = exports.init = exports.messagePromises = exports.error = exports.timeout = exports.initPromise = exports.origin = exports.instance = undefined;

var _regenerator = __webpack_require__(13);

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = __webpack_require__(12);

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _deferred = __webpack_require__(40);

var _ui = __webpack_require__(27);

var _errors = __webpack_require__(46);

var _inlineStyles = __webpack_require__(75);

var _inlineStyles2 = _interopRequireDefault(_inlineStyles);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var instance = exports.instance = void 0;
var origin = exports.origin = void 0;
var initPromise = exports.initPromise = (0, _deferred.create)();
var timeout = exports.timeout = 0;
var error = exports.error = void 0;

var _messageID = 0;
// every postMessage to iframe has its own promise to resolve
var messagePromises = exports.messagePromises = {};

var init = exports.init = function () {
    var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(settings) {
        var existedFrame, src, iframeSrcHost, onLoad;
        return _regenerator2.default.wrap(function _callee$(_context) {
            while (1) {
                switch (_context.prev = _context.next) {
                    case 0:
                        existedFrame = document.getElementById('trezorconnect');

                        if (existedFrame) {
                            exports.instance = instance = existedFrame;
                        } else {
                            exports.instance = instance = document.createElement('iframe');
                            instance.frameBorder = '0';
                            instance.width = '0px';
                            instance.height = '0px';
                            instance.style.position = 'absolute';
                            instance.style.display = 'none';
                            instance.style.border = '0px';
                            instance.style.width = '0px';
                            instance.style.height = '0px';
                            instance.id = 'trezorconnect';
                        }

                        src = settings.iframeSrc + '?' + Date.now();

                        instance.setAttribute('src', src);
                        if (settings.webusb) {
                            instance.setAttribute('allow', 'usb');
                        }

                        // eslint-disable-next-line no-irregular-whitespace, no-useless-escape
                        iframeSrcHost = instance.src.match(/^.+\:\/\/[^\‌​/]+/);

                        if (iframeSrcHost && iframeSrcHost.length > 0) {
                            exports.origin = origin = iframeSrcHost[0];
                        }

                        exports.timeout = timeout = window.setTimeout(function () {
                            initPromise.reject(_errors.IFRAME_TIMEOUT);
                        }, 10000);

                        onLoad = function onLoad() {
                            if (!instance) {
                                initPromise.reject(_errors.IFRAME_BLOCKED);
                                return;
                            }
                            try {
                                // if hosting page is able to access cross-origin location it means that the iframe is not loaded
                                var iframeOrigin = instance.contentWindow.location.origin;
                                if (!iframeOrigin || iframeOrigin === 'null') {
                                    // eslint-disable-next-line no-use-before-define
                                    handleIframeBlocked();
                                    return;
                                }
                            } catch (e) {
                                // empty
                            }

                            var extension = void 0;
                            // $FlowIssue chrome is not declared outside
                            if (typeof chrome !== 'undefined' && chrome.runtime && typeof chrome.runtime.onConnect !== 'undefined') {
                                chrome.runtime.onConnect.addListener(function () {});
                                extension = chrome.runtime.id;
                            }

                            instance.contentWindow.postMessage({
                                type: _ui.IFRAME_HANDSHAKE,
                                payload: {
                                    settings: settings,
                                    extension: extension
                                }
                            }, origin);

                            instance.onload = undefined;
                        };

                        // IE hack


                        if (instance.attachEvent) {
                            instance.attachEvent('onload', onLoad);
                        } else {
                            instance.onload = onLoad;
                        }
                        // inject iframe into host document body
                        if (document.body) {
                            document.body.appendChild(instance);
                            // eslint-disable-next-line no-use-before-define
                            injectStyleSheet();
                        }

                        _context.prev = 11;
                        _context.next = 14;
                        return initPromise.promise;

                    case 14:
                        _context.next = 19;
                        break;

                    case 16:
                        _context.prev = 16;
                        _context.t0 = _context['catch'](11);
                        throw _context.t0.message || _context.t0;

                    case 19:
                        _context.prev = 19;

                        window.clearTimeout(timeout);
                        exports.timeout = timeout = 0;
                        return _context.finish(19);

                    case 23:
                    case 'end':
                        return _context.stop();
                }
            }
        }, _callee, undefined, [[11, 16, 19, 23]]);
    }));

    return function init(_x) {
        return _ref.apply(this, arguments);
    };
}();

var injectStyleSheet = function injectStyleSheet() {
    if (!instance) {
        throw _errors.IFRAME_BLOCKED;
    }
    var doc = instance.ownerDocument;
    var head = doc.head || doc.getElementsByTagName('head')[0];
    var style = document.createElement('style');
    style.setAttribute('type', 'text/css');
    style.setAttribute('id', 'TrezorConnectStylesheet');

    // $FlowIssue
    if (style.styleSheet) {
        // IE
        // $FlowIssue
        style.styleSheet.cssText = _inlineStyles2.default;
    } else {
        style.appendChild(document.createTextNode(_inlineStyles2.default));
    }
    head.append(style);
};

var handleIframeBlocked = function handleIframeBlocked() {
    window.clearTimeout(timeout);

    exports.error = error = _errors.IFRAME_BLOCKED.message;
    // eslint-disable-next-line no-use-before-define
    dispose();
    initPromise.reject(_errors.IFRAME_BLOCKED);
};

// post messages to iframe
var postMessage = exports.postMessage = function postMessage(message) {
    var usePromise = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

    if (!instance) {
        throw _errors.IFRAME_BLOCKED;
    }
    if (usePromise) {
        _messageID++;
        message.id = _messageID;
        messagePromises[_messageID] = (0, _deferred.create)();
        instance.contentWindow.postMessage(message, origin);
        return messagePromises[_messageID].promise;
    }

    instance.contentWindow.postMessage(message, origin);
    return null;
};

var dispose = exports.dispose = function dispose() {
    if (instance && instance.parentNode) {
        try {
            instance.parentNode.removeChild(instance);
        } catch (error) {
            // do nothing
        }
    }
    exports.instance = instance = null;
    exports.timeout = timeout = 0;
};

var clearTimeout = exports.clearTimeout = function clearTimeout() {
    window.clearTimeout(timeout);
};

/***/ }),
/* 77 */
/***/ (function(module, exports) {

(function(self) {
  'use strict';

  if (self.fetch) {
    return
  }

  var support = {
    searchParams: 'URLSearchParams' in self,
    iterable: 'Symbol' in self && 'iterator' in Symbol,
    blob: 'FileReader' in self && 'Blob' in self && (function() {
      try {
        new Blob()
        return true
      } catch(e) {
        return false
      }
    })(),
    formData: 'FormData' in self,
    arrayBuffer: 'ArrayBuffer' in self
  }

  if (support.arrayBuffer) {
    var viewClasses = [
      '[object Int8Array]',
      '[object Uint8Array]',
      '[object Uint8ClampedArray]',
      '[object Int16Array]',
      '[object Uint16Array]',
      '[object Int32Array]',
      '[object Uint32Array]',
      '[object Float32Array]',
      '[object Float64Array]'
    ]

    var isDataView = function(obj) {
      return obj && DataView.prototype.isPrototypeOf(obj)
    }

    var isArrayBufferView = ArrayBuffer.isView || function(obj) {
      return obj && viewClasses.indexOf(Object.prototype.toString.call(obj)) > -1
    }
  }

  function normalizeName(name) {
    if (typeof name !== 'string') {
      name = String(name)
    }
    if (/[^a-z0-9\-#$%&'*+.\^_`|~]/i.test(name)) {
      throw new TypeError('Invalid character in header field name')
    }
    return name.toLowerCase()
  }

  function normalizeValue(value) {
    if (typeof value !== 'string') {
      value = String(value)
    }
    return value
  }

  // Build a destructive iterator for the value list
  function iteratorFor(items) {
    var iterator = {
      next: function() {
        var value = items.shift()
        return {done: value === undefined, value: value}
      }
    }

    if (support.iterable) {
      iterator[Symbol.iterator] = function() {
        return iterator
      }
    }

    return iterator
  }

  function Headers(headers) {
    this.map = {}

    if (headers instanceof Headers) {
      headers.forEach(function(value, name) {
        this.append(name, value)
      }, this)
    } else if (Array.isArray(headers)) {
      headers.forEach(function(header) {
        this.append(header[0], header[1])
      }, this)
    } else if (headers) {
      Object.getOwnPropertyNames(headers).forEach(function(name) {
        this.append(name, headers[name])
      }, this)
    }
  }

  Headers.prototype.append = function(name, value) {
    name = normalizeName(name)
    value = normalizeValue(value)
    var oldValue = this.map[name]
    this.map[name] = oldValue ? oldValue+','+value : value
  }

  Headers.prototype['delete'] = function(name) {
    delete this.map[normalizeName(name)]
  }

  Headers.prototype.get = function(name) {
    name = normalizeName(name)
    return this.has(name) ? this.map[name] : null
  }

  Headers.prototype.has = function(name) {
    return this.map.hasOwnProperty(normalizeName(name))
  }

  Headers.prototype.set = function(name, value) {
    this.map[normalizeName(name)] = normalizeValue(value)
  }

  Headers.prototype.forEach = function(callback, thisArg) {
    for (var name in this.map) {
      if (this.map.hasOwnProperty(name)) {
        callback.call(thisArg, this.map[name], name, this)
      }
    }
  }

  Headers.prototype.keys = function() {
    var items = []
    this.forEach(function(value, name) { items.push(name) })
    return iteratorFor(items)
  }

  Headers.prototype.values = function() {
    var items = []
    this.forEach(function(value) { items.push(value) })
    return iteratorFor(items)
  }

  Headers.prototype.entries = function() {
    var items = []
    this.forEach(function(value, name) { items.push([name, value]) })
    return iteratorFor(items)
  }

  if (support.iterable) {
    Headers.prototype[Symbol.iterator] = Headers.prototype.entries
  }

  function consumed(body) {
    if (body.bodyUsed) {
      return Promise.reject(new TypeError('Already read'))
    }
    body.bodyUsed = true
  }

  function fileReaderReady(reader) {
    return new Promise(function(resolve, reject) {
      reader.onload = function() {
        resolve(reader.result)
      }
      reader.onerror = function() {
        reject(reader.error)
      }
    })
  }

  function readBlobAsArrayBuffer(blob) {
    var reader = new FileReader()
    var promise = fileReaderReady(reader)
    reader.readAsArrayBuffer(blob)
    return promise
  }

  function readBlobAsText(blob) {
    var reader = new FileReader()
    var promise = fileReaderReady(reader)
    reader.readAsText(blob)
    return promise
  }

  function readArrayBufferAsText(buf) {
    var view = new Uint8Array(buf)
    var chars = new Array(view.length)

    for (var i = 0; i < view.length; i++) {
      chars[i] = String.fromCharCode(view[i])
    }
    return chars.join('')
  }

  function bufferClone(buf) {
    if (buf.slice) {
      return buf.slice(0)
    } else {
      var view = new Uint8Array(buf.byteLength)
      view.set(new Uint8Array(buf))
      return view.buffer
    }
  }

  function Body() {
    this.bodyUsed = false

    this._initBody = function(body) {
      this._bodyInit = body
      if (!body) {
        this._bodyText = ''
      } else if (typeof body === 'string') {
        this._bodyText = body
      } else if (support.blob && Blob.prototype.isPrototypeOf(body)) {
        this._bodyBlob = body
      } else if (support.formData && FormData.prototype.isPrototypeOf(body)) {
        this._bodyFormData = body
      } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
        this._bodyText = body.toString()
      } else if (support.arrayBuffer && support.blob && isDataView(body)) {
        this._bodyArrayBuffer = bufferClone(body.buffer)
        // IE 10-11 can't handle a DataView body.
        this._bodyInit = new Blob([this._bodyArrayBuffer])
      } else if (support.arrayBuffer && (ArrayBuffer.prototype.isPrototypeOf(body) || isArrayBufferView(body))) {
        this._bodyArrayBuffer = bufferClone(body)
      } else {
        throw new Error('unsupported BodyInit type')
      }

      if (!this.headers.get('content-type')) {
        if (typeof body === 'string') {
          this.headers.set('content-type', 'text/plain;charset=UTF-8')
        } else if (this._bodyBlob && this._bodyBlob.type) {
          this.headers.set('content-type', this._bodyBlob.type)
        } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
          this.headers.set('content-type', 'application/x-www-form-urlencoded;charset=UTF-8')
        }
      }
    }

    if (support.blob) {
      this.blob = function() {
        var rejected = consumed(this)
        if (rejected) {
          return rejected
        }

        if (this._bodyBlob) {
          return Promise.resolve(this._bodyBlob)
        } else if (this._bodyArrayBuffer) {
          return Promise.resolve(new Blob([this._bodyArrayBuffer]))
        } else if (this._bodyFormData) {
          throw new Error('could not read FormData body as blob')
        } else {
          return Promise.resolve(new Blob([this._bodyText]))
        }
      }

      this.arrayBuffer = function() {
        if (this._bodyArrayBuffer) {
          return consumed(this) || Promise.resolve(this._bodyArrayBuffer)
        } else {
          return this.blob().then(readBlobAsArrayBuffer)
        }
      }
    }

    this.text = function() {
      var rejected = consumed(this)
      if (rejected) {
        return rejected
      }

      if (this._bodyBlob) {
        return readBlobAsText(this._bodyBlob)
      } else if (this._bodyArrayBuffer) {
        return Promise.resolve(readArrayBufferAsText(this._bodyArrayBuffer))
      } else if (this._bodyFormData) {
        throw new Error('could not read FormData body as text')
      } else {
        return Promise.resolve(this._bodyText)
      }
    }

    if (support.formData) {
      this.formData = function() {
        return this.text().then(decode)
      }
    }

    this.json = function() {
      return this.text().then(JSON.parse)
    }

    return this
  }

  // HTTP methods whose capitalization should be normalized
  var methods = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'POST', 'PUT']

  function normalizeMethod(method) {
    var upcased = method.toUpperCase()
    return (methods.indexOf(upcased) > -1) ? upcased : method
  }

  function Request(input, options) {
    options = options || {}
    var body = options.body

    if (input instanceof Request) {
      if (input.bodyUsed) {
        throw new TypeError('Already read')
      }
      this.url = input.url
      this.credentials = input.credentials
      if (!options.headers) {
        this.headers = new Headers(input.headers)
      }
      this.method = input.method
      this.mode = input.mode
      if (!body && input._bodyInit != null) {
        body = input._bodyInit
        input.bodyUsed = true
      }
    } else {
      this.url = String(input)
    }

    this.credentials = options.credentials || this.credentials || 'omit'
    if (options.headers || !this.headers) {
      this.headers = new Headers(options.headers)
    }
    this.method = normalizeMethod(options.method || this.method || 'GET')
    this.mode = options.mode || this.mode || null
    this.referrer = null

    if ((this.method === 'GET' || this.method === 'HEAD') && body) {
      throw new TypeError('Body not allowed for GET or HEAD requests')
    }
    this._initBody(body)
  }

  Request.prototype.clone = function() {
    return new Request(this, { body: this._bodyInit })
  }

  function decode(body) {
    var form = new FormData()
    body.trim().split('&').forEach(function(bytes) {
      if (bytes) {
        var split = bytes.split('=')
        var name = split.shift().replace(/\+/g, ' ')
        var value = split.join('=').replace(/\+/g, ' ')
        form.append(decodeURIComponent(name), decodeURIComponent(value))
      }
    })
    return form
  }

  function parseHeaders(rawHeaders) {
    var headers = new Headers()
    // Replace instances of \r\n and \n followed by at least one space or horizontal tab with a space
    // https://tools.ietf.org/html/rfc7230#section-3.2
    var preProcessedHeaders = rawHeaders.replace(/\r?\n[\t ]+/g, ' ')
    preProcessedHeaders.split(/\r?\n/).forEach(function(line) {
      var parts = line.split(':')
      var key = parts.shift().trim()
      if (key) {
        var value = parts.join(':').trim()
        headers.append(key, value)
      }
    })
    return headers
  }

  Body.call(Request.prototype)

  function Response(bodyInit, options) {
    if (!options) {
      options = {}
    }

    this.type = 'default'
    this.status = options.status === undefined ? 200 : options.status
    this.ok = this.status >= 200 && this.status < 300
    this.statusText = 'statusText' in options ? options.statusText : 'OK'
    this.headers = new Headers(options.headers)
    this.url = options.url || ''
    this._initBody(bodyInit)
  }

  Body.call(Response.prototype)

  Response.prototype.clone = function() {
    return new Response(this._bodyInit, {
      status: this.status,
      statusText: this.statusText,
      headers: new Headers(this.headers),
      url: this.url
    })
  }

  Response.error = function() {
    var response = new Response(null, {status: 0, statusText: ''})
    response.type = 'error'
    return response
  }

  var redirectStatuses = [301, 302, 303, 307, 308]

  Response.redirect = function(url, status) {
    if (redirectStatuses.indexOf(status) === -1) {
      throw new RangeError('Invalid status code')
    }

    return new Response(null, {status: status, headers: {location: url}})
  }

  self.Headers = Headers
  self.Request = Request
  self.Response = Response

  self.fetch = function(input, init) {
    return new Promise(function(resolve, reject) {
      var request = new Request(input, init)
      var xhr = new XMLHttpRequest()

      xhr.onload = function() {
        var options = {
          status: xhr.status,
          statusText: xhr.statusText,
          headers: parseHeaders(xhr.getAllResponseHeaders() || '')
        }
        options.url = 'responseURL' in xhr ? xhr.responseURL : options.headers.get('X-Request-URL')
        var body = 'response' in xhr ? xhr.response : xhr.responseText
        resolve(new Response(body, options))
      }

      xhr.onerror = function() {
        reject(new TypeError('Network request failed'))
      }

      xhr.ontimeout = function() {
        reject(new TypeError('Network request failed'))
      }

      xhr.open(request.method, request.url, true)

      if (request.credentials === 'include') {
        xhr.withCredentials = true
      } else if (request.credentials === 'omit') {
        xhr.withCredentials = false
      }

      if ('responseType' in xhr && support.blob) {
        xhr.responseType = 'blob'
      }

      request.headers.forEach(function(value, name) {
        xhr.setRequestHeader(name, value)
      })

      xhr.send(typeof request._bodyInit === 'undefined' ? null : request._bodyInit)
    })
  }
  self.fetch.polyfill = true
})(typeof self !== 'undefined' ? self : this);


/***/ }),
/* 78 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;
exports.getOrigin = exports.httpRequest = undefined;

var _regenerator = __webpack_require__(13);

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = __webpack_require__(12);

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

__webpack_require__(77);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var httpRequest = exports.httpRequest = function () {
    var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(url) {
        var type = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'text';
        var response, txt;
        return _regenerator2.default.wrap(function _callee$(_context) {
            while (1) {
                switch (_context.prev = _context.next) {
                    case 0:
                        _context.next = 2;
                        return fetch(url, { credentials: 'same-origin' });

                    case 2:
                        response = _context.sent;

                        if (!response.ok) {
                            _context.next = 22;
                            break;
                        }

                        if (!(type === 'json')) {
                            _context.next = 11;
                            break;
                        }

                        _context.next = 7;
                        return response.text();

                    case 7:
                        txt = _context.sent;
                        return _context.abrupt('return', JSON.parse(txt));

                    case 11:
                        if (!(type === 'binary')) {
                            _context.next = 17;
                            break;
                        }

                        _context.next = 14;
                        return response.arrayBuffer();

                    case 14:
                        return _context.abrupt('return', _context.sent);

                    case 17:
                        _context.next = 19;
                        return response.text();

                    case 19:
                        return _context.abrupt('return', _context.sent);

                    case 20:
                        _context.next = 23;
                        break;

                    case 22:
                        throw new Error('httpRequest error: ' + url + ' ' + response.statusText);

                    case 23:
                    case 'end':
                        return _context.stop();
                }
            }
        }, _callee, undefined);
    }));

    return function httpRequest(_x2) {
        return _ref.apply(this, arguments);
    };
}();

var getOrigin = exports.getOrigin = function getOrigin(url) {
    // eslint-disable-next-line no-irregular-whitespace, no-useless-escape
    var parts = url.match(/^.+\:\/\/[^\‌​/]+/);
    return Array.isArray(parts) && parts.length > 0 ? parts[0] : 'unknown';
};

/***/ }),
/* 79 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;
var layerID = 'TrezorConnectInteractionLayer';

var layerInnerHtml = '\n    <div class="trezorconnect-container" id="' + layerID + '">\n        <div class="trezorconnect-window">\n            <div class="trezorconnect-head">\n                <svg class="trezorconnect-logo" x="0px" y="0px" viewBox="0 0 163.7 41.9" width="78px" height="20px" preserveAspectRatio="xMinYMin meet">\n                    <polygon points="101.1,12.8 118.2,12.8 118.2,17.3 108.9,29.9 118.2,29.9 118.2,35.2 101.1,35.2 101.1,30.7 110.4,18.1 101.1,18.1"/>\n                    <path d="M158.8,26.9c2.1-0.8,4.3-2.9,4.3-6.6c0-4.5-3.1-7.4-7.7-7.4h-10.5v22.3h5.8v-7.5h2.2l4.1,7.5h6.7L158.8,26.9z M154.7,22.5 h-4V18h4c1.5,0,2.5,0.9,2.5,2.2C157.2,21.6,156.2,22.5,154.7,22.5z"/>\n                    <path d="M130.8,12.5c-6.8,0-11.6,4.9-11.6,11.5s4.9,11.5,11.6,11.5s11.7-4.9,11.7-11.5S137.6,12.5,130.8,12.5z M130.8,30.3 c-3.4,0-5.7-2.6-5.7-6.3c0-3.8,2.3-6.3,5.7-6.3c3.4,0,5.8,2.6,5.8,6.3C136.6,27.7,134.2,30.3,130.8,30.3z"/>\n                    <polygon points="82.1,12.8 98.3,12.8 98.3,18 87.9,18 87.9,21.3 98,21.3 98,26.4 87.9,26.4 87.9,30 98.3,30 98.3,35.2 82.1,35.2 "/>\n                    <path d="M24.6,9.7C24.6,4.4,20,0,14.4,0S4.2,4.4,4.2,9.7v3.1H0v22.3h0l14.4,6.7l14.4-6.7h0V12.9h-4.2V9.7z M9.4,9.7 c0-2.5,2.2-4.5,5-4.5s5,2,5,4.5v3.1H9.4V9.7z M23,31.5l-8.6,4l-8.6-4V18.1H23V31.5z"/>\n                    <path d="M79.4,20.3c0-4.5-3.1-7.4-7.7-7.4H61.2v22.3H67v-7.5h2.2l4.1,7.5H80l-4.9-8.3C77.2,26.1,79.4,24,79.4,20.3z M71,22.5h-4V18 h4c1.5,0,2.5,0.9,2.5,2.2C73.5,21.6,72.5,22.5,71,22.5z"/>\n                    <polygon points="40.5,12.8 58.6,12.8 58.6,18.1 52.4,18.1 52.4,35.2 46.6,35.2 46.6,18.1 40.5,18.1 "/>\n                </svg>\n                <div class="trezorconnect-close">\n                    <svg x="0px" y="0px" viewBox="24 24 60 60" width="24px" height="24px" preserveAspectRatio="xMinYMin meet">\n                        <polygon class="st0" points="40,67.9 42.1,70 55,57.1 67.9,70 70,67.9 57.1,55 70,42.1 67.9,40 55,52.9 42.1,40 40,42.1 52.9,55 "/>\n                    </svg>\n                </div>\n            </div>\n            <div class="trezorconnect-body">\n                <h3>Popup was blocked</h3>\n                <p>Please click to \u201CContinue\u201D to open popup manually</p>\n                <button class="trezorconnect-open">Continue</button>\n            </div>\n        </div>\n    </div>\n';

var showPopupRequest = exports.showPopupRequest = function showPopupRequest(open, cancel) {
    if (document.getElementById(layerID)) {
        return;
    }

    var div = document.createElement('div');
    div.id = layerID;
    div.className = 'trezorconnect-container';
    div.innerHTML = layerInnerHtml;

    if (document.body) {
        document.body.appendChild(div);
    }

    var button = div.getElementsByClassName('trezorconnect-open')[0];
    button.onclick = function () {
        open();
        if (document.body) {
            document.body.removeChild(div);
        }
    };

    var close = div.getElementsByClassName('trezorconnect-close')[0];
    close.onclick = function () {
        cancel();
        if (document.body) {
            document.body.removeChild(div);
        }
    };
};

/***/ }),
/* 80 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;

var _regenerator = __webpack_require__(13);

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = __webpack_require__(12);

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _classCallCheck2 = __webpack_require__(19);

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _possibleConstructorReturn2 = __webpack_require__(45);

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = __webpack_require__(41);

var _inherits3 = _interopRequireDefault(_inherits2);

var _events = __webpack_require__(50);

var _events2 = _interopRequireDefault(_events);

var _popup = __webpack_require__(28);

var POPUP = _interopRequireWildcard(_popup);

var _showPopupRequest = __webpack_require__(79);

var _networkUtils = __webpack_require__(78);

var _deferred = __webpack_require__(40);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// const POPUP_REQUEST_TIMEOUT: number = 602;
var POPUP_REQUEST_TIMEOUT = 999;
var POPUP_CLOSE_INTERVAL = 500;
var POPUP_OPEN_TIMEOUT = 2000;

var PopupManager = function (_EventEmitter) {
    (0, _inherits3.default)(PopupManager, _EventEmitter);

    // $FlowIssue chrome not declared outside
    // Window
    function PopupManager(settings) {
        (0, _classCallCheck3.default)(this, PopupManager);

        var _this = (0, _possibleConstructorReturn3.default)(this, _EventEmitter.call(this));

        _this.requestTimeout = 0;
        _this.closeInterval = 0;
        _this.extension = false;

        _this.settings = settings;
        _this.src = settings.popupSrc;
        _this.origin = (0, _networkUtils.getOrigin)(settings.popupSrc);
        _this.handleLazyLoading = _this.handleLazyLoading.bind(_this);
        // $FlowIssue chrome not declared outside
        _this.extension = typeof chrome !== 'undefined' && chrome.runtime && typeof chrome.runtime.onConnect !== 'undefined';
        if (_this.extension) {
            _this.handleExtensionConnect = _this.handleExtensionConnect.bind(_this);
            _this.handleExtensionMessage = _this.handleExtensionMessage.bind(_this);
            // $FlowIssue chrome not declared outside
            chrome.runtime.onConnect.addListener(_this.handleExtensionConnect);
        }
        return _this;
    }

    PopupManager.prototype.request = function request() {
        var _this2 = this;

        var lazyLoad = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

        // popup request
        // TODO: ie - open imediately and hide it but post handshake after timeout

        // bring popup window to front
        if (this.locked) {
            if (this._window) {
                if (this.extension) {
                    // $FlowIssue chrome not declared outside
                    chrome.tabs.update(this._window.id, { active: true });
                } else {
                    this._window.focus();
                }
            }
            return;
        }

        this.lazyLoad = lazyLoad ? (0, _deferred.create)(POPUP.INIT) : null;
        if (this.lazyLoad) {
            if (!this.extension) {
                window.addEventListener('message', this.handleLazyLoading, false);
            }
        }

        var openFn = this.open.bind(this);
        this.locked = true;
        if (!this.settings.supportedBrowser) {
            openFn();
        } else {
            this.requestTimeout = window.setTimeout(function () {
                _this2.requestTimeout = 0;
                openFn();
            }, lazyLoad || this.extension ? 1 : POPUP_REQUEST_TIMEOUT);
        }
    };

    PopupManager.prototype.cancel = function cancel() {
        this.close();
    };

    PopupManager.prototype.unlock = function unlock() {
        this.locked = false;
    };

    PopupManager.prototype.open = function open() {
        var _this3 = this;

        if (!this.settings.supportedBrowser) {
            this.openWrapper(this.src + '#unsupported');
            return;
        }

        this.openWrapper(this.lazyLoad ? this.src + '#loading' : this.src);

        this.closeInterval = window.setInterval(function () {
            if (_this3._window) {
                if (_this3.extension) {
                    // $FlowIssue chrome not declared outside
                    chrome.tabs.get(_this3._window.id, function (tab) {
                        if (!tab) {
                            _this3.close();
                            _this3.emit(POPUP.CLOSED);
                        }
                    });
                } else if (_this3._window.closed) {
                    _this3.close();
                    _this3.emit(POPUP.CLOSED);
                }
            }
        }, POPUP_CLOSE_INTERVAL);

        this.openTimeout = window.setTimeout(function () {
            if (!(_this3._window && !_this3._window.closed)) {
                _this3.close();
                (0, _showPopupRequest.showPopupRequest)(_this3.open.bind(_this3), function () {
                    _this3.emit(POPUP.CLOSED);
                });
            }
        }, POPUP_OPEN_TIMEOUT);
    };

    PopupManager.prototype.openWrapper = function openWrapper(url) {
        var _this4 = this;

        if (this.extension) {
            // $FlowIssue chrome not declared outside
            chrome.tabs.create({
                url: url
            }, function (tab) {
                _this4._window = tab;
            });
        } else {
            this._window = window.open('', '_blank');
            if (this._window) {
                this._window.location.href = url; // otherwise android/chrome loose window.opener reference
            }
        }
    };

    PopupManager.prototype.handleExtensionConnect = function handleExtensionConnect(port) {
        if (port.name === 'trezor-connect') {
            if (!this._window || this._window && this._window.id !== port.sender.tab.id) {
                port.disconnect();
                return;
            }
            this.extensionPort = port;
            this.extensionPort.onMessage.addListener(this.handleExtensionMessage);
        } else if (port.name === 'trezor-usb-permissions') {
            port.postMessage({ broadcast: this.broadcast });
        }
    };

    PopupManager.prototype.handleExtensionMessage = function handleExtensionMessage(message) {
        if (!this.extensionPort) return;
        if (message === POPUP.EXTENSION_REQUEST) {
            this.extensionPort.postMessage({ type: POPUP.EXTENSION_REQUEST, broadcast: this.broadcast });
        } else if (message === POPUP.INIT && this.lazyLoad) {
            this.lazyLoad.resolve(true);
        } else if (message === POPUP.EXTENSION_USB_PERMISSIONS) {
            // $FlowIssue chrome not declared outside
            chrome.tabs.create({
                url: 'trezor-usb-permissions.html'
            });
        } else if (message === 'window.close') {
            this.emit(POPUP.CLOSED);
            this.close();
        }
    };

    PopupManager.prototype.setBroadcast = function setBroadcast(broadcast) {
        this.broadcast = broadcast;
    };

    PopupManager.prototype.handleLazyLoading = function handleLazyLoading(event) {
        if (this.lazyLoad && event.data && event.data === POPUP.INIT) {
            this.lazyLoad.resolve(true);
            window.removeEventListener('message', this.handleLazyLoading, false);
        }
    };

    PopupManager.prototype.resolveLazyLoad = function () {
        var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee() {
            return _regenerator2.default.wrap(function _callee$(_context) {
                while (1) {
                    switch (_context.prev = _context.next) {
                        case 0:
                            if (!this.lazyLoad) {
                                _context.next = 3;
                                break;
                            }

                            _context.next = 3;
                            return this.lazyLoad.promise;

                        case 3:
                            if (this.extension) {
                                if (this.extensionPort) {
                                    this.extensionPort.postMessage({ type: POPUP.INIT });
                                }
                            } else {
                                this._window.postMessage({ type: POPUP.INIT }, this.origin);
                            }

                        case 4:
                        case 'end':
                            return _context.stop();
                    }
                }
            }, _callee, this);
        }));

        function resolveLazyLoad() {
            return _ref.apply(this, arguments);
        }

        return resolveLazyLoad;
    }();

    PopupManager.prototype.close = function close() {
        if (this.requestTimeout) {
            window.clearTimeout(this.requestTimeout);
            this.requestTimeout = 0;
        }

        if (this.openTimeout) {
            window.clearTimeout(this.openTimeout);
            this.openTimeout = 0;
        }
        if (this.closeInterval) {
            window.clearInterval(this.closeInterval);
            this.closeInterval = 0;
        }

        if (this.extensionPort) {
            this.extensionPort.disconnect();
            this.extensionPort = null;
        }

        if (this._window) {
            if (this.extension) {
                // $FlowIssue chrome not declared outside
                chrome.tabs.remove(this._window.id);
            } else {
                this._window.close();
            }
            this._window = null;
        }
    };

    PopupManager.prototype.postMessage = function postMessage(message) {
        var _this5 = this;

        // post message before popup request finalized
        if (this.requestTimeout) {
            return;
        }

        // device needs interaction but there is no popup/ui
        // maybe popup request wasn't handled
        // ignore "ui_request_window" type
        if (!this._window && message.type !== 'ui_request_window' && this.openTimeout) {
            this.close();
            (0, _showPopupRequest.showPopupRequest)(this.open.bind(this), function () {
                _this5.emit(POPUP.CLOSED);
            });
            return;
        }

        // post message to popup window
        if (this._window) {
            this._window.postMessage(message, this.origin);
        }
    };

    PopupManager.prototype.onBeforeUnload = function onBeforeUnload() {
        this.close();
    };

    PopupManager.prototype.cancelOpenTimeout = function cancelOpenTimeout() {
        window.clearTimeout(this.openTimeout);
    };

    return PopupManager;
}(_events2.default);

exports.default = PopupManager;

/***/ }),
/* 81 */
/***/ (function(module, exports, __webpack_require__) {

var $export = __webpack_require__(5);
// 19.1.2.2 / 15.2.3.5 Object.create(O [, Properties])
$export($export.S, 'Object', { create: __webpack_require__(30) });


/***/ }),
/* 82 */
/***/ (function(module, exports, __webpack_require__) {

__webpack_require__(81);
var $Object = __webpack_require__(2).Object;
module.exports = function create(P, D) {
  return $Object.create(P, D);
};


/***/ }),
/* 83 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = { "default": __webpack_require__(82), __esModule: true };

/***/ }),
/* 84 */
/***/ (function(module, exports, __webpack_require__) {

// Works with __proto__ only. Old v8 can't work with null proto objects.
/* eslint-disable no-proto */
var isObject = __webpack_require__(4);
var anObject = __webpack_require__(3);
var check = function (O, proto) {
  anObject(O);
  if (!isObject(proto) && proto !== null) throw TypeError(proto + ": can't set as prototype!");
};
module.exports = {
  set: Object.setPrototypeOf || ('__proto__' in {} ? // eslint-disable-line
    function (test, buggy, set) {
      try {
        set = __webpack_require__(17)(Function.call, __webpack_require__(42).f(Object.prototype, '__proto__').set, 2);
        set(test, []);
        buggy = !(test instanceof Array);
      } catch (e) { buggy = true; }
      return function setPrototypeOf(O, proto) {
        check(O, proto);
        if (buggy) O.__proto__ = proto;
        else set(O, proto);
        return O;
      };
    }({}, false) : undefined),
  check: check
};


/***/ }),
/* 85 */
/***/ (function(module, exports, __webpack_require__) {

// 19.1.3.19 Object.setPrototypeOf(O, proto)
var $export = __webpack_require__(5);
$export($export.S, 'Object', { setPrototypeOf: __webpack_require__(84).set });


/***/ }),
/* 86 */
/***/ (function(module, exports, __webpack_require__) {

__webpack_require__(85);
module.exports = __webpack_require__(2).Object.setPrototypeOf;


/***/ }),
/* 87 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = { "default": __webpack_require__(86), __esModule: true };

/***/ }),
/* 88 */
/***/ (function(module, exports, __webpack_require__) {

__webpack_require__(25)('observable');


/***/ }),
/* 89 */
/***/ (function(module, exports, __webpack_require__) {

__webpack_require__(25)('asyncIterator');


/***/ }),
/* 90 */
/***/ (function(module, exports, __webpack_require__) {

// fallback for IE11 buggy Object.getOwnPropertyNames with iframe and window
var toIObject = __webpack_require__(10);
var gOPN = __webpack_require__(43).f;
var toString = {}.toString;

var windowNames = typeof window == 'object' && window && Object.getOwnPropertyNames
  ? Object.getOwnPropertyNames(window) : [];

var getWindowNames = function (it) {
  try {
    return gOPN(it);
  } catch (e) {
    return windowNames.slice();
  }
};

module.exports.f = function getOwnPropertyNames(it) {
  return windowNames && toString.call(it) == '[object Window]' ? getWindowNames(it) : gOPN(toIObject(it));
};


/***/ }),
/* 91 */
/***/ (function(module, exports, __webpack_require__) {

// 7.2.2 IsArray(argument)
var cof = __webpack_require__(15);
module.exports = Array.isArray || function isArray(arg) {
  return cof(arg) == 'Array';
};


/***/ }),
/* 92 */
/***/ (function(module, exports, __webpack_require__) {

// all enumerable object keys, includes symbols
var getKeys = __webpack_require__(22);
var gOPS = __webpack_require__(32);
var pIE = __webpack_require__(20);
module.exports = function (it) {
  var result = getKeys(it);
  var getSymbols = gOPS.f;
  if (getSymbols) {
    var symbols = getSymbols(it);
    var isEnum = pIE.f;
    var i = 0;
    var key;
    while (symbols.length > i) if (isEnum.call(it, key = symbols[i++])) result.push(key);
  } return result;
};


/***/ }),
/* 93 */
/***/ (function(module, exports, __webpack_require__) {

var META = __webpack_require__(21)('meta');
var isObject = __webpack_require__(4);
var has = __webpack_require__(6);
var setDesc = __webpack_require__(8).f;
var id = 0;
var isExtensible = Object.isExtensible || function () {
  return true;
};
var FREEZE = !__webpack_require__(16)(function () {
  return isExtensible(Object.preventExtensions({}));
});
var setMeta = function (it) {
  setDesc(it, META, { value: {
    i: 'O' + ++id, // object ID
    w: {}          // weak collections IDs
  } });
};
var fastKey = function (it, create) {
  // return primitive with prefix
  if (!isObject(it)) return typeof it == 'symbol' ? it : (typeof it == 'string' ? 'S' : 'P') + it;
  if (!has(it, META)) {
    // can't set metadata to uncaught frozen object
    if (!isExtensible(it)) return 'F';
    // not necessary to add metadata
    if (!create) return 'E';
    // add missing metadata
    setMeta(it);
  // return object ID
  } return it[META].i;
};
var getWeak = function (it, create) {
  if (!has(it, META)) {
    // can't set metadata to uncaught frozen object
    if (!isExtensible(it)) return true;
    // not necessary to add metadata
    if (!create) return false;
    // add missing metadata
    setMeta(it);
  // return hash weak collections IDs
  } return it[META].w;
};
// add metadata on freeze-family methods calling
var onFreeze = function (it) {
  if (FREEZE && meta.NEED && isExtensible(it) && !has(it, META)) setMeta(it);
  return it;
};
var meta = module.exports = {
  KEY: META,
  NEED: false,
  fastKey: fastKey,
  getWeak: getWeak,
  onFreeze: onFreeze
};


/***/ }),
/* 94 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// ECMAScript 6 symbols shim
var global = __webpack_require__(0);
var has = __webpack_require__(6);
var DESCRIPTORS = __webpack_require__(7);
var $export = __webpack_require__(5);
var redefine = __webpack_require__(58);
var META = __webpack_require__(93).KEY;
var $fails = __webpack_require__(16);
var shared = __webpack_require__(34);
var setToStringTag = __webpack_require__(18);
var uid = __webpack_require__(21);
var wks = __webpack_require__(1);
var wksExt = __webpack_require__(26);
var wksDefine = __webpack_require__(25);
var enumKeys = __webpack_require__(92);
var isArray = __webpack_require__(91);
var anObject = __webpack_require__(3);
var isObject = __webpack_require__(4);
var toIObject = __webpack_require__(10);
var toPrimitive = __webpack_require__(38);
var createDesc = __webpack_require__(23);
var _create = __webpack_require__(30);
var gOPNExt = __webpack_require__(90);
var $GOPD = __webpack_require__(42);
var $DP = __webpack_require__(8);
var $keys = __webpack_require__(22);
var gOPD = $GOPD.f;
var dP = $DP.f;
var gOPN = gOPNExt.f;
var $Symbol = global.Symbol;
var $JSON = global.JSON;
var _stringify = $JSON && $JSON.stringify;
var PROTOTYPE = 'prototype';
var HIDDEN = wks('_hidden');
var TO_PRIMITIVE = wks('toPrimitive');
var isEnum = {}.propertyIsEnumerable;
var SymbolRegistry = shared('symbol-registry');
var AllSymbols = shared('symbols');
var OPSymbols = shared('op-symbols');
var ObjectProto = Object[PROTOTYPE];
var USE_NATIVE = typeof $Symbol == 'function';
var QObject = global.QObject;
// Don't use setters in Qt Script, https://github.com/zloirock/core-js/issues/173
var setter = !QObject || !QObject[PROTOTYPE] || !QObject[PROTOTYPE].findChild;

// fallback for old Android, https://code.google.com/p/v8/issues/detail?id=687
var setSymbolDesc = DESCRIPTORS && $fails(function () {
  return _create(dP({}, 'a', {
    get: function () { return dP(this, 'a', { value: 7 }).a; }
  })).a != 7;
}) ? function (it, key, D) {
  var protoDesc = gOPD(ObjectProto, key);
  if (protoDesc) delete ObjectProto[key];
  dP(it, key, D);
  if (protoDesc && it !== ObjectProto) dP(ObjectProto, key, protoDesc);
} : dP;

var wrap = function (tag) {
  var sym = AllSymbols[tag] = _create($Symbol[PROTOTYPE]);
  sym._k = tag;
  return sym;
};

var isSymbol = USE_NATIVE && typeof $Symbol.iterator == 'symbol' ? function (it) {
  return typeof it == 'symbol';
} : function (it) {
  return it instanceof $Symbol;
};

var $defineProperty = function defineProperty(it, key, D) {
  if (it === ObjectProto) $defineProperty(OPSymbols, key, D);
  anObject(it);
  key = toPrimitive(key, true);
  anObject(D);
  if (has(AllSymbols, key)) {
    if (!D.enumerable) {
      if (!has(it, HIDDEN)) dP(it, HIDDEN, createDesc(1, {}));
      it[HIDDEN][key] = true;
    } else {
      if (has(it, HIDDEN) && it[HIDDEN][key]) it[HIDDEN][key] = false;
      D = _create(D, { enumerable: createDesc(0, false) });
    } return setSymbolDesc(it, key, D);
  } return dP(it, key, D);
};
var $defineProperties = function defineProperties(it, P) {
  anObject(it);
  var keys = enumKeys(P = toIObject(P));
  var i = 0;
  var l = keys.length;
  var key;
  while (l > i) $defineProperty(it, key = keys[i++], P[key]);
  return it;
};
var $create = function create(it, P) {
  return P === undefined ? _create(it) : $defineProperties(_create(it), P);
};
var $propertyIsEnumerable = function propertyIsEnumerable(key) {
  var E = isEnum.call(this, key = toPrimitive(key, true));
  if (this === ObjectProto && has(AllSymbols, key) && !has(OPSymbols, key)) return false;
  return E || !has(this, key) || !has(AllSymbols, key) || has(this, HIDDEN) && this[HIDDEN][key] ? E : true;
};
var $getOwnPropertyDescriptor = function getOwnPropertyDescriptor(it, key) {
  it = toIObject(it);
  key = toPrimitive(key, true);
  if (it === ObjectProto && has(AllSymbols, key) && !has(OPSymbols, key)) return;
  var D = gOPD(it, key);
  if (D && has(AllSymbols, key) && !(has(it, HIDDEN) && it[HIDDEN][key])) D.enumerable = true;
  return D;
};
var $getOwnPropertyNames = function getOwnPropertyNames(it) {
  var names = gOPN(toIObject(it));
  var result = [];
  var i = 0;
  var key;
  while (names.length > i) {
    if (!has(AllSymbols, key = names[i++]) && key != HIDDEN && key != META) result.push(key);
  } return result;
};
var $getOwnPropertySymbols = function getOwnPropertySymbols(it) {
  var IS_OP = it === ObjectProto;
  var names = gOPN(IS_OP ? OPSymbols : toIObject(it));
  var result = [];
  var i = 0;
  var key;
  while (names.length > i) {
    if (has(AllSymbols, key = names[i++]) && (IS_OP ? has(ObjectProto, key) : true)) result.push(AllSymbols[key]);
  } return result;
};

// 19.4.1.1 Symbol([description])
if (!USE_NATIVE) {
  $Symbol = function Symbol() {
    if (this instanceof $Symbol) throw TypeError('Symbol is not a constructor!');
    var tag = uid(arguments.length > 0 ? arguments[0] : undefined);
    var $set = function (value) {
      if (this === ObjectProto) $set.call(OPSymbols, value);
      if (has(this, HIDDEN) && has(this[HIDDEN], tag)) this[HIDDEN][tag] = false;
      setSymbolDesc(this, tag, createDesc(1, value));
    };
    if (DESCRIPTORS && setter) setSymbolDesc(ObjectProto, tag, { configurable: true, set: $set });
    return wrap(tag);
  };
  redefine($Symbol[PROTOTYPE], 'toString', function toString() {
    return this._k;
  });

  $GOPD.f = $getOwnPropertyDescriptor;
  $DP.f = $defineProperty;
  __webpack_require__(43).f = gOPNExt.f = $getOwnPropertyNames;
  __webpack_require__(20).f = $propertyIsEnumerable;
  __webpack_require__(32).f = $getOwnPropertySymbols;

  if (DESCRIPTORS && !__webpack_require__(14)) {
    redefine(ObjectProto, 'propertyIsEnumerable', $propertyIsEnumerable, true);
  }

  wksExt.f = function (name) {
    return wrap(wks(name));
  };
}

$export($export.G + $export.W + $export.F * !USE_NATIVE, { Symbol: $Symbol });

for (var es6Symbols = (
  // 19.4.2.2, 19.4.2.3, 19.4.2.4, 19.4.2.6, 19.4.2.8, 19.4.2.9, 19.4.2.10, 19.4.2.11, 19.4.2.12, 19.4.2.13, 19.4.2.14
  'hasInstance,isConcatSpreadable,iterator,match,replace,search,species,split,toPrimitive,toStringTag,unscopables'
).split(','), j = 0; es6Symbols.length > j;)wks(es6Symbols[j++]);

for (var wellKnownSymbols = $keys(wks.store), k = 0; wellKnownSymbols.length > k;) wksDefine(wellKnownSymbols[k++]);

$export($export.S + $export.F * !USE_NATIVE, 'Symbol', {
  // 19.4.2.1 Symbol.for(key)
  'for': function (key) {
    return has(SymbolRegistry, key += '')
      ? SymbolRegistry[key]
      : SymbolRegistry[key] = $Symbol(key);
  },
  // 19.4.2.5 Symbol.keyFor(sym)
  keyFor: function keyFor(sym) {
    if (!isSymbol(sym)) throw TypeError(sym + ' is not a symbol!');
    for (var key in SymbolRegistry) if (SymbolRegistry[key] === sym) return key;
  },
  useSetter: function () { setter = true; },
  useSimple: function () { setter = false; }
});

$export($export.S + $export.F * !USE_NATIVE, 'Object', {
  // 19.1.2.2 Object.create(O [, Properties])
  create: $create,
  // 19.1.2.4 Object.defineProperty(O, P, Attributes)
  defineProperty: $defineProperty,
  // 19.1.2.3 Object.defineProperties(O, Properties)
  defineProperties: $defineProperties,
  // 19.1.2.6 Object.getOwnPropertyDescriptor(O, P)
  getOwnPropertyDescriptor: $getOwnPropertyDescriptor,
  // 19.1.2.7 Object.getOwnPropertyNames(O)
  getOwnPropertyNames: $getOwnPropertyNames,
  // 19.1.2.8 Object.getOwnPropertySymbols(O)
  getOwnPropertySymbols: $getOwnPropertySymbols
});

// 24.3.2 JSON.stringify(value [, replacer [, space]])
$JSON && $export($export.S + $export.F * (!USE_NATIVE || $fails(function () {
  var S = $Symbol();
  // MS Edge converts symbol values to JSON as {}
  // WebKit converts symbol values to JSON as null
  // V8 throws on boxed symbols
  return _stringify([S]) != '[null]' || _stringify({ a: S }) != '{}' || _stringify(Object(S)) != '{}';
})), 'JSON', {
  stringify: function stringify(it) {
    var args = [it];
    var i = 1;
    var replacer, $replacer;
    while (arguments.length > i) args.push(arguments[i++]);
    $replacer = replacer = args[1];
    if (!isObject(replacer) && it === undefined || isSymbol(it)) return; // IE8 returns string on undefined
    if (!isArray(replacer)) replacer = function (key, value) {
      if (typeof $replacer == 'function') value = $replacer.call(this, key, value);
      if (!isSymbol(value)) return value;
    };
    args[1] = replacer;
    return _stringify.apply($JSON, args);
  }
});

// 19.4.3.4 Symbol.prototype[@@toPrimitive](hint)
$Symbol[PROTOTYPE][TO_PRIMITIVE] || __webpack_require__(9)($Symbol[PROTOTYPE], TO_PRIMITIVE, $Symbol[PROTOTYPE].valueOf);
// 19.4.3.5 Symbol.prototype[@@toStringTag]
setToStringTag($Symbol, 'Symbol');
// 20.2.1.9 Math[@@toStringTag]
setToStringTag(Math, 'Math', true);
// 24.3.3 JSON[@@toStringTag]
setToStringTag(global.JSON, 'JSON', true);


/***/ }),
/* 95 */
/***/ (function(module, exports, __webpack_require__) {

__webpack_require__(94);
__webpack_require__(61);
__webpack_require__(89);
__webpack_require__(88);
module.exports = __webpack_require__(2).Symbol;


/***/ }),
/* 96 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = { "default": __webpack_require__(95), __esModule: true };

/***/ }),
/* 97 */
/***/ (function(module, exports, __webpack_require__) {

__webpack_require__(60);
__webpack_require__(56);
module.exports = __webpack_require__(26).f('iterator');


/***/ }),
/* 98 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = { "default": __webpack_require__(97), __esModule: true };

/***/ }),
/* 99 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;
var BOOTSTRAP = exports.BOOTSTRAP = 'iframe-bootstrap';
var ERROR = exports.ERROR = 'iframe-error';
var CALL = exports.CALL = 'iframe-call';
var RESPONSE = exports.RESPONSE = 'iframe-response';

/***/ }),
/* 100 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// https://github.com/tc39/proposal-promise-try
var $export = __webpack_require__(5);
var newPromiseCapability = __webpack_require__(29);
var perform = __webpack_require__(52);

$export($export.S, 'Promise', { 'try': function (callbackfn) {
  var promiseCapability = newPromiseCapability.f(this);
  var result = perform(callbackfn);
  (result.e ? promiseCapability.reject : promiseCapability.resolve)(result.v);
  return promiseCapability.promise;
} });


/***/ }),
/* 101 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
// https://github.com/tc39/proposal-promise-finally

var $export = __webpack_require__(5);
var core = __webpack_require__(2);
var global = __webpack_require__(0);
var speciesConstructor = __webpack_require__(54);
var promiseResolve = __webpack_require__(51);

$export($export.P + $export.R, 'Promise', { 'finally': function (onFinally) {
  var C = speciesConstructor(this, core.Promise || global.Promise);
  var isFunction = typeof onFinally == 'function';
  return this.then(
    isFunction ? function (x) {
      return promiseResolve(C, onFinally()).then(function () { return x; });
    } : onFinally,
    isFunction ? function (e) {
      return promiseResolve(C, onFinally()).then(function () { throw e; });
    } : onFinally
  );
} });


/***/ }),
/* 102 */
/***/ (function(module, exports, __webpack_require__) {

var ITERATOR = __webpack_require__(1)('iterator');
var SAFE_CLOSING = false;

try {
  var riter = [7][ITERATOR]();
  riter['return'] = function () { SAFE_CLOSING = true; };
  // eslint-disable-next-line no-throw-literal
  Array.from(riter, function () { throw 2; });
} catch (e) { /* empty */ }

module.exports = function (exec, skipClosing) {
  if (!skipClosing && !SAFE_CLOSING) return false;
  var safe = false;
  try {
    var arr = [7];
    var iter = arr[ITERATOR]();
    iter.next = function () { return { done: safe = true }; };
    arr[ITERATOR] = function () { return iter; };
    exec(arr);
  } catch (e) { /* empty */ }
  return safe;
};


/***/ }),
/* 103 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var global = __webpack_require__(0);
var core = __webpack_require__(2);
var dP = __webpack_require__(8);
var DESCRIPTORS = __webpack_require__(7);
var SPECIES = __webpack_require__(1)('species');

module.exports = function (KEY) {
  var C = typeof core[KEY] == 'function' ? core[KEY] : global[KEY];
  if (DESCRIPTORS && C && !C[SPECIES]) dP.f(C, SPECIES, {
    configurable: true,
    get: function () { return this; }
  });
};


/***/ }),
/* 104 */
/***/ (function(module, exports, __webpack_require__) {

var hide = __webpack_require__(9);
module.exports = function (target, src, safe) {
  for (var key in src) {
    if (safe && target[key]) target[key] = src[key];
    else hide(target, key, src[key]);
  } return target;
};


/***/ }),
/* 105 */
/***/ (function(module, exports, __webpack_require__) {

var global = __webpack_require__(0);
var navigator = global.navigator;

module.exports = navigator && navigator.userAgent || '';


/***/ }),
/* 106 */
/***/ (function(module, exports, __webpack_require__) {

var global = __webpack_require__(0);
var macrotask = __webpack_require__(53).set;
var Observer = global.MutationObserver || global.WebKitMutationObserver;
var process = global.process;
var Promise = global.Promise;
var isNode = __webpack_require__(15)(process) == 'process';

module.exports = function () {
  var head, last, notify;

  var flush = function () {
    var parent, fn;
    if (isNode && (parent = process.domain)) parent.exit();
    while (head) {
      fn = head.fn;
      head = head.next;
      try {
        fn();
      } catch (e) {
        if (head) notify();
        else last = undefined;
        throw e;
      }
    } last = undefined;
    if (parent) parent.enter();
  };

  // Node.js
  if (isNode) {
    notify = function () {
      process.nextTick(flush);
    };
  // browsers with MutationObserver, except iOS Safari - https://github.com/zloirock/core-js/issues/339
  } else if (Observer && !(global.navigator && global.navigator.standalone)) {
    var toggle = true;
    var node = document.createTextNode('');
    new Observer(flush).observe(node, { characterData: true }); // eslint-disable-line no-new
    notify = function () {
      node.data = toggle = !toggle;
    };
  // environments with maybe non-completely correct, but existent Promise
  } else if (Promise && Promise.resolve) {
    // Promise.resolve without an argument throws an error in LG WebOS 2
    var promise = Promise.resolve(undefined);
    notify = function () {
      promise.then(flush);
    };
  // for other environments - macrotask based on:
  // - setImmediate
  // - MessageChannel
  // - window.postMessag
  // - onreadystatechange
  // - setTimeout
  } else {
    notify = function () {
      // strange IE + webpack dev server bug - use .call(global)
      macrotask.call(global, flush);
    };
  }

  return function (fn) {
    var task = { fn: fn, next: undefined };
    if (last) last.next = task;
    if (!head) {
      head = task;
      notify();
    } last = task;
  };
};


/***/ }),
/* 107 */
/***/ (function(module, exports) {

// fast apply, http://jsperf.lnkit.com/fast-apply/5
module.exports = function (fn, args, that) {
  var un = that === undefined;
  switch (args.length) {
    case 0: return un ? fn()
                      : fn.call(that);
    case 1: return un ? fn(args[0])
                      : fn.call(that, args[0]);
    case 2: return un ? fn(args[0], args[1])
                      : fn.call(that, args[0], args[1]);
    case 3: return un ? fn(args[0], args[1], args[2])
                      : fn.call(that, args[0], args[1], args[2]);
    case 4: return un ? fn(args[0], args[1], args[2], args[3])
                      : fn.call(that, args[0], args[1], args[2], args[3]);
  } return fn.apply(that, args);
};


/***/ }),
/* 108 */
/***/ (function(module, exports, __webpack_require__) {

var classof = __webpack_require__(55);
var ITERATOR = __webpack_require__(1)('iterator');
var Iterators = __webpack_require__(11);
module.exports = __webpack_require__(2).getIteratorMethod = function (it) {
  if (it != undefined) return it[ITERATOR]
    || it['@@iterator']
    || Iterators[classof(it)];
};


/***/ }),
/* 109 */
/***/ (function(module, exports, __webpack_require__) {

// check on default Array iterator
var Iterators = __webpack_require__(11);
var ITERATOR = __webpack_require__(1)('iterator');
var ArrayProto = Array.prototype;

module.exports = function (it) {
  return it !== undefined && (Iterators.Array === it || ArrayProto[ITERATOR] === it);
};


/***/ }),
/* 110 */
/***/ (function(module, exports, __webpack_require__) {

// call something on iterator step with safe closing on error
var anObject = __webpack_require__(3);
module.exports = function (iterator, fn, value, entries) {
  try {
    return entries ? fn(anObject(value)[0], value[1]) : fn(value);
  // 7.4.6 IteratorClose(iterator, completion)
  } catch (e) {
    var ret = iterator['return'];
    if (ret !== undefined) anObject(ret.call(iterator));
    throw e;
  }
};


/***/ }),
/* 111 */
/***/ (function(module, exports, __webpack_require__) {

var ctx = __webpack_require__(17);
var call = __webpack_require__(110);
var isArrayIter = __webpack_require__(109);
var anObject = __webpack_require__(3);
var toLength = __webpack_require__(63);
var getIterFn = __webpack_require__(108);
var BREAK = {};
var RETURN = {};
var exports = module.exports = function (iterable, entries, fn, that, ITERATOR) {
  var iterFn = ITERATOR ? function () { return iterable; } : getIterFn(iterable);
  var f = ctx(fn, that, entries ? 2 : 1);
  var index = 0;
  var length, step, iterator, result;
  if (typeof iterFn != 'function') throw TypeError(iterable + ' is not iterable!');
  // fast case for arrays with default iterator
  if (isArrayIter(iterFn)) for (length = toLength(iterable.length); length > index; index++) {
    result = entries ? f(anObject(step = iterable[index])[0], step[1]) : f(iterable[index]);
    if (result === BREAK || result === RETURN) return result;
  } else for (iterator = iterFn.call(iterable); !(step = iterator.next()).done;) {
    result = call(iterator, f, step.value, entries);
    if (result === BREAK || result === RETURN) return result;
  }
};
exports.BREAK = BREAK;
exports.RETURN = RETURN;


/***/ }),
/* 112 */
/***/ (function(module, exports) {

module.exports = function (it, Constructor, name, forbiddenField) {
  if (!(it instanceof Constructor) || (forbiddenField !== undefined && forbiddenField in it)) {
    throw TypeError(name + ': incorrect invocation!');
  } return it;
};


/***/ }),
/* 113 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var LIBRARY = __webpack_require__(14);
var global = __webpack_require__(0);
var ctx = __webpack_require__(17);
var classof = __webpack_require__(55);
var $export = __webpack_require__(5);
var isObject = __webpack_require__(4);
var aFunction = __webpack_require__(24);
var anInstance = __webpack_require__(112);
var forOf = __webpack_require__(111);
var speciesConstructor = __webpack_require__(54);
var task = __webpack_require__(53).set;
var microtask = __webpack_require__(106)();
var newPromiseCapabilityModule = __webpack_require__(29);
var perform = __webpack_require__(52);
var userAgent = __webpack_require__(105);
var promiseResolve = __webpack_require__(51);
var PROMISE = 'Promise';
var TypeError = global.TypeError;
var process = global.process;
var versions = process && process.versions;
var v8 = versions && versions.v8 || '';
var $Promise = global[PROMISE];
var isNode = classof(process) == 'process';
var empty = function () { /* empty */ };
var Internal, newGenericPromiseCapability, OwnPromiseCapability, Wrapper;
var newPromiseCapability = newGenericPromiseCapability = newPromiseCapabilityModule.f;

var USE_NATIVE = !!function () {
  try {
    // correct subclassing with @@species support
    var promise = $Promise.resolve(1);
    var FakePromise = (promise.constructor = {})[__webpack_require__(1)('species')] = function (exec) {
      exec(empty, empty);
    };
    // unhandled rejections tracking support, NodeJS Promise without it fails @@species test
    return (isNode || typeof PromiseRejectionEvent == 'function')
      && promise.then(empty) instanceof FakePromise
      // v8 6.6 (Node 10 and Chrome 66) have a bug with resolving custom thenables
      // https://bugs.chromium.org/p/chromium/issues/detail?id=830565
      // we can't detect it synchronously, so just check versions
      && v8.indexOf('6.6') !== 0
      && userAgent.indexOf('Chrome/66') === -1;
  } catch (e) { /* empty */ }
}();

// helpers
var isThenable = function (it) {
  var then;
  return isObject(it) && typeof (then = it.then) == 'function' ? then : false;
};
var notify = function (promise, isReject) {
  if (promise._n) return;
  promise._n = true;
  var chain = promise._c;
  microtask(function () {
    var value = promise._v;
    var ok = promise._s == 1;
    var i = 0;
    var run = function (reaction) {
      var handler = ok ? reaction.ok : reaction.fail;
      var resolve = reaction.resolve;
      var reject = reaction.reject;
      var domain = reaction.domain;
      var result, then, exited;
      try {
        if (handler) {
          if (!ok) {
            if (promise._h == 2) onHandleUnhandled(promise);
            promise._h = 1;
          }
          if (handler === true) result = value;
          else {
            if (domain) domain.enter();
            result = handler(value); // may throw
            if (domain) {
              domain.exit();
              exited = true;
            }
          }
          if (result === reaction.promise) {
            reject(TypeError('Promise-chain cycle'));
          } else if (then = isThenable(result)) {
            then.call(result, resolve, reject);
          } else resolve(result);
        } else reject(value);
      } catch (e) {
        if (domain && !exited) domain.exit();
        reject(e);
      }
    };
    while (chain.length > i) run(chain[i++]); // variable length - can't use forEach
    promise._c = [];
    promise._n = false;
    if (isReject && !promise._h) onUnhandled(promise);
  });
};
var onUnhandled = function (promise) {
  task.call(global, function () {
    var value = promise._v;
    var unhandled = isUnhandled(promise);
    var result, handler, console;
    if (unhandled) {
      result = perform(function () {
        if (isNode) {
          process.emit('unhandledRejection', value, promise);
        } else if (handler = global.onunhandledrejection) {
          handler({ promise: promise, reason: value });
        } else if ((console = global.console) && console.error) {
          console.error('Unhandled promise rejection', value);
        }
      });
      // Browsers should not trigger `rejectionHandled` event if it was handled here, NodeJS - should
      promise._h = isNode || isUnhandled(promise) ? 2 : 1;
    } promise._a = undefined;
    if (unhandled && result.e) throw result.v;
  });
};
var isUnhandled = function (promise) {
  return promise._h !== 1 && (promise._a || promise._c).length === 0;
};
var onHandleUnhandled = function (promise) {
  task.call(global, function () {
    var handler;
    if (isNode) {
      process.emit('rejectionHandled', promise);
    } else if (handler = global.onrejectionhandled) {
      handler({ promise: promise, reason: promise._v });
    }
  });
};
var $reject = function (value) {
  var promise = this;
  if (promise._d) return;
  promise._d = true;
  promise = promise._w || promise; // unwrap
  promise._v = value;
  promise._s = 2;
  if (!promise._a) promise._a = promise._c.slice();
  notify(promise, true);
};
var $resolve = function (value) {
  var promise = this;
  var then;
  if (promise._d) return;
  promise._d = true;
  promise = promise._w || promise; // unwrap
  try {
    if (promise === value) throw TypeError("Promise can't be resolved itself");
    if (then = isThenable(value)) {
      microtask(function () {
        var wrapper = { _w: promise, _d: false }; // wrap
        try {
          then.call(value, ctx($resolve, wrapper, 1), ctx($reject, wrapper, 1));
        } catch (e) {
          $reject.call(wrapper, e);
        }
      });
    } else {
      promise._v = value;
      promise._s = 1;
      notify(promise, false);
    }
  } catch (e) {
    $reject.call({ _w: promise, _d: false }, e); // wrap
  }
};

// constructor polyfill
if (!USE_NATIVE) {
  // 25.4.3.1 Promise(executor)
  $Promise = function Promise(executor) {
    anInstance(this, $Promise, PROMISE, '_h');
    aFunction(executor);
    Internal.call(this);
    try {
      executor(ctx($resolve, this, 1), ctx($reject, this, 1));
    } catch (err) {
      $reject.call(this, err);
    }
  };
  // eslint-disable-next-line no-unused-vars
  Internal = function Promise(executor) {
    this._c = [];             // <- awaiting reactions
    this._a = undefined;      // <- checked in isUnhandled reactions
    this._s = 0;              // <- state
    this._d = false;          // <- done
    this._v = undefined;      // <- value
    this._h = 0;              // <- rejection state, 0 - default, 1 - handled, 2 - unhandled
    this._n = false;          // <- notify
  };
  Internal.prototype = __webpack_require__(104)($Promise.prototype, {
    // 25.4.5.3 Promise.prototype.then(onFulfilled, onRejected)
    then: function then(onFulfilled, onRejected) {
      var reaction = newPromiseCapability(speciesConstructor(this, $Promise));
      reaction.ok = typeof onFulfilled == 'function' ? onFulfilled : true;
      reaction.fail = typeof onRejected == 'function' && onRejected;
      reaction.domain = isNode ? process.domain : undefined;
      this._c.push(reaction);
      if (this._a) this._a.push(reaction);
      if (this._s) notify(this, false);
      return reaction.promise;
    },
    // 25.4.5.1 Promise.prototype.catch(onRejected)
    'catch': function (onRejected) {
      return this.then(undefined, onRejected);
    }
  });
  OwnPromiseCapability = function () {
    var promise = new Internal();
    this.promise = promise;
    this.resolve = ctx($resolve, promise, 1);
    this.reject = ctx($reject, promise, 1);
  };
  newPromiseCapabilityModule.f = newPromiseCapability = function (C) {
    return C === $Promise || C === Wrapper
      ? new OwnPromiseCapability(C)
      : newGenericPromiseCapability(C);
  };
}

$export($export.G + $export.W + $export.F * !USE_NATIVE, { Promise: $Promise });
__webpack_require__(18)($Promise, PROMISE);
__webpack_require__(103)(PROMISE);
Wrapper = __webpack_require__(2)[PROMISE];

// statics
$export($export.S + $export.F * !USE_NATIVE, PROMISE, {
  // 25.4.4.5 Promise.reject(r)
  reject: function reject(r) {
    var capability = newPromiseCapability(this);
    var $$reject = capability.reject;
    $$reject(r);
    return capability.promise;
  }
});
$export($export.S + $export.F * (LIBRARY || !USE_NATIVE), PROMISE, {
  // 25.4.4.6 Promise.resolve(x)
  resolve: function resolve(x) {
    return promiseResolve(LIBRARY && this === Wrapper ? $Promise : this, x);
  }
});
$export($export.S + $export.F * !(USE_NATIVE && __webpack_require__(102)(function (iter) {
  $Promise.all(iter)['catch'](empty);
})), PROMISE, {
  // 25.4.4.1 Promise.all(iterable)
  all: function all(iterable) {
    var C = this;
    var capability = newPromiseCapability(C);
    var resolve = capability.resolve;
    var reject = capability.reject;
    var result = perform(function () {
      var values = [];
      var index = 0;
      var remaining = 1;
      forOf(iterable, false, function (promise) {
        var $index = index++;
        var alreadyCalled = false;
        values.push(undefined);
        remaining++;
        C.resolve(promise).then(function (value) {
          if (alreadyCalled) return;
          alreadyCalled = true;
          values[$index] = value;
          --remaining || resolve(values);
        }, reject);
      });
      --remaining || resolve(values);
    });
    if (result.e) reject(result.v);
    return capability.promise;
  },
  // 25.4.4.4 Promise.race(iterable)
  race: function race(iterable) {
    var C = this;
    var capability = newPromiseCapability(C);
    var reject = capability.reject;
    var result = perform(function () {
      forOf(iterable, false, function (promise) {
        C.resolve(promise).then(capability.resolve, reject);
      });
    });
    if (result.e) reject(result.v);
    return capability.promise;
  }
});


/***/ }),
/* 114 */
/***/ (function(module, exports) {

module.exports = function (done, value) {
  return { value: value, done: !!done };
};


/***/ }),
/* 115 */
/***/ (function(module, exports) {

module.exports = function () { /* empty */ };


/***/ }),
/* 116 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var addToUnscopables = __webpack_require__(115);
var step = __webpack_require__(114);
var Iterators = __webpack_require__(11);
var toIObject = __webpack_require__(10);

// 22.1.3.4 Array.prototype.entries()
// 22.1.3.13 Array.prototype.keys()
// 22.1.3.29 Array.prototype.values()
// 22.1.3.30 Array.prototype[@@iterator]()
module.exports = __webpack_require__(59)(Array, 'Array', function (iterated, kind) {
  this._t = toIObject(iterated); // target
  this._i = 0;                   // next index
  this._k = kind;                // kind
// 22.1.5.2.1 %ArrayIteratorPrototype%.next()
}, function () {
  var O = this._t;
  var kind = this._k;
  var index = this._i++;
  if (!O || index >= O.length) {
    this._t = undefined;
    return step(1);
  }
  if (kind == 'keys') return step(0, index);
  if (kind == 'values') return step(0, O[index]);
  return step(0, [index, O[index]]);
}, 'values');

// argumentsList[@@iterator] is %ArrayProto_values% (9.4.4.6, 9.4.4.7)
Iterators.Arguments = Iterators.Array;

addToUnscopables('keys');
addToUnscopables('values');
addToUnscopables('entries');


/***/ }),
/* 117 */
/***/ (function(module, exports, __webpack_require__) {

// 19.1.2.9 / 15.2.3.2 Object.getPrototypeOf(O)
var has = __webpack_require__(6);
var toObject = __webpack_require__(62);
var IE_PROTO = __webpack_require__(35)('IE_PROTO');
var ObjectProto = Object.prototype;

module.exports = Object.getPrototypeOf || function (O) {
  O = toObject(O);
  if (has(O, IE_PROTO)) return O[IE_PROTO];
  if (typeof O.constructor == 'function' && O instanceof O.constructor) {
    return O.constructor.prototype;
  } return O instanceof Object ? ObjectProto : null;
};


/***/ }),
/* 118 */
/***/ (function(module, exports, __webpack_require__) {

var dP = __webpack_require__(8);
var anObject = __webpack_require__(3);
var getKeys = __webpack_require__(22);

module.exports = __webpack_require__(7) ? Object.defineProperties : function defineProperties(O, Properties) {
  anObject(O);
  var keys = getKeys(Properties);
  var length = keys.length;
  var i = 0;
  var P;
  while (length > i) dP.f(O, P = keys[i++], Properties[P]);
  return O;
};


/***/ }),
/* 119 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var create = __webpack_require__(30);
var descriptor = __webpack_require__(23);
var setToStringTag = __webpack_require__(18);
var IteratorPrototype = {};

// 25.1.2.1.1 %IteratorPrototype%[@@iterator]()
__webpack_require__(9)(IteratorPrototype, __webpack_require__(1)('iterator'), function () { return this; });

module.exports = function (Constructor, NAME, next) {
  Constructor.prototype = create(IteratorPrototype, { next: descriptor(1, next) });
  setToStringTag(Constructor, NAME + ' Iterator');
};


/***/ }),
/* 120 */
/***/ (function(module, exports, __webpack_require__) {

var toInteger = __webpack_require__(36);
var defined = __webpack_require__(37);
// true  -> String#at
// false -> String#codePointAt
module.exports = function (TO_STRING) {
  return function (that, pos) {
    var s = String(defined(that));
    var i = toInteger(pos);
    var l = s.length;
    var a, b;
    if (i < 0 || i >= l) return TO_STRING ? '' : undefined;
    a = s.charCodeAt(i);
    return a < 0xd800 || a > 0xdbff || i + 1 === l || (b = s.charCodeAt(i + 1)) < 0xdc00 || b > 0xdfff
      ? TO_STRING ? s.charAt(i) : a
      : TO_STRING ? s.slice(i, i + 2) : (a - 0xd800 << 10) + (b - 0xdc00) + 0x10000;
  };
};


/***/ }),
/* 121 */
/***/ (function(module, exports, __webpack_require__) {

__webpack_require__(61);
__webpack_require__(60);
__webpack_require__(56);
__webpack_require__(113);
__webpack_require__(101);
__webpack_require__(100);
module.exports = __webpack_require__(2).Promise;


/***/ }),
/* 122 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = { "default": __webpack_require__(121), __esModule: true };

/***/ }),
/* 123 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(global) {/**
 * Copyright (c) 2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * https://raw.github.com/facebook/regenerator/master/LICENSE file. An
 * additional grant of patent rights can be found in the PATENTS file in
 * the same directory.
 */

!(function(global) {
  "use strict";

  var Op = Object.prototype;
  var hasOwn = Op.hasOwnProperty;
  var undefined; // More compressible than void 0.
  var $Symbol = typeof Symbol === "function" ? Symbol : {};
  var iteratorSymbol = $Symbol.iterator || "@@iterator";
  var asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator";
  var toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag";

  var inModule = typeof module === "object";
  var runtime = global.regeneratorRuntime;
  if (runtime) {
    if (inModule) {
      // If regeneratorRuntime is defined globally and we're in a module,
      // make the exports object identical to regeneratorRuntime.
      module.exports = runtime;
    }
    // Don't bother evaluating the rest of this file if the runtime was
    // already defined globally.
    return;
  }

  // Define the runtime globally (as expected by generated code) as either
  // module.exports (if we're in a module) or a new, empty object.
  runtime = global.regeneratorRuntime = inModule ? module.exports : {};

  function wrap(innerFn, outerFn, self, tryLocsList) {
    // If outerFn provided and outerFn.prototype is a Generator, then outerFn.prototype instanceof Generator.
    var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator;
    var generator = Object.create(protoGenerator.prototype);
    var context = new Context(tryLocsList || []);

    // The ._invoke method unifies the implementations of the .next,
    // .throw, and .return methods.
    generator._invoke = makeInvokeMethod(innerFn, self, context);

    return generator;
  }
  runtime.wrap = wrap;

  // Try/catch helper to minimize deoptimizations. Returns a completion
  // record like context.tryEntries[i].completion. This interface could
  // have been (and was previously) designed to take a closure to be
  // invoked without arguments, but in all the cases we care about we
  // already have an existing method we want to call, so there's no need
  // to create a new function object. We can even get away with assuming
  // the method takes exactly one argument, since that happens to be true
  // in every case, so we don't have to touch the arguments object. The
  // only additional allocation required is the completion record, which
  // has a stable shape and so hopefully should be cheap to allocate.
  function tryCatch(fn, obj, arg) {
    try {
      return { type: "normal", arg: fn.call(obj, arg) };
    } catch (err) {
      return { type: "throw", arg: err };
    }
  }

  var GenStateSuspendedStart = "suspendedStart";
  var GenStateSuspendedYield = "suspendedYield";
  var GenStateExecuting = "executing";
  var GenStateCompleted = "completed";

  // Returning this object from the innerFn has the same effect as
  // breaking out of the dispatch switch statement.
  var ContinueSentinel = {};

  // Dummy constructor functions that we use as the .constructor and
  // .constructor.prototype properties for functions that return Generator
  // objects. For full spec compliance, you may wish to configure your
  // minifier not to mangle the names of these two functions.
  function Generator() {}
  function GeneratorFunction() {}
  function GeneratorFunctionPrototype() {}

  // This is a polyfill for %IteratorPrototype% for environments that
  // don't natively support it.
  var IteratorPrototype = {};
  IteratorPrototype[iteratorSymbol] = function () {
    return this;
  };

  var getProto = Object.getPrototypeOf;
  var NativeIteratorPrototype = getProto && getProto(getProto(values([])));
  if (NativeIteratorPrototype &&
      NativeIteratorPrototype !== Op &&
      hasOwn.call(NativeIteratorPrototype, iteratorSymbol)) {
    // This environment has a native %IteratorPrototype%; use it instead
    // of the polyfill.
    IteratorPrototype = NativeIteratorPrototype;
  }

  var Gp = GeneratorFunctionPrototype.prototype =
    Generator.prototype = Object.create(IteratorPrototype);
  GeneratorFunction.prototype = Gp.constructor = GeneratorFunctionPrototype;
  GeneratorFunctionPrototype.constructor = GeneratorFunction;
  GeneratorFunctionPrototype[toStringTagSymbol] =
    GeneratorFunction.displayName = "GeneratorFunction";

  // Helper for defining the .next, .throw, and .return methods of the
  // Iterator interface in terms of a single ._invoke method.
  function defineIteratorMethods(prototype) {
    ["next", "throw", "return"].forEach(function(method) {
      prototype[method] = function(arg) {
        return this._invoke(method, arg);
      };
    });
  }

  runtime.isGeneratorFunction = function(genFun) {
    var ctor = typeof genFun === "function" && genFun.constructor;
    return ctor
      ? ctor === GeneratorFunction ||
        // For the native GeneratorFunction constructor, the best we can
        // do is to check its .name property.
        (ctor.displayName || ctor.name) === "GeneratorFunction"
      : false;
  };

  runtime.mark = function(genFun) {
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(genFun, GeneratorFunctionPrototype);
    } else {
      genFun.__proto__ = GeneratorFunctionPrototype;
      if (!(toStringTagSymbol in genFun)) {
        genFun[toStringTagSymbol] = "GeneratorFunction";
      }
    }
    genFun.prototype = Object.create(Gp);
    return genFun;
  };

  // Within the body of any async function, `await x` is transformed to
  // `yield regeneratorRuntime.awrap(x)`, so that the runtime can test
  // `hasOwn.call(value, "__await")` to determine if the yielded value is
  // meant to be awaited.
  runtime.awrap = function(arg) {
    return { __await: arg };
  };

  function AsyncIterator(generator) {
    function invoke(method, arg, resolve, reject) {
      var record = tryCatch(generator[method], generator, arg);
      if (record.type === "throw") {
        reject(record.arg);
      } else {
        var result = record.arg;
        var value = result.value;
        if (value &&
            typeof value === "object" &&
            hasOwn.call(value, "__await")) {
          return Promise.resolve(value.__await).then(function(value) {
            invoke("next", value, resolve, reject);
          }, function(err) {
            invoke("throw", err, resolve, reject);
          });
        }

        return Promise.resolve(value).then(function(unwrapped) {
          // When a yielded Promise is resolved, its final value becomes
          // the .value of the Promise<{value,done}> result for the
          // current iteration. If the Promise is rejected, however, the
          // result for this iteration will be rejected with the same
          // reason. Note that rejections of yielded Promises are not
          // thrown back into the generator function, as is the case
          // when an awaited Promise is rejected. This difference in
          // behavior between yield and await is important, because it
          // allows the consumer to decide what to do with the yielded
          // rejection (swallow it and continue, manually .throw it back
          // into the generator, abandon iteration, whatever). With
          // await, by contrast, there is no opportunity to examine the
          // rejection reason outside the generator function, so the
          // only option is to throw it from the await expression, and
          // let the generator function handle the exception.
          result.value = unwrapped;
          resolve(result);
        }, reject);
      }
    }

    if (typeof global.process === "object" && global.process.domain) {
      invoke = global.process.domain.bind(invoke);
    }

    var previousPromise;

    function enqueue(method, arg) {
      function callInvokeWithMethodAndArg() {
        return new Promise(function(resolve, reject) {
          invoke(method, arg, resolve, reject);
        });
      }

      return previousPromise =
        // If enqueue has been called before, then we want to wait until
        // all previous Promises have been resolved before calling invoke,
        // so that results are always delivered in the correct order. If
        // enqueue has not been called before, then it is important to
        // call invoke immediately, without waiting on a callback to fire,
        // so that the async generator function has the opportunity to do
        // any necessary setup in a predictable way. This predictability
        // is why the Promise constructor synchronously invokes its
        // executor callback, and why async functions synchronously
        // execute code before the first await. Since we implement simple
        // async functions in terms of async generators, it is especially
        // important to get this right, even though it requires care.
        previousPromise ? previousPromise.then(
          callInvokeWithMethodAndArg,
          // Avoid propagating failures to Promises returned by later
          // invocations of the iterator.
          callInvokeWithMethodAndArg
        ) : callInvokeWithMethodAndArg();
    }

    // Define the unified helper method that is used to implement .next,
    // .throw, and .return (see defineIteratorMethods).
    this._invoke = enqueue;
  }

  defineIteratorMethods(AsyncIterator.prototype);
  AsyncIterator.prototype[asyncIteratorSymbol] = function () {
    return this;
  };
  runtime.AsyncIterator = AsyncIterator;

  // Note that simple async functions are implemented on top of
  // AsyncIterator objects; they just return a Promise for the value of
  // the final result produced by the iterator.
  runtime.async = function(innerFn, outerFn, self, tryLocsList) {
    var iter = new AsyncIterator(
      wrap(innerFn, outerFn, self, tryLocsList)
    );

    return runtime.isGeneratorFunction(outerFn)
      ? iter // If outerFn is a generator, return the full iterator.
      : iter.next().then(function(result) {
          return result.done ? result.value : iter.next();
        });
  };

  function makeInvokeMethod(innerFn, self, context) {
    var state = GenStateSuspendedStart;

    return function invoke(method, arg) {
      if (state === GenStateExecuting) {
        throw new Error("Generator is already running");
      }

      if (state === GenStateCompleted) {
        if (method === "throw") {
          throw arg;
        }

        // Be forgiving, per 25.3.3.3.3 of the spec:
        // https://people.mozilla.org/~jorendorff/es6-draft.html#sec-generatorresume
        return doneResult();
      }

      context.method = method;
      context.arg = arg;

      while (true) {
        var delegate = context.delegate;
        if (delegate) {
          var delegateResult = maybeInvokeDelegate(delegate, context);
          if (delegateResult) {
            if (delegateResult === ContinueSentinel) continue;
            return delegateResult;
          }
        }

        if (context.method === "next") {
          // Setting context._sent for legacy support of Babel's
          // function.sent implementation.
          context.sent = context._sent = context.arg;

        } else if (context.method === "throw") {
          if (state === GenStateSuspendedStart) {
            state = GenStateCompleted;
            throw context.arg;
          }

          context.dispatchException(context.arg);

        } else if (context.method === "return") {
          context.abrupt("return", context.arg);
        }

        state = GenStateExecuting;

        var record = tryCatch(innerFn, self, context);
        if (record.type === "normal") {
          // If an exception is thrown from innerFn, we leave state ===
          // GenStateExecuting and loop back for another invocation.
          state = context.done
            ? GenStateCompleted
            : GenStateSuspendedYield;

          if (record.arg === ContinueSentinel) {
            continue;
          }

          return {
            value: record.arg,
            done: context.done
          };

        } else if (record.type === "throw") {
          state = GenStateCompleted;
          // Dispatch the exception by looping back around to the
          // context.dispatchException(context.arg) call above.
          context.method = "throw";
          context.arg = record.arg;
        }
      }
    };
  }

  // Call delegate.iterator[context.method](context.arg) and handle the
  // result, either by returning a { value, done } result from the
  // delegate iterator, or by modifying context.method and context.arg,
  // setting context.delegate to null, and returning the ContinueSentinel.
  function maybeInvokeDelegate(delegate, context) {
    var method = delegate.iterator[context.method];
    if (method === undefined) {
      // A .throw or .return when the delegate iterator has no .throw
      // method always terminates the yield* loop.
      context.delegate = null;

      if (context.method === "throw") {
        if (delegate.iterator.return) {
          // If the delegate iterator has a return method, give it a
          // chance to clean up.
          context.method = "return";
          context.arg = undefined;
          maybeInvokeDelegate(delegate, context);

          if (context.method === "throw") {
            // If maybeInvokeDelegate(context) changed context.method from
            // "return" to "throw", let that override the TypeError below.
            return ContinueSentinel;
          }
        }

        context.method = "throw";
        context.arg = new TypeError(
          "The iterator does not provide a 'throw' method");
      }

      return ContinueSentinel;
    }

    var record = tryCatch(method, delegate.iterator, context.arg);

    if (record.type === "throw") {
      context.method = "throw";
      context.arg = record.arg;
      context.delegate = null;
      return ContinueSentinel;
    }

    var info = record.arg;

    if (! info) {
      context.method = "throw";
      context.arg = new TypeError("iterator result is not an object");
      context.delegate = null;
      return ContinueSentinel;
    }

    if (info.done) {
      // Assign the result of the finished delegate to the temporary
      // variable specified by delegate.resultName (see delegateYield).
      context[delegate.resultName] = info.value;

      // Resume execution at the desired location (see delegateYield).
      context.next = delegate.nextLoc;

      // If context.method was "throw" but the delegate handled the
      // exception, let the outer generator proceed normally. If
      // context.method was "next", forget context.arg since it has been
      // "consumed" by the delegate iterator. If context.method was
      // "return", allow the original .return call to continue in the
      // outer generator.
      if (context.method !== "return") {
        context.method = "next";
        context.arg = undefined;
      }

    } else {
      // Re-yield the result returned by the delegate method.
      return info;
    }

    // The delegate iterator is finished, so forget it and continue with
    // the outer generator.
    context.delegate = null;
    return ContinueSentinel;
  }

  // Define Generator.prototype.{next,throw,return} in terms of the
  // unified ._invoke helper method.
  defineIteratorMethods(Gp);

  Gp[toStringTagSymbol] = "Generator";

  // A Generator should always return itself as the iterator object when the
  // @@iterator function is called on it. Some browsers' implementations of the
  // iterator prototype chain incorrectly implement this, causing the Generator
  // object to not be returned from this call. This ensures that doesn't happen.
  // See https://github.com/facebook/regenerator/issues/274 for more details.
  Gp[iteratorSymbol] = function() {
    return this;
  };

  Gp.toString = function() {
    return "[object Generator]";
  };

  function pushTryEntry(locs) {
    var entry = { tryLoc: locs[0] };

    if (1 in locs) {
      entry.catchLoc = locs[1];
    }

    if (2 in locs) {
      entry.finallyLoc = locs[2];
      entry.afterLoc = locs[3];
    }

    this.tryEntries.push(entry);
  }

  function resetTryEntry(entry) {
    var record = entry.completion || {};
    record.type = "normal";
    delete record.arg;
    entry.completion = record;
  }

  function Context(tryLocsList) {
    // The root entry object (effectively a try statement without a catch
    // or a finally block) gives us a place to store values thrown from
    // locations where there is no enclosing try statement.
    this.tryEntries = [{ tryLoc: "root" }];
    tryLocsList.forEach(pushTryEntry, this);
    this.reset(true);
  }

  runtime.keys = function(object) {
    var keys = [];
    for (var key in object) {
      keys.push(key);
    }
    keys.reverse();

    // Rather than returning an object with a next method, we keep
    // things simple and return the next function itself.
    return function next() {
      while (keys.length) {
        var key = keys.pop();
        if (key in object) {
          next.value = key;
          next.done = false;
          return next;
        }
      }

      // To avoid creating an additional object, we just hang the .value
      // and .done properties off the next function object itself. This
      // also ensures that the minifier will not anonymize the function.
      next.done = true;
      return next;
    };
  };

  function values(iterable) {
    if (iterable) {
      var iteratorMethod = iterable[iteratorSymbol];
      if (iteratorMethod) {
        return iteratorMethod.call(iterable);
      }

      if (typeof iterable.next === "function") {
        return iterable;
      }

      if (!isNaN(iterable.length)) {
        var i = -1, next = function next() {
          while (++i < iterable.length) {
            if (hasOwn.call(iterable, i)) {
              next.value = iterable[i];
              next.done = false;
              return next;
            }
          }

          next.value = undefined;
          next.done = true;

          return next;
        };

        return next.next = next;
      }
    }

    // Return an iterator with no values.
    return { next: doneResult };
  }
  runtime.values = values;

  function doneResult() {
    return { value: undefined, done: true };
  }

  Context.prototype = {
    constructor: Context,

    reset: function(skipTempReset) {
      this.prev = 0;
      this.next = 0;
      // Resetting context._sent for legacy support of Babel's
      // function.sent implementation.
      this.sent = this._sent = undefined;
      this.done = false;
      this.delegate = null;

      this.method = "next";
      this.arg = undefined;

      this.tryEntries.forEach(resetTryEntry);

      if (!skipTempReset) {
        for (var name in this) {
          // Not sure about the optimal order of these conditions:
          if (name.charAt(0) === "t" &&
              hasOwn.call(this, name) &&
              !isNaN(+name.slice(1))) {
            this[name] = undefined;
          }
        }
      }
    },

    stop: function() {
      this.done = true;

      var rootEntry = this.tryEntries[0];
      var rootRecord = rootEntry.completion;
      if (rootRecord.type === "throw") {
        throw rootRecord.arg;
      }

      return this.rval;
    },

    dispatchException: function(exception) {
      if (this.done) {
        throw exception;
      }

      var context = this;
      function handle(loc, caught) {
        record.type = "throw";
        record.arg = exception;
        context.next = loc;

        if (caught) {
          // If the dispatched exception was caught by a catch block,
          // then let that catch block handle the exception normally.
          context.method = "next";
          context.arg = undefined;
        }

        return !! caught;
      }

      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        var record = entry.completion;

        if (entry.tryLoc === "root") {
          // Exception thrown outside of any try block that could handle
          // it, so set the completion value of the entire function to
          // throw the exception.
          return handle("end");
        }

        if (entry.tryLoc <= this.prev) {
          var hasCatch = hasOwn.call(entry, "catchLoc");
          var hasFinally = hasOwn.call(entry, "finallyLoc");

          if (hasCatch && hasFinally) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            } else if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }

          } else if (hasCatch) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            }

          } else if (hasFinally) {
            if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }

          } else {
            throw new Error("try statement without catch or finally");
          }
        }
      }
    },

    abrupt: function(type, arg) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc <= this.prev &&
            hasOwn.call(entry, "finallyLoc") &&
            this.prev < entry.finallyLoc) {
          var finallyEntry = entry;
          break;
        }
      }

      if (finallyEntry &&
          (type === "break" ||
           type === "continue") &&
          finallyEntry.tryLoc <= arg &&
          arg <= finallyEntry.finallyLoc) {
        // Ignore the finally entry if control is not jumping to a
        // location outside the try/catch block.
        finallyEntry = null;
      }

      var record = finallyEntry ? finallyEntry.completion : {};
      record.type = type;
      record.arg = arg;

      if (finallyEntry) {
        this.method = "next";
        this.next = finallyEntry.finallyLoc;
        return ContinueSentinel;
      }

      return this.complete(record);
    },

    complete: function(record, afterLoc) {
      if (record.type === "throw") {
        throw record.arg;
      }

      if (record.type === "break" ||
          record.type === "continue") {
        this.next = record.arg;
      } else if (record.type === "return") {
        this.rval = this.arg = record.arg;
        this.method = "return";
        this.next = "end";
      } else if (record.type === "normal" && afterLoc) {
        this.next = afterLoc;
      }

      return ContinueSentinel;
    },

    finish: function(finallyLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.finallyLoc === finallyLoc) {
          this.complete(entry.completion, entry.afterLoc);
          resetTryEntry(entry);
          return ContinueSentinel;
        }
      }
    },

    "catch": function(tryLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc === tryLoc) {
          var record = entry.completion;
          if (record.type === "throw") {
            var thrown = record.arg;
            resetTryEntry(entry);
          }
          return thrown;
        }
      }

      // The context.catch method must only be called with a location
      // argument that corresponds to a known catch block.
      throw new Error("illegal catch attempt");
    },

    delegateYield: function(iterable, resultName, nextLoc) {
      this.delegate = {
        iterator: values(iterable),
        resultName: resultName,
        nextLoc: nextLoc
      };

      if (this.method === "next") {
        // Deliberately forget the last sent value so that we don't
        // accidentally pass it on to the delegate.
        this.arg = undefined;
      }

      return ContinueSentinel;
    }
  };
})(
  // Among the various tricks for obtaining a reference to the global
  // object, this seems to be the most reliable technique that does not
  // use indirect eval (which violates Content Security Policy).
  typeof global === "object" ? global :
  typeof window === "object" ? window :
  typeof self === "object" ? self : this
);

/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(31)))

/***/ }),
/* 124 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(global) {// This method of obtaining a reference to the global object needs to be
// kept identical to the way it is obtained in runtime.js
var g =
  typeof global === "object" ? global :
  typeof window === "object" ? window :
  typeof self === "object" ? self : this;

// Use `getOwnPropertyNames` because not all browsers support calling
// `hasOwnProperty` on the global `self` object in a worker. See #183.
var hadRuntime = g.regeneratorRuntime &&
  Object.getOwnPropertyNames(g).indexOf("regeneratorRuntime") >= 0;

// Save the old regeneratorRuntime in case it needs to be restored later.
var oldRuntime = hadRuntime && g.regeneratorRuntime;

// Force reevalutation of runtime.js.
g.regeneratorRuntime = undefined;

module.exports = __webpack_require__(123);

if (hadRuntime) {
  // Restore the original runtime.
  g.regeneratorRuntime = oldRuntime;
} else {
  // Remove the global property added by runtime.js.
  try {
    delete g.regeneratorRuntime;
  } catch(e) {
    g.regeneratorRuntime = undefined;
  }
}

/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(31)))

/***/ }),
/* 125 */
/***/ (function(module, exports, __webpack_require__) {

var toInteger = __webpack_require__(36);
var max = Math.max;
var min = Math.min;
module.exports = function (index, length) {
  index = toInteger(index);
  return index < 0 ? max(index + length, 0) : min(index, length);
};


/***/ }),
/* 126 */
/***/ (function(module, exports, __webpack_require__) {

// false -> Array#indexOf
// true  -> Array#includes
var toIObject = __webpack_require__(10);
var toLength = __webpack_require__(63);
var toAbsoluteIndex = __webpack_require__(125);
module.exports = function (IS_INCLUDES) {
  return function ($this, el, fromIndex) {
    var O = toIObject($this);
    var length = toLength(O.length);
    var index = toAbsoluteIndex(fromIndex, length);
    var value;
    // Array#includes uses SameValueZero equality algorithm
    // eslint-disable-next-line no-self-compare
    if (IS_INCLUDES && el != el) while (length > index) {
      value = O[index++];
      // eslint-disable-next-line no-self-compare
      if (value != value) return true;
    // Array#indexOf ignores holes, Array#includes - not
    } else for (;length > index; index++) if (IS_INCLUDES || index in O) {
      if (O[index] === el) return IS_INCLUDES || index || 0;
    } return !IS_INCLUDES && -1;
  };
};


/***/ }),
/* 127 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// 19.1.2.1 Object.assign(target, source, ...)
var getKeys = __webpack_require__(22);
var gOPS = __webpack_require__(32);
var pIE = __webpack_require__(20);
var toObject = __webpack_require__(62);
var IObject = __webpack_require__(64);
var $assign = Object.assign;

// should work with symbols and should have deterministic property order (V8 bug)
module.exports = !$assign || __webpack_require__(16)(function () {
  var A = {};
  var B = {};
  // eslint-disable-next-line no-undef
  var S = Symbol();
  var K = 'abcdefghijklmnopqrst';
  A[S] = 7;
  K.split('').forEach(function (k) { B[k] = k; });
  return $assign({}, A)[S] != 7 || Object.keys($assign({}, B)).join('') != K;
}) ? function assign(target, source) { // eslint-disable-line no-unused-vars
  var T = toObject(target);
  var aLen = arguments.length;
  var index = 1;
  var getSymbols = gOPS.f;
  var isEnum = pIE.f;
  while (aLen > index) {
    var S = IObject(arguments[index++]);
    var keys = getSymbols ? getKeys(S).concat(getSymbols(S)) : getKeys(S);
    var length = keys.length;
    var j = 0;
    var key;
    while (length > j) if (isEnum.call(S, key = keys[j++])) T[key] = S[key];
  } return T;
} : $assign;


/***/ }),
/* 128 */
/***/ (function(module, exports, __webpack_require__) {

// 19.1.3.1 Object.assign(target, source)
var $export = __webpack_require__(5);

$export($export.S + $export.F, 'Object', { assign: __webpack_require__(127) });


/***/ }),
/* 129 */
/***/ (function(module, exports, __webpack_require__) {

__webpack_require__(128);
module.exports = __webpack_require__(2).Object.assign;


/***/ }),
/* 130 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = { "default": __webpack_require__(129), __esModule: true };

/***/ }),
/* 131 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/**
 * (C) 2017 SatoshiLabs
 * GPLv3
 */

exports.__esModule = true;
exports.TRANSPORT_EVENT = exports.DEVICE_EVENT = exports.UI_EVENT = exports.DEVICE = exports.UI = exports.TRANSPORT = undefined;

var _extends2 = __webpack_require__(67);

var _extends3 = _interopRequireDefault(_extends2);

var _classCallCheck2 = __webpack_require__(19);

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _regenerator = __webpack_require__(13);

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = __webpack_require__(12);

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _events = __webpack_require__(50);

var _events2 = _interopRequireDefault(_events);

var _constants = __webpack_require__(49);

var _transport = __webpack_require__(48);

var TRANSPORT = _interopRequireWildcard(_transport);

var _popup = __webpack_require__(28);

var POPUP = _interopRequireWildcard(_popup);

var _iframe = __webpack_require__(99);

var IFRAME = _interopRequireWildcard(_iframe);

var _ui = __webpack_require__(27);

var UI = _interopRequireWildcard(_ui);

var _device = __webpack_require__(47);

var DEVICE = _interopRequireWildcard(_device);

var _errors = __webpack_require__(46);

var _PopupManager = __webpack_require__(80);

var _PopupManager2 = _interopRequireDefault(_PopupManager);

var _builder = __webpack_require__(76);

var iframe = _interopRequireWildcard(_builder);

var _button = __webpack_require__(74);

var _button2 = _interopRequireDefault(_button);

var _debug = __webpack_require__(73);

var _debug2 = _interopRequireDefault(_debug);

var _message = __webpack_require__(72);

var _ConnectSettings = __webpack_require__(71);

var _types = __webpack_require__(70);

var $T = _interopRequireWildcard(_types);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var eventEmitter = new _events2.default();
var _log = (0, _debug.init)('[trezor-connect.js]');

var _settings = void 0;
var _popupManager = void 0;

var initPopupManager = function initPopupManager() {
    var pm = new _PopupManager2.default(_settings);
    pm.on(POPUP.CLOSED, function () {
        iframe.postMessage({ type: POPUP.CLOSED }, false);
    });
    return pm;
};

// handle message received from iframe
var handleMessage = function handleMessage(messageEvent) {
    // ignore messages from domain other then iframe origin
    if (messageEvent.origin !== iframe.origin) return;

    var message = (0, _message.parseMessage)(messageEvent.data);
    // TODO: destructuring with type
    // https://github.com/Microsoft/TypeScript/issues/240
    // const { id, event, type, data, error }: CoreMessage = message;
    var id = message.id || 0;
    var event = message.event;
    var type = message.type;
    var payload = message.payload;

    _log.log('handleMessage', message);

    switch (event) {
        case _constants.RESPONSE_EVENT:
            if (iframe.messagePromises[id]) {
                // clear unnecessary fields from message object
                delete message.type;
                delete message.event;
                // delete message.id;
                // message.__id = id;
                // resolve message promise (send result of call method)
                iframe.messagePromises[id].resolve(message);
                delete iframe.messagePromises[id];
            } else {
                _log.warn('Unknown message id ' + id);
            }
            break;

        case _constants.DEVICE_EVENT:
            // pass DEVICE event up to html
            eventEmitter.emit(event, message);
            eventEmitter.emit(type, payload); // DEVICE_EVENT also emit single events (connect/disconnect...)
            break;

        case _constants.TRANSPORT_EVENT:
            eventEmitter.emit(event, message);
            eventEmitter.emit(type, payload); // DEVICE_EVENT also emit single events (connect/disconnect...)
            break;

        case _constants.UI_EVENT:

            if (type === IFRAME.BOOTSTRAP) {
                iframe.clearTimeout();
                break;
            } else if (type === POPUP.BOOTSTRAP) {
                // Popup did open but is still loading JS
                _popupManager.cancelOpenTimeout();
                break;
            }

            // pass UI event up
            eventEmitter.emit(event, message);
            eventEmitter.emit(type, payload);

            if (type === UI.IFRAME_HANDSHAKE) {
                if (payload.error) {
                    iframe.initPromise.reject(new Error(payload.error));
                } else {
                    _popupManager.setBroadcast(payload.broadcast);
                    iframe.initPromise.resolve();
                }
            } else if (type === POPUP.CANCEL_POPUP_REQUEST) {
                _popupManager.cancel();
            } else if (type === UI.CLOSE_UI_WINDOW) {
                _popupManager.close();
            }
            break;

        default:
            _log.log('Undefined message', event, messageEvent);
    }
};

var init = function () {
    var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee() {
        var settings = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
        return _regenerator2.default.wrap(function _callee$(_context) {
            while (1) {
                switch (_context.prev = _context.next) {
                    case 0:
                        if (!iframe.instance) {
                            _context.next = 2;
                            break;
                        }

                        throw _errors.IFRAME_INITIALIZED;

                    case 2:

                        if (!_settings) {
                            _settings = (0, _ConnectSettings.parse)(settings);
                        }

                        if (_settings.supportedBrowser) {
                            _context.next = 5;
                            break;
                        }

                        throw new Error('Unsupported browser');

                    case 5:

                        if (!_popupManager) {
                            _popupManager = initPopupManager();
                        }

                        _log.enabled = _settings.debug;

                        window.addEventListener('message', handleMessage);
                        window.addEventListener('beforeunload', function () {
                            if (_popupManager) {
                                _popupManager.onBeforeUnload();
                            }

                            iframe.dispose();
                        });

                        _context.next = 11;
                        return iframe.init(_settings);

                    case 11:
                    case 'end':
                        return _context.stop();
                }
            }
        }, _callee, undefined);
    }));

    return function init() {
        return _ref.apply(this, arguments);
    };
}();

var call = function () {
    var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2(params) {
        var response;
        return _regenerator2.default.wrap(function _callee2$(_context2) {
            while (1) {
                switch (_context2.prev = _context2.next) {
                    case 0:
                        if (!(!iframe.instance && !iframe.timeout)) {
                            _context2.next = 16;
                            break;
                        }

                        // init popup with lazy loading before iframe initialization
                        _settings = (0, _ConnectSettings.parse)({});
                        _popupManager = initPopupManager();
                        _popupManager.request(true);

                        if (_settings.supportedBrowser) {
                            _context2.next = 6;
                            break;
                        }

                        return _context2.abrupt('return', { success: false, payload: { error: 'Unsupported browser' } });

                    case 6:
                        _context2.prev = 6;
                        _context2.next = 9;
                        return init(_settings);

                    case 9:
                        _popupManager.resolveLazyLoad();
                        _context2.next = 16;
                        break;

                    case 12:
                        _context2.prev = 12;
                        _context2.t0 = _context2['catch'](6);

                        _popupManager.close();
                        return _context2.abrupt('return', { success: false, payload: { error: _context2.t0 } });

                    case 16:
                        if (!iframe.timeout) {
                            _context2.next = 20;
                            break;
                        }

                        return _context2.abrupt('return', { success: false, payload: { error: _errors.NO_IFRAME.message } });

                    case 20:
                        if (!iframe.error) {
                            _context2.next = 22;
                            break;
                        }

                        return _context2.abrupt('return', { success: false, payload: { error: iframe.error } });

                    case 22:

                        // request popup window it might be used in the future
                        // if (eventEmitter.listeners(UI_EVENT).length < 1) { _popupManager.request(params); }
                        if (_settings.popup) {
                            _popupManager.request();
                        }

                        // post message to iframe
                        _context2.prev = 23;
                        _context2.next = 26;
                        return iframe.postMessage({ type: IFRAME.CALL, payload: params });

                    case 26:
                        response = _context2.sent;

                        if (!response) {
                            _context2.next = 32;
                            break;
                        }

                        // TODO: unlock popupManager request only if there wasn't error "in progress"
                        if (response.payload.error !== _errors.DEVICE_CALL_IN_PROGRESS.message) {
                            _popupManager.unlock();
                        }
                        return _context2.abrupt('return', response);

                    case 32:
                        _popupManager.unlock();
                        // TODO
                        return _context2.abrupt('return', { success: false, payload: { error: 'No response from iframe' } });

                    case 34:
                        _context2.next = 40;
                        break;

                    case 36:
                        _context2.prev = 36;
                        _context2.t1 = _context2['catch'](23);

                        _log.error('__call error', _context2.t1);
                        return _context2.abrupt('return', _context2.t1);

                    case 40:
                    case 'end':
                        return _context2.stop();
                }
            }
        }, _callee2, undefined, [[6, 12], [23, 36]]);
    }));

    return function call(_x2) {
        return _ref2.apply(this, arguments);
    };
}();

var customMessageResponse = function customMessageResponse(payload) {
    iframe.postMessage({
        event: _constants.UI_EVENT,
        type: UI.CUSTOM_MESSAGE_RESPONSE,
        payload: payload
    });
};

var TrezorConnect = function TrezorConnect() {
    (0, _classCallCheck3.default)(this, TrezorConnect);
};

TrezorConnect.init = function () {
    var _ref3 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee3(settings) {
        return _regenerator2.default.wrap(function _callee3$(_context3) {
            while (1) {
                switch (_context3.prev = _context3.next) {
                    case 0:
                        _context3.next = 2;
                        return init(settings);

                    case 2:
                        return _context3.abrupt('return', _context3.sent);

                    case 3:
                    case 'end':
                        return _context3.stop();
                }
            }
        }, _callee3, undefined);
    }));

    return function (_x3) {
        return _ref3.apply(this, arguments);
    };
}();

TrezorConnect.on = function (type, fn) {
    eventEmitter.on(type, fn);
};

TrezorConnect.off = function (type, fn) {
    eventEmitter.removeListener(type, fn);
};

TrezorConnect.uiResponse = function (response) {
    iframe.postMessage((0, _extends3.default)({ event: _constants.UI_EVENT }, response));
};

TrezorConnect.changeSettings = function (settings) {
    var parsedSettings = (0, _ConnectSettings.parse)(settings);
    _log.enabled = parsedSettings.debug;
    iframe.postMessage({ type: UI.CHANGE_SETTINGS, payload: parsedSettings }, false);
};

TrezorConnect.customMessage = function () {
    var _ref4 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee5(params) {
        var callback, customMessageListener, response;
        return _regenerator2.default.wrap(function _callee5$(_context5) {
            while (1) {
                switch (_context5.prev = _context5.next) {
                    case 0:
                        if (!(typeof params.callback !== 'function')) {
                            _context5.next = 2;
                            break;
                        }

                        return _context5.abrupt('return', {
                            success: false,
                            payload: {
                                error: 'Parameter "callback" is not a function'
                            }
                        });

                    case 2:

                        // TODO: set message listener only if iframe is loaded correctly
                        callback = params.callback;

                        delete params.callback;

                        customMessageListener = function () {
                            var _ref5 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee4(event) {
                                var data, payload;
                                return _regenerator2.default.wrap(function _callee4$(_context4) {
                                    while (1) {
                                        switch (_context4.prev = _context4.next) {
                                            case 0:
                                                data = event.data;

                                                if (!(data && data.type === UI.CUSTOM_MESSAGE_REQUEST)) {
                                                    _context4.next = 6;
                                                    break;
                                                }

                                                _context4.next = 4;
                                                return callback(data.payload);

                                            case 4:
                                                payload = _context4.sent;

                                                if (payload) {
                                                    customMessageResponse(payload);
                                                } else {
                                                    customMessageResponse({ message: 'release' });
                                                }

                                            case 6:
                                            case 'end':
                                                return _context4.stop();
                                        }
                                    }
                                }, _callee4, undefined);
                            }));

                            return function customMessageListener(_x5) {
                                return _ref5.apply(this, arguments);
                            };
                        }();

                        window.addEventListener('message', customMessageListener, false);

                        _context5.next = 8;
                        return call((0, _extends3.default)({ method: 'customMessage' }, params));

                    case 8:
                        response = _context5.sent;

                        window.removeEventListener('message', customMessageListener);
                        return _context5.abrupt('return', response);

                    case 11:
                    case 'end':
                        return _context5.stop();
                }
            }
        }, _callee5, undefined);
    }));

    return function (_x4) {
        return _ref4.apply(this, arguments);
    };
}();

TrezorConnect.requestLogin = function () {
    var _ref6 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee7(params) {
        var callback, loginChallengeListener, response;
        return _regenerator2.default.wrap(function _callee7$(_context7) {
            while (1) {
                switch (_context7.prev = _context7.next) {
                    case 0:
                        if (!(typeof params.callback === 'function')) {
                            _context7.next = 12;
                            break;
                        }

                        callback = params.callback;

                        delete params.callback; // delete callback value. this field cannot be sent using postMessage function

                        // TODO: set message listener only if iframe is loaded correctly

                        loginChallengeListener = function () {
                            var _ref7 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee6(event) {
                                var data, payload;
                                return _regenerator2.default.wrap(function _callee6$(_context6) {
                                    while (1) {
                                        switch (_context6.prev = _context6.next) {
                                            case 0:
                                                data = event.data;

                                                if (!(data && data.type === UI.LOGIN_CHALLENGE_REQUEST)) {
                                                    _context6.next = 6;
                                                    break;
                                                }

                                                _context6.next = 4;
                                                return callback();

                                            case 4:
                                                payload = _context6.sent;

                                                iframe.postMessage({
                                                    event: _constants.UI_EVENT,
                                                    type: UI.LOGIN_CHALLENGE_RESPONSE,
                                                    payload: payload
                                                });

                                            case 6:
                                            case 'end':
                                                return _context6.stop();
                                        }
                                    }
                                }, _callee6, undefined);
                            }));

                            return function loginChallengeListener(_x7) {
                                return _ref7.apply(this, arguments);
                            };
                        }();

                        window.addEventListener('message', loginChallengeListener, false);

                        _context7.next = 7;
                        return call((0, _extends3.default)({ method: 'requestLogin' }, params, { asyncChallenge: true }));

                    case 7:
                        response = _context7.sent;

                        window.removeEventListener('message', loginChallengeListener);
                        return _context7.abrupt('return', response);

                    case 12:
                        _context7.next = 14;
                        return call((0, _extends3.default)({ method: 'requestLogin' }, params));

                    case 14:
                        return _context7.abrupt('return', _context7.sent);

                    case 15:
                    case 'end':
                        return _context7.stop();
                }
            }
        }, _callee7, undefined);
    }));

    return function (_x6) {
        return _ref6.apply(this, arguments);
    };
}();

TrezorConnect.cipherKeyValue = function () {
    var _ref8 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee8(params) {
        return _regenerator2.default.wrap(function _callee8$(_context8) {
            while (1) {
                switch (_context8.prev = _context8.next) {
                    case 0:
                        _context8.next = 2;
                        return call((0, _extends3.default)({ method: 'cipherKeyValue' }, params));

                    case 2:
                        return _context8.abrupt('return', _context8.sent);

                    case 3:
                    case 'end':
                        return _context8.stop();
                }
            }
        }, _callee8, undefined);
    }));

    return function (_x8) {
        return _ref8.apply(this, arguments);
    };
}();

TrezorConnect.composeTransaction = function () {
    var _ref9 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee9(params) {
        return _regenerator2.default.wrap(function _callee9$(_context9) {
            while (1) {
                switch (_context9.prev = _context9.next) {
                    case 0:
                        _context9.next = 2;
                        return call((0, _extends3.default)({ method: 'composeTransaction' }, params));

                    case 2:
                        return _context9.abrupt('return', _context9.sent);

                    case 3:
                    case 'end':
                        return _context9.stop();
                }
            }
        }, _callee9, undefined);
    }));

    return function (_x9) {
        return _ref9.apply(this, arguments);
    };
}();

TrezorConnect.ethereumGetAddress = function () {
    var _ref10 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee10(params) {
        return _regenerator2.default.wrap(function _callee10$(_context10) {
            while (1) {
                switch (_context10.prev = _context10.next) {
                    case 0:
                        _context10.next = 2;
                        return call((0, _extends3.default)({ method: 'ethereumGetAddress' }, params));

                    case 2:
                        return _context10.abrupt('return', _context10.sent);

                    case 3:
                    case 'end':
                        return _context10.stop();
                }
            }
        }, _callee10, undefined);
    }));

    return function (_x10) {
        return _ref10.apply(this, arguments);
    };
}();

TrezorConnect.ethereumSignMessage = function () {
    var _ref11 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee11(params) {
        return _regenerator2.default.wrap(function _callee11$(_context11) {
            while (1) {
                switch (_context11.prev = _context11.next) {
                    case 0:
                        _context11.next = 2;
                        return call((0, _extends3.default)({ method: 'ethereumSignMessage' }, params));

                    case 2:
                        return _context11.abrupt('return', _context11.sent);

                    case 3:
                    case 'end':
                        return _context11.stop();
                }
            }
        }, _callee11, undefined);
    }));

    return function (_x11) {
        return _ref11.apply(this, arguments);
    };
}();

TrezorConnect.ethereumSignTransaction = function () {
    var _ref12 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee12(params) {
        return _regenerator2.default.wrap(function _callee12$(_context12) {
            while (1) {
                switch (_context12.prev = _context12.next) {
                    case 0:
                        _context12.next = 2;
                        return call((0, _extends3.default)({ method: 'ethereumSignTransaction' }, params));

                    case 2:
                        return _context12.abrupt('return', _context12.sent);

                    case 3:
                    case 'end':
                        return _context12.stop();
                }
            }
        }, _callee12, undefined);
    }));

    return function (_x12) {
        return _ref12.apply(this, arguments);
    };
}();

TrezorConnect.ethereumVerifyMessage = function () {
    var _ref13 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee13(params) {
        return _regenerator2.default.wrap(function _callee13$(_context13) {
            while (1) {
                switch (_context13.prev = _context13.next) {
                    case 0:
                        _context13.next = 2;
                        return call((0, _extends3.default)({ method: 'ethereumVerifyMessage' }, params));

                    case 2:
                        return _context13.abrupt('return', _context13.sent);

                    case 3:
                    case 'end':
                        return _context13.stop();
                }
            }
        }, _callee13, undefined);
    }));

    return function (_x13) {
        return _ref13.apply(this, arguments);
    };
}();

TrezorConnect.getAccountInfo = function () {
    var _ref14 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee14(params) {
        return _regenerator2.default.wrap(function _callee14$(_context14) {
            while (1) {
                switch (_context14.prev = _context14.next) {
                    case 0:
                        _context14.next = 2;
                        return call((0, _extends3.default)({ method: 'getAccountInfo' }, params));

                    case 2:
                        return _context14.abrupt('return', _context14.sent);

                    case 3:
                    case 'end':
                        return _context14.stop();
                }
            }
        }, _callee14, undefined);
    }));

    return function (_x14) {
        return _ref14.apply(this, arguments);
    };
}();

TrezorConnect.getAddress = function () {
    var _ref15 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee15(params) {
        return _regenerator2.default.wrap(function _callee15$(_context15) {
            while (1) {
                switch (_context15.prev = _context15.next) {
                    case 0:
                        _context15.next = 2;
                        return call((0, _extends3.default)({ method: 'getAddress' }, params));

                    case 2:
                        return _context15.abrupt('return', _context15.sent);

                    case 3:
                    case 'end':
                        return _context15.stop();
                }
            }
        }, _callee15, undefined);
    }));

    return function (_x15) {
        return _ref15.apply(this, arguments);
    };
}();

TrezorConnect.getDeviceState = function () {
    var _ref16 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee16(params) {
        return _regenerator2.default.wrap(function _callee16$(_context16) {
            while (1) {
                switch (_context16.prev = _context16.next) {
                    case 0:
                        _context16.next = 2;
                        return call((0, _extends3.default)({ method: 'getDeviceState' }, params));

                    case 2:
                        return _context16.abrupt('return', _context16.sent);

                    case 3:
                    case 'end':
                        return _context16.stop();
                }
            }
        }, _callee16, undefined);
    }));

    return function (_x16) {
        return _ref16.apply(this, arguments);
    };
}();

TrezorConnect.getFeatures = function () {
    var _ref17 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee17(params) {
        return _regenerator2.default.wrap(function _callee17$(_context17) {
            while (1) {
                switch (_context17.prev = _context17.next) {
                    case 0:
                        _context17.next = 2;
                        return call((0, _extends3.default)({ method: 'getFeatures' }, params));

                    case 2:
                        return _context17.abrupt('return', _context17.sent);

                    case 3:
                    case 'end':
                        return _context17.stop();
                }
            }
        }, _callee17, undefined);
    }));

    return function (_x17) {
        return _ref17.apply(this, arguments);
    };
}();

TrezorConnect.getPublicKey = function () {
    var _ref18 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee18(params) {
        return _regenerator2.default.wrap(function _callee18$(_context18) {
            while (1) {
                switch (_context18.prev = _context18.next) {
                    case 0:
                        _context18.next = 2;
                        return call((0, _extends3.default)({ method: 'getPublicKey' }, params));

                    case 2:
                        return _context18.abrupt('return', _context18.sent);

                    case 3:
                    case 'end':
                        return _context18.stop();
                }
            }
        }, _callee18, undefined);
    }));

    return function (_x18) {
        return _ref18.apply(this, arguments);
    };
}();

TrezorConnect.nemGetAddress = function () {
    var _ref19 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee19(params) {
        return _regenerator2.default.wrap(function _callee19$(_context19) {
            while (1) {
                switch (_context19.prev = _context19.next) {
                    case 0:
                        _context19.next = 2;
                        return call((0, _extends3.default)({ method: 'nemGetAddress' }, params));

                    case 2:
                        return _context19.abrupt('return', _context19.sent);

                    case 3:
                    case 'end':
                        return _context19.stop();
                }
            }
        }, _callee19, undefined);
    }));

    return function (_x19) {
        return _ref19.apply(this, arguments);
    };
}();

TrezorConnect.nemSignTransaction = function () {
    var _ref20 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee20(params) {
        return _regenerator2.default.wrap(function _callee20$(_context20) {
            while (1) {
                switch (_context20.prev = _context20.next) {
                    case 0:
                        _context20.next = 2;
                        return call((0, _extends3.default)({ method: 'nemSignTransaction' }, params));

                    case 2:
                        return _context20.abrupt('return', _context20.sent);

                    case 3:
                    case 'end':
                        return _context20.stop();
                }
            }
        }, _callee20, undefined);
    }));

    return function (_x20) {
        return _ref20.apply(this, arguments);
    };
}();

TrezorConnect.pushTransaction = function () {
    var _ref21 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee21(params) {
        return _regenerator2.default.wrap(function _callee21$(_context21) {
            while (1) {
                switch (_context21.prev = _context21.next) {
                    case 0:
                        _context21.next = 2;
                        return call((0, _extends3.default)({ method: 'pushTransaction' }, params));

                    case 2:
                        return _context21.abrupt('return', _context21.sent);

                    case 3:
                    case 'end':
                        return _context21.stop();
                }
            }
        }, _callee21, undefined);
    }));

    return function (_x21) {
        return _ref21.apply(this, arguments);
    };
}();

TrezorConnect.signMessage = function () {
    var _ref22 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee22(params) {
        return _regenerator2.default.wrap(function _callee22$(_context22) {
            while (1) {
                switch (_context22.prev = _context22.next) {
                    case 0:
                        _context22.next = 2;
                        return call((0, _extends3.default)({ method: 'signMessage' }, params));

                    case 2:
                        return _context22.abrupt('return', _context22.sent);

                    case 3:
                    case 'end':
                        return _context22.stop();
                }
            }
        }, _callee22, undefined);
    }));

    return function (_x22) {
        return _ref22.apply(this, arguments);
    };
}();

TrezorConnect.signTransaction = function () {
    var _ref23 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee23(params) {
        return _regenerator2.default.wrap(function _callee23$(_context23) {
            while (1) {
                switch (_context23.prev = _context23.next) {
                    case 0:
                        _context23.next = 2;
                        return call((0, _extends3.default)({ method: 'signTransaction' }, params));

                    case 2:
                        return _context23.abrupt('return', _context23.sent);

                    case 3:
                    case 'end':
                        return _context23.stop();
                }
            }
        }, _callee23, undefined);
    }));

    return function (_x23) {
        return _ref23.apply(this, arguments);
    };
}();

TrezorConnect.stellarGetAddress = function () {
    var _ref24 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee24(params) {
        return _regenerator2.default.wrap(function _callee24$(_context24) {
            while (1) {
                switch (_context24.prev = _context24.next) {
                    case 0:
                        _context24.next = 2;
                        return call((0, _extends3.default)({ method: 'stellarGetAddress' }, params));

                    case 2:
                        return _context24.abrupt('return', _context24.sent);

                    case 3:
                    case 'end':
                        return _context24.stop();
                }
            }
        }, _callee24, undefined);
    }));

    return function (_x24) {
        return _ref24.apply(this, arguments);
    };
}();

TrezorConnect.stellarSignTransaction = function () {
    var _ref25 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee25(params) {
        return _regenerator2.default.wrap(function _callee25$(_context25) {
            while (1) {
                switch (_context25.prev = _context25.next) {
                    case 0:
                        _context25.next = 2;
                        return call((0, _extends3.default)({ method: 'stellarSignTransaction' }, params));

                    case 2:
                        return _context25.abrupt('return', _context25.sent);

                    case 3:
                    case 'end':
                        return _context25.stop();
                }
            }
        }, _callee25, undefined);
    }));

    return function (_x25) {
        return _ref25.apply(this, arguments);
    };
}();

TrezorConnect.verifyMessage = function () {
    var _ref26 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee26(params) {
        return _regenerator2.default.wrap(function _callee26$(_context26) {
            while (1) {
                switch (_context26.prev = _context26.next) {
                    case 0:
                        _context26.next = 2;
                        return call((0, _extends3.default)({ method: 'verifyMessage' }, params));

                    case 2:
                        return _context26.abrupt('return', _context26.sent);

                    case 3:
                    case 'end':
                        return _context26.stop();
                }
            }
        }, _callee26, undefined);
    }));

    return function (_x26) {
        return _ref26.apply(this, arguments);
    };
}();

TrezorConnect.dispose = function () {
    // TODO
};

TrezorConnect.renderWebUSBButton = function (className) {
    (0, _button2.default)(className, _settings.webusbSrc, iframe.origin);
};

exports.default = TrezorConnect;
exports.TRANSPORT = TRANSPORT;
exports.UI = UI;
exports.DEVICE = DEVICE;
exports.UI_EVENT = _constants.UI_EVENT;
exports.DEVICE_EVENT = _constants.DEVICE_EVENT;
exports.TRANSPORT_EVENT = _constants.TRANSPORT_EVENT;

/***/ })
/******/ ])["default"];
});
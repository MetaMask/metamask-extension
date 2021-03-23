(function (factory) {
  typeof define === 'function' && define.amd ? define(factory) :
  factory();
}((function () { 'use strict';

  /**
   * commons.js
   * Declare shorthand functions. Sharing these declarations across modules
   * improves on consistency and minification. Unused declarations are
   * dropped by the tree shaking process.
   *
   * We capture these, not just for brevity, but for security. If any code
   * modifies Object to change what 'assign' points to, the Compartment shim
   * would be corrupted.
   */

  const {
    assign,
    create,
    defineProperties,
    entries,
    freeze,
    getOwnPropertyDescriptor,
    getOwnPropertyDescriptors,
    getOwnPropertyNames,
    getPrototypeOf,
    is,
    isExtensible,
    keys,
    prototype: objectPrototype,
    seal,
    setPrototypeOf,
    values,
  } = Object;

  // At time of this writing, we still support Node 10 which doesn't have
  // `Object.fromEntries`. If it is absent, this should be an adequate
  // replacement.
  // By the terminology of https://ponyfoo.com/articles/polyfills-or-ponyfills
  // it is a ponyfill rather than a polyfill or shim because we do not
  // install it on `Object`.
  const objectFromEntries = entryPairs => {
    const result = {};
    for (const [prop, val] of entryPairs) {
      result[prop] = val;
    }
    return result;
  };

  const fromEntries = Object.fromEntries || objectFromEntries;

  const defineProperty = (object, prop, descriptor) => {
    // Object.defineProperty is allowed to fail silently so we use
    // Object.defineProperties instead.
    return defineProperties(object, { [prop]: descriptor });
  };

  const { apply, construct, get: reflectGet, set: reflectSet } = Reflect;

  const { isArray, prototype: arrayPrototype } = Array;
  const { revocable: proxyRevocable } = Proxy;
  const { prototype: regexpPrototype } = RegExp;
  const { prototype: stringPrototype } = String;
  const { prototype: weakmapPrototype } = WeakMap;

  /**
   * uncurryThis()
   * This form of uncurry uses Reflect.apply()
   *
   * The original uncurry uses:
   * const bind = Function.prototype.bind;
   * const uncurryThis = bind.bind(bind.call);
   *
   * See those reference for a complete explanation:
   * http://wiki.ecmascript.org/doku.php?id=conventions:safe_meta_programming
   * which only lives at
   * http://web.archive.org/web/20160805225710/http://wiki.ecmascript.org/doku.php?id=conventions:safe_meta_programming
   *
   * @param {(thisArg: Object, ...args: any[]) => any} fn
   */
  const uncurryThis = fn => (thisArg, ...args) => apply(fn, thisArg, args);

  const objectHasOwnProperty = uncurryThis(objectPrototype.hasOwnProperty);
  //
  const arrayFilter = uncurryThis(arrayPrototype.filter);
  const arrayJoin = uncurryThis(arrayPrototype.join);
  const arrayPush = uncurryThis(arrayPrototype.push);
  const arrayPop = uncurryThis(arrayPrototype.pop);
  const arrayIncludes = uncurryThis(arrayPrototype.includes);
  //
  const regexpTest = uncurryThis(regexpPrototype.test);
  //
  const stringMatch = uncurryThis(stringPrototype.match);
  const stringSearch = uncurryThis(stringPrototype.search);
  const stringSlice = uncurryThis(stringPrototype.slice);
  const stringSplit = uncurryThis(stringPrototype.split);
  //
  const weakmapGet = uncurryThis(weakmapPrototype.get);
  const weakmapSet = uncurryThis(weakmapPrototype.set);
  const weakmapHas = uncurryThis(weakmapPrototype.has);

  /**
   * immutableObject
   * An immutable (frozen) exotic object and is safe to share.
   */
  const immutableObject = freeze({ __proto__: null });

  const nativeSuffix = ') { [native code] }';

  // Note: Top level mutable state. Does not make anything worse, since the
  // patching of `Function.prototype.toString` is also globally stateful. We
  // use this top level state so that multiple calls to `tameFunctionToString` are
  // idempotent, rather than creating redundant indirections.
  let nativeBrander;

  /**
   * Replace `Function.prototype.toString` with one that recognizes
   * shimmed functions as honorary native functions.
   */
  function tameFunctionToString() {
    if (nativeBrander === undefined) {
      const nativeBrand = new WeakSet();

      const originalFunctionToString = Function.prototype.toString;

      const tamingMethods = {
        toString() {
          const str = apply(originalFunctionToString, this, []);
          if (str.endsWith(nativeSuffix) || !nativeBrand.has(this)) {
            return str;
          }
          return `function ${this.name}() { [native code] }`;
        },
      };

      defineProperty(Function.prototype, 'toString', {
        value: tamingMethods.toString,
      });

      nativeBrander = freeze(func => nativeBrand.add(func));
    }
    return nativeBrander;
  }

  /**
   * @file Exports {@code whitelist}, a recursively defined
   * JSON record enumerating all intrinsics and their properties
   * according to ECMA specs.
   *
   * @author JF Paradis
   * @author Mark S. Miller
   */

  /* eslint max-lines: 0 */

  /**
   * constantProperties
   * non-configurable, non-writable data properties of all global objects.
   * Must be powerless.
   * Maps from property name to the actual value
   */
  const constantProperties = {
    // *** Value Properties of the Global Object

    Infinity,
    NaN,
    undefined,
  };

  /**
   * universalPropertyNames
   * Properties of all global objects.
   * Must be powerless.
   * Maps from property name to the intrinsic name in the whitelist.
   */
  const universalPropertyNames = {
    // *** Function Properties of the Global Object

    isFinite: 'isFinite',
    isNaN: 'isNaN',
    parseFloat: 'parseFloat',
    parseInt: 'parseInt',

    decodeURI: 'decodeURI',
    decodeURIComponent: 'decodeURIComponent',
    encodeURI: 'encodeURI',
    encodeURIComponent: 'encodeURIComponent',

    // *** Constructor Properties of the Global Object

    Array: 'Array',
    ArrayBuffer: 'ArrayBuffer',
    BigInt: 'BigInt',
    BigInt64Array: 'BigInt64Array',
    BigUint64Array: 'BigUint64Array',
    Boolean: 'Boolean',
    DataView: 'DataView',
    EvalError: 'EvalError',
    Float32Array: 'Float32Array',
    Float64Array: 'Float64Array',
    Int8Array: 'Int8Array',
    Int16Array: 'Int16Array',
    Int32Array: 'Int32Array',
    Map: 'Map',
    Number: 'Number',
    Object: 'Object',
    Promise: 'Promise',
    Proxy: 'Proxy',
    RangeError: 'RangeError',
    ReferenceError: 'ReferenceError',
    Set: 'Set',
    String: 'String',
    Symbol: 'Symbol',
    SyntaxError: 'SyntaxError',
    TypeError: 'TypeError',
    Uint8Array: 'Uint8Array',
    Uint8ClampedArray: 'Uint8ClampedArray',
    Uint16Array: 'Uint16Array',
    Uint32Array: 'Uint32Array',
    URIError: 'URIError',
    WeakMap: 'WeakMap',
    WeakSet: 'WeakSet',

    // *** Other Properties of the Global Object

    JSON: 'JSON',
    Reflect: 'Reflect',

    // *** Annex B

    escape: 'escape',
    unescape: 'unescape',

    // ESNext

    lockdown: 'lockdown',
    harden: 'harden',
    HandledPromise: 'HandledPromise', // TODO: Until Promise.delegate (see below).
    StaticModuleRecord: 'StaticModuleRecord',
  };

  /**
   * initialGlobalPropertyNames
   * Those found only on the initial global, i.e., the global of the
   * start compartment, as well as any compartments created before lockdown.
   * These may provide much of the power provided by the original.
   * Maps from property name to the intrinsic name in the whitelist.
   */
  const initialGlobalPropertyNames = {
    // *** Constructor Properties of the Global Object

    Date: '%InitialDate%',
    Error: '%InitialError%',
    RegExp: '%InitialRegExp%',

    // *** Other Properties of the Global Object

    Math: '%InitialMath%',

    // ESNext

    // From Error-stack proposal
    // Only on initial global. No corresponding
    // powerless form for other globals.
    getStackString: '%InitialGetStackString%',

    // TODO https://github.com/Agoric/SES-shim/issues/551
    // Need initial WeakRef and FinalizationGroup in
    // start compartment only.
  };

  /**
   * sharedGlobalPropertyNames
   * Those found only on the globals of new compartments created after lockdown,
   * which must therefore be powerless.
   * Maps from property name to the intrinsic name in the whitelist.
   */
  const sharedGlobalPropertyNames = {
    // *** Constructor Properties of the Global Object

    Date: '%SharedDate%',
    Error: '%SharedError%',
    RegExp: '%SharedRegExp%',

    // *** Other Properties of the Global Object

    Math: '%SharedMath%',
  };

  // All the "subclasses" of Error. These are collectively represented in the
  // EcmaScript spec by the meta variable NativeError.
  // TODO Add AggregateError https://github.com/Agoric/SES-shim/issues/550
  const NativeErrors = [
    EvalError,
    RangeError,
    ReferenceError,
    SyntaxError,
    TypeError,
    URIError,
  ];

  /**
   * <p>Each JSON record enumerates the disposition of the properties on
   *    some corresponding intrinsic object.
   *
   * <p>All records are made of key-value pairs where the key
   *    is the property to process, and the value is the associated
   *    dispositions a.k.a. the "permit". Those permits can be:
   * <ul>
   * <li>The boolean value "false", in which case this property is
   *     blacklisted and simply removed. Properties not mentioned
   *     are also considered blacklisted and are removed.
   * <li>A string value equal to a primitive ("number", "string", etc),
   *     in which case the property is whitelisted if its value property
   *     is typeof the given type. For example, {@code "Infinity"} leads to
   *     "number" and property values that fail {@code typeof "number"}.
   *     are removed.
   * <li>A string value equal to an intinsic name ("ObjectPrototype",
   *     "Array", etc), in which case the property whitelisted if its
   *     value property is equal to the value of the corresponfing
   *     intrinsics. For example, {@code Map.prototype} leads to
   *     "MapPrototype" and the property is removed if its value is
   *     not equal to %MapPrototype%
   * <li>Another record, in which case this property is simply
   *     whitelisted and that next record represents the disposition of
   *     the object which is its value. For example, {@code "Object"}
   *     leads to another record explaining what properties {@code
   *     "Object"} may have and how each such property should be treated.
   *
   * <p>Notes:
   * <li>"[[Proto]]" is used to refer to the "[[Prototype]]" internal
   *     slot, which says which object this object inherits from.
   * <li>"--proto--" is used to refer to the "__proto__" property name,
   *     which is the name of an accessor property on Object.prototype.
   *     In practice, it is used to access the [[Proto]] internal slot,
   *     but is distinct from the internal slot itself. We use
   *     "--proto--" rather than "__proto__" below because "__proto__"
   *     in an object literal is special syntax rather than a normal
   *     property definition.
   * <li>"ObjectPrototype" is the default "[[Proto]]" (when not specified).
   * <li>Constants "fn" and "getter" are used to keep the structure DRY.
   * <li>Symbol properties are listed using the "@@name" form.
   */

  // Function Instances
  const FunctionInstance = {
    '[[Proto]]': '%FunctionPrototype%',
    length: 'number',
    name: 'string',
    // Do not specify "prototype" here, since only Function instances that can
    // be used as a constructor have a prototype property. For constructors,
    // since prototype properties are instance-specific, we define it there.
  };

  // Aliases
  const fn = FunctionInstance;

  const getter = {
    get: fn,
    set: 'undefined',
  };

  // Possible but not encountered in the specs
  // export const setter = {
  //   get: 'undefined',
  //   set: fn,
  // };

  const accessor = {
    get: fn,
    set: fn,
  };

  function isAccessorPermit(permit) {
    return permit === getter || permit === accessor;
  }

  // NativeError Object Structure
  function NativeError(prototype) {
    return {
      // Properties of the NativeError Constructors
      '[[Proto]]': '%SharedError%',

      // NativeError.prototype
      prototype,
    };
  }

  function NativeErrorPrototype(constructor) {
    return {
      // Properties of the NativeError Prototype Objects
      '[[Proto]]': '%ErrorPrototype%',
      constructor,
      message: 'string',
      name: 'string',
      // Redundantly present only on v8. Safe to remove.
      toString: false,
    };
  }

  // The TypedArray Constructors
  function TypedArray(prototype) {
    return {
      // Properties of the TypedArray Constructors
      '[[Proto]]': '%TypedArray%',
      BYTES_PER_ELEMENT: 'number',
      prototype,
    };
  }

  function TypedArrayPrototype(constructor) {
    return {
      // Properties of the TypedArray Prototype Objects
      '[[Proto]]': '%TypedArrayPrototype%',
      BYTES_PER_ELEMENT: 'number',
      constructor,
    };
  }

  // Without Math.random
  const SharedMath = {
    E: 'number',
    LN10: 'number',
    LN2: 'number',
    LOG10E: 'number',
    LOG2E: 'number',
    PI: 'number',
    SQRT1_2: 'number',
    SQRT2: 'number',
    '@@toStringTag': 'string',
    abs: fn,
    acos: fn,
    acosh: fn,
    asin: fn,
    asinh: fn,
    atan: fn,
    atanh: fn,
    atan2: fn,
    cbrt: fn,
    ceil: fn,
    clz32: fn,
    cos: fn,
    cosh: fn,
    exp: fn,
    expm1: fn,
    floor: fn,
    fround: fn,
    hypot: fn,
    imul: fn,
    log: fn,
    log1p: fn,
    log10: fn,
    log2: fn,
    max: fn,
    min: fn,
    pow: fn,
    round: fn,
    sign: fn,
    sin: fn,
    sinh: fn,
    sqrt: fn,
    tan: fn,
    tanh: fn,
    trunc: fn,
    // See https://github.com/Moddable-OpenSource/moddable/issues/523
    idiv: false,
    // See https://github.com/Moddable-OpenSource/moddable/issues/523
    idivmod: false,
    // See https://github.com/Moddable-OpenSource/moddable/issues/523
    imod: false,
    // See https://github.com/Moddable-OpenSource/moddable/issues/523
    imuldiv: false,
    // See https://github.com/Moddable-OpenSource/moddable/issues/523
    irem: false,
    // See https://github.com/Moddable-OpenSource/moddable/issues/523
    mod: false,
  };

  const whitelist = {
    // ECMA https://tc39.es/ecma262

    // The intrinsics object has no prototype to avoid conflicts.
    '[[Proto]]': null,

    // %ThrowTypeError%
    '%ThrowTypeError%': fn,

    // *** The Global Object

    // *** Value Properties of the Global Object
    Infinity: 'number',
    NaN: 'number',
    undefined: 'undefined',

    // *** Function Properties of the Global Object

    // eval
    '%UniqueEval%': fn,
    isFinite: fn,
    isNaN: fn,
    parseFloat: fn,
    parseInt: fn,
    decodeURI: fn,
    decodeURIComponent: fn,
    encodeURI: fn,
    encodeURIComponent: fn,

    // *** Fundamental Objects

    Object: {
      // Properties of the Object Constructor
      '[[Proto]]': '%FunctionPrototype%',
      assign: fn,
      create: fn,
      defineProperties: fn,
      defineProperty: fn,
      entries: fn,
      freeze: fn,
      fromEntries: fn,
      getOwnPropertyDescriptor: fn,
      getOwnPropertyDescriptors: fn,
      getOwnPropertyNames: fn,
      getOwnPropertySymbols: fn,
      getPrototypeOf: fn,
      is: fn,
      isExtensible: fn,
      isFrozen: fn,
      isSealed: fn,
      keys: fn,
      preventExtensions: fn,
      prototype: '%ObjectPrototype%',
      seal: fn,
      setPrototypeOf: fn,
      values: fn,
    },

    '%ObjectPrototype%': {
      // Properties of the Object Prototype Object
      '[[Proto]]': null,
      constructor: 'Object',
      hasOwnProperty: fn,
      isPrototypeOf: fn,
      propertyIsEnumerable: fn,
      toLocaleString: fn,
      toString: fn,
      valueOf: fn,

      // Annex B: Additional Properties of the Object.prototype Object

      '--proto--': accessor,
      __defineGetter__: fn,
      __defineSetter__: fn,
      __lookupGetter__: fn,
      __lookupSetter__: fn,
    },

    '%UniqueFunction%': {
      // Properties of the Function Constructor
      '[[Proto]]': '%FunctionPrototype%',
      prototype: '%FunctionPrototype%',
    },

    '%InertFunction%': {
      '[[Proto]]': '%FunctionPrototype%',
      prototype: '%FunctionPrototype%',
    },

    '%FunctionPrototype%': {
      apply: fn,
      bind: fn,
      call: fn,
      constructor: '%InertFunction%', // TODO test
      toString: fn,
      '@@hasInstance': fn,
      // proposed but not yet std yet. To be removed if there
      caller: false,
      // proposed but not yet std yet. To be removed if there
      arguments: false,
    },

    Boolean: {
      // Properties of the Boolean Constructor
      '[[Proto]]': '%FunctionPrototype%',
      prototype: '%BooleanPrototype%',
    },

    '%BooleanPrototype%': {
      constructor: 'Boolean',
      toString: fn,
      valueOf: fn,
    },

    Symbol: {
      // Properties of the Symbol Constructor
      '[[Proto]]': '%FunctionPrototype%',
      asyncIterator: 'symbol',
      for: fn,
      hasInstance: 'symbol',
      isConcatSpreadable: 'symbol',
      iterator: 'symbol',
      keyFor: fn,
      match: 'symbol',
      matchAll: 'symbol',
      prototype: '%SymbolPrototype%',
      replace: 'symbol',
      search: 'symbol',
      species: 'symbol',
      split: 'symbol',
      toPrimitive: 'symbol',
      toStringTag: 'symbol',
      unscopables: 'symbol',
    },

    '%SymbolPrototype%': {
      // Properties of the Symbol Prototype Object
      constructor: 'Symbol',
      description: getter,
      toString: fn,
      valueOf: fn,
      '@@toPrimitive': fn,
      '@@toStringTag': 'string',
    },

    '%InitialError%': {
      // Properties of the Error Constructor
      '[[Proto]]': '%FunctionPrototype%',
      prototype: '%ErrorPrototype%',
      // Non standard, v8 only, used by tap
      captureStackTrace: fn,
      // Non standard, v8 only, used by tap, tamed to accessor
      stackTraceLimit: accessor,
      // Non standard, v8 only, used by several, tamed to accessor
      prepareStackTrace: accessor,
    },

    '%SharedError%': {
      // Properties of the Error Constructor
      '[[Proto]]': '%FunctionPrototype%',
      prototype: '%ErrorPrototype%',
      // Non standard, v8 only, used by tap
      captureStackTrace: fn,
      // Non standard, v8 only, used by tap, tamed to accessor
      stackTraceLimit: accessor,
      // Non standard, v8 only, used by several, tamed to accessor
      prepareStackTrace: accessor,
    },

    '%ErrorPrototype%': {
      constructor: '%SharedError%',
      message: 'string',
      name: 'string',
      toString: fn,
      // proposed de-facto, assumed TODO
      // Seen on FF Nightly 88.0a1
      at: false,
      // Seen on FF and XS
      stack: false,
    },

    // NativeError

    EvalError: NativeError('%EvalErrorPrototype%'),
    RangeError: NativeError('%RangeErrorPrototype%'),
    ReferenceError: NativeError('%ReferenceErrorPrototype%'),
    SyntaxError: NativeError('%SyntaxErrorPrototype%'),
    TypeError: NativeError('%TypeErrorPrototype%'),
    URIError: NativeError('%URIErrorPrototype%'),

    '%EvalErrorPrototype%': NativeErrorPrototype('EvalError'),
    '%RangeErrorPrototype%': NativeErrorPrototype('RangeError'),
    '%ReferenceErrorPrototype%': NativeErrorPrototype('ReferenceError'),
    '%SyntaxErrorPrototype%': NativeErrorPrototype('SyntaxError'),
    '%TypeErrorPrototype%': NativeErrorPrototype('TypeError'),
    '%URIErrorPrototype%': NativeErrorPrototype('URIError'),

    // *** Numbers and Dates

    Number: {
      // Properties of the Number Constructor
      '[[Proto]]': '%FunctionPrototype%',
      EPSILON: 'number',
      isFinite: fn,
      isInteger: fn,
      isNaN: fn,
      isSafeInteger: fn,
      MAX_SAFE_INTEGER: 'number',
      MAX_VALUE: 'number',
      MIN_SAFE_INTEGER: 'number',
      MIN_VALUE: 'number',
      NaN: 'number',
      NEGATIVE_INFINITY: 'number',
      parseFloat: fn,
      parseInt: fn,
      POSITIVE_INFINITY: 'number',
      prototype: '%NumberPrototype%',
    },

    '%NumberPrototype%': {
      // Properties of the Number Prototype Object
      constructor: 'Number',
      toExponential: fn,
      toFixed: fn,
      toLocaleString: fn,
      toPrecision: fn,
      toString: fn,
      valueOf: fn,
    },

    BigInt: {
      // Properties of the BigInt Constructor
      '[[Proto]]': '%FunctionPrototype%',
      asIntN: fn,
      asUintN: fn,
      prototype: '%BigIntPrototype%',
      // See https://github.com/Moddable-OpenSource/moddable/issues/523
      bitLength: false,
      // See https://github.com/Moddable-OpenSource/moddable/issues/523
      fromArrayBuffer: false,
    },

    '%BigIntPrototype%': {
      constructor: 'BigInt',
      toLocaleString: fn,
      toString: fn,
      valueOf: fn,
      '@@toStringTag': 'string',
    },

    '%InitialMath%': {
      ...SharedMath,
      // random is standard but omitted from SharedMath
      random: fn,
    },

    '%SharedMath%': SharedMath,

    '%InitialDate%': {
      // Properties of the Date Constructor
      '[[Proto]]': '%FunctionPrototype%',
      now: fn,
      parse: fn,
      prototype: '%DatePrototype%',
      UTC: fn,
    },

    '%SharedDate%': {
      // Properties of the Date Constructor
      '[[Proto]]': '%FunctionPrototype%',
      now: fn,
      parse: fn,
      prototype: '%DatePrototype%',
      UTC: fn,
    },

    '%DatePrototype%': {
      constructor: '%SharedDate%',
      getDate: fn,
      getDay: fn,
      getFullYear: fn,
      getHours: fn,
      getMilliseconds: fn,
      getMinutes: fn,
      getMonth: fn,
      getSeconds: fn,
      getTime: fn,
      getTimezoneOffset: fn,
      getUTCDate: fn,
      getUTCDay: fn,
      getUTCFullYear: fn,
      getUTCHours: fn,
      getUTCMilliseconds: fn,
      getUTCMinutes: fn,
      getUTCMonth: fn,
      getUTCSeconds: fn,
      setDate: fn,
      setFullYear: fn,
      setHours: fn,
      setMilliseconds: fn,
      setMinutes: fn,
      setMonth: fn,
      setSeconds: fn,
      setTime: fn,
      setUTCDate: fn,
      setUTCFullYear: fn,
      setUTCHours: fn,
      setUTCMilliseconds: fn,
      setUTCMinutes: fn,
      setUTCMonth: fn,
      setUTCSeconds: fn,
      toDateString: fn,
      toISOString: fn,
      toJSON: fn,
      toLocaleDateString: fn,
      toLocaleString: fn,
      toLocaleTimeString: fn,
      toString: fn,
      toTimeString: fn,
      toUTCString: fn,
      valueOf: fn,
      '@@toPrimitive': fn,

      // Annex B: Additional Properties of the Date.prototype Object
      getYear: fn,
      setYear: fn,
      toGMTString: fn,
    },

    // Text Processing

    String: {
      // Properties of the String Constructor
      '[[Proto]]': '%FunctionPrototype%',
      fromCharCode: fn,
      fromCodePoint: fn,
      prototype: '%StringPrototype%',
      raw: fn,
      // See https://github.com/Moddable-OpenSource/moddable/issues/523
      fromArrayBuffer: false,
    },

    '%StringPrototype%': {
      // Properties of the String Prototype Object
      length: 'number',
      charAt: fn,
      charCodeAt: fn,
      codePointAt: fn,
      concat: fn,
      constructor: 'String',
      endsWith: fn,
      includes: fn,
      indexOf: fn,
      lastIndexOf: fn,
      localeCompare: fn,
      match: fn,
      matchAll: fn,
      normalize: fn,
      padEnd: fn,
      padStart: fn,
      repeat: fn,
      replace: fn,
      replaceAll: fn, // ES2021
      search: fn,
      slice: fn,
      split: fn,
      startsWith: fn,
      substring: fn,
      toLocaleLowerCase: fn,
      toLocaleUpperCase: fn,
      toLowerCase: fn,
      toString: fn,
      toUpperCase: fn,
      trim: fn,
      trimEnd: fn,
      trimStart: fn,
      valueOf: fn,
      '@@iterator': fn,

      // Annex B: Additional Properties of the String.prototype Object
      substr: fn,
      anchor: fn,
      big: fn,
      blink: fn,
      bold: fn,
      fixed: fn,
      fontcolor: fn,
      fontsize: fn,
      italics: fn,
      link: fn,
      small: fn,
      strike: fn,
      sub: fn,
      sup: fn,
      trimLeft: fn,
      trimRight: fn,
      // See https://github.com/Moddable-OpenSource/moddable/issues/523
      compare: false,
    },

    '%StringIteratorPrototype%': {
      '[[Proto]]': '%IteratorPrototype%',
      next: fn,
      '@@toStringTag': 'string',
    },

    '%InitialRegExp%': {
      // Properties of the RegExp Constructor
      '[[Proto]]': '%FunctionPrototype%',
      prototype: '%RegExpPrototype%',
      '@@species': getter,

      // The https://github.com/tc39/proposal-regexp-legacy-features
      // are all optional, unsafe, and omitted
      input: false,
      $_: false,
      lastMatch: false,
      '$&': false,
      lastParen: false,
      '$+': false,
      leftContext: false,
      '$`': false,
      rightContext: false,
      "$'": false,
      $1: false,
      $2: false,
      $3: false,
      $4: false,
      $5: false,
      $6: false,
      $7: false,
      $8: false,
      $9: false,
    },

    '%SharedRegExp%': {
      // Properties of the RegExp Constructor
      '[[Proto]]': '%FunctionPrototype%',
      prototype: '%RegExpPrototype%',
      '@@species': getter,
    },

    '%RegExpPrototype%': {
      // Properties of the RegExp Prototype Object
      constructor: '%SharedRegExp%',
      exec: fn,
      dotAll: getter,
      flags: getter,
      global: getter,
      ignoreCase: getter,
      '@@match': fn,
      '@@matchAll': fn,
      multiline: getter,
      '@@replace': fn,
      '@@search': fn,
      source: getter,
      '@@split': fn,
      sticky: getter,
      test: fn,
      toString: fn,
      unicode: getter,

      // Annex B: Additional Properties of the RegExp.prototype Object
      compile: false, // UNSAFE and suppressed.
      // Seen on FF Nightly 88.0a1, Chrome Canary 91.0.4446.0,
      // Safari Tech Preview Release 122 (Safari 14.2, WebKit 16612.1.6.2)
      hasIndices: false,
    },

    '%RegExpStringIteratorPrototype%': {
      // The %RegExpStringIteratorPrototype% Object
      '[[Proto]]': '%IteratorPrototype%',
      next: fn,
      '@@toStringTag': 'string',
    },

    // Indexed Collections

    Array: {
      // Properties of the Array Constructor
      '[[Proto]]': '%FunctionPrototype%',
      from: fn,
      isArray: fn,
      of: fn,
      prototype: '%ArrayPrototype%',
      '@@species': getter,
    },

    '%ArrayPrototype%': {
      // Properties of the Array Prototype Object
      length: 'number',
      concat: fn,
      constructor: 'Array',
      copyWithin: fn,
      entries: fn,
      every: fn,
      fill: fn,
      filter: fn,
      find: fn,
      findIndex: fn,
      flat: fn,
      flatMap: fn,
      forEach: fn,
      includes: fn,
      indexOf: fn,
      join: fn,
      keys: fn,
      lastIndexOf: fn,
      map: fn,
      pop: fn,
      push: fn,
      reduce: fn,
      reduceRight: fn,
      reverse: fn,
      shift: fn,
      slice: fn,
      some: fn,
      sort: fn,
      splice: fn,
      toLocaleString: fn,
      toString: fn,
      unshift: fn,
      values: fn,
      '@@iterator': fn,
      '@@unscopables': {
        '[[Proto]]': null,
        copyWithin: 'boolean',
        entries: 'boolean',
        fill: 'boolean',
        find: 'boolean',
        findIndex: 'boolean',
        flat: 'boolean',
        flatMap: 'boolean',
        includes: 'boolean',
        keys: 'boolean',
        values: 'boolean',
        // Failed tc39 proposal
        // Seen on FF Nightly 88.0a1
        at: false,
      },
      // Failed tc39 proposal
      // Seen on FF Nightly 88.0a1
      at: false,
    },

    '%ArrayIteratorPrototype%': {
      // The %ArrayIteratorPrototype% Object
      '[[Proto]]': '%IteratorPrototype%',
      next: fn,
      '@@toStringTag': 'string',
    },

    // *** TypedArray Objects

    '%TypedArray%': {
      // Properties of the %TypedArray% Intrinsic Object
      '[[Proto]]': '%FunctionPrototype%',
      from: fn,
      of: fn,
      prototype: '%TypedArrayPrototype%',
      '@@species': getter,
    },

    '%TypedArrayPrototype%': {
      buffer: getter,
      byteLength: getter,
      byteOffset: getter,
      constructor: '%TypedArray%',
      copyWithin: fn,
      entries: fn,
      every: fn,
      fill: fn,
      filter: fn,
      find: fn,
      findIndex: fn,
      forEach: fn,
      includes: fn,
      indexOf: fn,
      join: fn,
      keys: fn,
      lastIndexOf: fn,
      length: getter,
      map: fn,
      reduce: fn,
      reduceRight: fn,
      reverse: fn,
      set: fn,
      slice: fn,
      some: fn,
      sort: fn,
      subarray: fn,
      toLocaleString: fn,
      toString: fn,
      values: fn,
      '@@iterator': fn,
      '@@toStringTag': getter,
      // Failed tc39 proposal
      // Seen on FF Nightly 88.0a1
      at: false,
    },

    // The TypedArray Constructors

    BigInt64Array: TypedArray('%BigInt64ArrayPrototype%'),
    BigUint64Array: TypedArray('%BigUint64ArrayPrototype%'),
    Float32Array: TypedArray('%Float32ArrayPrototype%'),
    Float64Array: TypedArray('%Float64ArrayPrototype%'),
    Int16Array: TypedArray('%Int16ArrayPrototype%'),
    Int32Array: TypedArray('%Int32ArrayPrototype%'),
    Int8Array: TypedArray('%Int8ArrayPrototype%'),
    Uint16Array: TypedArray('%Uint16ArrayPrototype%'),
    Uint32Array: TypedArray('%Uint32ArrayPrototype%'),
    Uint8Array: TypedArray('%Uint8ArrayPrototype%'),
    Uint8ClampedArray: TypedArray('%Uint8ClampedArrayPrototype%'),

    '%BigInt64ArrayPrototype%': TypedArrayPrototype('BigInt64Array'),
    '%BigUint64ArrayPrototype%': TypedArrayPrototype('BigUint64Array'),
    '%Float32ArrayPrototype%': TypedArrayPrototype('Float32Array'),
    '%Float64ArrayPrototype%': TypedArrayPrototype('Float64Array'),
    '%Int16ArrayPrototype%': TypedArrayPrototype('Int16Array'),
    '%Int32ArrayPrototype%': TypedArrayPrototype('Int32Array'),
    '%Int8ArrayPrototype%': TypedArrayPrototype('Int8Array'),
    '%Uint16ArrayPrototype%': TypedArrayPrototype('Uint16Array'),
    '%Uint32ArrayPrototype%': TypedArrayPrototype('Uint32Array'),
    '%Uint8ArrayPrototype%': TypedArrayPrototype('Uint8Array'),
    '%Uint8ClampedArrayPrototype%': TypedArrayPrototype('Uint8ClampedArray'),

    // *** Keyed Collections

    Map: {
      // Properties of the Map Constructor
      '[[Proto]]': '%FunctionPrototype%',
      '@@species': getter,
      prototype: '%MapPrototype%',
    },

    '%MapPrototype%': {
      clear: fn,
      constructor: 'Map',
      delete: fn,
      entries: fn,
      forEach: fn,
      get: fn,
      has: fn,
      keys: fn,
      set: fn,
      size: getter,
      values: fn,
      '@@iterator': fn,
      '@@toStringTag': 'string',
    },

    '%MapIteratorPrototype%': {
      // The %MapIteratorPrototype% Object
      '[[Proto]]': '%IteratorPrototype%',
      next: fn,
      '@@toStringTag': 'string',
    },

    Set: {
      // Properties of the Set Constructor
      '[[Proto]]': '%FunctionPrototype%',
      prototype: '%SetPrototype%',
      '@@species': getter,
    },

    '%SetPrototype%': {
      add: fn,
      clear: fn,
      constructor: 'Set',
      delete: fn,
      entries: fn,
      forEach: fn,
      has: fn,
      keys: fn,
      size: getter,
      values: fn,
      '@@iterator': fn,
      '@@toStringTag': 'string',
    },

    '%SetIteratorPrototype%': {
      // The %SetIteratorPrototype% Object
      '[[Proto]]': '%IteratorPrototype%',
      next: fn,
      '@@toStringTag': 'string',
    },

    WeakMap: {
      // Properties of the WeakMap Constructor
      '[[Proto]]': '%FunctionPrototype%',
      prototype: '%WeakMapPrototype%',
    },

    '%WeakMapPrototype%': {
      constructor: 'WeakMap',
      delete: fn,
      get: fn,
      has: fn,
      set: fn,
      '@@toStringTag': 'string',
    },

    WeakSet: {
      // Properties of the WeakSet Constructor
      '[[Proto]]': '%FunctionPrototype%',
      prototype: '%WeakSetPrototype%',
    },

    '%WeakSetPrototype%': {
      add: fn,
      constructor: 'WeakSet',
      delete: fn,
      has: fn,
      '@@toStringTag': 'string',
    },

    // *** Structured Data

    ArrayBuffer: {
      // Properties of the ArrayBuffer Constructor
      '[[Proto]]': '%FunctionPrototype%',
      isView: fn,
      prototype: '%ArrayBufferPrototype%',
      '@@species': getter,
      // See https://github.com/Moddable-OpenSource/moddable/issues/523
      fromString: false,
      // See https://github.com/Moddable-OpenSource/moddable/issues/523
      fromBigInt: false,
    },

    '%ArrayBufferPrototype%': {
      byteLength: getter,
      constructor: 'ArrayBuffer',
      slice: fn,
      '@@toStringTag': 'string',
      // See https://github.com/Moddable-OpenSource/moddable/issues/523
      concat: false,
    },

    // SharedArrayBuffer Objects
    SharedArrayBuffer: false, // UNSAFE and purposely suppressed.
    '%SharedArrayBufferPrototype%': false, // UNSAFE and purposely suppressed.

    DataView: {
      // Properties of the DataView Constructor
      '[[Proto]]': '%FunctionPrototype%',
      BYTES_PER_ELEMENT: 'number', // Non std but undeletable on Safari.
      prototype: '%DataViewPrototype%',
    },

    '%DataViewPrototype%': {
      buffer: getter,
      byteLength: getter,
      byteOffset: getter,
      constructor: 'DataView',
      getBigInt64: fn,
      getBigUint64: fn,
      getFloat32: fn,
      getFloat64: fn,
      getInt8: fn,
      getInt16: fn,
      getInt32: fn,
      getUint8: fn,
      getUint16: fn,
      getUint32: fn,
      setBigInt64: fn,
      setBigUint64: fn,
      setFloat32: fn,
      setFloat64: fn,
      setInt8: fn,
      setInt16: fn,
      setInt32: fn,
      setUint8: fn,
      setUint16: fn,
      setUint32: fn,
      '@@toStringTag': 'string',
    },

    // Atomics
    Atomics: false, // UNSAFE and suppressed.

    JSON: {
      parse: fn,
      stringify: fn,
      '@@toStringTag': 'string',
    },

    // *** Control Abstraction Objects

    '%IteratorPrototype%': {
      // The %IteratorPrototype% Object
      '@@iterator': fn,
    },

    '%AsyncIteratorPrototype%': {
      // The %AsyncIteratorPrototype% Object
      '@@asyncIterator': fn,
    },

    '%InertGeneratorFunction%': {
      // Properties of the GeneratorFunction Constructor
      '[[Proto]]': '%InertFunction%',
      prototype: '%Generator%',
    },

    '%Generator%': {
      // Properties of the GeneratorFunction Prototype Object
      '[[Proto]]': '%FunctionPrototype%',
      constructor: '%InertGeneratorFunction%',
      prototype: '%GeneratorPrototype%',
      '@@toStringTag': 'string',
    },

    '%InertAsyncGeneratorFunction%': {
      // Properties of the AsyncGeneratorFunction Constructor
      '[[Proto]]': '%InertFunction%',
      prototype: '%AsyncGenerator%',
    },

    '%AsyncGenerator%': {
      // Properties of the AsyncGeneratorFunction Prototype Object
      '[[Proto]]': '%FunctionPrototype%',
      constructor: '%InertAsyncGeneratorFunction%',
      prototype: '%AsyncGeneratorPrototype%',
      '@@toStringTag': 'string',
    },

    '%GeneratorPrototype%': {
      // Properties of the Generator Prototype Object
      '[[Proto]]': '%IteratorPrototype%',
      constructor: '%Generator%',
      next: fn,
      return: fn,
      throw: fn,
      '@@toStringTag': 'string',
    },

    '%AsyncGeneratorPrototype%': {
      // Properties of the AsyncGenerator Prototype Object
      '[[Proto]]': '%AsyncIteratorPrototype%',
      constructor: '%AsyncGenerator%',
      next: fn,
      return: fn,
      throw: fn,
      '@@toStringTag': 'string',
    },

    // TODO: To be replaced with Promise.delegate
    //
    // The HandledPromise global variable shimmed by `@agoric/eventual-send/shim`
    // implements an initial version of the eventual send specification at:
    // https://github.com/tc39/proposal-eventual-send
    //
    // We will likely change this to add a property to Promise called
    // Promise.delegate and put static methods on it, which will necessitate
    // another whitelist change to update to the current proposed standard.
    HandledPromise: {
      '[[Proto]]': 'Promise',
      applyFunction: fn,
      applyFunctionSendOnly: fn,
      applyMethod: fn,
      applyMethodSendOnly: fn,
      get: fn,
      getSendOnly: fn,
      prototype: '%PromisePrototype%',
      resolve: fn,
    },

    Promise: {
      // Properties of the Promise Constructor
      '[[Proto]]': '%FunctionPrototype%',
      all: fn,
      allSettled: fn,
      // To transition from `false` to `fn` once we also have `AggregateError`
      // TODO https://github.com/Agoric/SES-shim/issues/550
      any: false, // ES2021
      prototype: '%PromisePrototype%',
      race: fn,
      reject: fn,
      resolve: fn,
      '@@species': getter,
    },

    '%PromisePrototype%': {
      // Properties of the Promise Prototype Object
      catch: fn,
      constructor: 'Promise',
      finally: fn,
      then: fn,
      '@@toStringTag': 'string',
    },

    '%InertAsyncFunction%': {
      // Properties of the AsyncFunction Constructor
      '[[Proto]]': '%InertFunction%',
      prototype: '%AsyncFunctionPrototype%',
    },

    '%AsyncFunctionPrototype%': {
      // Properties of the AsyncFunction Prototype Object
      '[[Proto]]': '%FunctionPrototype%',
      constructor: '%InertAsyncFunction%',
      '@@toStringTag': 'string',
    },

    // Reflection

    Reflect: {
      // The Reflect Object
      // Not a function object.
      apply: fn,
      construct: fn,
      defineProperty: fn,
      deleteProperty: fn,
      get: fn,
      getOwnPropertyDescriptor: fn,
      getPrototypeOf: fn,
      has: fn,
      isExtensible: fn,
      ownKeys: fn,
      preventExtensions: fn,
      set: fn,
      setPrototypeOf: fn,
      '@@toStringTag': 'string',
    },

    Proxy: {
      // Properties of the Proxy Constructor
      '[[Proto]]': '%FunctionPrototype%',
      revocable: fn,
    },

    // Appendix B

    // Annex B: Additional Properties of the Global Object

    escape: fn,
    unescape: fn,

    // Proposed

    '%UniqueCompartment%': {
      '[[Proto]]': '%FunctionPrototype%',
      prototype: '%CompartmentPrototype%',
      toString: fn,
    },

    '%InertCompartment%': {
      '[[Proto]]': '%FunctionPrototype%',
      prototype: '%CompartmentPrototype%',
      toString: fn,
    },

    '%CompartmentPrototype%': {
      constructor: '%InertCompartment%',
      evaluate: fn,
      globalThis: getter,
      name: getter,
      // Should this be proposed?
      toString: fn,
    },

    lockdown: fn,
    harden: fn,

    '%InitialGetStackString%': fn,
  };

  // Like defineProperty, but throws if it would modify an existing property.
  // We use this to ensure that two conflicting attempts to define the same
  // property throws, causing SES initialization to fail. Otherwise, a
  // conflict between, for example, two of SES's internal whitelists might
  // get masked as one overwrites the other. Accordingly, the thrown error
  // complains of a "Conflicting definition".
  function initProperty(obj, name, desc) {
    if (objectHasOwnProperty(obj, name)) {
      const preDesc = getOwnPropertyDescriptor(obj, name);
      if (
        !Object.is(preDesc.value, desc.value) ||
        preDesc.get !== desc.get ||
        preDesc.set !== desc.set ||
        preDesc.writable !== desc.writable ||
        preDesc.enumerable !== desc.enumerable ||
        preDesc.configurable !== desc.configurable
      ) {
        throw new Error(`Conflicting definitions of ${name}`);
      }
    }
    defineProperty(obj, name, desc);
  }

  // Like defineProperties, but throws if it would modify an existing property.
  // This ensures that the intrinsics added to the intrinsics collector object
  // graph do not overlap.
  function initProperties(obj, descs) {
    for (const [name, desc] of entries(descs)) {
      initProperty(obj, name, desc);
    }
  }

  // sampleGlobals creates an intrinsics object, suitable for
  // interinsicsCollector.addIntrinsics, from the named properties of a global
  // object.
  function sampleGlobals(globalObject, newPropertyNames) {
    const newIntrinsics = { __proto__: null };
    for (const [globalName, intrinsicName] of entries(newPropertyNames)) {
      if (objectHasOwnProperty(globalObject, globalName)) {
        newIntrinsics[intrinsicName] = globalObject[globalName];
      }
    }
    return newIntrinsics;
  }

  function makeIntrinsicsCollector() {
    const intrinsics = { __proto__: null };
    let pseudoNatives;

    const intrinsicsCollector = {
      addIntrinsics(newIntrinsics) {
        initProperties(intrinsics, getOwnPropertyDescriptors(newIntrinsics));
      },

      // For each intrinsic, if it has a `.prototype` property, use the
      // whitelist to find out the intrinsic name for that prototype and add it
      // to the intrinsics.
      completePrototypes() {
        for (const [name, intrinsic] of entries(intrinsics)) {
          if (intrinsic !== Object(intrinsic)) {
            // eslint-disable-next-line no-continue
            continue;
          }
          if (!objectHasOwnProperty(intrinsic, 'prototype')) {
            // eslint-disable-next-line no-continue
            continue;
          }
          const permit = whitelist[name];
          if (typeof permit !== 'object') {
            throw new Error(`Expected permit object at whitelist.${name}`);
          }
          const namePrototype = permit.prototype;
          if (!namePrototype) {
            throw new Error(`${name}.prototype property not whitelisted`);
          }
          if (
            typeof namePrototype !== 'string' ||
            !objectHasOwnProperty(whitelist, namePrototype)
          ) {
            throw new Error(`Unrecognized ${name}.prototype whitelist entry`);
          }
          const intrinsicPrototype = intrinsic.prototype;
          if (objectHasOwnProperty(intrinsics, namePrototype)) {
            if (intrinsics[namePrototype] !== intrinsicPrototype) {
              throw new Error(`Conflicting bindings of ${namePrototype}`);
            }
            // eslint-disable-next-line no-continue
            continue;
          }
          intrinsics[namePrototype] = intrinsicPrototype;
        }
      },
      finalIntrinsics() {
        freeze(intrinsics);
        pseudoNatives = new WeakSet(
          values(intrinsics).filter(obj => typeof obj === 'function'),
        );
        return intrinsics;
      },
      isPseudoNative(obj) {
        if (!pseudoNatives) {
          throw new Error(
            'isPseudoNative can only be called after finalIntrinsics',
          );
        }
        return pseudoNatives.has(obj);
      },
    };

    intrinsicsCollector.addIntrinsics(constantProperties);
    intrinsicsCollector.addIntrinsics(
      sampleGlobals(globalThis, universalPropertyNames),
    );

    return intrinsicsCollector;
  }

  /**
   * getGlobalIntrinsics()
   * Doesn't tame, delete, or modify anything. Samples globalObject to create an
   * intrinsics record containing only the whitelisted global variables, listed
   * by the intrinsic names appropriate for new globals, i.e., the globals of
   * newly constructed compartments.
   *
   * WARNING:
   * If run before lockdown, the returned intrinsics record will carry the
   * *original* unsafe (feral, untamed) bindings of these global variables.
   *
   * @param {Object} globalObject
   */
  function getGlobalIntrinsics(globalObject) {
    const intrinsicsCollector = makeIntrinsicsCollector();

    intrinsicsCollector.addIntrinsics(
      sampleGlobals(globalObject, sharedGlobalPropertyNames),
    );

    return intrinsicsCollector.finalIntrinsics();
  }

  const InertCompartment = function Compartment(
    _endowments = {},
    _modules = {},
    _options = {},
  ) {
    throw new TypeError('Not available');
  };

  /**
   * Object.getConstructorOf()
   * Helper function to improve readability, similar to Object.getPrototypeOf().
   *
   * @param {Object} obj
   */
  function getConstructorOf(obj) {
    return getPrototypeOf(obj).constructor;
  }

  /**
   * getAnonymousIntrinsics()
   * Get the intrinsics not otherwise reachable by named own property
   * traversal from the global object.
   *
   * @returns {Object}
   */
  function getAnonymousIntrinsics() {
    const InertFunction = Function.prototype.constructor;

    const SymbolIterator = (typeof Symbol && Symbol.iterator) || '@@iterator';
    const SymbolMatchAll = (typeof Symbol && Symbol.matchAll) || '@@matchAll';

    // 9.2.4.1 %ThrowTypeError%

    // eslint-disable-next-line prefer-rest-params
    const ThrowTypeError = getOwnPropertyDescriptor(arguments, 'callee').get;

    // 21.1.5.2 The %StringIteratorPrototype% Object

    // eslint-disable-next-line no-new-wrappers
    const StringIteratorObject = new String()[SymbolIterator]();
    const StringIteratorPrototype = getPrototypeOf(StringIteratorObject);

    // 21.2.7.1 The %RegExpStringIteratorPrototype% Object
    const RegExpStringIterator =
      RegExp.prototype[SymbolMatchAll] && new RegExp()[SymbolMatchAll]();
    const RegExpStringIteratorPrototype =
      RegExpStringIterator && getPrototypeOf(RegExpStringIterator);

    // 22.1.5.2 The %ArrayIteratorPrototype% Object

    // eslint-disable-next-line no-array-constructor
    const ArrayIteratorObject = new Array()[SymbolIterator]();
    const ArrayIteratorPrototype = getPrototypeOf(ArrayIteratorObject);

    // 22.2.1 The %TypedArray% Intrinsic Object

    const TypedArray = getPrototypeOf(Float32Array);

    // 23.1.5.2 The %MapIteratorPrototype% Object

    const MapIteratorObject = new Map()[SymbolIterator]();
    const MapIteratorPrototype = getPrototypeOf(MapIteratorObject);

    // 23.2.5.2 The %SetIteratorPrototype% Object

    const SetIteratorObject = new Set()[SymbolIterator]();
    const SetIteratorPrototype = getPrototypeOf(SetIteratorObject);

    // 25.1.2 The %IteratorPrototype% Object

    const IteratorPrototype = getPrototypeOf(ArrayIteratorPrototype);

    // 25.2.1 The GeneratorFunction Constructor

    // eslint-disable-next-line no-empty-function
    function* GeneratorFunctionInstance() {}
    const GeneratorFunction = getConstructorOf(GeneratorFunctionInstance);

    // 25.2.3 Properties of the GeneratorFunction Prototype Object

    const Generator = GeneratorFunction.prototype;

    // 25.3.1 The AsyncGeneratorFunction Constructor

    // eslint-disable-next-line no-empty-function
    async function* AsyncGeneratorFunctionInstance() {}
    const AsyncGeneratorFunction = getConstructorOf(
      AsyncGeneratorFunctionInstance,
    );

    // 25.3.2.2 AsyncGeneratorFunction.prototype
    const AsyncGenerator = AsyncGeneratorFunction.prototype;
    // 25.5.1 Properties of the AsyncGenerator Prototype Object
    const AsyncGeneratorPrototype = AsyncGenerator.prototype;
    const AsyncIteratorPrototype = getPrototypeOf(AsyncGeneratorPrototype);

    // 25.7.1 The AsyncFunction Constructor

    // eslint-disable-next-line no-empty-function
    async function AsyncFunctionInstance() {}
    const AsyncFunction = getConstructorOf(AsyncFunctionInstance);

    const intrinsics = {
      '%InertFunction%': InertFunction,
      '%ArrayIteratorPrototype%': ArrayIteratorPrototype,
      '%InertAsyncFunction%': AsyncFunction,
      '%AsyncGenerator%': AsyncGenerator,
      '%InertAsyncGeneratorFunction%': AsyncGeneratorFunction,
      '%AsyncGeneratorPrototype%': AsyncGeneratorPrototype,
      '%AsyncIteratorPrototype%': AsyncIteratorPrototype,
      '%Generator%': Generator,
      '%InertGeneratorFunction%': GeneratorFunction,
      '%IteratorPrototype%': IteratorPrototype,
      '%MapIteratorPrototype%': MapIteratorPrototype,
      '%RegExpStringIteratorPrototype%': RegExpStringIteratorPrototype,
      '%SetIteratorPrototype%': SetIteratorPrototype,
      '%StringIteratorPrototype%': StringIteratorPrototype,
      '%ThrowTypeError%': ThrowTypeError,
      '%TypedArray%': TypedArray,
      '%InertCompartment%': InertCompartment,
    };

    return intrinsics;
  }

  // Adapted from SES/Caja - Copyright (C) 2011 Google Inc.
  // Copyright (C) 2018 Agoric

  // Licensed under the Apache License, Version 2.0 (the "License");
  // you may not use this file except in compliance with the License.
  // You may obtain a copy of the License at
  //
  // http://www.apache.org/licenses/LICENSE-2.0
  //
  // Unless required by applicable law or agreed to in writing, software
  // distributed under the License is distributed on an "AS IS" BASIS,
  // WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  // See the License for the specific language governing permissions and
  // limitations under the License.

  // based upon:
  // https://github.com/google/caja/blob/master/src/com/google/caja/ses/startSES.js
  // https://github.com/google/caja/blob/master/src/com/google/caja/ses/repairES5.js
  // then copied from proposal-frozen-realms deep-freeze.js
  // then copied from SES/src/bundle/deepFreeze.js

  // @ts-check

  const { freeze: freeze$1, getOwnPropertyDescriptors: getOwnPropertyDescriptors$1, getPrototypeOf: getPrototypeOf$1 } = Object;
  const { ownKeys } = Reflect;

  /**
   * @typedef {<T>(root: T) => T} Hardener
   */

  /**
   * Create a `harden` function.
   *
   * @returns {Hardener}
   */
  function makeHardener() {
    const hardened = new WeakSet();

    const { harden } = {
      /**
       * @template T
       * @param {T} root
       * @returns {T}
       */
      harden(root) {
        const toFreeze = new Set();
        const paths = new WeakMap();

        // If val is something we should be freezing but aren't yet,
        // add it to toFreeze.
        /**
         * @param {any} val
         * @param {string} [path]
         */
        function enqueue(val, path = undefined) {
          if (Object(val) !== val) {
            // ignore primitives
            return;
          }
          const type = typeof val;
          if (type !== 'object' && type !== 'function') {
            // future proof: break until someone figures out what it should do
            throw new TypeError(`Unexpected typeof: ${type}`);
          }
          if (hardened.has(val) || toFreeze.has(val)) {
            // Ignore if this is an exit, or we've already visited it
            return;
          }
          // console.log(`adding ${val} to toFreeze`, val);
          toFreeze.add(val);
          paths.set(val, path);
        }

        /**
         * @param {any} obj
         */
        function freezeAndTraverse(obj) {
          // Now freeze the object to ensure reactive
          // objects such as proxies won't add properties
          // during traversal, before they get frozen.

          // Object are verified before being enqueued,
          // therefore this is a valid candidate.
          // Throws if this fails (strict mode).
          freeze$1(obj);

          // we rely upon certain commitments of Object.freeze and proxies here

          // get stable/immutable outbound links before a Proxy has a chance to do
          // something sneaky.
          const path = paths.get(obj) || 'unknown';
          const descs = getOwnPropertyDescriptors$1(obj);
          const proto = getPrototypeOf$1(obj);
          enqueue(proto, `${path}.__proto__`);

          ownKeys(descs).forEach(name => {
            const pathname = `${path}.${String(name)}`;
            // todo uncurried form
            // todo: getOwnPropertyDescriptors is guaranteed to return well-formed
            // descriptors, but they still inherit from Object.prototype. If
            // someone has poisoned Object.prototype to add 'value' or 'get'
            // properties, then a simple 'if ("value" in desc)' or 'desc.value'
            // test could be confused. We use hasOwnProperty to be sure about
            // whether 'value' is present or not, which tells us for sure that
            // this is a data property.
            // The 'name' may be a symbol, and TypeScript doesn't like us to
            // index arbitrary symbols on objects, so we pretend they're just
            // strings.
            const desc = descs[/** @type {string} */ (name)];
            if ('value' in desc) {
              // todo uncurried form
              enqueue(desc.value, `${pathname}`);
            } else {
              enqueue(desc.get, `${pathname}(get)`);
              enqueue(desc.set, `${pathname}(set)`);
            }
          });
        }

        function dequeue() {
          // New values added before forEach() has finished will be visited.
          toFreeze.forEach(freezeAndTraverse); // todo curried forEach
        }

        function commit() {
          // todo curried forEach
          // we capture the real WeakSet.prototype.add above, in case someone
          // changes it. The two-argument form of forEach passes the second
          // argument as the 'this' binding, so we add to the correct set.
          toFreeze.forEach(hardened.add, hardened);
        }

        enqueue(root);
        dequeue();
        // console.log("toFreeze set:", toFreeze);
        commit();

        return root;
      },
    };

    return harden;
  }

  // Copyright (C) 2011 Google Inc.

  const { apply: apply$1, ownKeys: ownKeys$1 } = Reflect;
  const uncurryThis$1 = fn => (thisArg, ...args) => apply$1(fn, thisArg, args);
  const hasOwnProperty = uncurryThis$1(Object.prototype.hasOwnProperty);

  /**
   * asStringPropertyName()
   *
   * @param {string} path
   * @param {string | symbol} prop
   */
  function asStringPropertyName(path, prop) {
    if (typeof prop === 'string') {
      return prop;
    }

    if (typeof prop === 'symbol') {
      return `@@${prop.toString().slice(14, -1)}`;
    }

    throw new TypeError(`Unexpected property name type ${path} ${prop}`);
  }

  /**
   * whitelistIntrinsics()
   * Removes all non-whitelisted properties found by recursively and
   * reflectively walking own property chains.
   *
   * @param {Object} intrinsics
   * @param {(Object) => void} nativeBrander
   */
  function whitelistIntrinsics(intrinsics, nativeBrander) {
    // These primities are allowed allowed for permits.
    const primitives = ['undefined', 'boolean', 'number', 'string', 'symbol'];

    /*
     * whitelistPrototype()
     * Validate the object's [[prototype]] against a permit.
     */
    function whitelistPrototype(path, obj, protoName) {
      if (obj !== Object(obj)) {
        throw new TypeError(`Object expected: ${path}, ${obj}, ${protoName}`);
      }
      const proto = getPrototypeOf(obj);

      // Null prototype.
      if (proto === null && protoName === null) {
        return;
      }

      // Assert: protoName, if provided, is a string.
      if (protoName !== undefined && typeof protoName !== 'string') {
        throw new TypeError(`Malformed whitelist permit ${path}.__proto__`);
      }

      // If permit not specified, default to Object.prototype.
      if (proto === intrinsics[protoName || '%ObjectPrototype%']) {
        return;
      }

      // We can't clean [[prototype]], therefore abort.
      throw new Error(`Unexpected intrinsic ${path}.__proto__ at ${protoName}`);
    }

    /*
     * isWhitelistPropertyValue()
     * Whitelist a single property value against a permit.
     */
    function isWhitelistPropertyValue(path, value, prop, permit) {
      if (typeof permit === 'object') {
        // eslint-disable-next-line no-use-before-define
        whitelistProperties(path, value, permit);
        // The property is whitelisted.
        return true;
      }

      if (permit === false) {
        // A boolan 'false' permit specifies the removal of a property.
        // We require a more specific permit instead of allowing 'true'.
        return false;
      }

      if (typeof permit === 'string') {
        // A string permit can have one of two meanings:

        if (prop === 'prototype' || prop === 'constructor') {
          // For prototype and constructor value properties, the permit
          // is the name of an intrinsic.
          // Assumption: prototype and constructor cannot be primitives.
          // Assert: the permit is the name of an intrinsic.
          // Assert: the property value is equal to that intrinsic.

          if (hasOwnProperty(intrinsics, permit)) {
            if (value !== intrinsics[permit]) {
              throw new TypeError(`Does not match whitelist ${path}`);
            }
            return true;
          }
        } else {
          // For all other properties, the permit is the name of a primitive.
          // Assert: the permit is the name of a primitive.
          // Assert: the property value type is equal to that primitive.

          // eslint-disable-next-line no-lonely-if
          if (primitives.includes(permit)) {
            // eslint-disable-next-line valid-typeof
            if (typeof value !== permit) {
              throw new TypeError(
                `At ${path} expected ${permit} not ${typeof value}`,
              );
            }
            return true;
          }
        }
      }

      throw new TypeError(`Unexpected whitelist permit ${permit} at ${path}`);
    }

    /*
     * isWhitelistProperty()
     * Whitelist a single property against a permit.
     */
    function isWhitelistProperty(path, obj, prop, permit) {
      const desc = getOwnPropertyDescriptor(obj, prop);

      // Is this a value property?
      if (hasOwnProperty(desc, 'value')) {
        if (isAccessorPermit(permit)) {
          throw new TypeError(`Accessor expected at ${path}`);
        }
        return isWhitelistPropertyValue(path, desc.value, prop, permit);
      }
      if (!isAccessorPermit(permit)) {
        throw new TypeError(`Accessor not expected at ${path}`);
      }
      return (
        isWhitelistPropertyValue(`${path}<get>`, desc.get, prop, permit.get) &&
        isWhitelistPropertyValue(`${path}<set>`, desc.set, prop, permit.set)
      );
    }

    /*
     * getSubPermit()
     */
    function getSubPermit(obj, permit, prop) {
      const permitProp = prop === '__proto__' ? '--proto--' : prop;
      if (hasOwnProperty(permit, permitProp)) {
        return permit[permitProp];
      }

      if (typeof obj === 'function') {
        nativeBrander(obj);
        if (hasOwnProperty(FunctionInstance, permitProp)) {
          return FunctionInstance[permitProp];
        }
      }

      return undefined;
    }

    /*
     * whitelistProperties()
     * Whitelist all properties against a permit.
     */
    function whitelistProperties(path, obj, permit) {
      if (obj === undefined) {
        return;
      }

      const protoName = permit['[[Proto]]'];
      whitelistPrototype(path, obj, protoName);

      for (const prop of ownKeys$1(obj)) {
        const propString = asStringPropertyName(path, prop);
        const subPath = `${path}.${propString}`;
        const subPermit = getSubPermit(obj, permit, propString);

        if (subPermit) {
          // Property has a permit.
          if (isWhitelistProperty(subPath, obj, prop, subPermit)) {
            // Property is whitelisted.
            // eslint-disable-next-line no-continue
            continue;
          }
        }

        if (subPermit !== false) {
          // This call to `console.log` is intensional. It is not a vestige
          // of a debugging attempt. See the comment at top of file for an
          // explanation.
          console.log(`Removing ${subPath}`);
        }
        try {
          delete obj[prop];
        } catch (err) {
          if (prop in obj) {
            console.error(`failed to delete ${subPath}`, err);
          } else {
            console.error(`deleting ${subPath} threw`, err);
          }
          throw err;
        }
      }
    }

    // Start path with 'intrinsics' to clarify that properties are not
    // removed from the global object by the whitelisting operation.
    whitelistProperties('intrinsics', intrinsics, whitelist);
  }

  // Adapted from SES/Caja - Copyright (C) 2011 Google Inc.

  /**
   * Replace the legacy accessors of Object to comply with strict mode
   * and ES2016 semantics, we do this by redefining them while in 'use strict'.
   *
   * todo: list the issues resolved
   *
   * This function can be used in two ways: (1) invoked directly to fix the primal
   * realm's Object.prototype, and (2) converted to a string to be executed
   * inside each new RootRealm to fix their Object.prototypes. Evaluation requires
   * the function to have no dependencies, so don't import anything from
   * the outside.
   */

  function repairLegacyAccessors() {
    try {
      // Verify that the method is not callable.
      // eslint-disable-next-line no-underscore-dangle
      (0, Object.prototype.__lookupGetter__)('x');
    } catch (ignore) {
      // Throws, no need to patch.
      return;
    }

    // On some platforms, the implementation of these functions act as
    // if they are in sloppy mode: if they're invoked badly, they will
    // expose the global object, so we need to repair these for
    // security. Thus it is our responsibility to fix this, and we need
    // to include repairAccessors. E.g. Chrome in 2016.

    function toObject(obj) {
      if (obj === undefined || obj === null) {
        throw new TypeError("can't convert undefined or null to object");
      }
      return Object(obj);
    }

    function asPropertyName(obj) {
      if (typeof obj === 'symbol') {
        return obj;
      }
      return `${obj}`;
    }

    function aFunction(obj, accessor) {
      if (typeof obj !== 'function') {
        throw TypeError(`invalid ${accessor} usage`);
      }
      return obj;
    }

    defineProperties(objectPrototype, {
      __defineGetter__: {
        value: function __defineGetter__(prop, func) {
          const O = toObject(this);
          defineProperty(O, prop, {
            get: aFunction(func, 'getter'),
            enumerable: true,
            configurable: true,
          });
        },
      },
      __defineSetter__: {
        value: function __defineSetter__(prop, func) {
          const O = toObject(this);
          defineProperty(O, prop, {
            set: aFunction(func, 'setter'),
            enumerable: true,
            configurable: true,
          });
        },
      },
      __lookupGetter__: {
        value: function __lookupGetter__(prop) {
          let O = toObject(this);
          prop = asPropertyName(prop);
          let desc;
          // eslint-disable-next-line no-cond-assign
          while (O && !(desc = getOwnPropertyDescriptor(O, prop))) {
            O = getPrototypeOf(O);
          }
          return desc && desc.get;
        },
      },
      __lookupSetter__: {
        value: function __lookupSetter__(prop) {
          let O = toObject(this);
          prop = asPropertyName(prop);
          let desc;
          // eslint-disable-next-line no-cond-assign
          while (O && !(desc = getOwnPropertyDescriptor(O, prop))) {
            O = getPrototypeOf(O);
          }
          return desc && desc.set;
        },
      },
    });
  }

  // This module replaces the original `Function` constructor, and the original
  // `%GeneratorFunction%`, `%AsyncFunction%` and `%AsyncGeneratorFunction%`,
  // with safe replacements that throw if invoked.
  //
  // These are all reachable via syntax, so it isn't sufficient to just
  // replace global properties with safe versions. Our main goal is to prevent
  // access to the `Function` constructor through these starting points.
  //
  // After modules block is done, the originals must no longer be reachable,
  // unless a copy has been made, and functions can only be created by syntax
  // (using eval) or by invoking a previously saved reference to the originals.
  //
  // Typically, this module will not be used directly, but via the
  // [lockdown - shim] which handles all necessary repairs and taming in SES.
  //
  // Relation to ECMA specifications
  //
  // The taming of constructors really wants to be part of the standard, because
  // new constructors may be added in the future, reachable from syntax, and this
  // list must be updated to match.
  //
  // In addition, the standard needs to define four new intrinsics for the safe
  // replacement functions. See [./whitelist intrinsics].
  //
  // Adapted from SES/Caja
  // Copyright (C) 2011 Google Inc.
  // https://github.com/google/caja/blob/master/src/com/google/caja/ses/startSES.js
  // https://github.com/google/caja/blob/master/src/com/google/caja/ses/repairES5.js

  /**
   * tameFunctionConstructors()
   * This block replaces the original Function constructor, and the original
   * %GeneratorFunction% %AsyncFunction% and %AsyncGeneratorFunction%, with
   * safe replacements that throw if invoked.
   */
  function tameFunctionConstructors() {
    try {
      // Verify that the method is not callable.
      (0, Function.prototype.constructor)('return 1');
    } catch (ignore) {
      // Throws, no need to patch.
      return {};
    }

    const newIntrinsics = {};

    /*
     * The process to repair constructors:
     * 1. Create an instance of the function by evaluating syntax
     * 2. Obtain the prototype from the instance
     * 3. Create a substitute tamed constructor
     * 4. Replace the original constructor with the tamed constructor
     * 5. Replace tamed constructor prototype property with the original one
     * 6. Replace its [[Prototype]] slot with the tamed constructor of Function
     */
    function repairFunction(name, intrinsicName, declaration) {
      let FunctionInstance;
      try {
        // eslint-disable-next-line no-eval
        FunctionInstance = (0, eval)(declaration);
      } catch (e) {
        if (e instanceof SyntaxError) {
          // Prevent failure on platforms where async and/or generators
          // are not supported.
          return;
        }
        // Re-throw
        throw e;
      }
      const FunctionPrototype = getPrototypeOf(FunctionInstance);

      // Prevents the evaluation of source when calling constructor on the
      // prototype of functions.
      // eslint-disable-next-line func-names
      const InertConstructor = function() {
        throw new TypeError('Not available');
      };
      defineProperties(InertConstructor, {
        prototype: { value: FunctionPrototype },
        name: {
          value: name,
          writable: false,
          enumerable: false,
          configurable: true,
        },
      });

      defineProperties(FunctionPrototype, {
        constructor: { value: InertConstructor },
      });

      // Reconstructs the inheritance among the new tamed constructors
      // to mirror the original specified in normal JS.
      if (InertConstructor !== Function.prototype.constructor) {
        setPrototypeOf(InertConstructor, Function.prototype.constructor);
      }

      newIntrinsics[intrinsicName] = InertConstructor;
    }

    // Here, the order of operation is important: Function needs to be repaired
    // first since the other repaired constructors need to inherit from the
    // tamed Function function constructor.

    repairFunction('Function', '%InertFunction%', '(function(){})');
    repairFunction(
      'GeneratorFunction',
      '%InertGeneratorFunction%',
      '(function*(){})',
    );
    repairFunction(
      'AsyncFunction',
      '%InertAsyncFunction%',
      '(async function(){})',
    );
    repairFunction(
      'AsyncGeneratorFunction',
      '%InertAsyncGeneratorFunction%',
      '(async function*(){})',
    );

    return newIntrinsics;
  }

  function tameDateConstructor(dateTaming = 'safe') {
    if (dateTaming !== 'safe' && dateTaming !== 'unsafe') {
      throw new Error(`unrecognized dateTaming ${dateTaming}`);
    }
    const OriginalDate = Date;
    const DatePrototype = OriginalDate.prototype;

    // Use concise methods to obtain named functions without constructors.
    const tamedMethods = {
      now() {
        return NaN;
      },
    };

    // Tame the Date constructor.
    // Common behavior
    //   * new Date(x) coerces x into a number and then returns a Date
    //     for that number of millis since the epoch
    //   * new Date(NaN) returns a Date object which stringifies to
    //     'Invalid Date'
    //   * new Date(undefined) returns a Date object which stringifies to
    //     'Invalid Date'
    // OriginalDate (normal standard) behavior
    //   * Date(anything) gives a string with the current time
    //   * new Date() returns the current time, as a Date object
    // SharedDate behavior
    //   * Date(anything) returned 'Invalid Date'
    //   * new Date() returns a Date object which stringifies to
    //     'Invalid Date'
    const makeDateConstructor = ({ powers = 'none' } = {}) => {
      let ResultDate;
      if (powers === 'original') {
        ResultDate = function Date(...rest) {
          if (new.target === undefined) {
            return Reflect.apply(OriginalDate, undefined, rest);
          }
          return Reflect.construct(OriginalDate, rest, new.target);
        };
      } else {
        ResultDate = function Date(...rest) {
          if (new.target === undefined) {
            return 'Invalid Date';
          }
          if (rest.length === 0) {
            rest = [NaN];
          }
          return Reflect.construct(OriginalDate, rest, new.target);
        };
      }

      defineProperties(ResultDate, {
        length: { value: 7 },
        prototype: {
          value: DatePrototype,
          writable: false,
          enumerable: false,
          configurable: false,
        },
        parse: {
          value: Date.parse,
          writable: true,
          enumerable: false,
          configurable: true,
        },
        UTC: {
          value: Date.UTC,
          writable: true,
          enumerable: false,
          configurable: true,
        },
      });
      return ResultDate;
    };
    const InitialDate = makeDateConstructor({ powers: 'original' });
    const SharedDate = makeDateConstructor({ power: 'none' });

    defineProperties(InitialDate, {
      now: {
        value: Date.now,
        writable: true,
        enumerable: false,
        configurable: true,
      },
    });
    defineProperties(SharedDate, {
      now: {
        value: tamedMethods.now,
        writable: true,
        enumerable: false,
        configurable: true,
      },
    });

    defineProperties(DatePrototype, {
      constructor: { value: SharedDate },
    });

    return {
      '%InitialDate%': InitialDate,
      '%SharedDate%': SharedDate,
    };
  }

  function tameMathObject(mathTaming = 'safe') {
    if (mathTaming !== 'safe' && mathTaming !== 'unsafe') {
      throw new Error(`unrecognized mathTaming ${mathTaming}`);
    }
    const originalMath = Math;
    const initialMath = originalMath; // to follow the naming pattern

    const { random: _, ...otherDescriptors } = getOwnPropertyDescriptors(
      originalMath,
    );

    const sharedMath = create(Object.prototype, otherDescriptors);

    return {
      '%InitialMath%': initialMath,
      '%SharedMath%': sharedMath,
    };
  }

  function tameRegExpConstructor(regExpTaming = 'safe') {
    if (regExpTaming !== 'safe' && regExpTaming !== 'unsafe') {
      throw new Error(`unrecognized regExpTaming ${regExpTaming}`);
    }
    const OriginalRegExp = RegExp;
    const RegExpPrototype = OriginalRegExp.prototype;

    const makeRegExpConstructor = (_ = {}) => {
      // RegExp has non-writable static properties we need to omit.
      const ResultRegExp = function RegExp(...rest) {
        if (new.target === undefined) {
          return OriginalRegExp(...rest);
        }
        return Reflect.construct(OriginalRegExp, rest, new.target);
      };

      defineProperties(ResultRegExp, {
        length: { value: 2 },
        prototype: {
          value: RegExpPrototype,
          writable: false,
          enumerable: false,
          configurable: false,
        },
        [Symbol.species]: getOwnPropertyDescriptor(
          OriginalRegExp,
          Symbol.species,
        ),
      });
      return ResultRegExp;
    };

    const InitialRegExp = makeRegExpConstructor();
    const SharedRegExp = makeRegExpConstructor();

    if (regExpTaming !== 'unsafe') {
      delete RegExpPrototype.compile;
    }
    defineProperties(RegExpPrototype, {
      constructor: { value: SharedRegExp },
    });

    return {
      '%InitialRegExp%': InitialRegExp,
      '%SharedRegExp%': SharedRegExp,
    };
  }

  /**
   * @file Exports {@code enablements}, a recursively defined
   * JSON record defining the optimum set of intrinsics properties
   * that need to be "repaired" before hardening is applied on
   * enviromments subject to the override mistake.
   *
   * @author JF Paradis
   * @author Mark S. Miller
   */

  /**
   * <p>Because "repairing" replaces data properties with accessors, every
   * time a repaired property is accessed, the associated getter is invoked,
   * which degrades the runtime performance of all code executing in the
   * repaired enviromment, compared to the non-repaired case. In order
   * to maintain performance, we only repair the properties of objects
   * for which hardening causes a breakage of their normal intended usage.
   *
   * There are three unwanted cases:
   * <ul>
   * <li>Overriding properties on objects typically used as records,
   *     namely {@code "Object"} and {@code "Array"}. In the case of arrays,
   *     the situation is unintentional, a given program might not be aware
   *     that non-numerical properties are stored on the underlying object
   *     instance, not on the array. When an object is typically used as a
   *     map, we repair all of its prototype properties.
   * <li>Overriding properties on objects that provide defaults on their
   *     prototype and that programs typically set using an assignment, such as
   *     {@code "Error.prototype.message"} and {@code "Function.prototype.name"}
   *     (both default to "").
   * <li>Setting-up a prototype chain, where a constructor is set to extend
   *     another one. This is typically set by assignment, for example
   *     {@code "Child.prototype.constructor = Child"}, instead of invoking
   *     Object.defineProperty();
   *
   * <p>Each JSON record enumerates the disposition of the properties on
   * some corresponding intrinsic object.
   *
   * <p>For each such record, the values associated with its property
   * names can be:
   * <ul>
   * <li>true, in which case this property is simply repaired. The
   *     value associated with that property is not traversed. For
   * 	   example, {@code "Function.prototype.name"} leads to true,
   *     meaning that the {@code "name"} property of {@code
   *     "Function.prototype"} should be repaired (which is needed
   *     when inheriting from @code{Function} and setting the subclass's
   *     {@code "prototype.name"} property). If the property is
   *     already an accessor property, it is not repaired (because
   *     accessors are not subject to the override mistake).
   * <li>"*", in which case this property is not repaired but the
   *     value associated with that property are traversed and repaired.
   * <li>Another record, in which case this property is not repaired
   *     and that next record represents the disposition of the object
   *     which is its value. For example,{@code "FunctionPrototype"}
   *     leads to another record explaining which properties {@code
   *     Function.prototype} need to be repaired.
   */

  /**
   * Minimal enablements when all the code is modern and known not to
   * step into the override mistake, except for the following pervasive
   * cases.
   */
  const minEnablements = {
    '%ObjectPrototype%': {
      toString: true,
    },

    '%FunctionPrototype%': {
      toString: true, // set by "rollup"
    },

    '%ErrorPrototype%': {
      name: true, // set by "precond", "ava", "node-fetch"
    },
  };

  /**
   * Moderate enablements are usually good enough for legacy compat.
   */
  const moderateEnablements = {
    '%ObjectPrototype%': {
      toString: true,
      valueOf: true,
    },

    '%ArrayPrototype%': {
      toString: true,
      push: true, // set by "Google Analytics"
    },

    // Function.prototype has no 'prototype' property to enable.
    // Function instances have their own 'name' and 'length' properties
    // which are configurable and non-writable. Thus, they are already
    // non-assignable anyway.
    '%FunctionPrototype%': {
      constructor: true, // set by "regenerator-runtime"
      bind: true, // set by "underscore", "express"
      toString: true, // set by "rollup"
    },

    '%ErrorPrototype%': {
      constructor: true, // set by "fast-json-patch", "node-fetch"
      message: true,
      name: true, // set by "precond", "ava", "node-fetch"
      toString: true, // set by "bluebird"
    },

    '%TypeErrorPrototype%': {
      constructor: true, // set by "readable-stream"
      message: true, // set by "tape"
      name: true, // set by "readable-stream"
    },

    '%SyntaxErrorPrototype%': {
      message: true, // to match TypeErrorPrototype.message
    },

    '%RangeErrorPrototype%': {
      message: true, // to match TypeErrorPrototype.message
    },

    '%URIErrorPrototype%': {
      message: true, // to match TypeErrorPrototype.message
    },

    '%EvalErrorPrototype%': {
      message: true, // to match TypeErrorPrototype.message
    },

    '%ReferenceErrorPrototype%': {
      message: true, // to match TypeErrorPrototype.message
    },

    '%PromisePrototype%': {
      constructor: true, // set by "core-js"
    },

    '%TypedArrayPrototype%': '*', // set by https://github.com/feross/buffer

    '%Generator%': {
      constructor: true,
      name: true,
      toString: true,
    },

    '%IteratorPrototype%': {
      toString: true,
    },
  };

  /**
   * The 'severe' enablement are needed because of issues tracked at
   * https://github.com/endojs/endo/issues/576
   *
   * They are like the `moderate` enablements except for the entries below.
   */
  const severeEnablements = {
    ...moderateEnablements,

    /**
     * Rollup(as used at least by vega) and webpack
     * (as used at least by regenerator) both turn exports into assignments
     * to a big `exports` object that inherits directly from
     * `Object.prototype`.Some of the exported names we've seen include
     * `hasOwnProperty`, `constructor`, and `toString`. But the strategy used
     * by rollup and webpack means potentionally turns any exported name
     * into an assignment rejected by the override mistake.That's why
     * we take the extreme step of enabling everything on`Object.prototype`.
     *
     * In addition, code doing inheritance manually will often override
     * the `constructor` property on the new prototype by assignment. We've
     * see this several times.
     *
     * The cost of enabling all these is that they create a miserable debugging
     * experience. https://github.com/Agoric/agoric-sdk/issues/2324 explains
     * how it confused the Node console.
     *
     * The vscode debugger's object inspector shows the own data properties of
     * an object, which is typically what you want, but also shows both getter
     * and setter for every accessor property whether inherited or own.
     * With the `'*'` setting here, all the properties inherited from
     * `Object.prototype` are accessors, creating an unusable display as seen
     * at As explained at
     * https://github.com/endojs/endo/blob/master/packages/ses/lockdown-options.md#overridetaming-options
     * Open the triangles at the bottom of that section.
     */
    '%ObjectPrototype%': '*',

    /**
     * The widely used Buffer defined at https://github.com/feross/buffer
     * on initialization, manually creates the equivalent of a subclass of
     * `TypedArray`, which it then initializes by assignment. These assignments
     * include enough of the `TypeArray` methods that here, we just enable
     * them all.
     */
    '%TypedArrayPrototype%': '*',
  };

  // Adapted from SES/Caja

  const { ownKeys: ownKeys$2 } = Reflect;

  function isObject(obj) {
    return obj !== null && typeof obj === 'object';
  }

  /**
   * For a special set of properties defined in the `enablement` whitelist,
   * `enablePropertyOverrides` ensures that the effect of freezing does not
   * suppress the ability to override these properties on derived objects by
   * simple assignment.
   *
   * Because of lack of sufficient foresight at the time, ES5 unfortunately
   * specified that a simple assignment to a non-existent property must fail if
   * it would override an non-writable data property of the same name in the
   * shadow of the prototype chain. In retrospect, this was a mistake, the
   * so-called "override mistake". But it is now too late and we must live with
   * the consequences.
   *
   * As a result, simply freezing an object to make it tamper proof has the
   * unfortunate side effect of breaking previously correct code that is
   * considered to have followed JS best practices, if this previous code used
   * assignment to override.
   *
   * For the enabled properties, `enablePropertyOverrides` effectively shims what
   * the assignment behavior would have been in the absence of the override
   * mistake. However, the shim produces an imperfect emulation. It shims the
   * behavior by turning these data properties into accessor properties, where
   * the accessor's getter and setter provide the desired behavior. For
   * non-reflective operations, the illusion is perfect. However, reflective
   * operations like `getOwnPropertyDescriptor` see the descriptor of an accessor
   * property rather than the descriptor of a data property. At the time of this
   * writing, this is the best we know how to do.
   *
   * To the getter of the accessor we add a property named
   * `'originalValue'` whose value is, as it says, the value that the
   * data property had before being converted to an accessor property. We add
   * this extra property to the getter for two reason:
   *
   * The harden algorithm walks the own properties reflectively, i.e., with
   * `getOwnPropertyDescriptor` semantics, rather than `[[Get]]` semantics. When
   * it sees an accessor property, it does not invoke the getter. Rather, it
   * proceeds to walk both the getter and setter as part of its transitive
   * traversal. Without this extra property, `enablePropertyOverrides` would have
   * hidden the original data property value from `harden`, which would be bad.
   * Instead, by exposing that value in an own data property on the getter,
   * `harden` finds and walks it anyway.
   *
   * We enable a form of cooperative emulation, giving reflective code an
   * opportunity to cooperate in upholding the illusion. When such cooperative
   * reflective code sees an accessor property, where the accessor's getter
   * has an `originalValue` property, it knows that the getter is
   * alleging that it is the result of the `enablePropertyOverrides` conversion
   * pattern, so it can decide to cooperatively "pretend" that it sees a data
   * property with that value.
   *
   * @param {Record<string, any>} intrinsics
   * @param {'min' | 'moderate' | 'severe'} overrideTaming
   */
  function enablePropertyOverrides(intrinsics, overrideTaming) {
    function enable(path, obj, prop, desc) {
      if ('value' in desc && desc.configurable) {
        const { value } = desc;

        function getter() {
          return value;
        }
        defineProperty(getter, 'originalValue', {
          value,
          writable: false,
          enumerable: false,
          configurable: false,
        });

        function setter(newValue) {
          if (obj === this) {
            throw new TypeError(
              `Cannot assign to read only property '${String(
              prop,
            )}' of '${path}'`,
            );
          }
          if (objectHasOwnProperty(this, prop)) {
            this[prop] = newValue;
          } else {
            defineProperty(this, prop, {
              value: newValue,
              writable: true,
              enumerable: true,
              configurable: true,
            });
          }
        }

        defineProperty(obj, prop, {
          get: getter,
          set: setter,
          enumerable: desc.enumerable,
          configurable: desc.configurable,
        });
      }
    }

    function enableProperty(path, obj, prop) {
      const desc = getOwnPropertyDescriptor(obj, prop);
      if (!desc) {
        return;
      }
      enable(path, obj, prop, desc);
    }

    function enableAllProperties(path, obj) {
      const descs = getOwnPropertyDescriptors(obj);
      if (!descs) {
        return;
      }
      // TypeScript does not allow symbols to be used as indexes because it
      // cannot recokon types of symbolized properties.
      // @ts-ignore
      ownKeys$2(descs).forEach(prop => enable(path, obj, prop, descs[prop]));
    }

    function enableProperties(path, obj, plan) {
      for (const prop of getOwnPropertyNames(plan)) {
        const desc = getOwnPropertyDescriptor(obj, prop);
        if (!desc || desc.get || desc.set) {
          // No not a value property, nothing to do.
          // eslint-disable-next-line no-continue
          continue;
        }

        // Plan has no symbol keys and we use getOwnPropertyNames()
        // so `prop` cannot only be a string, not a symbol. We coerce it in place
        // with `String(..)` anyway just as good hygiene, since these paths are just
        // for diagnostic purposes.
        const subPath = `${path}.${String(prop)}`;
        const subPlan = plan[prop];

        if (subPlan === true) {
          enableProperty(subPath, obj, prop);
        } else if (subPlan === '*') {
          enableAllProperties(subPath, desc.value);
        } else if (isObject(subPlan)) {
          enableProperties(subPath, desc.value, subPlan);
        } else {
          throw new TypeError(`Unexpected override enablement plan ${subPath}`);
        }
      }
    }

    let plan;
    switch (overrideTaming) {
      case 'min': {
        plan = minEnablements;
        break;
      }
      case 'moderate': {
        plan = moderateEnablements;
        break;
      }
      case 'severe': {
        plan = severeEnablements;
        break;
      }
      default: {
        throw new Error(`unrecognized overrideTaming ${overrideTaming}`);
      }
    }

    // Do the repair.
    enableProperties('root', intrinsics, plan);
  }

  // @ts-check

  /**
   * Prepend the correct indefinite article onto a noun, typically a typeof
   * result, e.g., "an object" vs. "a number"
   *
   * @param {string} str The noun to prepend
   * @returns {string} The noun prepended with a/an
   */
  const an = str => {
    str = `${str}`;
    if (str.length >= 1 && 'aeiouAEIOU'.includes(str[0])) {
      return `an ${str}`;
    }
    return `a ${str}`;
  };
  freeze(an);

  /**
   * Like `JSON.stringify` but does not blow up if given a cycle or a bigint.
   * This is not
   * intended to be a serialization to support any useful unserialization,
   * or any programmatic use of the resulting string. The string is intended
   * *only* for showing a human under benign conditions, in order to be
   * informative enough for some
   * logging purposes. As such, this `bestEffortStringify` has an
   * imprecise specification and may change over time.
   *
   * The current `bestEffortStringify` possibly emits too many "seen"
   * markings: Not only for cycles, but also for repeated subtrees by
   * object identity.
   *
   * As a best effort only for diagnostic interpretation by humans,
   * `bestEffortStringify` also turns various cases that normal
   * `JSON.stringify` skips or errors on, like `undefined` or bigints,
   * into strings that convey their meaning. To distinguish this from
   * strings in the input, these synthesized strings always begin and
   * end with square brackets. To distinguish those strings from an
   * input string with square brackets, and input string that starts
   * with an open square bracket `[` is itself placed in square brackets.
   *
   * @param {any} payload
   * @param {(string|number)=} spaces
   * @returns {string}
   */
  const bestEffortStringify = (payload, spaces = undefined) => {
    const seenSet = new Set();
    const replacer = (_, val) => {
      switch (typeof val) {
        case 'object': {
          if (val === null) {
            return null;
          }
          if (seenSet.has(val)) {
            return '[Seen]';
          }
          seenSet.add(val);
          if (val instanceof Error) {
            return `[${val.name}: ${val.message}]`;
          }
          if (Symbol.toStringTag in val) {
            // For the built-ins that have or inherit a `Symbol.toStringTag`-named
            // property, most of them inherit the default `toString` method,
            // which will print in a similar manner: `"[object Foo]"` vs
            // `"[Foo]"`. The exceptions are
            //    * `Symbol.prototype`, `BigInt.prototype`, `String.prototype`
            //      which don't matter to us since we handle primitives
            //      separately and we don't care about primitive wrapper objects.
            //    * TODO
            //      `Date.prototype`, `TypedArray.prototype`.
            //      Hmmm, we probably should make special cases for these. We're
            //      not using these yet, so it's not urgent. But others will run
            //      into these.
            //
            // Once #2018 is closed, the only objects in our code that have or
            // inherit a `Symbol.toStringTag`-named property are remotables
            // or their remote presences.
            // This printing will do a good job for these without
            // violating abstraction layering. This behavior makes sense
            // purely in terms of JavaScript concepts. That's some of the
            // motivation for choosing that representation of remotables
            // and their remote presences in the first place.
            return `[${val[Symbol.toStringTag]}]`;
          }
          return val;
        }
        case 'function': {
          return `[Function ${val.name || '<anon>'}]`;
        }
        case 'string': {
          if (val.startsWith('[')) {
            return `[${val}]`;
          }
          return val;
        }
        case 'undefined':
        case 'symbol': {
          return `[${String(val)}]`;
        }
        case 'bigint': {
          return `[${val}n]`;
        }
        case 'number': {
          if (Object.is(val, NaN)) {
            return '[NaN]';
          } else if (val === Infinity) {
            return '[Infinity]';
          } else if (val === -Infinity) {
            return '[-Infinity]';
          }
          return val;
        }
        default: {
          return val;
        }
      }
    };
    return JSON.stringify(payload, replacer, spaces);
  };
  freeze(bestEffortStringify);

  // Copyright (C) 2019 Agoric, under Apache License 2.0

  // For our internal debugging purposes, uncomment
  // const internalDebugConsole = console;

  // /////////////////////////////////////////////////////////////////////////////

  /** @type {WeakMap<StringablePayload, any>} */
  const declassifiers = new WeakMap();

  /** @type {AssertQuote} */
  const quote = (payload, spaces = undefined) => {
    const result = freeze({
      toString: freeze(() => bestEffortStringify(payload, spaces)),
    });
    declassifiers.set(result, payload);
    return result;
  };
  freeze(quote);

  // /////////////////////////////////////////////////////////////////////////////

  /**
   * @typedef {Object} HiddenDetails
   *
   * Captures the arguments passed to the `details` template string tag.
   *
   * @property {TemplateStringsArray | string[]} template
   * @property {any[]} args
   */

  /**
   * @type {WeakMap<DetailsToken, HiddenDetails>}
   *
   * Maps from a details token which a `details` template literal returned
   * to a record of the contents of that template literal expression.
   */
  const hiddenDetailsMap = new WeakMap();

  /** @type {DetailsTag} */
  const details = (template, ...args) => {
    // Keep in mind that the vast majority of calls to `details` creates
    // a details token that is never used, so this path must remain as fast as
    // possible. Hence we store what we've got with little processing, postponing
    // all the work to happen only if needed, for example, if an assertion fails.
    const detailsToken = freeze({ __proto__: null });
    hiddenDetailsMap.set(detailsToken, { template, args });
    return detailsToken;
  };
  freeze(details);

  /**
   * @param {HiddenDetails} hiddenDetails
   * @returns {string}
   */
  const getMessageString = ({ template, args }) => {
    const parts = [template[0]];
    for (let i = 0; i < args.length; i += 1) {
      const arg = args[i];
      let argStr;
      if (declassifiers.has(arg)) {
        argStr = `${arg}`;
      } else if (arg instanceof Error) {
        argStr = `(${an(arg.name)})`;
      } else {
        argStr = `(${an(typeof arg)})`;
      }
      parts.push(argStr, template[i + 1]);
    }
    return parts.join('');
  };

  /**
   * @param {HiddenDetails} hiddenDetails
   * @returns {LogArgs}
   */
  const getLogArgs = ({ template, args }) => {
    const logArgs = [template[0]];
    for (let i = 0; i < args.length; i += 1) {
      let arg = args[i];
      if (declassifiers.has(arg)) {
        arg = declassifiers.get(arg);
      }
      // Remove the extra spaces (since console.error puts them
      // between each cause).
      const priorWithoutSpace = (logArgs.pop() || '').replace(/ $/, '');
      if (priorWithoutSpace !== '') {
        logArgs.push(priorWithoutSpace);
      }
      const nextWithoutSpace = template[i + 1].replace(/^ /, '');
      logArgs.push(arg, nextWithoutSpace);
    }
    if (logArgs[logArgs.length - 1] === '') {
      logArgs.pop();
    }
    return logArgs;
  };

  /**
   * @type {WeakMap<Error, LogArgs>}
   *
   * Maps from an error object to the log args that are a more informative
   * alternative message for that error. When logging the error, these
   * log args should be preferred to `error.message`.
   */
  const hiddenMessageLogArgs = new WeakMap();

  /**
   * @type {AssertMakeError}
   */
  const makeError = (
    optDetails = details`Assert failed`,
    ErrorConstructor = Error,
  ) => {
    if (typeof optDetails === 'string') {
      // If it is a string, use it as the literal part of the template so
      // it doesn't get quoted.
      optDetails = details([optDetails]);
    }
    const hiddenDetails = hiddenDetailsMap.get(optDetails);
    if (hiddenDetails === undefined) {
      throw new Error(`unrecognized details ${optDetails}`);
    }
    const messageString = getMessageString(hiddenDetails);
    const error = new ErrorConstructor(messageString);
    hiddenMessageLogArgs.set(error, getLogArgs(hiddenDetails));
    // The next line is a particularly fruitful place to put a breakpoint.
    return error;
  };
  freeze(makeError);

  // /////////////////////////////////////////////////////////////////////////////

  /**
   * @type {WeakMap<Error, LogArgs[]>}
   *
   * Maps from an error to an array of log args, where each log args is
   * remembered as an annotation on that error. This can be used, for example,
   * to keep track of additional causes of the error. The elements of any
   * log args may include errors which are associated with further annotations.
   * An augmented console, like the causal console of `console.js`, could
   * then retrieve the graph of such annotations.
   */
  const hiddenNoteLogArgsArrays = new WeakMap();

  /**
   * @type {WeakMap<Error, NoteCallback[]>}
   *
   * An augmented console will normally only take the hidden noteArgs array once,
   * when it logs the error being annotated. Once that happens, further
   * annotations of that error should go to the console immediately. We arrange
   * that by accepting a note-callback function from the console as an optional
   * part of that taking operation. Normally there will only be at most one
   * callback per error, but that depends on console behavior which we should not
   * assume. We make this an array of callbacks so multiple registrations
   * are independent.
   */
  const hiddenNoteCallbackArrays = new WeakMap();

  /** @type {AssertNote} */
  const note = (error, detailsNote) => {
    if (typeof detailsNote === 'string') {
      // If it is a string, use it as the literal part of the template so
      // it doesn't get quoted.
      detailsNote = details([detailsNote]);
    }
    const hiddenDetails = hiddenDetailsMap.get(detailsNote);
    if (hiddenDetails === undefined) {
      throw new Error(`unrecognized details ${detailsNote}`);
    }
    const logArgs = getLogArgs(hiddenDetails);
    const callbacks = hiddenNoteCallbackArrays.get(error);
    if (callbacks !== undefined) {
      for (const callback of callbacks) {
        callback(error, logArgs);
      }
    } else {
      const logArgsArray = hiddenNoteLogArgsArrays.get(error);
      if (logArgsArray !== undefined) {
        logArgsArray.push(logArgs);
      } else {
        hiddenNoteLogArgsArrays.set(error, [logArgs]);
      }
    }
  };
  freeze(note);

  /**
   * The unprivileged form that just uses the de facto `error.stack` property.
   * The start compartment normally has a privileged `globalThis.getStackString`
   * which should be preferred if present.
   *
   * @param {Error} error
   * @returns {string}
   */
  const defaultGetStackString = error => {
    if (!('stack' in error)) {
      return '';
    }
    const stackString = `${error.stack}`;
    const pos = stackString.indexOf('\n');
    if (stackString.startsWith(' ') || pos === -1) {
      return stackString;
    }
    return stackString.slice(pos + 1); // exclude the initial newline
  };

  /** @type {LoggedErrorHandler} */
  const loggedErrorHandler = {
    getStackString: globalThis.getStackString || defaultGetStackString,
    takeMessageLogArgs: error => {
      const result = hiddenMessageLogArgs.get(error);
      hiddenMessageLogArgs.delete(error);
      return result;
    },
    takeNoteLogArgsArray: (error, callback) => {
      const result = hiddenNoteLogArgsArrays.get(error);
      hiddenNoteLogArgsArrays.delete(error);
      if (callback !== undefined) {
        const callbacks = hiddenNoteCallbackArrays.get(error);
        if (callbacks) {
          callbacks.push(callback);
        } else {
          hiddenNoteCallbackArrays.set(error, [callback]);
        }
      }
      return result || [];
    },
  };
  freeze(loggedErrorHandler);

  // /////////////////////////////////////////////////////////////////////////////

  /**
   * @type {MakeAssert}
   */
  const makeAssert = (optRaise = undefined) => {
    /** @type {AssertFail} */
    const fail = (
      optDetails = details`Assert failed`,
      ErrorConstructor = Error,
    ) => {
      const reason = makeError(optDetails, ErrorConstructor);
      if (optRaise !== undefined) {
        optRaise(reason);
      }
      throw reason;
    };
    freeze(fail);

    // Don't freeze or export `baseAssert` until we add methods.
    // TODO If I change this from a `function` function to an arrow
    // function, I seem to get type errors from TypeScript. Why?
    /** @type {BaseAssert} */
    function baseAssert(
      flag,
      optDetails = details`Check failed`,
      ErrorConstructor = Error,
    ) {
      if (!flag) {
        throw fail(optDetails, ErrorConstructor);
      }
    }

    /** @type {AssertEqual} */
    const equal = (
      actual,
      expected,
      optDetails = details`Expected ${actual} is same as ${expected}`,
      ErrorConstructor = RangeError,
    ) => {
      baseAssert(is(actual, expected), optDetails, ErrorConstructor);
    };
    freeze(equal);

    /** @type {AssertTypeof} */
    const assertTypeof = (specimen, typename, optDetails) => {
      baseAssert(
        typeof typename === 'string',
        details`${quote(typename)} must be a string`,
      );
      if (optDetails === undefined) {
        // Like
        // ```js
        // optDetails = details`${specimen} must be ${quote(an(typename))}`;
        // ```
        // except it puts the typename into the literal part of the template
        // so it doesn't get quoted.
        optDetails = details(['', ` must be ${an(typename)}`], specimen);
      }
      equal(typeof specimen, typename, optDetails, TypeError);
    };
    freeze(assertTypeof);

    /** @type {AssertString} */
    const assertString = (specimen, optDetails) =>
      assertTypeof(specimen, 'string', optDetails);

    // Note that "assert === baseAssert"
    /** @type {Assert} */
    const assert = assign(baseAssert, {
      error: makeError,
      fail,
      equal,
      typeof: assertTypeof,
      string: assertString,
      note,
      details,
      quote,
      makeAssert,
    });
    return freeze(assert);
  };
  freeze(makeAssert);

  /** @type {Assert} */
  const assert = makeAssert();

  const { details: d, quote: q } = assert;

  const localePattern = /^(\w*[a-z])Locale([A-Z]\w*)$/;

  // Use concise methods to obtain named functions without constructor
  // behavior or `.prototype` property.
  const tamedMethods = {
    // See https://tc39.es/ecma262/#sec-string.prototype.localecompare
    localeCompare(that) {
      if (this === null || this === undefined) {
        throw new TypeError(
          'Cannot localeCompare with null or undefined "this" value',
        );
      }
      const s = `${this}`;
      that = `${that}`;
      if (s < that) {
        return -1;
      }
      if (s > that) {
        return 1;
      }
      assert(s === that, d`expected ${q(s)} and ${q(that)} to compare`);
      return 0;
    },
  };

  const nonLocaleCompare = tamedMethods.localeCompare;

  function tameLocaleMethods(intrinsics, localeTaming = 'safe') {
    if (localeTaming !== 'safe' && localeTaming !== 'unsafe') {
      throw new Error(`unrecognized dateTaming ${localeTaming}`);
    }
    if (localeTaming === 'unsafe') {
      return;
    }

    defineProperty(String.prototype, 'localeCompare', {
      value: nonLocaleCompare,
    });

    for (const intrinsicName of getOwnPropertyNames(intrinsics)) {
      const intrinsic = intrinsics[intrinsicName];
      if (intrinsic === Object(intrinsic)) {
        for (const methodName of getOwnPropertyNames(intrinsic)) {
          const match = localePattern.exec(methodName);
          if (match) {
            assert(
              typeof intrinsic[methodName] === 'function',
              d`expected ${q(methodName)} to be a function`,
            );
            const nonLocaleMethodName = `${match[1]}${match[2]}`;
            const method = intrinsic[nonLocaleMethodName];
            assert(
              typeof method === 'function',
              d`function ${q(nonLocaleMethodName)} not found`,
            );
            defineProperty(intrinsic, methodName, { value: method });
          }
        }
      }
    }
  }

  /**
   * keywords
   * In JavaScript you cannot use these reserved words as variables.
   * See 11.6.1 Identifier Names
   */
  const keywords = [
    // 11.6.2.1 Keywords
    'await',
    'break',
    'case',
    'catch',
    'class',
    'const',
    'continue',
    'debugger',
    'default',
    'delete',
    'do',
    'else',
    'export',
    'extends',
    'finally',
    'for',
    'function',
    'if',
    'import',
    'in',
    'instanceof',
    'new',
    'return',
    'super',
    'switch',
    'this',
    'throw',
    'try',
    'typeof',
    'var',
    'void',
    'while',
    'with',
    'yield',

    // Also reserved when parsing strict mode code
    'let',
    'static',

    // 11.6.2.2 Future Reserved Words
    'enum',

    // Also reserved when parsing strict mode code
    'implements',
    'package',
    'protected',
    'interface',
    'private',
    'public',

    // Reserved but not mentioned in specs
    'await',

    'null',
    'true',
    'false',

    'this',
    'arguments',
  ];

  /**
   * identifierPattern
   * Simplified validation of indentifier names: may only contain alphanumeric
   * characters (or "$" or "_"), and may not start with a digit. This is safe
   * and does not reduces the compatibility of the shim. The motivation for
   * this limitation was to decrease the complexity of the implementation,
   * and to maintain a resonable level of performance.
   * Note: \w is equivalent [a-zA-Z_0-9]
   * See 11.6.1 Identifier Names
   */
  const identifierPattern = new RegExp('^[a-zA-Z_$][\\w$]*$');

  /**
   * isValidIdentifierName()
   * What variable names might it bring into scope? These include all
   * property names which can be variable names, including the names
   * of inherited properties. It excludes symbols and names which are
   * keywords. We drop symbols safely. Currently, this shim refuses
   * service if any of the names are keywords or keyword-like. This is
   * safe and only prevent performance optimization.
   *
   * @param {string} name
   */
  function isValidIdentifierName(name) {
    // Ensure we have a valid identifier. We use regexpTest rather than
    // /../.test() to guard against the case where RegExp has been poisoned.
    return (
      name !== 'eval' &&
      !arrayIncludes(keywords, name) &&
      regexpTest(identifierPattern, name)
    );
  }

  /*
   * isImmutableDataProperty
   */

  function isImmutableDataProperty(obj, name) {
    const desc = getOwnPropertyDescriptor(obj, name);
    return (
      //
      // The getters will not have .writable, don't let the falsyness of
      // 'undefined' trick us: test with === false, not ! . However descriptors
      // inherit from the (potentially poisoned) global object, so we might see
      // extra properties which weren't really there. Accessor properties have
      // 'get/set/enumerable/configurable', while data properties have
      // 'value/writable/enumerable/configurable'.
      desc.configurable === false &&
      desc.writable === false &&
      //
      // Checks for data properties because they're the only ones we can
      // optimize (accessors are most likely non-constant). Descriptors can't
      // can't have accessors and value properties at the same time, therefore
      // this check is sufficient. Using explicit own property deal with the
      // case where Object.prototype has been poisoned.
      objectHasOwnProperty(desc, 'value')
    );
  }

  /**
   * getScopeConstants()
   * What variable names might it bring into scope? These include all
   * property names which can be variable names, including the names
   * of inherited properties. It excludes symbols and names which are
   * keywords. We drop symbols safely. Currently, this shim refuses
   * service if any of the names are keywords or keyword-like. This is
   * safe and only prevent performance optimization.
   *
   * @param {Object} globalObject
   * @param {Object} localObject
   */
  function getScopeConstants(globalObject, localObject = {}) {
    // getOwnPropertyNames() does ignore Symbols so we don't need to
    // filter them out.
    const globalNames = getOwnPropertyNames(globalObject);
    const localNames = getOwnPropertyNames(localObject);

    // Collect all valid & immutable identifiers from the endowments.
    const localConstants = localNames.filter(
      name =>
        isValidIdentifierName(name) && isImmutableDataProperty(localObject, name),
    );

    // Collect all valid & immutable identifiers from the global that
    // are also not present in the endwoments (immutable or not).
    const globalConstants = globalNames.filter(
      name =>
        // Can't define a constant: it would prevent a
        // lookup on the endowments.
        !localNames.includes(name) &&
        isValidIdentifierName(name) &&
        isImmutableDataProperty(globalObject, name),
    );

    return [...globalConstants, ...localConstants];
  }

  const { details: d$1, quote: q$1 } = assert;

  // The original unsafe untamed eval function, which must not escape.
  // Sample at module initialization time, which is before lockdown can
  // repair it.  Use it only to build powerless abstractions.
  // eslint-disable-next-line no-eval
  const FERAL_EVAL = eval;

  /**
   * alwaysThrowHandler
   * This is an object that throws if any propery is called. It's used as
   * a proxy handler which throws on any trap called.
   * It's made from a proxy with a get trap that throws. It's safe to
   * create one and share it between all scopeHandlers.
   */
  const alwaysThrowHandler = new Proxy(immutableObject, {
    get(_shadow, prop) {
      assert.fail(
        d$1`Please report unexpected scope handler trap: ${q$1(String(prop))}`,
      );
    },
  });

  /*
   * createScopeHandler()
   * ScopeHandler manages a Proxy which serves as the global scope for the
   * performEval operation (the Proxy is the argument of a 'with' binding).
   * As described in createSafeEvaluator(), it has several functions:
   * - allow the very first (and only the very first) use of 'eval' to map to
   * the real (unsafe) eval function, so it acts as a 'direct eval' and can
   * access its lexical scope (which maps to the 'with' binding, which the
   * ScopeHandler also controls).
   * - ensure that all subsequent uses of 'eval' map to the safeEvaluator,
   * which lives as the 'eval' property of the safeGlobal.
   * - route all other property lookups at the safeGlobal.
   * - hide the unsafeGlobal which lives on the scope chain above the 'with'.
   * - ensure the Proxy invariants despite some global properties being frozen.
   */
  function createScopeHandler(
    globalObject,
    localObject = {},
    { sloppyGlobalsMode = false } = {},
  ) {
    return {
      // The scope handler throws if any trap other than get/set/has are run
      // (e.g. getOwnPropertyDescriptors, apply, getPrototypeOf).
      __proto__: alwaysThrowHandler,

      // This flag allow us to determine if the eval() call is an done by the
      // realm's code or if it is user-land invocation, so we can react differently.
      useUnsafeEvaluator: false,

      get(_shadow, prop) {
        if (typeof prop === 'symbol') {
          return undefined;
        }

        // Special treatment for eval. The very first lookup of 'eval' gets the
        // unsafe (real direct) eval, so it will get the lexical scope that uses
        // the 'with' context.
        if (prop === 'eval') {
          // test that it is true rather than merely truthy
          if (this.useUnsafeEvaluator === true) {
            // revoke before use
            this.useUnsafeEvaluator = false;
            return FERAL_EVAL;
          }
          // fall through
        }

        // Properties of the localObject.
        if (prop in localObject) {
          // Use reflect to defeat accessors that could be present on the
          // localObject object itself as `this`.
          // This is done out of an overabundance of caution, as the SES shim
          // only use the localObject carry globalLexicals and live binding
          // traps.
          // The globalLexicals are captured as a snapshot of what's passed to
          // the Compartment constructor, wherein all accessors and setters are
          // eliminated and the result frozen.
          // The live binding traps do use accessors, and none of those accessors
          // make use of their receiver.
          // Live binding traps provide no avenue for user code to observe the
          // receiver.
          return reflectGet(localObject, prop, globalObject);
        }

        // Properties of the global.
        return reflectGet(globalObject, prop);
      },

      set(_shadow, prop, value) {
        // Properties of the localObject.
        if (prop in localObject) {
          const desc = getOwnPropertyDescriptor(localObject, prop);
          if ('value' in desc) {
            // Work around a peculiar behavior in the specs, where
            // value properties are defined on the receiver.
            return reflectSet(localObject, prop, value);
          }
          // Ensure that the 'this' value on setters resolves
          // to the safeGlobal, not to the localObject object.
          return reflectSet(localObject, prop, value, globalObject);
        }

        // Properties of the global.
        return reflectSet(globalObject, prop, value);
      },

      // we need has() to return false for some names to prevent the lookup from
      // climbing the scope chain and eventually reaching the unsafeGlobal
      // object (globalThis), which is bad.

      // todo: we'd like to just have has() return true for everything, and then
      // use get() to raise a ReferenceError for anything not on the safe global.
      // But we want to be compatible with ReferenceError in the normal case and
      // the lack of ReferenceError in the 'typeof' case. Must either reliably
      // distinguish these two cases (the trap behavior might be different), or
      // we rely on a mandatory source-to-source transform to change 'typeof abc'
      // to XXX. We already need a mandatory parse to prevent the 'import',
      // since it's a special form instead of merely being a global variable/

      // note: if we make has() return true always, then we must implement a
      // set() trap to avoid subverting the protection of strict mode (it would
      // accept assignments to undefined globals, when it ought to throw
      // ReferenceError for such assignments)

      has(_shadow, prop) {
        // unsafeGlobal: hide all properties of the current global
        // at the expense of 'typeof' being wrong for those properties. For
        // example, in the browser, evaluating 'document = 3', will add
        // a property to globalObject instead of throwing a ReferenceError.
        if (
          sloppyGlobalsMode ||
          prop === 'eval' ||
          prop in localObject ||
          prop in globalObject ||
          prop in globalThis
        ) {
          return true;
        }

        return false;
      },

      // note: this is likely a bug of safari
      // https://bugs.webkit.org/show_bug.cgi?id=195534

      getPrototypeOf() {
        return null;
      },

      // Chip has seen this happen single stepping under the Chrome/v8 debugger.
      // TODO record how to reliably reproduce, and to test if this fix helps.
      // TODO report as bug to v8 or Chrome, and record issue link here.

      getOwnPropertyDescriptor(_target, prop) {
        // Coerce with `String` in case prop is a symbol.
        const quotedProp = JSON.stringify(String(prop));
        console.warn(
          `getOwnPropertyDescriptor trap on scopeHandler for ${quotedProp}`,
          new Error().stack,
        );
        return undefined;
      },
    };
  }

  // Captures a key and value of the form #key=value or @key=value
  const sourceMetaEntryRegExp =
    '\\s*[@#]\\s*([a-zA-Z][a-zA-Z0-9]*)\\s*=\\s*([^\\s\\*]*)';
  // Captures either a one-line or multi-line comment containing
  // one #key=value or @key=value.
  // Produces two pairs of capture groups, but the initial two may be undefined.
  // On account of the mechanics of regular expressions, scanning from the end
  // does not allow us to capture every pair, so getSourceURL must capture and
  // trim until there are no matching comments.
  const sourceMetaEntriesRegExp = new RegExp(
    `(?:\\s*//${sourceMetaEntryRegExp}|/\\*${sourceMetaEntryRegExp}\\s*\\*/)\\s*$`,
  );

  function getSourceURL(src) {
    let sourceURL = '<unknown>';

    // Our regular expression matches the last one or two comments with key value
    // pairs at the end of the source, avoiding a scan over the entire length of
    // the string, but at the expense of being able to capture all the (key,
    // value) pair meta comments at the end of the source, which may include
    // sourceMapURL in addition to sourceURL.
    // So, we sublimate the comments out of the source until no source or no
    // comments remain.
    while (src.length > 0) {
      const match = sourceMetaEntriesRegExp.exec(src);
      if (match === null) {
        break;
      }
      src = src.slice(0, src.length - match[0].length);

      // We skip $0 since it contains the entire match.
      // The match contains four capture groups,
      // two (key, value) pairs, the first of which
      // may be undefined.
      // On the off-chance someone put two sourceURL comments in their code with
      // different commenting conventions, the latter has precedence.
      if (match[3] === 'sourceURL') {
        sourceURL = match[4];
      } else if (match[1] === 'sourceURL') {
        sourceURL = match[2];
      }
    }

    return sourceURL;
  }

  // @ts-check

  /**
   * Find the first occurence of the given pattern and return
   * the location as the approximate line number.
   *
   * @param {string} src
   * @param {RegExp} pattern
   * @returns {number}
   */
  function getLineNumber(src, pattern) {
    const index = stringSearch(src, pattern);
    if (index < 0) {
      return -1;
    }
    return stringSplit(stringSlice(src, 0, index), '\n').length;
  }

  // /////////////////////////////////////////////////////////////////////////////

  const htmlCommentPattern = new RegExp(`(?:${'<'}!--|--${'>'})`, 'g');

  /**
   * Conservatively reject the source text if it may contain text that some
   * JavaScript parsers may treat as an html-like comment. To reject without
   * parsing, `rejectHtmlComments` will also reject some other text as well.
   *
   * https://www.ecma-international.org/ecma-262/9.0/index.html#sec-html-like-comments
   * explains that JavaScript parsers may or may not recognize html
   * comment tokens "<" immediately followed by "!--" and "--"
   * immediately followed by ">" in non-module source text, and treat
   * them as a kind of line comment. Since otherwise both of these can
   * appear in normal JavaScript source code as a sequence of operators,
   * we have the terrifying possibility of the same source code parsing
   * one way on one correct JavaScript implementation, and another way
   * on another.
   *
   * This shim takes the conservative strategy of just rejecting source
   * text that contains these strings anywhere. Note that this very
   * source file is written strangely to avoid mentioning these
   * character strings explicitly.
   *
   * We do not write the regexp in a straightforward way, so that an
   * apparennt html comment does not appear in this file. Thus, we avoid
   * rejection by the overly eager rejectDangerousSources.
   *
   * @param {string} src
   * @returns {string}
   */
  function rejectHtmlComments(src) {
    const lineNumber = getLineNumber(src, htmlCommentPattern);
    if (lineNumber < 0) {
      return src;
    }
    const name = getSourceURL(src);
    throw new SyntaxError(
      `Possible HTML comment rejected at ${name}:${lineNumber}. (SES_HTML_COMMENT_REJECTED)`,
    );
  }

  /**
   * An optional transform to place ahead of `rejectHtmlComments` to evade *that*
   * rejection. However, it may change the meaning of the program.
   *
   * This evasion replaces each alleged html comment with the space-separated
   * JavaScript operator sequence that it may mean, assuming that it appears
   * outside of a comment or literal string, in source code where the JS
   * parser makes no special case for html comments (like module source code).
   * In that case, this evasion preserves the meaning of the program, though it
   * does change the souce column numbers on each effected line.
   *
   * If the html comment appeared in a literal (a string literal, regexp literal,
   * or a template literal), then this evasion will change the meaning of the
   * program by changing the text of that literal.
   *
   * If the html comment appeared in a JavaScript comment, then this evasion does
   * not change the meaning of the program because it only changes the contents of
   * those comments.
   *
   * @param { string } src
   * @returns { string }
   */
  function evadeHtmlCommentTest(src) {
    const replaceFn = match => (match[0] === '<' ? '< ! --' : '-- >');
    return src.replace(htmlCommentPattern, replaceFn);
  }

  // /////////////////////////////////////////////////////////////////////////////

  const importPattern = new RegExp('\\bimport(\\s*(?:\\(|/[/*]))', 'g');

  /**
   * Conservatively reject the source text if it may contain a dynamic
   * import expression. To reject without parsing, `rejectImportExpressions` will
   * also reject some other text as well.
   *
   * The proposed dynamic import expression is the only syntax currently
   * proposed, that can appear in non-module JavaScript code, that
   * enables direct access to the outside world that cannot be
   * surpressed or intercepted without parsing and rewriting. Instead,
   * this shim conservatively rejects any source text that seems to
   * contain such an expression. To do this safely without parsing, we
   * must also reject some valid programs, i.e., those containing
   * apparent import expressions in literal strings or comments.
   *
   * The current conservative rule looks for the identifier "import"
   * followed by either an open paren or something that looks like the
   * beginning of a comment. We assume that we do not need to worry
   * about html comment syntax because that was already rejected by
   * rejectHtmlComments.
   *
   * this \s *must* match all kinds of syntax-defined whitespace. If e.g.
   * U+2028 (LINE SEPARATOR) or U+2029 (PARAGRAPH SEPARATOR) is treated as
   * whitespace by the parser, but not matched by /\s/, then this would admit
   * an attack like: import\u2028('power.js') . We're trying to distinguish
   * something like that from something like importnotreally('power.js') which
   * is perfectly safe.
   *
   * @param { string } src
   * @returns { string }
   */
  function rejectImportExpressions(src) {
    const lineNumber = getLineNumber(src, importPattern);
    if (lineNumber < 0) {
      return src;
    }
    const name = getSourceURL(src);
    throw new SyntaxError(
      `Possible import expression rejected at ${name}:${lineNumber}. (SES_IMPORT_REJECTED)`,
    );
  }

  /**
   * An optional transform to place ahead of `rejectImportExpressions` to evade
   * *that* rejection. However, it may change the meaning of the program.
   *
   * This evasion replaces each suspicious `import` identifier with `__import__`.
   * If the alleged import expression appears in a JavaScript comment, this
   * evasion will not change the meaning of the program. If it appears in a
   * literal (string literal, regexp literal, or a template literal), then this
   * evasion will change the contents of that literal. If it appears as code
   * where it would be parsed as an expression, then it might or might not change
   * the meaning of the program, depending on the binding, if any, of the lexical
   * variable `__import__`.
   *
   * Finally, if the original appears in code where it is not parsed as an
   * expression, for example `foo.import(path)`, then this evasion would rewrite
   * to `foo.__import__(path)` which has a surprisingly different meaning.
   *
   * @param { string } src
   * @returns { string }
   */
  function evadeImportExpressionTest(src) {
    const replaceFn = (_, p1) => `__import__${p1}`;
    return src.replace(importPattern, replaceFn);
  }

  // /////////////////////////////////////////////////////////////////////////////

  const someDirectEvalPattern = new RegExp('\\beval(\\s*\\()', 'g');

  /**
   * Heuristically reject some text that seems to contain a direct eval
   * expression, with both false positives and false negavives. To reject without
   * parsing, `rejectSomeDirectEvalExpressions` may will also reject some other
   * text as well. It may also accept source text that contains a direct eval
   * written oddly, such as `(eval)(src)`. This false negative is not a security
   * vulnerability. Rather it is a compat hazard because it will execute as
   * an indirect eval under the SES-shim but as a direct eval on platforms that
   * support SES directly (like XS).
   *
   * The shim cannot correctly emulate a direct eval as explained at
   * https://github.com/Agoric/realms-shim/issues/12
   * If we did not reject direct eval syntax, we would
   * accidentally evaluate these with an emulation of indirect eval. To
   * prevent future compatibility problems, in shifting from use of the
   * shim to genuine platform support for the proposal, we should
   * instead statically reject code that seems to contain a direct eval
   * expression.
   *
   * As with the dynamic import expression, to avoid a full parse, we do
   * this approximately with a regexp, that will also reject strings
   * that appear safely in comments or strings. Unlike dynamic import,
   * if we miss some, this only creates future compat problems, not
   * security problems. Thus, we are only trying to catch innocent
   * occurrences, not malicious one. In particular, `(eval)(...)` is
   * direct eval syntax that would not be caught by the following regexp.
   *
   * Exported for unit tests.
   *
   * @param { string } src
   * @returns { string }
   */
  function rejectSomeDirectEvalExpressions(src) {
    const lineNumber = getLineNumber(src, someDirectEvalPattern);
    if (lineNumber < 0) {
      return src;
    }
    const name = getSourceURL(src);
    throw new SyntaxError(
      `Possible direct eval expression rejected at ${name}:${lineNumber}. (SES_EVAL_REJECTED)`,
    );
  }

  // /////////////////////////////////////////////////////////////////////////////

  /**
   * A transform that bundles together the transforms that must unconditionally
   * happen last in order to ensure safe evaluation without parsing.
   *
   * @param {string} source
   * @returns {string}
   */
  function mandatoryTransforms(source) {
    source = rejectHtmlComments(source);
    source = rejectImportExpressions(source);
    return source;
  }

  /**
   * Starting with `source`, apply each transform to the result of the
   * previous one, returning the result of the last transformation.
   *
   * @param {string} source
   * @param {((str: string) => string)[]} transforms
   * @returns {string}
   */
  function applyTransforms(source, transforms) {
    for (const transform of transforms) {
      source = transform(source);
    }
    return source;
  }

  // The original unsafe untamed Function constructor, which must not escape.
  // Sample at module initialization time, which is before lockdown can
  // repair it. Use it only to build powerless abstractions.
  const FERAL_FUNCTION = Function;

  /**
   * buildOptimizer()
   * Given an array of indentifier, the optimizer return a `const` declaration
   * destructring `this`.
   *
   * @param {Array<string>} constants
   */
  function buildOptimizer(constants) {
    // No need to build an oprimizer when there are no constants.
    if (constants.length === 0) return '';
    // Use 'this' to avoid going through the scope proxy, which is unecessary
    // since the optimizer only needs references to the safe global.
    return `const {${arrayJoin(constants, ',')}} = this;`;
  }

  /**
   * makeEvaluateFactory()
   * The factory create 'evaluate' functions with the correct optimizer
   * inserted.
   *
   * @param {Array<string>} [constants]
   */
  function makeEvaluateFactory(constants = []) {
    const optimizer = buildOptimizer(constants);

    // Create a function in sloppy mode, so that we can use 'with'. It returns
    // a function in strict mode that evaluates the provided code using direct
    // eval, and thus in strict mode in the same scope. We must be very careful
    // to not create new names in this scope

    // 1: we use 'with' (around a Proxy) to catch all free variable names. The
    // `this` value holds the Proxy which safely wraps the safeGlobal
    // 2: 'optimizer' catches constant variable names for speed.
    // 3: The inner strict function is effectively passed two parameters:
    //    a) its arguments[0] is the source to be directly evaluated.
    //    b) its 'this' is the this binding seen by the code being
    //       directly evaluated (the globalObject).
    // 4: The outer sloppy function is passed one parameter, the scope proxy.
    //    as the `this` parameter.

    // Notes:
    // - everything in the 'optimizer' string is looked up in the proxy
    //   (including an 'arguments[0]', which points at the Proxy).
    // - keywords like 'function' which are reserved keywords, and cannot be
    //   used as a variables, so they is not part to the optimizer.
    // - when 'eval' is looked up in the proxy, and it's the first time it is
    //   looked up after useUnsafeEvaluator is turned on, the proxy returns the
    //   eval intrinsic, and flips useUnsafeEvaluator back to false. Any reference
    //   to 'eval' in that string will get the tamed evaluator.

    return FERAL_FUNCTION(`
    with (this) {
      ${optimizer}
      return function() {
        'use strict';
        return eval(arguments[0]);
      };
    }
  `);
  }

  // Portions adapted from V8 - Copyright 2016 the V8 project authors.

  const { details: d$2 } = assert;

  /**
   * performEval()
   * The low-level operation used by all evaluators:
   * eval(), Function(), Evalutator.prototype.evaluate().
   *
   * @param {string} source
   * @param {Object} globalObject
   * @param {Objeect} localObject
   * @param {Object} [options]
   * @param {Array<Transform>} [options.localTransforms]
   * @param {Array<Transform>} [options.globalTransforms]
   * @param {bool} [options.sloppyGlobalsMode]
   */
  function performEval(
    source,
    globalObject,
    localObject = {},
    {
      localTransforms = [],
      globalTransforms = [],
      sloppyGlobalsMode = false,
    } = {},
  ) {
    // Execute the mandatory transforms last to ensure that any rewritten code
    // meets those mandatory requirements.
    source = applyTransforms(source, [
      ...localTransforms,
      ...globalTransforms,
      mandatoryTransforms,
    ]);

    const scopeHandler = createScopeHandler(globalObject, localObject, {
      sloppyGlobalsMode,
    });
    const scopeProxyRevocable = proxyRevocable(immutableObject, scopeHandler);
    // Ensure that "this" resolves to the scope proxy.

    const constants = getScopeConstants(globalObject, localObject);
    const evaluateFactory = makeEvaluateFactory(constants);
    const evaluate = apply(evaluateFactory, scopeProxyRevocable.proxy, []);

    scopeHandler.useUnsafeEvaluator = true;
    let err;
    try {
      // Ensure that "this" resolves to the safe global.
      return apply(evaluate, globalObject, [source]);
    } catch (e) {
      // stash the child-code error in hopes of debugging the internal failure
      err = e;
      throw e;
    } finally {
      if (scopeHandler.useUnsafeEvaluator === true) {
        // The proxy switches off useUnsafeEvaluator immediately after
        // the first access, but if that's not the case we should abort.
        // This condition is one where this vat is now hopelessly confused,
        // and the vat as a whole should be aborted. All immediately reachable
        // state should be abandoned. However, that is not yet possible,
        // so we at least prevent further variable resolution via the
        // scopeHandler, and throw an error with diagnostic info including
        // the thrown error if any from evaluating the source code.
        scopeProxyRevocable.revoke();
        // TODO A GOOD PLACE TO PANIC(), i.e., kill the vat incarnation.
        // See https://github.com/Agoric/SES-shim/issues/490
        assert.fail(d$2`handler did not revoke useUnsafeEvaluator ${err}`);
      }
    }
  }

  /*
   * makeEvalFunction()
   * A safe version of the native eval function which relies on
   * the safety of performEval for confinement.
   */
  const makeEvalFunction = (globalObject, options = {}) => {
    // We use the the concise method syntax to create an eval without a
    // [[Construct]] behavior (such that the invocation "new eval()" throws
    // TypeError: eval is not a constructor"), but which still accepts a
    // 'this' binding.
    const newEval = {
      eval(source) {
        if (typeof source !== 'string') {
          // As per the runtime semantic of PerformEval [ECMAScript 18.2.1.1]:
          // If Type(source) is not String, return source.
          // TODO Recent proposals from Mike Samuel may change this non-string
          // rule. Track.
          return source;
        }
        return performEval(source, globalObject, {}, options);
      },
    }.eval;

    return newEval;
  };

  // The original unsafe untamed Function constructor, which must not escape.
  // Sample at module initialization time, which is before lockdown can
  // repair it.  Use it only to build powerless abstractions.
  const FERAL_FUNCTION$1 = Function;

  /*
   * makeFunctionConstructor()
   * A safe version of the native Function which relies on
   * the safety of performEval for confinement.
   */
  function makeFunctionConstructor(globaObject, options = {}) {
    // Define an unused parameter to ensure Function.length === 1
    const newFunction = function Function(_body) {
      // Sanitize all parameters at the entry point.
      // eslint-disable-next-line prefer-rest-params
      const bodyText = `${arrayPop(arguments) || ''}`;
      // eslint-disable-next-line prefer-rest-params
      const parameters = `${arrayJoin(arguments, ',')}`;

      // Are parameters and bodyText valid code, or is someone
      // attempting an injection attack? This will throw a SyntaxError if:
      // - parameters doesn't parse as parameters
      // - bodyText doesn't parse as a function body
      // - either contain a call to super() or references a super property.
      // eslint-disable-next-line no-new
      new FERAL_FUNCTION$1(parameters, bodyText);

      // Safe to be combined. Defeat potential trailing comments.
      // TODO: since we create an anonymous function, the 'this' value
      // isn't bound to the global object as per specs, but set as undefined.
      const src = `(function anonymous(${parameters}\n) {\n${bodyText}\n})`;
      return performEval(src, globaObject, {}, options);
    };

    defineProperties(newFunction, {
      // Ensure that any function created in any evaluator in a realm is an
      // instance of Function in any evaluator of the same realm.
      prototype: {
        value: Function.prototype,
        writable: false,
        enumerable: false,
        configurable: false,
      },
    });

    // Assert identity of Function.__proto__ accross all compartments
    assert(
      getPrototypeOf(Function) === Function.prototype,
      'Function prototype is the same accross compartments',
    );
    assert(
      getPrototypeOf(newFunction) === Function.prototype,
      'Function constructor prototype is the same accross compartments',
    );

    return newFunction;
  }

  /**
   * initGlobalObject()
   * Create new global object using a process similar to ECMA specifications
   * (portions of SetRealmGlobalObject and SetDefaultGlobalBindings).
   * `newGlobalPropertyNames` should be either `initialGlobalPropertyNames` or
   * `sharedGlobalPropertyNames`.
   *
   * @param {Object} globalObject
   * @param {Object} intrinsics
   * @param {Object} newGlobalPropertyNames
   * @param {Function} makeCompartmentConstructor
   * @param {Object} compartmentPrototype
   * @param {Object} [options]
   * @param {Array<Transform>} [options.globalTransforms]
   * @param {(Object) => void} [options.nativeBrander]
   */
  function initGlobalObject(
    globalObject,
    intrinsics,
    newGlobalPropertyNames,
    makeCompartmentConstructor,
    compartmentPrototype,
    { globalTransforms, nativeBrander },
  ) {
    for (const [name, constant] of entries(constantProperties)) {
      defineProperty(globalObject, name, {
        value: constant,
        writable: false,
        enumerable: false,
        configurable: false,
      });
    }

    for (const [name, intrinsicName] of entries(universalPropertyNames)) {
      if (objectHasOwnProperty(intrinsics, intrinsicName)) {
        defineProperty(globalObject, name, {
          value: intrinsics[intrinsicName],
          writable: true,
          enumerable: false,
          configurable: true,
        });
      }
    }

    for (const [name, intrinsicName] of entries(newGlobalPropertyNames)) {
      if (objectHasOwnProperty(intrinsics, intrinsicName)) {
        defineProperty(globalObject, name, {
          value: intrinsics[intrinsicName],
          writable: true,
          enumerable: false,
          configurable: true,
        });
      }
    }

    const perCompartmentGlobals = {
      globalThis: globalObject,
      eval: makeEvalFunction(globalObject, {
        globalTransforms,
      }),
      Function: makeFunctionConstructor(globalObject, {
        globalTransforms,
      }),
    };

    perCompartmentGlobals.Compartment = makeCompartmentConstructor(
      makeCompartmentConstructor,
      intrinsics,
      nativeBrander,
    );

    // TODO These should still be tamed according to the whitelist before
    // being made available.
    for (const [name, value] of entries(perCompartmentGlobals)) {
      defineProperty(globalObject, name, {
        value,
        writable: true,
        enumerable: false,
        configurable: true,
      });
      if (typeof value === 'function') {
        nativeBrander(value);
      }
    }
  }

  // @ts-check

  // For our internal debugging purposes, uncomment
  // const internalDebugConsole = console;

  // The whitelists of console methods, from:
  // Whatwg "living standard" https://console.spec.whatwg.org/
  // Node https://nodejs.org/dist/latest-v14.x/docs/api/console.html
  // MDN https://developer.mozilla.org/en-US/docs/Web/API/Console_API
  // TypeScript https://openstapps.gitlab.io/projectmanagement/interfaces/_node_modules__types_node_globals_d_.console.html
  // Chrome https://developers.google.com/web/tools/chrome-devtools/console/api

  // All console level methods have parameters (fmt?, ...args)
  // where the argument sequence `fmt?, ...args` formats args according to
  // fmt if fmt is a format string. Otherwise, it just renders them all as values
  // separated by spaces.
  // https://console.spec.whatwg.org/#formatter
  // https://nodejs.org/docs/latest/api/util.html#util_util_format_format_args

  // For the causal console, all occurrences of `fmt, ...args` or `...args` by
  // itself must check for the presence of an error to ask the
  // `loggedErrorHandler` to handle.
  // In theory we should do a deep inspection to detect for example an array
  // containing an error. We currently do not detect these and may never.

  /** @typedef {keyof VirtualConsole | 'profile' | 'profileEnd'} ConsoleProps */

  /** @type {readonly [ConsoleProps, LogSeverity | undefined][]} */
  const consoleLevelMethods = freeze([
    ['debug', 'debug'], // (fmt?, ...args) verbose level on Chrome
    ['log', 'log'], // (fmt?, ...args) info level on Chrome
    ['info', 'info'], // (fmt?, ...args)
    ['warn', 'warn'], // (fmt?, ...args)
    ['error', 'error'], // (fmt?, ...args)

    ['trace', 'log'], // (fmt?, ...args)
    ['dirxml', 'log'], // (fmt?, ...args)
    ['group', 'log'], // (fmt?, ...args)
    ['groupCollapsed', 'log'], // (fmt?, ...args)
  ]);

  /** @type {readonly [ConsoleProps, LogSeverity | undefined][]} */
  const consoleOtherMethods = freeze([
    ['assert', 'error'], // (value, fmt?, ...args)
    ['timeLog', 'log'], // (label?, ...args) no fmt string

    // Insensitive to whether any argument is an error. All arguments can pass
    // thru to baseConsole as is.
    ['clear', undefined], // ()
    ['count', 'info'], // (label?)
    ['countReset', undefined], // (label?)
    ['dir', 'log'], // (item, options?)
    ['groupEnd', 'log'], // ()
    // In theory tabular data may be or contain an error. However, we currently
    // do not detect these and may never.
    ['table', 'log'], // (tabularData, properties?)
    ['time', 'info'], // (label?)
    ['timeEnd', 'info'], // (label?)

    // Node Inspector only, MDN, and TypeScript, but not whatwg
    ['profile', undefined], // (label?)
    ['profileEnd', undefined], // (label?)
    ['timeStamp', undefined], // (label?)
  ]);

  /** @type {readonly [ConsoleProps, LogSeverity | undefined][]} */
  const consoleWhitelist = freeze([
    ...consoleLevelMethods,
    ...consoleOtherMethods,
  ]);

  /**
   * consoleOmittedProperties is currently unused. I record and maintain it here
   * with the intention that it be treated like the `false` entries in the main
   * SES whitelist: that seeing these on the original console is expected, but
   * seeing anything else that's outside the whitelist is surprising and should
   * provide a diagnostic.
   *
   * const consoleOmittedProperties = freeze([
   *   'memory', // Chrome
   *   'exception', // FF, MDN
   *   '_ignoreErrors', // Node
   *   '_stderr', // Node
   *   '_stderrErrorHandler', // Node
   *   '_stdout', // Node
   *   '_stdoutErrorHandler', // Node
   *   '_times', // Node
   *   'context', // Chrome, Node
   *   'record', // Safari
   *   'recordEnd', // Safari
   *
   *   'screenshot', // Safari
   *   // Symbols
   *   '@@toStringTag', // Chrome: "Object", Safari: "Console"
   *   // A variety of other symbols also seen on Node
   * ]);
   */

  // /////////////////////////////////////////////////////////////////////////////

  /** @type {MakeLoggingConsoleKit} */
  const makeLoggingConsoleKit = () => {
    // Not frozen!
    let logArray = [];

    const loggingConsole = fromEntries(
      consoleWhitelist.map(([name, _]) => {
        // Use an arrow function so that it doesn't come with its own name in
        // its printed form. Instead, we're hoping that tooling uses only
        // the `.name` property set below.
        /**
         * @param {...any} args
         */
        const method = (...args) => {
          logArray.push([name, ...args]);
        };
        defineProperty(method, 'name', { value: name });
        return [name, freeze(method)];
      }),
    );
    freeze(loggingConsole);

    const takeLog = () => {
      const result = freeze(logArray);
      logArray = [];
      return result;
    };
    freeze(takeLog);

    const typedLoggingConsole = /** @type {VirtualConsole} */ (loggingConsole);

    return freeze({ loggingConsole: typedLoggingConsole, takeLog });
  };
  freeze(makeLoggingConsoleKit);

  // /////////////////////////////////////////////////////////////////////////////

  /** @type {ErrorInfo} */
  const ErrorInfo = {
    NOTE: 'ERROR_NOTE:',
    MESSAGE: 'ERROR_MESSAGE:',
  };
  freeze(ErrorInfo);

  /**
   * The error annotations are sent to the baseConsole by calling some level
   * method. The 'debug' level seems best, because the Chrome console classifies
   * `debug` as verbose and does not show it by default. But we keep it symbolic
   * so we can change our mind. (On Node, `debug`, `log`, and `info` are aliases
   * for the same function and so will behave the same there.)
   */
  const BASE_CONSOLE_LEVEL = 'debug';

  /** @type {MakeCausalConsole} */
  const makeCausalConsole = (baseConsole, loggedErrorHandler) => {
    const {
      getStackString,
      takeMessageLogArgs,
      takeNoteLogArgsArray,
    } = loggedErrorHandler;

    // by "tagged", we mean first sent to the baseConsole as an argument in a
    // console level method call, in which it is shown with an identifying tag
    // number. We number the errors according to the order in
    // which they were first logged to the baseConsole, starting at 1.
    let numErrorsTagged = 0;
    /** @type WeakMap<Error, number> */
    const errorTagOrder = new WeakMap();

    /**
     * @param {Error} err
     * @returns {string}
     */
    const tagError = err => {
      let errNum;
      if (errorTagOrder.has(err)) {
        errNum = errorTagOrder.get(err);
      } else {
        numErrorsTagged += 1;
        errorTagOrder.set(err, numErrorsTagged);
        errNum = numErrorsTagged;
      }
      return `${err.name}#${errNum}`;
    };

    /**
     * @param {ReadonlyArray<any>} logArgs
     * @param {Array<any>} subErrorsSink
     * @returns {any}
     */
    const extractErrorArgs = (logArgs, subErrorsSink) => {
      const argTags = logArgs.map(arg => {
        if (arg instanceof Error) {
          subErrorsSink.push(arg);
          return `(${tagError(arg)})`;
        }
        return arg;
      });
      return argTags;
    };

    /**
     * @param {Error} error
     * @param {ErrorInfoKind} kind
     * @param {readonly any[]} logArgs
     * @param {Array<Error>} subErrorsSink
     */
    const logErrorInfo = (error, kind, logArgs, subErrorsSink) => {
      const errorTag = tagError(error);
      const errorName =
        kind === ErrorInfo.MESSAGE ? `${errorTag}:` : `${errorTag} ${kind}`;
      const argTags = extractErrorArgs(logArgs, subErrorsSink);
      baseConsole[BASE_CONSOLE_LEVEL](errorName, ...argTags);
    };

    /**
     * Logs the `subErrors` within a group name mentioning `optTag`.
     *
     * @param {Error[]} subErrors
     * @param {string | undefined} optTag
     * @returns {void}
     */
    const logSubErrors = (subErrors, optTag = undefined) => {
      if (subErrors.length === 0) {
        return;
      }
      if (subErrors.length === 1 && optTag === undefined) {
        // eslint-disable-next-line no-use-before-define
        logError(subErrors[0]);
        return;
      }
      let label;
      if (subErrors.length === 1) {
        label = `Nested error`;
      } else {
        label = `Nested ${subErrors.length} errors`;
      }
      if (optTag !== undefined) {
        label = `${label} under ${optTag}`;
      }
      baseConsole.group(label);
      try {
        for (const subError of subErrors) {
          // eslint-disable-next-line no-use-before-define
          logError(subError);
        }
      } finally {
        baseConsole.groupEnd();
      }
    };

    const errorsLogged = new WeakSet();

    /** @type {NoteCallback} */
    const noteCallback = (error, noteLogArgs) => {
      const subErrors = [];
      // Annotation arrived after the error has already been logged,
      // so just log the annotation immediately, rather than remembering it.
      logErrorInfo(error, ErrorInfo.NOTE, noteLogArgs, subErrors);
      logSubErrors(subErrors, tagError(error));
    };

    /**
     * @param {Error} error
     */
    const logError = error => {
      if (errorsLogged.has(error)) {
        return;
      }
      const errorTag = tagError(error);
      errorsLogged.add(error);
      const subErrors = [];
      const messageLogArgs = takeMessageLogArgs(error);
      const noteLogArgsArray = takeNoteLogArgsArray(error, noteCallback);
      // Show the error's most informative error message
      if (messageLogArgs === undefined) {
        // If there is no message log args, then just show the message that
        // the error itself carries.
        baseConsole[BASE_CONSOLE_LEVEL](`${errorTag}:`, error.message);
      } else {
        // If there is one, we take it to be strictly more informative than the
        // message string carried by the error, so show it *instead*.
        logErrorInfo(error, ErrorInfo.MESSAGE, messageLogArgs, subErrors);
      }
      // After the message but before any other annotations, show the stack.
      let stackString = getStackString(error);
      if (
        typeof stackString === 'string' &&
        stackString.length >= 1 &&
        !stackString.endsWith('\n')
      ) {
        stackString += '\n';
      }
      baseConsole[BASE_CONSOLE_LEVEL](stackString);
      // Show the other annotations on error
      for (const noteLogArgs of noteLogArgsArray) {
        logErrorInfo(error, ErrorInfo.NOTE, noteLogArgs, subErrors);
      }
      // explain all the errors seen in the messages already emitted.
      logSubErrors(subErrors, errorTag);
    };

    const levelMethods = consoleLevelMethods.map(([level, _]) => {
      /**
       * @param {...any} logArgs
       */
      const levelMethod = (...logArgs) => {
        const subErrors = [];
        const argTags = extractErrorArgs(logArgs, subErrors);
        // @ts-ignore
        baseConsole[level](...argTags);
        logSubErrors(subErrors);
      };
      defineProperty(levelMethod, 'name', { value: level });
      return [level, freeze(levelMethod)];
    });
    const otherMethodNames = consoleOtherMethods.filter(
      ([name, _]) => name in baseConsole,
    );
    const otherMethods = otherMethodNames.map(([name, _]) => {
      /**
       * @param {...any} args
       */
      const otherMethod = (...args) => {
        // @ts-ignore
        baseConsole[name](...args);
        return undefined;
      };
      defineProperty(otherMethod, 'name', { value: name });
      return [name, freeze(otherMethod)];
    });

    const causalConsole = fromEntries([...levelMethods, ...otherMethods]);
    return freeze(causalConsole);
  };
  freeze(makeCausalConsole);

  // /////////////////////////////////////////////////////////////////////////////

  /** @type {FilterConsole} */
  const filterConsole = (baseConsole, filter, _topic = undefined) => {
    // TODO do something with optional topic string
    const whilelist = consoleWhitelist.filter(([name, _]) => name in baseConsole);
    const methods = whilelist.map(([name, severity]) => {
      /**
       * @param {...any} args
       */
      const method = (...args) => {
        if (severity === undefined || filter.canLog(severity)) {
          // @ts-ignore
          baseConsole[name](...args);
        }
      };
      return [name, freeze(method)];
    });
    const filteringConsole = fromEntries(methods);
    return freeze(filteringConsole);
  };
  freeze(filterConsole);

  // @ts-check

  const originalConsole = console;

  /**
   * Wrap console unless suppressed.
   * At the moment, the console is considered a host power in the start
   * compartment, and not a primordial. Hence it is absent from the whilelist
   * and bypasses the intrinsicsCollector.
   *
   * @param {"safe" | "unsafe"} consoleTaming
   * @param {GetStackString=} optGetStackString
   */
  const tameConsole = (
    consoleTaming = 'safe',
    optGetStackString = undefined,
  ) => {
    if (consoleTaming !== 'safe' && consoleTaming !== 'unsafe') {
      throw new Error(`unrecognized consoleTaming ${consoleTaming}`);
    }

    if (consoleTaming === 'unsafe') {
      return { console: originalConsole };
    }
    let loggedErrorHandler$1;
    if (optGetStackString === undefined) {
      loggedErrorHandler$1 = loggedErrorHandler;
    } else {
      loggedErrorHandler$1 = {
        ...loggedErrorHandler,
        getStackString: optGetStackString,
      };
    }
    const causalConsole = makeCausalConsole(originalConsole, loggedErrorHandler$1);
    return { console: causalConsole };
  };

  // Whitelist names from https://v8.dev/docs/stack-trace-api
  // Whitelisting only the names used by error-stack-shim/src/v8StackFrames
  // callSiteToFrame to shim the error stack proposal.
  const safeV8CallSiteMethodNames = [
    // suppress 'getThis' definitely
    'getTypeName',
    // suppress 'getFunction' definitely
    'getFunctionName',
    'getMethodName',
    'getFileName',
    'getLineNumber',
    'getColumnNumber',
    'getEvalOrigin',
    'isToplevel',
    'isEval',
    'isNative',
    'isConstructor',
    'isAsync',
    // suppress 'isPromiseAll' for now
    // suppress 'getPromiseIndex' for now

    // Additional names found by experiment, absent from
    // https://v8.dev/docs/stack-trace-api
    'getPosition',
    'getScriptNameOrSourceURL',

    'toString', // TODO replace to use only whitelisted info
  ];

  // TODO this is a ridiculously expensive way to attenuate callsites.
  // Before that matters, we should switch to a reasonable representation.
  const safeV8CallSiteFacet = callSite => {
    const methodEntry = name => [name, () => callSite[name]()];
    const o = fromEntries(safeV8CallSiteMethodNames.map(methodEntry));
    return Object.create(o, {});
  };

  const safeV8SST = sst => sst.map(safeV8CallSiteFacet);

  // If it has `/node_modules/` anywhere in it, on Node it is likely
  // to be a dependent package of the current package, and so to
  // be an infrastructure frame to be dropped from concise stack traces.
  const FILENAME_NODE_DEPENDENTS_CENSOR = /\/node_modules\//;

  // If it begins with `internal/` or `node:internal` then it is likely
  // part of the node infrustructre itself, to be dropped from concise
  // stack traces.
  const FILENAME_NODE_INTERNALS_CENSOR = /^(?:node:)?internal\//;

  // Frames within the `assert.js` package should be dropped from
  // concise stack traces, as these are just steps towards creating the
  // error object in question.
  const FILENAME_ASSERT_CENSOR = /\/packages\/ses\/src\/error\/assert.js$/;

  // Frames within the `eventual-send` shim should be dropped so that concise
  // deep stacks omit the internals of the eventual-sending mechanism causing
  // asynchronous messages to be sent.
  // Note that the eventual-send package will move from agoric-sdk to
  // Endo, so this rule will be of general interest.
  const FILENAME_EVENTUAL_SEND_CENSOR = /\/packages\/eventual-send\/src\//;

  // Any stack frame whose `fileName` matches any of these censor patterns
  // will be omitted from concise stacks.
  // TODO Enable users to configure FILENAME_CENSORS via `lockdown` options.
  const FILENAME_CENSORS = [
    FILENAME_NODE_DEPENDENTS_CENSOR,
    FILENAME_NODE_INTERNALS_CENSOR,
    FILENAME_ASSERT_CENSOR,
    FILENAME_EVENTUAL_SEND_CENSOR,
  ];

  // Should a stack frame with this as its fileName be included in a concise
  // stack trace?
  // Exported only so it can be unit tested.
  // TODO Move so that it applies not just to v8.
  const filterFileName = fileName => {
    if (!fileName) {
      // Stack frames with no fileName should appear in concise stack traces.
      return true;
    }
    for (const filter of FILENAME_CENSORS) {
      if (filter.test(fileName)) {
        return false;
      }
    }
    return true;
  };

  // The ad-hoc rule of the current pattern is that any likely-file-path or
  // likely url-path prefix, ending in a `/.../` should get dropped.
  // Anything to the left of the likely path text is kept.
  // Everything to the right of `/.../` is kept. Thus
  // `'Object.bar (/vat-v1/.../eventual-send/test/test-deep-send.js:13:21)'`
  // simplifies to
  // `'Object.bar (eventual-send/test/test-deep-send.js:13:21)'`.
  //
  // See thread starting at
  // https://github.com/Agoric/agoric-sdk/issues/2326#issuecomment-773020389
  const CALLSITE_ELLIPSES_PATTERN = /^((?:.*[( ])?)[:/\w_-]*\/\.\.\.\/(.+)$/;

  // The ad-hoc rule of the current pattern is that any likely-file-path or
  // likely url-path prefix, ending in a `/` and prior to `package/` should get
  // dropped.
  // Anything to the left of the likely path prefix text is kept. `package/` and
  // everything to its right is kept. Thus
  // `'Object.bar (/Users/markmiller/src/ongithub/agoric/agoric-sdk/packages/eventual-send/test/test-deep-send.js:13:21)'`
  // simplifies to
  // `'Object.bar (packages/eventual-send/test/test-deep-send.js:13:21)'`.
  // Note that `/packages/` is a convention for monorepos encouraged by
  // lerna.
  const CALLSITE_PACKAGES_PATTERN = /^((?:.*[( ])?)[:/\w_-]*\/(packages\/.+)$/;

  // The use of these callSite patterns below assumes that any match will bind
  // capture groups containing the parts of the original string we want
  // to keep. The parts outside those capture groups will be dropped from concise
  // stacks.
  // TODO Enable users to configure CALLSITE_PATTERNS via `lockdown` options.
  const CALLSITE_PATTERNS = [
    CALLSITE_ELLIPSES_PATTERN,
    CALLSITE_PACKAGES_PATTERN,
  ];

  // For a stack frame that should be included in a concise stack trace, if
  // `callSiteString` is the original stringified stack frame, return the
  // possibly-shorter stringified stack frame that should be shown instead.
  // Exported only so it can be unit tested.
  // TODO Move so that it applies not just to v8.
  const shortenCallSiteString = callSiteString => {
    for (const filter of CALLSITE_PATTERNS) {
      const match = filter.exec(callSiteString);
      if (match) {
        return match.slice(1).join('');
      }
    }
    return callSiteString;
  };

  function tameV8ErrorConstructor(
    OriginalError,
    InitialError,
    errorTaming,
    stackFiltering,
  ) {
    // const callSiteFilter = _callSite => true;
    const callSiteFilter = callSite => {
      if (stackFiltering === 'verbose') {
        return true;
      }
      return filterFileName(callSite.getFileName());
    };

    const callSiteStringifier = callSite => {
      let callSiteString = `${callSite}`;
      if (stackFiltering === 'concise') {
        callSiteString = shortenCallSiteString(callSiteString);
      }
      return `\n  at ${callSiteString}`;
    };

    const stackStringFromSST = (_error, sst) =>
      [...sst.filter(callSiteFilter).map(callSiteStringifier)].join('');

    // Mapping from error instance to the structured stack trace capturing the
    // stack for that instance.
    const ssts = new WeakMap();

    // Use concise methods to obtain named functions without constructors.
    const tamedMethods = {
      // The optional `optFn` argument is for cutting off the bottom of
      // the stack --- for capturing the stack only above the topmost
      // call to that function. Since this isn't the "real" captureStackTrace
      // but instead calls the real one, if no other cutoff is provided,
      // we cut this one off.
      captureStackTrace(error, optFn = tamedMethods.captureStackTrace) {
        if (typeof OriginalError.captureStackTrace === 'function') {
          // OriginalError.captureStackTrace is only on v8
          OriginalError.captureStackTrace(error, optFn);
          return;
        }
        Reflect.set(error, 'stack', '');
      },
      // Shim of proposed special power, to reside by default only
      // in the start compartment, for getting the stack traceback
      // string associated with an error.
      // See https://tc39.es/proposal-error-stacks/
      getStackString(error) {
        if (!ssts.has(error)) {
          // eslint-disable-next-line no-void
          void error.stack;
        }
        const sst = ssts.get(error);
        if (!sst) {
          return '';
        }
        return stackStringFromSST(error, sst);
      },
      prepareStackTrace(error, sst) {
        ssts.set(error, sst);
        if (errorTaming === 'unsafe') {
          const stackString = stackStringFromSST(error, sst);
          return `${error}${stackString}`;
        }
        return '';
      },
    };

    // A prepareFn is a prepareStackTrace function.
    // An sst is a `structuredStackTrace`, which is an array of
    // callsites.
    // A user prepareFn is a prepareFn defined by a client of this API,
    // and provided by assigning to `Error.prepareStackTrace`.
    // A user prepareFn should only receive an attenuated sst, which
    // is an array of attenuated callsites.
    // A system prepareFn is the prepareFn created by this module to
    // be installed on the real `Error` constructor, to receive
    // an original sst, i.e., an array of unattenuated callsites.
    // An input prepareFn is a function the user assigns to
    // `Error.prepareStackTrace`, which might be a user prepareFn or
    // a system prepareFn previously obtained by reading
    // `Error.prepareStackTrace`.

    const defaultPrepareFn = tamedMethods.prepareStackTrace;

    OriginalError.prepareStackTrace = defaultPrepareFn;

    // A weakset branding some functions as system prepareFns, all of which
    // must be defined by this module, since they can receive an
    // unattenuated sst.
    const systemPrepareFnSet = new WeakSet([defaultPrepareFn]);

    const systemPrepareFnFor = inputPrepareFn => {
      if (systemPrepareFnSet.has(inputPrepareFn)) {
        return inputPrepareFn;
      }
      // Use concise methods to obtain named functions without constructors.
      const systemMethods = {
        prepareStackTrace(error, sst) {
          ssts.set(error, sst);
          return inputPrepareFn(error, safeV8SST(sst));
        },
      };
      systemPrepareFnSet.add(systemMethods.prepareStackTrace);
      return systemMethods.prepareStackTrace;
    };

    // Note `stackTraceLimit` accessor already defined by
    // tame-error-constructor.js
    defineProperties(InitialError, {
      captureStackTrace: {
        value: tamedMethods.captureStackTrace,
        writable: true,
        enumerable: false,
        configurable: true,
      },
      prepareStackTrace: {
        get() {
          return OriginalError.prepareStackTrace;
        },
        set(inputPrepareStackTraceFn) {
          if (typeof inputPrepareStackTraceFn === 'function') {
            const systemPrepareFn = systemPrepareFnFor(inputPrepareStackTraceFn);
            OriginalError.prepareStackTrace = systemPrepareFn;
          } else {
            OriginalError.prepareStackTrace = defaultPrepareFn;
          }
        },
        enumerable: false,
        configurable: true,
      },
    });

    return tamedMethods.getStackString;
  }

  // Present on at least FF. Proposed by Error-proposal. Not on SES whitelist
  // so grab it before it is removed.
  const stackDesc = getOwnPropertyDescriptor(Error.prototype, 'stack');
  const stackGetter = stackDesc && stackDesc.get;

  // Use concise methods to obtain named functions without constructors.
  const tamedMethods$1 = {
    getStackString(error) {
      if (typeof stackGetter === 'function') {
        return apply(stackGetter, error, []);
      } else if ('stack' in error) {
        // The fallback is to just use the de facto `error.stack` if present
        return `${error.stack}`;
      }
      return '';
    },
  };

  function tameErrorConstructor(
    errorTaming = 'safe',
    stackFiltering = 'concise',
  ) {
    if (errorTaming !== 'safe' && errorTaming !== 'unsafe') {
      throw new Error(`unrecognized errorTaming ${errorTaming}`);
    }
    if (stackFiltering !== 'concise' && stackFiltering !== 'verbose') {
      throw new Error(`unrecognized stackFiltering ${stackFiltering}`);
    }
    const OriginalError = Error;
    const ErrorPrototype = OriginalError.prototype;

    const platform =
      typeof OriginalError.captureStackTrace === 'function' ? 'v8' : 'unknown';

    const makeErrorConstructor = (_ = {}) => {
      const ResultError = function Error(...rest) {
        let error;
        if (new.target === undefined) {
          error = apply(OriginalError, this, rest);
        } else {
          error = construct(OriginalError, rest, new.target);
        }
        if (platform === 'v8') {
          // TODO Likely expensive!
          OriginalError.captureStackTrace(error, ResultError);
        }
        return error;
      };
      defineProperties(ResultError, {
        length: { value: 1 },
        prototype: {
          value: ErrorPrototype,
          writable: false,
          enumerable: false,
          configurable: false,
        },
      });
      return ResultError;
    };
    const InitialError = makeErrorConstructor({ powers: 'original' });
    const SharedError = makeErrorConstructor({ powers: 'none' });
    defineProperties(ErrorPrototype, {
      constructor: { value: SharedError },
      /* TODO
      stack: {
        get() {
          return '';
        },
        set(_) {
          // ignore
        },
      },
      */
    });

    for (const NativeError of NativeErrors) {
      setPrototypeOf(NativeError, SharedError);
    }

    // https://v8.dev/docs/stack-trace-api#compatibility advises that
    // programmers can "always" set `Error.stackTraceLimit`
    // even on non-v8 platforms. On non-v8
    // it will have no effect, but this advice only makes sense
    // if the assignment itself does not fail, which it would
    // if `Error` were naively frozen. Hence, we add setters that
    // accept but ignore the assignment on non-v8 platforms.
    defineProperties(InitialError, {
      stackTraceLimit: {
        get() {
          if (typeof OriginalError.stackTraceLimit === 'number') {
            // OriginalError.stackTraceLimit is only on v8
            return OriginalError.stackTraceLimit;
          }
          return undefined;
        },
        set(newLimit) {
          if (typeof newLimit !== 'number') {
            // silently do nothing. This behavior doesn't precisely
            // emulate v8 edge-case behavior. But given the purpose
            // of this emulation, having edge cases err towards
            // harmless seems the safer option.
            return;
          }
          if (typeof OriginalError.stackTraceLimit === 'number') {
            // OriginalError.stackTraceLimit is only on v8
            OriginalError.stackTraceLimit = newLimit;
            // We place the useless return on the next line to ensure
            // that anything we place after the if in the future only
            // happens if the then-case does not.
            // eslint-disable-next-line no-useless-return
            return;
          }
        },
        // WTF on v8 stackTraceLimit is enumerable
        enumerable: false,
        configurable: true,
      },
    });

    // The default SharedError much be completely powerless even on v8,
    // so the lenient `stackTraceLimit` accessor does nothing on all
    // platforms.
    defineProperties(SharedError, {
      stackTraceLimit: {
        get() {
          return undefined;
        },
        set(_newLimit) {
          // do nothing
        },
        enumerable: false,
        configurable: true,
      },
    });

    let initialGetStackString = tamedMethods$1.getStackString;
    if (platform === 'v8') {
      initialGetStackString = tameV8ErrorConstructor(
        OriginalError,
        InitialError,
        errorTaming,
        stackFiltering,
      );
    }
    return {
      '%InitialGetStackString%': initialGetStackString,
      '%InitialError%': InitialError,
      '%SharedError%': SharedError,
    };
  }

  // Copyright (C) 2018 Agoric

  /**
   * @typedef {{
   *   dateTaming?: 'safe' | 'unsafe',
   *   errorTaming?: 'safe' | 'unsafe',
   *   mathTaming?: 'safe' | 'unsafe',
   *   regExpTaming?: 'safe' | 'unsafe',
   *   localeTaming?: 'safe' | 'unsafe',
   *   consoleTaming?: 'safe' | 'unsafe',
   *   overrideTaming?: 'min' | 'moderate' | 'severe',
   *   stackFiltering?: 'concise' | 'verbose',
   * }} LockdownOptions
   */

  const { details: d$3, quote: q$2 } = assert;

  let firstOptions;

  // A successful lockdown call indicates that `harden` can be called and
  // guarantee that the hardened object graph is frozen out to the fringe.
  let lockedDown = false;

  // Build a harden() with an empty fringe.
  // Gate it on lockdown.
  const lockdownHarden = makeHardener();

  /**
   * @template T
   * @param {T} ref
   * @returns {T}
   */
  const harden = ref => {
    assert(lockedDown, 'Cannot harden before lockdown');
    return lockdownHarden(ref);
  };

  const alreadyHardenedIntrinsics = () => false;

  /**
   * @callback Transform
   * @param {string} source
   * @returns {string}
   */

  /**
   * @callback CompartmentConstructor
   * @param {Object} endowments
   * @param {Object} moduleMap
   * @param {Object} [options]
   * @param {Array<Transform>} [options.transforms]
   * @param {Array<Transform>} [options.__shimTransforms__]
   * @param {Object} [options.globalLexicals]
   */

  /**
   * @callback CompartmentConstructorMaker
   * @param {CompartmentConstructorMaker} targetMakeCompartmentConstructor
   * @param {Object} intrinsics
   * @param {(func: Function) => void} nativeBrander
   * @returns {CompartmentConstructor}
   */

  /**
   * @param {CompartmentConstructorMaker} makeCompartmentConstructor
   * @param {Object} compartmentPrototype
   * @param {() => Object} getAnonymousIntrinsics
   * @param {LockdownOptions} [options]
   * @returns {() => {}} repairIntrinsics
   */
  function repairIntrinsics(
    makeCompartmentConstructor,
    compartmentPrototype,
    getAnonymousIntrinsics,
    options = {},
  ) {
    // First time, absent options default to 'safe'.
    // Subsequent times, absent options default to first options.
    // Thus, all present options must agree with first options.
    // Reconstructing `option` here also ensures that it is a well
    // behaved record, with only own data properties.
    //
    // The `overrideTaming` is not a safety issue. Rather it is a tradeoff
    // between code compatibility, which is better with the `'moderate'`
    // setting, and tool compatibility, which is better with the `'min'`
    // setting. See
    // https://github.com/Agoric/SES-shim/blob/master/packages/ses/README.md#enabling-override-by-assignment)
    // for an explanation of when to use which.
    //
    // The `stackFiltering` is not a safety issue. Rather it is a tradeoff
    // between relevance and completeness of the stack frames shown on the
    // console. Setting`stackFiltering` to `'verbose'` applies no filters, providing
    // the raw stack frames that can be quite versbose. Setting
    // `stackFrameFiltering` to`'concise'` limits the display to the stack frame
    // information most likely to be relevant, eliminating distracting frames
    // such as those from the infrastructure. However, the bug you're trying to
    // track down might be in the infrastrure, in which case the `'verbose'` setting
    // is useful. See
    // [`stackFiltering` options](https://github.com/Agoric/SES-shim/blob/master/packages/ses/lockdown-options.md#stackfiltering-options)
    // for an explanation.
    options = /** @type {LockdownOptions} */ ({ ...firstOptions, ...options });
    const {
      dateTaming = 'safe',
      errorTaming = 'safe',
      mathTaming = 'safe',
      regExpTaming = 'safe',
      localeTaming = 'safe',
      consoleTaming = 'safe',
      overrideTaming = 'moderate',
      stackFiltering = 'concise',

      ...extraOptions
    } = options;

    // Assert that only supported options were passed.
    // Use Reflect.ownKeys to reject symbol-named properties as well.
    const extraOptionsNames = Reflect.ownKeys(extraOptions);
    assert(
      extraOptionsNames.length === 0,
      d$3`lockdown(): non supported option ${q$2(extraOptionsNames)}`,
    );

    // Asserts for multiple invocation of lockdown().
    if (firstOptions) {
      for (const name of keys(firstOptions)) {
        assert(
          options[name] === firstOptions[name],
          d$3`lockdown(): cannot re-invoke with different option ${q$2(name)}`,
        );
      }
      return alreadyHardenedIntrinsics;
    }

    firstOptions = {
      dateTaming,
      errorTaming,
      mathTaming,
      regExpTaming,
      localeTaming,
      consoleTaming,
      overrideTaming,
      stackFiltering,
    };

    /**
     * 1. TAME powers & gather intrinsics first.
     */
    const intrinsicsCollector = makeIntrinsicsCollector();

    intrinsicsCollector.addIntrinsics(tameFunctionConstructors());

    intrinsicsCollector.addIntrinsics(tameDateConstructor(dateTaming));
    intrinsicsCollector.addIntrinsics(
      tameErrorConstructor(errorTaming, stackFiltering),
    );
    intrinsicsCollector.addIntrinsics(tameMathObject(mathTaming));
    intrinsicsCollector.addIntrinsics(tameRegExpConstructor(regExpTaming));

    intrinsicsCollector.addIntrinsics(getAnonymousIntrinsics());

    intrinsicsCollector.completePrototypes();

    const intrinsics = intrinsicsCollector.finalIntrinsics();

    // Wrap console unless suppressed.
    // At the moment, the console is considered a host power in the start
    // compartment, and not a primordial. Hence it is absent from the whilelist
    // and bypasses the intrinsicsCollector.
    let optGetStackString;
    if (errorTaming !== 'unsafe') {
      optGetStackString = intrinsics['%InitialGetStackString%'];
    }
    const consoleRecord = tameConsole(consoleTaming, optGetStackString);
    globalThis.console = /** @type {Console} */ (consoleRecord.console);

    // Replace *Locale* methods with their non-locale equivalents
    tameLocaleMethods(intrinsics, localeTaming);

    // Replace Function.prototype.toString with one that recognizes
    // shimmed functions as honorary native functions.
    const nativeBrander = tameFunctionToString();

    /**
     * 2. WHITELIST to standardize the environment.
     */

    // Remove non-standard properties.
    // All remaining function encountered during whitelisting are
    // branded as honorary native functions.
    whitelistIntrinsics(intrinsics, nativeBrander);

    // Repair problems with legacy accessors if necessary.
    repairLegacyAccessors();

    // Initialize the powerful initial global, i.e., the global of the
    // start compartment, from the intrinsics.
    initGlobalObject(
      globalThis,
      intrinsics,
      initialGlobalPropertyNames,
      makeCompartmentConstructor,
      compartmentPrototype,
      {
        nativeBrander,
      },
    );

    /**
     * 3. HARDEN to share the intrinsics.
     */

    function hardenIntrinsics() {
      // Circumvent the override mistake.
      enablePropertyOverrides(intrinsics, overrideTaming);

      // Finally register and optionally freeze all the intrinsics. This
      // must be the operation that modifies the intrinsics.
      lockdownHarden(intrinsics);

      // Having completed lockdown without failing, the user may now
      // call `harden` and expect the object's transitively accessible properties
      // to be frozen out to the fringe.
      // Raise the `harden` gate.
      lockedDown = true;

      // Returning `true` indicates that this is a JS to SES transition.
      return true;
    }

    return hardenIntrinsics;
  }

  /**
   * @param {CompartmentConstructorMaker} makeCompartmentConstructor
   * @param {Object} compartmentPrototype
   * @param {() => Object} getAnonymousIntrinsics
   */
  const makeLockdown = (
    makeCompartmentConstructor,
    compartmentPrototype,
    getAnonymousIntrinsics,
  ) => {
    /**
     * @param {LockdownOptions} [options]
     */
    const lockdown = (options = {}) => {
      const maybeHardenIntrinsics = repairIntrinsics(
        makeCompartmentConstructor,
        compartmentPrototype,
        getAnonymousIntrinsics,
        options,
      );
      return maybeHardenIntrinsics();
    };
    return lockdown;
  };

  /** @typedef {ReturnType<typeof makeLockdown>} Lockdown */

  // @ts-check

  // privateFields captures the private state for each compartment.
  const privateFields = new WeakMap();

  /**
   * @typedef {(source: string) => string} Transform
   */

  const CompartmentPrototype = {
    constructor: InertCompartment,

    get globalThis() {
      return privateFields.get(this).globalObject;
    },

    get name() {
      return privateFields.get(this).name;
    },

    /**
     * @param {string} source is a JavaScript program grammar construction.
     * @param {Object} [options]
     * @param {Array<Transform>} [options.transforms]
     * @param {boolean} [options.sloppyGlobalsMode]
     * @param {Object} [options.__moduleShimLexicals__]
     * @param {boolean} [options.__evadeHtmlCommentTest__]
     * @param {boolean} [options.__evadeImportExpressionTest__]
     * @param {boolean} [options.__rejectSomeDirectEvalExpressions__]
     */
    evaluate(source, options = {}) {
      // Perform this check first to avoid unecessary sanitizing.
      // TODO Maybe relax string check and coerce instead:
      // https://github.com/tc39/proposal-dynamic-code-brand-checks
      if (typeof source !== 'string') {
        throw new TypeError('first argument of evaluate() must be a string');
      }

      // Extract options, and shallow-clone transforms.
      const {
        transforms = [],
        sloppyGlobalsMode = false,
        __moduleShimLexicals__ = undefined,
        __evadeHtmlCommentTest__ = false,
        __evadeImportExpressionTest__ = false,
        __rejectSomeDirectEvalExpressions__ = true, // Note default on
      } = options;
      const localTransforms = [...transforms];
      if (__evadeHtmlCommentTest__ === true) {
        localTransforms.push(evadeHtmlCommentTest);
      }
      if (__evadeImportExpressionTest__ === true) {
        localTransforms.push(evadeImportExpressionTest);
      }
      if (__rejectSomeDirectEvalExpressions__ === true) {
        localTransforms.push(rejectSomeDirectEvalExpressions);
      }

      const compartmentFields = privateFields.get(this);
      let { globalTransforms } = compartmentFields;
      const { globalObject, globalLexicals } = compartmentFields;

      let localObject = globalLexicals;
      if (__moduleShimLexicals__ !== undefined) {
        // When using `evaluate` for ESM modules, as should only occur from the
        // module-shim's module-instance.js, we do not reveal the SES-shim's
        // module-to-program translation, as this is not standardizable behavior.
        // However, the `localTransforms` will come from the `__shimTransforms__`
        // Compartment option in this case, which is a non-standardizable escape
        // hatch so programs designed specifically for the SES-shim
        // implementation may opt-in to use the same transforms for `evaluate`
        // and `import`, at the expense of being tightly coupled to SES-shim.
        globalTransforms = undefined;

        localObject = create(null, getOwnPropertyDescriptors(globalLexicals));
        defineProperties(
          localObject,
          getOwnPropertyDescriptors(__moduleShimLexicals__),
        );
      }

      return performEval(source, globalObject, localObject, {
        globalTransforms,
        localTransforms,
        sloppyGlobalsMode,
      });
    },

    toString() {
      return '[object Compartment]';
    },
  };

  defineProperties(InertCompartment, {
    prototype: { value: CompartmentPrototype },
  });

  /**
   * @callback CompartmentConstructor
   * Each Compartment constructor is a global. A host that wants to execute
   * code in a context bound to a new global creates a new compartment.
   *
   * @param {Object} endowments
   * @param {Object} _moduleMap
   * @param {Object} [options]
   * @param {string} [options.name]
   * @param {Array<Transform>} [options.transforms]
   * @param {Array<Transform>} [options.__shimTransforms__]
   * @param {Object} [options.globalLexicals]
   */

  /**
   * @callback MakeCompartmentConstructor
   * @param {MakeCompartmentConstructor} targetMakeCompartmentConstructor
   * @param {Object} intrinsics
   * @param {(object: Object) => void} nativeBrander
   * @returns {CompartmentConstructor}
   */

  /** @type {MakeCompartmentConstructor} */
  const makeCompartmentConstructor = (
    targetMakeCompartmentConstructor,
    intrinsics,
    nativeBrander,
  ) => {
    /** @type {CompartmentConstructor} */
    function Compartment(endowments = {}, _moduleMap = {}, options = {}) {
      if (new.target === undefined) {
        throw new TypeError(
          "Class constructor Compartment cannot be invoked without 'new'",
        );
      }

      // Extract options, and shallow-clone transforms.
      const {
        name = '<unknown>',
        transforms = [],
        __shimTransforms__ = [],
        globalLexicals = {},
      } = options;
      const globalTransforms = [...transforms, ...__shimTransforms__];

      const globalObject = {};
      initGlobalObject(
        globalObject,
        intrinsics,
        sharedGlobalPropertyNames,
        targetMakeCompartmentConstructor,
        this.constructor.prototype,
        {
          globalTransforms,
          nativeBrander,
        },
      );

      assign(globalObject, endowments);

      const invalidNames = getOwnPropertyNames(globalLexicals).filter(
        identifier => !isValidIdentifierName(identifier),
      );
      if (invalidNames.length) {
        throw new Error(
          `Cannot create compartment with invalid names for global lexicals: ${invalidNames.join(
          ', ',
        )}; these names would not be lexically mentionable`,
        );
      }

      privateFields.set(this, {
        name,
        globalTransforms,
        globalObject,
        // The caller continues to own the globalLexicals object they passed to
        // the compartment constructor, but the compartment only respects the
        // original values and they are constants in the scope of evaluated
        // programs and executed modules.
        // This shallow copy captures only the values of enumerable own
        // properties, erasing accessors.
        // The snapshot is frozen to ensure that the properties are immutable
        // when transferred-by-property-descriptor onto local scope objects.
        globalLexicals: freeze({ ...globalLexicals }),
      });
    }

    Compartment.prototype = CompartmentPrototype;

    return Compartment;
  };

  // Copyright (C) 2018 Agoric

  const nativeBrander$1 = tameFunctionToString();

  const Compartment = makeCompartmentConstructor(
    makeCompartmentConstructor,
    getGlobalIntrinsics(globalThis),
    nativeBrander$1,
  );

  assign(globalThis, {
    harden,
    lockdown: makeLockdown(
      makeCompartmentConstructor,
      CompartmentPrototype,
      getAnonymousIntrinsics,
    ),
    Compartment,
    assert,
  });

})));

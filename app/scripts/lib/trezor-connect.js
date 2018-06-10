/* eslint-disable */
/* prettier-ignore */

/**
 * (C) 2017 SatoshiLabs
 *
 * GPLv3
 */
var TREZOR_CONNECT_VERSION = 4;

if (!Array.isArray) {
  Array.isArray = function(arg) {
    return Object.prototype.toString.call(arg) === "[object Array]";
  };
}

var HD_HARDENED = 0x80000000;

// react sometimes adds some other parameters that should not be there
function _fwStrFix(obj, fw) {
  if (typeof fw === "string") {
    obj.requiredFirmware = fw;
  }
  return obj;
}

("use strict");

var chrome = window.chrome;
var IS_CHROME_APP = chrome && chrome.app && chrome.app.window;

var ERR_TIMED_OUT = "Loading timed out";
var ERR_WINDOW_CLOSED = "Window closed";
var ERR_WINDOW_BLOCKED = "Window blocked";
var ERR_ALREADY_WAITING = "Already waiting for a response";
var ERR_CHROME_NOT_CONNECTED = "Internal Chrome popup is not responding.";

var DISABLE_LOGIN_BUTTONS = window.TREZOR_DISABLE_LOGIN_BUTTONS || false;
var CHROME_URL = window.TREZOR_CHROME_URL || "./chrome/wrapper.html";
var POPUP_ORIGIN = window.TREZOR_POPUP_ORIGIN || "https://connect.trezor.io";
var POPUP_PATH =
  window.TREZOR_POPUP_PATH || POPUP_ORIGIN + "/" + TREZOR_CONNECT_VERSION;
var POPUP_URL =
  window.TREZOR_POPUP_URL ||
  POPUP_PATH + "/popup/popup.html?v=" + new Date().getTime();

var POPUP_INIT_TIMEOUT = 15000;

/**
 * Public API.
 */
function TrezorConnect() {
  var manager = new PopupManager();

  /**
   * Popup errors.
   */
  this.ERR_TIMED_OUT = ERR_TIMED_OUT;
  this.ERR_WINDOW_CLOSED = ERR_WINDOW_CLOSED;
  this.ERR_WINDOW_BLOCKED = ERR_WINDOW_BLOCKED;
  this.ERR_ALREADY_WAITING = ERR_ALREADY_WAITING;
  this.ERR_CHROME_NOT_CONNECTED = ERR_CHROME_NOT_CONNECTED;

  /**
   * Open the popup for further communication. All API functions open the
   * popup automatically, but if you need to generate some parameters
   * asynchronously, use `open` first to avoid popup blockers.
   * @param {function(?Error)} callback
   */
  this.open = function(callback) {
    var onchannel = function(result) {
      if (result instanceof Error) {
        callback(result);
      } else {
        callback();
      }
    };
    manager.waitForChannel(onchannel);
  };

  /**
   * Close the opened popup, if any.
   */
  this.close = function() {
    manager.close();
  };

  /**
   * Enable or disable closing the opened popup after a successful call.
   * @param {boolean} value
   */
  this.closeAfterSuccess = function(value) {
    manager.closeAfterSuccess = value;
  };

  /**
   * Enable or disable closing the opened popup after a failed call.
   * @param {boolean} value
   */
  this.closeAfterFailure = function(value) {
    manager.closeAfterFailure = value;
  };

  /**
   * Set bitcore server
   * @param {string|Array<string>} value
   */
  this.setBitcoreURLS = function(value) {
    if (typeof value === "string") {
      manager.bitcoreURLS = [value];
    } else if (value instanceof Array) {
      manager.bitcoreURLS = value;
    }
  };

  /**
   * Set currency. Human readable coin name
   * @param {string|Array<string>} value
   */
  this.setCurrency = function(value) {
    if (typeof value === "string") {
      manager.currency = value;
    }
  };

  /**
   * Set currency units (mBTC, BTC)
   * @param {string|Array<string>} value
   */
  this.setCurrencyUnits = function(value) {
    if (typeof value === "string") {
      manager.currencyUnits = value;
    }
  };

  /**
   * Set coin info json url
   * @param {string|Array<string>} value
   */
  this.setCoinInfoURL = function(value) {
    if (typeof value === "string") {
      manager.coinInfoURL = value;
    }
  };

  /**
   * Set max. limit for account discovery
   * @param {number} value
   */
  this.setAccountDiscoveryLimit = function(value) {
    if (!isNaN(value)) manager.accountDiscoveryLimit = value;
  };

  /**
   * Set max. gap for account discovery
   * @param {number} value
   */
  this.setAccountDiscoveryGapLength = function(value) {
    if (!isNaN(value)) manager.accountDiscoveryGapLength = value;
  };

  /**
   * Set discovery BIP44 coin type
   * @param {number} value
   */
  this.setAccountDiscoveryBip44CoinType = function(value) {
    if (!isNaN(value)) manager.accountDiscoveryBip44CoinType = value;
  };

  /**
   * @typedef XPubKeyResult
   * @param {boolean} success
   * @param {?string} error
   * @param {?string} xpubkey  serialized extended public key
   * @param {?string} path     BIP32 serializd path of the key
   */

  /**
   * Load BIP32 extended public key by path.
   *
   * Path can be specified either in the string form ("m/44'/1/0") or as
   * raw integer array. In case you omit the path, user is asked to select
   * a BIP32 account to export, and the result contains m/44'/0'/x' node
   * of the account.
   *
   * @param {?(string|array<number>)} path
   * @param {function(XPubKeyResult)} callback
   * @param {?(string|array<number>)} requiredFirmware
   */
  this.getXPubKey = function(path, callback, requiredFirmware) {
    if (typeof path === "string") {
      path = parseHDPath(path);
    }
    manager.sendWithChannel(
      _fwStrFix(
        {
          type: "xpubkey",
          path: path
        },
        requiredFirmware
      ),
      callback
    );
  };

  this.getFreshAddress = function(callback, requiredFirmware) {
    var wrapperCallback = function(result) {
      if (result.success) {
        callback({ success: true, address: result.freshAddress });
      } else {
        callback(result);
      }
    };

    manager.sendWithChannel(
      _fwStrFix(
        {
          type: "accountinfo"
        },
        requiredFirmware
      ),
      wrapperCallback
    );
  };

  this.getAccountInfo = function(input, callback, requiredFirmware) {
    try {
      manager.sendWithChannel(
        _fwStrFix(
          {
            type: "accountinfo",
            description: input
          },
          requiredFirmware
        ),
        callback
      );
    } catch (e) {
      callback({ success: false, error: e });
    }
  };

  this.getAllAccountsInfo = function(callback, requiredFirmware) {
    try {
      manager.sendWithChannel(
        _fwStrFix(
          {
            type: "allaccountsinfo",
            description: "all"
          },
          requiredFirmware
        ),
        callback
      );
    } catch (e) {
      callback({ success: false, error: e });
    }
  };

  this.getBalance = function(callback, requiredFirmware) {
    manager.sendWithChannel(
      _fwStrFix(
        {
          type: "accountinfo"
        },
        requiredFirmware
      ),
      callback
    );
  };

  /**
   * @typedef SignTxResult
   * @param {boolean} success
   * @param {?string} error
   * @param {?string} serialized_tx      serialized tx, in hex, including signatures
   * @param {?array<string>} signatures  array of input signatures, in hex
   */

  /**
   * Sign a transaction in the device and return both serialized
   * transaction and the signatures.
   *
   * @param {array<TxInputType>} inputs
   * @param {array<TxOutputType>} outputs
   * @param {function(SignTxResult)} callback
   * @param {?(string|array<number>)} requiredFirmware
   *
   * @see https://github.com/trezor/trezor-common/blob/master/protob/types.proto
   */
  this.signTx = function(inputs, outputs, callback, requiredFirmware, coin) {
    manager.sendWithChannel(
      _fwStrFix(
        {
          type: "signtx",
          inputs: inputs,
          outputs: outputs,
          coin: coin
        },
        requiredFirmware
      ),
      callback
    );
  };

  // new implementation with ethereum at beginnig
  this.ethereumSignTx = function() {
    this.signEthereumTx.apply(this, arguments);
  };

  // old fallback
  this.signEthereumTx = function(
    address_n,
    nonce,
    gas_price,
    gas_limit,
    to,
    value,
    data,
    chain_id,
    callback,
    requiredFirmware
  ) {
    if (requiredFirmware == null) {
      requiredFirmware = "1.4.0"; // first firmware that supports ethereum
    }
    if (typeof address_n === "string") {
      address_n = parseHDPath(address_n);
    }
    manager.sendWithChannel(
      _fwStrFix(
        {
          type: "signethtx",
          address_n: address_n,
          nonce: nonce,
          gas_price: gas_price,
          gas_limit: gas_limit,
          to: to,
          value: value,
          data: data,
          chain_id: chain_id
        },
        requiredFirmware
      ),
      callback
    );
  };

  /**
   * @typedef TxRecipient
   * @param {number} amount   the amount to send, in satoshis
   * @param {string} address  the address of the recipient
   */

  /**
   * Compose a transaction by doing BIP-0044 discovery, letting the user
   * select an account, and picking UTXO by internal preferences.
   * Transaction is then signed and returned in the same format as
   * `signTx`.  Only supports BIP-0044 accounts (single-signature).
   *
   * @param {array<TxRecipient>} recipients
   * @param {function(SignTxResult)} callback
   * @param {?(string|array<number>)} requiredFirmware
   */
  this.composeAndSignTx = function(recipients, callback, requiredFirmware) {
    manager.sendWithChannel(
      _fwStrFix(
        {
          type: "composetx",
          recipients: recipients
        },
        requiredFirmware
      ),
      callback
    );
  };

  /**
   * @typedef RequestLoginResult
   * @param {boolean} success
   * @param {?string} error
   * @param {?string} public_key  public key used for signing, in hex
   * @param {?string} signature   signature, in hex
   */

  /**
   * Sign a login challenge for active origin.
   *
   * @param {?string} hosticon
   * @param {string} challenge_hidden
   * @param {string} challenge_visual
   * @param {string|function(RequestLoginResult)} callback
   * @param {?(string|array<number>)} requiredFirmware
   *
   * @see https://github.com/trezor/trezor-common/blob/master/protob/messages.proto
   */
  this.requestLogin = function(
    hosticon,
    challenge_hidden,
    challenge_visual,
    callback,
    requiredFirmware
  ) {
    if (typeof callback === "string") {
      // special case for a login through <trezor:login> button.
      // `callback` is name of global var
      callback = window[callback];
    }
    if (!callback) {
      throw new TypeError("TrezorConnect: login callback not found");
    }
    manager.sendWithChannel(
      _fwStrFix(
        {
          type: "login",
          icon: hosticon,
          challenge_hidden: challenge_hidden,
          challenge_visual: challenge_visual
        },
        requiredFirmware
      ),
      callback
    );
  };

  /**
   * @typedef SignMessageResult
   * @param {boolean} success
   * @param {?string} error
   * @param {?string} address address (in base58check)
   * @param {?string} signature   signature, in base64
   */

  /**
   * Sign a message
   *
   * @param {string|array} path
   * @param {string} message to sign (ascii)
   * @param {string|function(SignMessageResult)} callback
   * @param {?string} opt_coin - (optional) name of coin (default Bitcoin)
   * @param {?(string|array<number>)} requiredFirmware
   *
   */
  this.signMessage = function(
    path,
    message,
    callback,
    opt_coin,
    requiredFirmware
  ) {
    if (typeof path === "string") {
      path = parseHDPath(path);
    }
    if (!opt_coin) {
      opt_coin = "Bitcoin";
    }
    if (!callback) {
      throw new TypeError("TrezorConnect: callback not found");
    }
    manager.sendWithChannel(
      _fwStrFix(
        {
          type: "signmsg",
          path: path,
          message: message,
          coin: opt_coin
        },
        requiredFirmware
      ),
      callback
    );
  };

  /**
   * Sign an Ethereum message
   *
   * @param {string|array} path
   * @param {string} message to sign (ascii)
   * @param {string|function(SignMessageResult)} callback
   * @param {?(string|array<number>)} requiredFirmware
   *
   */
  this.ethereumSignMessage = function(
    path,
    message,
    callback,
    requiredFirmware
  ) {
    if (typeof path === "string") {
      path = parseHDPath(path);
    }
    if (!callback) {
      throw new TypeError("TrezorConnect: callback not found");
    }
    manager.sendWithChannel(
      _fwStrFix(
        {
          type: "signethmsg",
          path: path,
          message: message
        },
        requiredFirmware
      ),
      callback
    );
  };

  /**
   * Verify message
   *
   * @param {string} address
   * @param {string} signature (base64)
   * @param {string} message (string)
   * @param {string|function()} callback
   * @param {?string} opt_coin - (optional) name of coin (default Bitcoin)
   * @param {?(string|array<number>)} requiredFirmware
   *
   */
  this.verifyMessage = function(
    address,
    signature,
    message,
    callback,
    opt_coin,
    requiredFirmware
  ) {
    if (!opt_coin) {
      opt_coin = "Bitcoin";
    }
    if (!callback) {
      throw new TypeError("TrezorConnect: callback not found");
    }
    manager.sendWithChannel(
      _fwStrFix(
        {
          type: "verifymsg",
          address: address,
          signature: signature,
          message: message,
          coin: { coin_name: opt_coin }
        },
        requiredFirmware
      ),
      callback
    );
  };

  /**
   * Verify ethereum message
   *
   * @param {string} address
   * @param {string} signature (base64)
   * @param {string} message (string)
   * @param {string|function()} callback
   * @param {?(string|array<number>)} requiredFirmware
   *
   */
  this.ethereumVerifyMessage = function(
    address,
    signature,
    message,
    callback,
    requiredFirmware
  ) {
    if (!callback) {
      throw new TypeError("TrezorConnect: callback not found");
    }
    manager.sendWithChannel(
      _fwStrFix(
        {
          type: "verifyethmsg",
          address: address,
          signature: signature,
          message: message
        },
        requiredFirmware
      ),
      callback
    );
  };

  /**
   * Symmetric key-value encryption
   *
   * @param {string|array} path
   * @param {string} key to show on device display
   * @param {string} value hexadecimal value, length a multiple of 16 bytes
   * @param {boolean} encrypt / decrypt direction
   * @param {boolean} ask_on_encrypt (should user confirm on encrypt?)
   * @param {boolean} ask_on_decrypt (should user confirm on decrypt?)
   * @param {string|function()} callback
   * @param {?(string|array<number>)} requiredFirmware
   *
   */
  this.cipherKeyValue = function(
    path,
    key,
    value,
    encrypt,
    ask_on_encrypt,
    ask_on_decrypt,
    callback,
    requiredFirmware
  ) {
    if (typeof path === "string") {
      path = parseHDPath(path);
    }
    if (typeof value !== "string") {
      throw new TypeError("TrezorConnect: Value must be a string");
    }
    if (!/^[0-9A-Fa-f]*$/.test(value)) {
      throw new TypeError("TrezorConnect: Value must be hexadecimal");
    }
    if (value.length % 32 !== 0) {
      // 1 byte == 2 hex strings
      throw new TypeError(
        "TrezorConnect: Value length must be multiple of 16 bytes"
      );
    }
    if (!callback) {
      throw new TypeError("TrezorConnect: callback not found");
    }
    manager.sendWithChannel(
      _fwStrFix(
        {
          type: "cipherkeyvalue",
          path: path,
          key: key,
          value: value,
          encrypt: !!encrypt,
          ask_on_encrypt: !!ask_on_encrypt,
          ask_on_decrypt: !!ask_on_decrypt
        },
        requiredFirmware
      ),
      callback
    );
  };

  this.nemGetAddress = function(
    address_n,
    network,
    callback,
    requiredFirmware
  ) {
    if (requiredFirmware == null) {
      requiredFirmware = "1.6.0"; // first firmware that supports NEM
    }
    if (typeof address_n === "string") {
      address_n = parseHDPath(address_n);
    }
    manager.sendWithChannel(
      _fwStrFix(
        {
          type: "nemGetAddress",
          address_n: address_n,
          network: network
        },
        requiredFirmware
      ),
      callback
    );
  };

  this.nemSignTx = function(
    address_n,
    transaction,
    callback,
    requiredFirmware
  ) {
    if (requiredFirmware == null) {
      requiredFirmware = "1.6.0"; // first firmware that supports NEM
    }
    if (typeof address_n === "string") {
      address_n = parseHDPath(address_n);
    }
    manager.sendWithChannel(
      _fwStrFix(
        {
          type: "nemSignTx",
          address_n: address_n,
          transaction: transaction
        },
        requiredFirmware
      ),
      callback
    );
  };

  this.pushTransaction = function(rawTx, callback) {
    if (!/^[0-9A-Fa-f]*$/.test(rawTx)) {
      throw new TypeError("TrezorConnect: Transaction must be hexadecimal");
    }
    if (!callback) {
      throw new TypeError("TrezorConnect: callback not found");
    }

    manager.sendWithChannel(
      {
        type: "pushtx",
        rawTx: rawTx
      },
      callback
    );
  };

  /**
   * Display address on device
   *
   * @param {array} address
   * @param {string} coin
   * @param {boolean} segwit
   * @param {?(string|array<number>)} requiredFirmware
   *
   */
  this.getAddress = function(
    address,
    coin,
    segwit,
    callback,
    requiredFirmware
  ) {
    if (typeof address === "string") {
      address = parseHDPath(address);
    }

    manager.sendWithChannel(
      _fwStrFix(
        {
          type: "getaddress",
          address_n: address,
          coin: coin,
          segwit: segwit
        },
        requiredFirmware
      ),
      callback
    );
  };

  /**
   * Display ethereum address on device
   *
   * @param {array} address
   * @param {?(string|array<number>)} requiredFirmware
   *
   */
  this.ethereumGetAddress = function(address, callback, requiredFirmware) {
    if (typeof address === "string") {
      address = parseHDPath(address);
    }

    manager.sendWithChannel(
      _fwStrFix(
        {
          type: "ethgetaddress",
          address_n: address
        },
        requiredFirmware
      ),
      callback
    );
  };

  var LOGIN_CSS =
    '<style>@import url("@connect_path@/login_buttons.css")</style>';

  var LOGIN_ONCLICK =
    "TrezorConnect.requestLogin(" +
    "'@hosticon@','@challenge_hidden@','@challenge_visual@','@callback@'" +
    ")";

  var LOGIN_HTML =
    '<div id="trezorconnect-wrapper">' +
    '  <a id="trezorconnect-button" onclick="' +
    LOGIN_ONCLICK +
    '">' +
    '    <span id="trezorconnect-icon"></span>' +
    '    <span id="trezorconnect-text">@text@</span>' +
    "  </a>" +
    '  <span id="trezorconnect-info">' +
    '    <a id="trezorconnect-infolink" href="https://www.buytrezor.com/"' +
    '       target="_blank">What is TREZOR?</a>' +
    "  </span>" +
    "</div>";

  /**
   * Find <trezor:login> elements and replace them with login buttons.
   * It's not required to use these special elements, feel free to call
   * `TrezorConnect.requestLogin` directly.
   */
  this.renderLoginButtons = function() {
    var elements = document.getElementsByTagName("trezor:login");

    for (var i = 0; i < elements.length; i++) {
      var e = elements[i];
      var text = e.getAttribute("text") || "Sign in with TREZOR";
      var callback = e.getAttribute("callback") || "";
      var hosticon = e.getAttribute("icon") || "";
      var challenge_hidden = e.getAttribute("challenge_hidden") || "";
      var challenge_visual = e.getAttribute("challenge_visual") || "";

      // it's not valid to put markup into attributes, so let users
      // supply a raw text and make TREZOR bold
      text = text.replace("TREZOR", "<strong>TREZOR</strong>");
      e.outerHTML = (LOGIN_CSS + LOGIN_HTML)
        .replace("@text@", text)
        .replace("@callback@", callback)
        .replace("@hosticon@", hosticon)
        .replace("@challenge_hidden@", challenge_hidden)
        .replace("@challenge_visual@", challenge_visual)
        .replace("@connect_path@", POPUP_PATH);
    }
  };
}

/*
     * `getXPubKey()`
     */

function parseHDPath(string) {
  return string
    .toLowerCase()
    .split("/")
    .filter(function(p) {
      return p !== "m";
    })
    .map(function(p) {
      var hardened = false;
      if (p[p.length - 1] === "'") {
        hardened = true;
        p = p.substr(0, p.length - 1);
      }
      if (isNaN(p)) {
        throw new Error("Not a valid path.");
      }
      var n = parseInt(p);
      if (hardened) {
        // hardened index
        n = (n | 0x80000000) >>> 0;
      }
      return n;
    });
}

/*
     * Popup management
     */

function ChromePopup(url, name, width, height) {
  var left = (screen.width - width) / 2;
  var top = (screen.height - height) / 2;
  var opts = {
    id: name,
    innerBounds: {
      width: width,
      height: height,
      left: left,
      top: top
    }
  };

  var closed = function() {
    if (this.onclose) {
      this.onclose(false); // never report as blocked
    }
  }.bind(this);

  var opened = function(w) {
    this.window = w;
    this.window.onClosed.addListener(closed);
  }.bind(this);

  chrome.app.window.create(url, opts, opened);

  this.name = name;
  this.window = null;
  this.onclose = null;
}

function ChromeChannel(popup, waiting) {
  var port = null;

  var respond = function(data) {
    if (waiting) {
      var w = waiting;
      waiting = null;
      w(data);
    }
  };

  var setup = function(p) {
    if (p.name === popup.name) {
      port = p;
      port.onMessage.addListener(respond);
      chrome.runtime.onConnect.removeListener(setup);
    }
  };

  chrome.runtime.onConnect.addListener(setup);

  this.respond = respond;

  this.close = function() {
    chrome.runtime.onConnect.removeListener(setup);
    port.onMessage.removeListener(respond);
    port.disconnect();
    port = null;
  };

  this.send = function(value, callback) {
    if (waiting === null) {
      waiting = callback;

      if (port) {
        port.postMessage(value);
      } else {
        throw new Error(ERR_CHROME_NOT_CONNECTED);
      }
    } else {
      throw new Error(ERR_ALREADY_WAITING);
    }
  };
}

function Popup(url, origin, name, width, height) {
  var left = (screen.width - width) / 2;
  var top = (screen.height - height) / 2;
  var opts =
    "width=" +
    width +
    ",height=" +
    height +
    ",left=" +
    left +
    ",top=" +
    top +
    ",menubar=no" +
    ",toolbar=no" +
    ",location=no" +
    ",personalbar=no" +
    ",status=no";
  var w = window.open(url, name, opts);

  var interval;
  var blocked = w.closed;
  var iterate = function() {
    if (w.closed) {
      clearInterval(interval);
      if (this.onclose) {
        this.onclose(blocked);
      }
    }
  }.bind(this);
  interval = setInterval(iterate, 100);

  this.window = w;
  this.origin = origin;
  this.onclose = null;
}

function Channel(popup, waiting) {
  var respond = function(data) {
    if (waiting) {
      var w = waiting;
      waiting = null;
      w(data);
    }
  };

  var receive = function(event) {
    var org1 = event.origin.match(/^.+\:\/\/[^\‌​/]+/)[0];
    var org2 = popup.origin.match(/^.+\:\/\/[^\‌​/]+/)[0];
    //if (event.source === popup.window && event.origin === popup.origin) {
    if (event.source === popup.window && org1 === org2) {
      respond(event.data);
    }
  };

  window.addEventListener("message", receive);

  this.respond = respond;

  this.close = function() {
    window.removeEventListener("message", receive);
  };

  this.send = function(value, callback) {
    if (waiting === null) {
      waiting = callback;
      popup.window.postMessage(value, popup.origin);
    } else {
      throw new Error(ERR_ALREADY_WAITING);
    }
  };
}

function ConnectedChannel(p) {
  var ready = function() {
    clearTimeout(this.timeout);
    this.popup.onclose = null;
    this.ready = true;
    this.onready();
  }.bind(this);

  var closed = function(blocked) {
    clearTimeout(this.timeout);
    this.channel.close();
    if (blocked) {
      this.onerror(new Error(ERR_WINDOW_BLOCKED));
    } else {
      this.onerror(new Error(ERR_WINDOW_CLOSED));
    }
  }.bind(this);

  var timedout = function() {
    this.popup.onclose = null;
    if (this.popup.window) {
      this.popup.window.close();
    }
    this.channel.close();
    this.onerror(new Error(ERR_TIMED_OUT));
  }.bind(this);

  if (IS_CHROME_APP) {
    this.popup = new ChromePopup(p.chromeUrl, p.name, p.width, p.height);
    this.channel = new ChromeChannel(this.popup, ready);
  } else {
    this.popup = new Popup(p.url, p.origin, p.name, p.width, p.height);
    this.channel = new Channel(this.popup, ready);
  }

  this.timeout = setTimeout(timedout, POPUP_INIT_TIMEOUT);

  this.popup.onclose = closed;

  this.ready = false;
  this.onready = null;
  this.onerror = null;
}

function PopupManager() {
  var cc = null;

  var closed = function() {
    cc.channel.respond(new Error(ERR_WINDOW_CLOSED));
    cc.channel.close();
    cc = null;
  };

  var open = function(callback) {
    cc = new ConnectedChannel({
      name: "trezor-connect",
      width: 600,
      height: 500,
      origin: POPUP_ORIGIN,
      path: POPUP_PATH,
      url: POPUP_URL,
      chromeUrl: CHROME_URL
    });
    cc.onready = function() {
      cc.popup.onclose = closed;
      callback(cc.channel);
    };
    cc.onerror = function(error) {
      cc = null;
      callback(error);
    };
  }.bind(this);

  this.closeAfterSuccess = true;
  this.closeAfterFailure = true;

  this.close = function() {
    if (cc && cc.popup.window) {
      cc.popup.window.close();
    }
  };

  this.waitForChannel = function(callback) {
    if (cc) {
      if (cc.ready) {
        callback(cc.channel);
      } else {
        callback(new Error(ERR_ALREADY_WAITING));
      }
    } else {
      try {
        open(callback);
      } catch (e) {
        callback(new Error(ERR_WINDOW_BLOCKED));
      }
    }
  };

  this.sendWithChannel = function(message, callback) {
    message.bitcoreURLS = this.bitcoreURLS || null;
    message.currency = this.currency || null;
    message.currencyUnits = this.currencyUnits || null;
    message.coinInfoURL = this.coinInfoURL || null;
    message.accountDiscoveryLimit = this.accountDiscoveryLimit || null;
    message.accountDiscoveryGapLength = this.accountDiscoveryGapLength || null;
    message.accountDiscoveryBip44CoinType =
      this.accountDiscoveryBip44CoinType || null;

    var respond = function(response) {
      var succ = response.success && this.closeAfterSuccess;
      var fail = !response.success && this.closeAfterFailure;
      if (succ || fail) {
        this.close();
      }
      callback(response);
    }.bind(this);

    var onresponse = function(response) {
      if (response instanceof Error) {
        var error = response;
        respond({ success: false, error: error.message });
      } else {
        respond(response);
      }
    };

    var onchannel = function(channel) {
      if (channel instanceof Error) {
        var error = channel;
        respond({ success: false, error: error.message });
      } else {
        channel.send(message, onresponse);
      }
    };

    this.waitForChannel(onchannel);
  };
}

const connect = new TrezorConnect();
module.exports = connect;
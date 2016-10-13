window.QUnit = QUnit; (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
"use strict";

var vector = global.crypto.getRandomValues(new Uint8Array(16));

module.exports = {
  encrypt: encrypt,
  decrypt: decrypt
};

// Takes a Pojo, returns encrypted text.
function encrypt(password, dataObj) {
  var data = JSON.stringify(dataObj);
  global.crypto.subtle.encrypt({ name: "AES-CBC", iv: vector }, key, convertStringToArrayBufferView(data)).then(function (result) {
    var encryptedData = new Uint8Array(result);
    return encryptedData;
  }, function (e) {
    console.log(e.message);
  });
}

// Takes encrypted text, returns the restored Pojo.
function decrypt(password, text) {}

function convertStringToArrayBufferView(str) {
  var bytes = new Uint8Array(str.length);
  for (var i = 0; i < str.length; i++) {
    bytes[i] = str.charCodeAt(i);
  }

  return bytes;
}

function convertArrayBufferViewtoString(buffer) {
  var str = "";
  for (var i = 0; i < buffer.byteLength; i++) {
    str += String.fromCharCode(buffer[i]);
  }

  return str;
}

var password = "password";

var key = null;

function keyFromPassword(password) {
  global.crypto.subtle.digest({ name: "SHA-256" }, convertStringToArrayBufferView(password)).then(function (result) {
    return global.crypto.subtle.importKey("raw", result, { name: "AES-CBC" }, false, ["encrypt", "decrypt"]);
  });
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],2:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var encryptor = require('../../../app/scripts/lib/encryptor');

QUnit.test('encryptor', function (assert) {
  var password, data, encrypted;

  password = 'a sample passw0rd';
  data = { foo: 'data to encrypt' };

  encryptor.encrypt(password, data).then(function (result) {
    assert.equal(typeof result === 'undefined' ? 'undefined' : _typeof(result), 'string', 'returns a string');
  }).catch(function (reason) {
    assert.ifError(reason, 'threw an error');
  });
});

},{"../../../app/scripts/lib/encryptor":1}],3:[function(require,module,exports){
'use strict';

QUnit.test('agree to terms', function (assert) {
  var done = assert.async();

  // Select the mock app root
  var app = $('iframe').contents().find('#app-content .mock-app-root');

  app.find('.markdown').prop('scrollTop', 100000000);

  wait().then(function () {
    app.find('button').click();
  }).then(function () {
    return wait();
  }).then(function () {
    var title = app.find('h1').text();
    assert.equal(title, 'MetaMask', 'title screen');

    var buttons = app.find('button');
    assert.equal(buttons.length, 1, 'one button: create new vault');

    done();
  });

  // Wait for view to transition:
});

},{}]},{},[2,3]);

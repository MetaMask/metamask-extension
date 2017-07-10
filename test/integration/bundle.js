(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var PASSWORD = 'password123';

QUnit.module('first time usage');

QUnit.test('render init screen', function (assert) {
  var done = assert.async();
  var app = void 0;

  wait().then(function () {
    app = $('iframe').contents().find('#app-content .mock-app-root');

    var recurseNotices = function recurseNotices() {
      var button = app.find('button');
      if (button.html() === 'Accept') {
        var termsPage = app.find('.markdown')[0];
        termsPage.scrollTop = termsPage.scrollHeight;
        return wait().then(function () {
          button.click();
          return wait();
        }).then(function () {
          return recurseNotices();
        });
      } else {
        return wait();
      }
    };
    return recurseNotices();
  }).then(function () {
    // Scroll through terms
    var title = app.find('h1').text();
    assert.equal(title, 'MetaMask', 'title screen');

    // enter password
    var pwBox = app.find('#password-box')[0];
    var confBox = app.find('#password-box-confirm')[0];
    pwBox.value = PASSWORD;
    confBox.value = PASSWORD;

    return wait();
  }).then(function () {

    // create vault
    var createButton = app.find('button.primary')[0];
    createButton.click();

    return wait(1500);
  }).then(function () {

    var created = app.find('h3')[0];
    assert.equal(created.textContent, 'Vault Created', 'Vault created screen');

    // Agree button
    var button = app.find('button')[0];
    assert.ok(button, 'button present');
    button.click();

    return wait(1000);
  }).then(function () {

    var detail = app.find('.account-detail-section')[0];
    assert.ok(detail, 'Account detail section loaded.');

    var sandwich = app.find('.sandwich-expando')[0];
    sandwich.click();

    return wait();
  }).then(function () {

    var sandwich = app.find('.menu-droppo')[0];
    var children = sandwich.children;
    var lock = children[children.length - 2];
    assert.ok(lock, 'Lock menu item found');
    lock.click();

    return wait(1000);
  }).then(function () {

    var pwBox = app.find('#password-box')[0];
    pwBox.value = PASSWORD;

    var createButton = app.find('button.primary')[0];
    createButton.click();

    return wait(1000);
  }).then(function () {

    var detail = app.find('.account-detail-section')[0];
    assert.ok(detail, 'Account detail section loaded again.');

    return wait();
  }).then(function () {

    var qrButton = app.find('.fa.fa-qrcode')[0];
    qrButton.click();

    return wait(1000);
  }).then(function () {

    var qrHeader = app.find('.qr-header')[0];
    var qrContainer = app.find('#qr-container')[0];
    assert.equal(qrHeader.textContent, 'Account 1', 'Should show account label.');
    assert.ok(qrContainer, 'QR Container found');

    return wait();
  }).then(function () {

    var networkMenu = app.find('.network-indicator')[0];
    networkMenu.click();

    return wait();
  }).then(function () {

    var networkMenu = app.find('.network-indicator')[0];
    var children = networkMenu.children;
    children.length[3];
    assert.ok(children, 'All network options present');

    done();
  });
});

},{}]},{},[1]);

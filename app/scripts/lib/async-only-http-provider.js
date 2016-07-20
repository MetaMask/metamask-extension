/*
  This file is modified from the web3.js Http Provider

  web3.js is free software: you can redistribute it and/or modify
  it under the terms of the GNU Lesser General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  web3.js is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU Lesser General Public License for more details.

  You should have received a copy of the GNU Lesser General Public License
  along with web3.js.  If not, see <http://www.gnu.org/licenses/>.
*/
/** @file async-only-http-provider.js
 * @authors:
 *   Marek Kotewicz <marek@ethdev.com>
 *   Marian Oancea <marian@ethdev.com>
 *   Fabian Vogelsteller <fabian@ethdev.com>
 *   Dan Finlay <dan@metamask.io>
 * @date 2015
 */

'use strict'

var errors = require('web3/lib/web3/errors')

// workaround to use httpprovider in different envs
var XMLHttpRequest // jshint ignore: line

// browser
if (typeof window !== 'undefined' && window.XMLHttpRequest) {
  XMLHttpRequest = window.XMLHttpRequest // jshint ignore: line

// node
} else {
  XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest // jshint ignore: line
}

/**
 * HttpProvider should be used to send rpc calls over http
 */
var HttpProvider = function (host) {
  this.host = host || 'http://localhost:8545'
}

/**
 * Should be called to prepare new XMLHttpRequest
 *
 * @method prepareRequest
 * @param {Boolean} true if request should be async
 * @return {XMLHttpRequest} object
 */
HttpProvider.prototype.prepareRequest = function (async) {
  var request = new XMLHttpRequest()
  request.open('POST', this.host, async)
  request.setRequestHeader('Content-Type', 'application/json')
  return request
}

/**
 * Should be called to make sync request
 *
 * @method send
 * @param {Object} payload
 * @return {Object} result
 */
HttpProvider.prototype.send = function (payload) {
  var message = 'The MetaMask Web3 object does not support synchronous methods. See ""https://github.com/MetaMask/faq#all-async---think-of-metamask-as-a-light-client"" for details.'
  throw new Error(message)
}

/**
 * Should be used to make async request
 *
 * @method sendAsync
 * @param {Object} payload
 * @param {Function} callback triggered on end with (err, result)
 */
HttpProvider.prototype.sendAsync = function (payload, callback) {
  var request = this.prepareRequest(true)

  request.onreadystatechange = function() {
    if (request.readyState === 4) {
      var result = request.responseText
      var error = null

      try {
        result = JSON.parse(result)
      } catch (e) {
        error = errors.InvalidResponse(request.responseText)
      }

      callback(error, result)
    }
  }

  try {
    request.send(JSON.stringify(payload))
  } catch (error) {
    callback(errors.InvalidConnection(this.host))
  }
}

/**
 * Synchronously tries to make Http request
 *
 * @method isConnected
 * @return {Boolean} returns true if request haven't failed. Otherwise false
 */
HttpProvider.prototype.isConnected = function() {
  try {
    this.send({
      id: 9999999999,
      jsonrpc: '2.0',
      method: 'net_listening',
      params: [],
    })
    return true
  } catch (e) {
    return false
  }
}

module.exports = HttpProvider


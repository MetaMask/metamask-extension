const format = require('cfxjs-format')
const EthRPC = require('ethjs-rpc')

module.exports = Eth

function Eth(provider, options) {
  const self = this
  const optionsObject = options || {}

  if (!(this instanceof Eth)) {
    throw new Error(
      '[ethjs-query] the Eth object requires the "new" flag in order to function normally (i.e. `const eth = new Eth(provider);`).'
    )
  }
  if (typeof provider !== 'object') {
    throw new Error(
      "[ethjs-query] the Eth object requires that the first input 'provider' must be an object, got '" +
        typeof provider +
        "' (i.e. 'const eth = new Eth(provider);')"
    )
  }

  self.options = Object.assign({
    debug: optionsObject.debug || false,
    logger: optionsObject.logger || console,
    jsonSpace: optionsObject.jsonSpace || 0,
  })
  self.rpc = new EthRPC(provider)
  self.setProvider = self.rpc.setProvider
}

Eth.prototype.log = function log(message) {
  const self = this
  if (self.options.debug) {
    self.options.logger.log('[ethjs-query log] ' + message)
  }
}

Object.keys(format.schema.methods).forEach(function(rpcMethodName) {
  Object.defineProperty(Eth.prototype, rpcMethodName.replace('eth_', ''), {
    enumerable: true,
    value: generateFnFor(rpcMethodName, format.schema.methods[rpcMethodName]),
  })
})

function betterErrorMessage(err) {
  if (!err) {
    return
  }

  if (err.value && err.message.includes('[object Object]')) {
    let realRpcErrorMessage
    try {
      realRpcErrorMessage = JSON.stringify(err.value)
    } catch (e) {
      return err
    }
    err.message = err.message.replace(
      '[object Object]',
      '\n' + realRpcErrorMessage
    )
  }

  return err
}

function generateFnFor(method, methodObject) {
  return function outputMethod() {
    let protoCallback = null // () => {}; // eslint-disable-line
    var inputs = null // eslint-disable-line
    var inputError = null // eslint-disable-line
    const self = this
    var args = [].slice.call(arguments) // eslint-disable-line
    var protoMethod = method.replace('eth_', '') // eslint-disable-line

    if (args.length > 0 && typeof args[args.length - 1] === 'function') {
      protoCallback = args.pop()
    }

    const prom = new Promise(function(resolve, reject) {
      const cb = function cb(callbackError, callbackResult) {
        if (callbackError) {
          reject(callbackError)
          // protoCallback(callbackError, null);
        } else {
          try {
            self.log(
              "attempting method formatting for '" +
                protoMethod +
                "' with raw outputs: " +
                JSON.stringify(callbackResult, null, self.options.jsonSpace)
            )
            const methodOutputs = format.formatOutputs(method, callbackResult)
            self.log(
              "method formatting success for '" +
                protoMethod +
                "' formatted result: " +
                JSON.stringify(methodOutputs, null, self.options.jsonSpace)
            )

            resolve(methodOutputs)
            // protoCallback(null, methodOutputs);
          } catch (outputFormattingError) {
            const outputError = new Error(
              "[ethjs-query] while formatting outputs from RPC '" +
                JSON.stringify(callbackResult, null, self.options.jsonSpace) +
                "' for method '" +
                protoMethod +
                "' " +
                outputFormattingError
            )

            reject(outputError)
            // protoCallback(outputError, null);
          }
        }
      }

      if (args.length < methodObject[2]) {
        return cb(
          new Error(
            "[ethjs-query] method '" +
              protoMethod +
              "' requires at least " +
              methodObject[2] +
              ' input (format type ' +
              methodObject[0][0] +
              '), ' +
              args.length +
              ' provided. For more information visit: https://github.com/ethereum/wiki/wiki/JSON-RPC#' +
              method.toLowerCase()
          )
        )
      }

      if (args.length > methodObject[0].length) {
        return cb(
          new Error(
            "[ethjs-query] method '" +
              protoMethod +
              "' requires at most " +
              methodObject[0].length +
              ' params, ' +
              args.length +
              " provided '" +
              JSON.stringify(args, null, self.options.jsonSpace) +
              "'. For more information visit: https://github.com/ethereum/wiki/wiki/JSON-RPC#" +
              method.toLowerCase()
          )
        )
      }

      if (methodObject[3] && args.length < methodObject[3]) {
        args.push('latest')
      }

      self.log(
        "attempting method formatting for '" +
          protoMethod +
          "' with inputs " +
          JSON.stringify(args, null, self.options.jsonSpace)
      )

      try {
        inputs = format.formatInputs(method, args)
        self.log(
          "method formatting success for '" +
            protoMethod +
            "' with formatted result: " +
            JSON.stringify(inputs, null, self.options.jsonSpace)
        )
      } catch (formattingError) {
        return cb(
          new Error(
            "[ethjs-query] while formatting inputs '" +
              JSON.stringify(args, null, self.options.jsonSpace) +
              "' for method '" +
              protoMethod +
              "' error: " +
              formattingError
          )
        )
      }

      return self.rpc.sendAsync({ method: method, params: inputs }, cb)
    })

    if (protoCallback) {
      prom
        .then(function(result) {
          return protoCallback(null, result)
        })
        .catch(function(err) {
          return protoCallback(betterErrorMessage(err), null)
        })

      return undefined
    }

    return prom.catch(function(err) {
      throw betterErrorMessage(err)
    })
  }
}

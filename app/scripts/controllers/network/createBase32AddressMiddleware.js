const createAsyncMiddleware = require('json-rpc-engine/src/createAsyncMiddleware')
const { ethErrors } = require('eth-json-rpc-errors')
const {
  hexToBase32,
  isValidBase32Address,
  isValidHexAddress,
} = require('../../cip37')
const ADDR_CONFIG = require('./rpc-address-config')

module.exports = { createBase32AddressMiddleware }

function alterAddr(req, res, params, conf, networkId) {
  if (conf.from) {
    const addr = req.from
    if (
      addr === null ||
      addr === undefined ||
      isValidBase32Address(addr, networkId)
    ) {
      params[conf.index] = addr
    } else if (!isValidHexAddress(addr)) {
      res.error = ethErrors.rpc.invalidParams({
        data: req,
        message: 'Invalid hex address',
      })

      return false
    } else {
      req.from = hexToBase32(addr, networkId)
    }
  }

  if (conf.object) {
    conf.keys.forEach(idx => {
      const addr = params[idx]
      if (
        addr === null ||
        addr === undefined ||
        isValidBase32Address(addr, networkId)
      ) {
        params[idx] = addr
      } else if (!isValidHexAddress(addr)) {
        res.error = ethErrors.rpc.invalidParams({
          data: req,
          message: 'Invalid hex address',
        })

        return false
      } else {
        params[idx] = hexToBase32(addr, networkId)
      }
    })

    return params
  }

  if (conf.index !== undefined && !conf.children) {
    // eslint-disable-next-line no-inner-declarations
    function updateArrParams(index) {
      const addr = params[index]

      if (
        addr === null ||
        addr === undefined ||
        isValidBase32Address(addr, networkId)
      ) {
params[index] = addr
} else if (!isValidHexAddress(addr, networkId)) {
        res.error = ethErrors.rpc.invalidParams({
          data: req,
          message: 'Invalid hex address',
        })

        return false
      } else {
        params[index] = hexToBase32(addr, networkId)
      }
    }

    if (Array.isArray(conf.index)) {
conf.index.forEach(updateArrParams)
} else {
 updateArrParams(conf.index)
}

    return params
  }

  if (conf.index !== undefined && conf.children) {
    return conf.children.map(childConf =>
      alterAddr(req, res, params[conf.index], childConf, networkId)
    )
  }
}

function createBase32AddressMiddleware(networkId) {
  // eslint-disable-next-line no-unused-vars
  return createAsyncMiddleware(async (req, res, next) => {
    const methodConf = ADDR_CONFIG[req.method]
    if (!methodConf) {
      return await next()
    }

    const rstParams = alterAddr(req, res, req.params, methodConf, networkId)

    if (!rstParams) {
      return
    }

    req.params = rstParams

    await next()
  })
}

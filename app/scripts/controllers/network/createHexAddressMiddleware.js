const createAsyncMiddleware = require('json-rpc-engine/src/createAsyncMiddleware')
const { ethErrors } = require('eth-json-rpc-errors')
const {
  base32ToHex,
  isValidBase32Address,
  isValidHexAddress,
} = require('../../cip37')
const ADDR_CONFIG = require('./rpc-address-config')

module.exports = { createHexAddressMiddleware }

function alterAddr(req, res, params, conf, networkId) {
  if (conf.from) {
    const addr = req.from
    if (addr === null || addr === undefined || isValidHexAddress(addr)) {
      params[conf.index] = addr
    } else if (!isValidBase32Address(addr, networkId)) {
      res.error = ethErrors.rpc.invalidParams({
        data: req,
        message: 'Invalid base32 address',
      })

      return false
    } else {
      req.from = base32ToHex(addr)
    }
  }

  if (conf.object) {
    conf.keys.forEach(idx => {
      const addr = params[idx]
      if (addr === null || addr === undefined || isValidHexAddress(addr)) {
        params[idx] = addr
      } else if (!isValidBase32Address(addr, networkId)) {
        res.error = ethErrors.rpc.invalidParams({
          data: req,
          message: 'Invalid base32 address',
        })

        return false
      } else {
        params[idx] = base32ToHex(addr)
      }
    })

    return params
  }

  if (conf.index !== undefined && !conf.children) {
    // eslint-disable-next-line no-inner-declarations
    function updateArrParams(index) {
      const addr = params[index]

      if (addr === null || addr === undefined || isValidHexAddress(addr)) {
params[index] = addr
} else if (!isValidBase32Address(addr, networkId)) {
        res.error = ethErrors.rpc.invalidParams({
          data: req,
          message: 'Invalid base32 address',
        })

        return false
      } else {
        params[index] = base32ToHex(addr)
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

function createHexAddressMiddleware(networkId) {
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

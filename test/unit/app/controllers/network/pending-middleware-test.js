const assert = require('assert')
const { createPendingNonceMiddleware, createPendingTxMiddleware } = require('../../../../../app/scripts/controllers/network/middleware/pending')
const txMetaStub = require('./stubs').txMetaStub
describe('#createPendingNonceMiddleware', function () {
  const getPendingNonce = async () => '0x2'
  const address = '0xF231D46dD78806E1DD93442cf33C7671f8538748'
  const pendingNonceMiddleware = createPendingNonceMiddleware({ getPendingNonce })

  it('should call next if not a eth_getTransactionCount request', (done) => {
    const req = {method: 'eth_getBlockByNumber'}
    const res = {}
    pendingNonceMiddleware(req, res, () => done())
  })
  it('should call next if not a "pending" block request', (done) => {
    const req = { method: 'eth_getTransactionCount', params: [address] }
    const res = {}
    pendingNonceMiddleware(req, res, () => done())
  })
  it('should fill the result with a the "pending" nonce', (done) => {
    const req = { method: 'eth_getTransactionCount', params: [address, 'pending'] }
    const res = {}
    pendingNonceMiddleware(req, res, () => {
      done(new Error('should not have called next'))
    }, () => {
      assert(res.result === '0x2')
      done()
    })
  })
})

describe('#createPendingTxMiddleware', function () {
  let returnUndefined = true
  const getPendingTransactionByHash = () => returnUndefined ? undefined : txMetaStub
  const address = '0xF231D46dD78806E1DD93442cf33C7671f8538748'
  const pendingTxMiddleware = createPendingTxMiddleware({ getPendingTransactionByHash })
  const spec = {
    'blockHash': null,
    'blockNumber': null,
    'from': '0xf231d46dd78806e1dd93442cf33c7671f8538748',
    'gas': '0x5208',
    'gasPrice': '0x1e8480',
    'hash': '0x2cc5a25744486f7383edebbf32003e5a66e18135799593d6b5cdd2bb43674f09',
    'input': '0x',
    'nonce': '0x4',
    'to': '0xf231d46dd78806e1dd93442cf33c7671f8538748',
    'transactionIndex': null,
    'value': '0x0',
    'v': '0x2c',
    'r': '0x5f973e540f2d3c2f06d3725a626b75247593cb36477187ae07ecfe0a4db3cf57',
    's': '0x0259b52ee8c58baaa385fb05c3f96116e58de89bcc165cb3bfdfc708672fed8a',
  }
  it('should call next if not a eth_getTransactionByHash request', (done) => {
    const req = {method: 'eth_getBlockByNumber'}
    const res = {}
    pendingTxMiddleware(req, res, () => done())
  })

  it('should call next if no pending txMeta is in history', (done) => {
    const req = { method: 'eth_getTransactionByHash', params: [address] }
    const res = {}
    pendingTxMiddleware(req, res, () => done())
  })

  it('should fill the result with a the "pending" tx the result should match the rpc spec', (done) => {
    returnUndefined = false
    const req = { method: 'eth_getTransactionByHash', params: [address, 'pending'] }
    const res = {}
    pendingTxMiddleware(req, res, () => {
      done(new Error('should not have called next'))
    }, () => {
      /*
      // uncomment this section for debugging help with non matching keys
      const coppy = {...res.result}
      Object.keys(spec).forEach((key) => {
        console.log(coppy[key], '===', spec[key], coppy[key] === spec[key], key)
        delete coppy[key]
      })
      console.log(coppy)
      */
      assert.deepStrictEqual(res.result, spec, new Error('result does not match the spec object'))
      done()
    })
  })

})

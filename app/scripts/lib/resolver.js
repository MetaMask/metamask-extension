const namehash = require('eth-ens-namehash')
const multihash = require('multihashes')
const HttpProvider = require('ethjs-provider-http')
const Eth = require('ethjs-query')
const EthContract = require('ethjs-contract')
const registrarAbi = require('./contracts/registrar')
const resolverAbi = require('./contracts/resolver')

function ens (name, provider) {
  const eth = new Eth(new HttpProvider(getProvider(provider.type)))
  const hash = namehash.hash(name)
  const contract = new EthContract(eth)
  const Registrar = contract(registrarAbi).at(getRegistrar(provider.type))
  return new Promise((resolve, reject) => {
    if (provider.type === 'mainnet' || provider.type === 'ropsten') {
      Registrar.resolver(hash).then((address) => {
        if (address === '0x0000000000000000000000000000000000000000') {
          reject(null)
        } else {
          const Resolver = contract(resolverAbi).at(address['0'])
          return Resolver.content(hash)
        }
      }).then((contentHash) => {
        if (contentHash['0'] === '0x0000000000000000000000000000000000000000000000000000000000000000') reject(null)
        if (contentHash.ret !== '0x') {
          const hex = contentHash['0'].substring(2)
          const buf = multihash.fromHexString(hex)
          resolve(multihash.toB58String(multihash.encode(buf, 'sha2-256')))
        } else {
          reject(null)
        }
      })
    } else {
      return reject('unsupport')
    }
  })
}

function getProvider (type) {
  switch (type) {
    case 'mainnet':
      return 'https://mainnet.infura.io/'
    case 'ropsten':
      return 'https://ropsten.infura.io/'
    default:
      return 'http://localhost:8545/'
  }
}

function getRegistrar (type) {
  switch (type) {
    case 'mainnet':
      return '0x314159265dd8dbb310642f98f50c066173c1259b'
    case 'ropsten':
      return '0x112234455c3a32fd11230c42e7bccd4a84e02010'
    default:
      return '0x0000000000000000000000000000000000000000'
  }
}

module.exports.resolve = function (name, provider) {
  const path = name.split('.')
  const topLevelDomain = path[path.length - 1]
  if (topLevelDomain === 'eth' || topLevelDomain === 'test') {
    return ens(name, provider)
  } else {
    return new Promise((resolve, reject) => {
      reject(null)
    })
  }
}

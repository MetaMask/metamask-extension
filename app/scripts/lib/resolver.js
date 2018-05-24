const namehash = require('eth-ens-namehash')
const multihash = require('multihashes')
const REGISTRAR_ENS_MAIN_NET = '0x314159265dd8dbb310642f98f50c066173c1259b'
const HttpProvider = require('ethjs-provider-http')
const Eth = require('ethjs-query')
const EthContract = require('ethjs-contract')
const registrarAbi = require('./contracts/registrar')
const resolverAbi = require('./contracts/resolver')

function ens (name, provider) {
  const eth = new Eth(new HttpProvider(provider.rpcTarget))
  const hash = namehash.hash(name)
  const contract = new EthContract(eth)
  const Registrar = contract(registrarAbi).at(REGISTRAR_ENS_MAIN_NET)
  return new Promise((resolve, reject) => {
    if (provider.type !== 'mainnet') reject('unsupport')
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
        resolve(multihash.toB58String(buf))
      } else {
        reject(null)
      }
    })
  })
}

module.exports.resolve = function (name, provider) {
  const path = name.split('.')
  const tld = path[path.length - 1]
  if (tld === 'eth') {
    return ens(name, provider)
  } else {
    return new Promise((resolve, reject) => {
      reject(null)
    })
  }
}

const namehash = require('eth-ens-namehash')
const multihash = require('multihashes')
const REGISTRAR_ENS_MAIN_NET = "0x314159265dd8dbb310642f98f50c066173c1259b"
const HttpProvider = require('ethjs-provider-http')
const Eth = require('ethjs-query')
const EthContract = require('ethjs-contract')
const registrarAbi = require('./contracts/registrar')
const resolverAbi = require('./contracts/resolver')
function ens(name, provider) {
  // provider need mainnet
  let eth = new Eth(new HttpProvider(provider.rpcTarget))
  let hash = namehash.hash(name)
  let contract = new EthContract(eth)
  let Registrar = contract(registrarAbi).at(REGISTRAR_ENS_MAIN_NET)
  return new Promise((resolve, reject) => {
    if (provider.type !== "mainnet") reject('no_mainnet')
    Registrar.resolver(hash).then((address) => {
      if (address === '0x0000000000000000000000000000000000000000') {
        reject(null)
      } else {
        let Resolver = contract(resolverAbi).at(address["0"])
        return Resolver.content(hash)
      }
    }).then((contentHash) => {
      if (contentHash["0"] === '0x0000000000000000000000000000000000000000000000000000000000000000') reject(null)
      if (contentHash.ret !== "0x") {
        let hex = contentHash["0"].substring(2)
        let buf = multihash.fromHexString(hex)
        resolve(multihash.toB58String(multihash.encode(buf, 'sha2-256')))
      } else {
        reject('fisk')
      }
    })
  })
}
module.exports.resolve = function (name, provider) {
  let path = name.split(".");
  let tld = path[path.length - 1];
  if (tld === 'eth') {
    return ens(name, provider);
  } else {
    return new Promise((resolve, reject) => {
      reject(null)
    })
  }
}

const namehash = require('eth-ens-namehash')
const multihash = require('multihashes')
const Eth = require('ethjs-query')
const EthContract = require('ethjs-contract')
const registrarAbi = require('./contracts/registrar')
const resolverAbi = require('./contracts/resolver')

module.exports = resolveEnsToIpfsContentId


async function resolveEnsToIpfsContentId({ provider, name }) {
  const eth = new Eth(provider)
  const hash = namehash.hash(name)
  const contract = new EthContract(eth)
  // lookup registrar
  const chainId = Number.parseInt(await eth.net_version(), 10)
  const registrarAddress = getRegistrarForChainId(chainId)
  if (!registrarAddress) {
    throw new Error(`EnsIpfsResolver - no known ens-ipfs registrar for chainId '${chainId}'`)
  }
  const Registrar = contract(registrarAbi).at(registrarAddress)
  // lookup resolver
  const resolverLookupResult = await Registrar.resolver(hash)
  const resolverAddress = resolverLookupResult[0]
  console.log('resolver: ', resolverAddress)
  if (hexValueIsEmpty(resolverAddress)) {
    throw new Error(`EnsIpfsResolver - no resolver found for name '${name}'`)
  }
  const Resolver = contract(resolverAbi).at(resolverAddress)

  const contenthashInterfaceLookupResult = await Resolver.supportsInterface('0xbc1c58d1')
  const contenthashInterface = contenthashInterfaceLookupResult[0]
  console.log(contenthashInterface, 'support')
  if (contenthashInterface) {
    const contenthashLookupResult = await Resolver.contenthash(hash)
    const contenthash = contenthashLookupResult[0]
    if (!hexValueIsEmpty(contenthash)) {
      const nonPrefixedHex = contenthash.slice(2)
      const buffer = multihash.fromHexString(nonPrefixedHex)
      const contentId = multihash.toB58String(multihash.encode(buffer, 'sha2-256'))
      return [contentId, 'ipfs']
    }
  }

  const contentInterfaceLookupResult = await Resolver.supportsInterface('0xd8389dc5')
  const contentInterface = contentInterfaceLookupResult[0]
  if (contentInterface) {
    const contentLookupResult = await Resolver.content(hash)
    const content = contentLookupResult[0]
    if (!hexValueIsEmpty(content)) {
      const nonPrefixedHex = content.slice(2)
      const buffer = multihash.fromHexString(nonPrefixedHex)
      const contentId = multihash.toB58String(multihash.encode(buffer, 'sha2-256'))
      return [contentId, 'ipfs']
    }
  }


  const textInterfaceLookupResult = await Resolver.supportsInterface('0x59d1d43c')
  const textInterface = textInterfaceLookupResult[0]
  if (textInterface) {
    const contentLookupResultTns = await Resolver.text(hash, 'onion')
    console.log('onion addr: ', contentLookupResultTns[0])
    if (contentLookupResultTns[0] === '') {
      throw new Error(`EnsIpfsResolver - no content ID found for name '${name}'`)
    }
    return [contentLookupResultTns[0], 'onion']
  }


}

function hexValueIsEmpty(value) {
  return [undefined, null, '0x', '0x0', '0x0000000000000000000000000000000000000000000000000000000000000000'].includes(value)
}

function getRegistrarForChainId(chainId) {
  switch (chainId) {
    // mainnet
    case 1:
      return '0x314159265dd8dbb310642f98f50c066173c1259b'
      // ropsten
    case 3:
      return '0x112234455c3a32fd11230c42e7bccd4a84e02010'
  }
}
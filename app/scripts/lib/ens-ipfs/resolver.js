const namehash = require('eth-ens-namehash')
const Eth = require('ethjs-query')
const EthContract = require('ethjs-contract')
const registryAbi = require('./contracts/registry')
const resolverAbi = require('./contracts/resolver')
const contentHash = require('content-hash')

module.exports = resolveEnsToIpfsContentId


async function resolveEnsToIpfsContentId ({ provider, name }) {
  const eth = new Eth(provider)
  const hash = namehash.hash(name)
  const contract = new EthContract(eth)
  // lookup registry
  const chainId = Number.parseInt(await eth.net_version(), 10)
  const registryAddress = getRegistryForChainId(chainId)
  if (!registryAddress) {
    throw new Error(`EnsIpfsResolver - no known ens-ipfs registry for chainId "${chainId}"`)
  }
  const Registry = contract(registryAbi).at(registryAddress)
  // lookup resolver
  const resolverLookupResult = await Registry.resolver(hash)
  const resolverAddress = resolverLookupResult[0]
  if (hexValueIsEmpty(resolverAddress)) {
    throw new Error(`EnsIpfsResolver - no resolver found for name "${name}"`)
  }
  const Resolver = contract(resolverAbi).at(resolverAddress)

  const isEIP1577Compliant = await Resolver.supportsInterface('0xbc1c58d1')
  const isLegacyResolver = await Resolver.supportsInterface('0xd8389dc5')
  if (isEIP1577Compliant[0]) {
    const contentLookupResult = await Resolver.contenthash(hash)
    const rawContentHash = contentLookupResult[0]
    const decodedContentHash = contentHash.decode(rawContentHash)
    const type = contentHash.getCodec(rawContentHash)
    return {type: type, hash: decodedContentHash}
  }
  if (isLegacyResolver[0]) {
    // lookup content id
    const contentLookupResult = await Resolver.content(hash)
    const content = contentLookupResult[0]
    if (hexValueIsEmpty(content)) {
      throw new Error(`EnsIpfsResolver - no content ID found for name "${name}"`)
    }
    return {type: 'swarm-ns', hash: content.slice(2)}
  }
  throw new Error(`EnsIpfsResolver - the resolver for name "${name}" is not standard, it should either supports contenthash() or content()`)
}

function hexValueIsEmpty (value) {
  return [undefined, null, '0x', '0x0', '0x0000000000000000000000000000000000000000000000000000000000000000'].includes(value)
}

/**
 * Returns the registry address for the given chain ID
 * @param {number} chainId the chain ID
 * @returns {string|null} the registry address if known, null otherwise
 */
function getRegistryForChainId (chainId) {
  switch (chainId) {
    case 1:
      // falls through
    case 3:
      // falls through
    case 4:
      // falls through
    case 5:
      // Mainnet, Ropsten, Rinkeby, and Goerli, respectively, use the same address
      return '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e'
    default:
      return null
  }
}

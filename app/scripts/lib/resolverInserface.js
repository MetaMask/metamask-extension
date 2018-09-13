const Promises = require('bluebird')
const namehash = require('eth-ens-namehash')

class ResolverInserface {

    constructor (contract, abi, address) {
        const resolverContract = contract(abi).at(address)
        this.resolverPromise = Promises.resolve(Promises.promisifyAll(resolverContract))
    }

    supportsInterface = support => {
        const res = this.resolverPromise.then(resolver => resolver.supportsInterfaceAsync(support))
        return res
    }

    multihash = name => {
        const res = this.resolverPromise.then(resolver => resolver.multihashAsync(name))
        return res
    }

    getSupportsInterface = async support => {
        try {
          const content = await this.supportsInterface(support)
          return content
        } catch (err) {
          console.error('getSupportsInterface:', support, err)
          return 'getSupportsInterface not found'
        }
    }

    getMultiHash = async name => {
        try {
            const hash = await this.multihash(namehash.hash(name))
            if (hash['0'] === '0x') return hash['0']
            return hash
        } catch (err) {
            console.error('getMultiHash: ', name, err)
            return 'getMultiHash not found'
        }
    }

}
module.exports = ResolverInserface

const GnosisSafe = require('../lib/contracts/gnosis-safe-v2')
const ObservableStore = require('obs-store')
const extend = require('xtend')

class AccountsController {
    constructor (opts = {}) {
        const initState = extend({
        }, opts.initState)

        this.network = opts.network
        this.provider = opts.provider
        this.preferences = opts.preferences
        this.keyring = opts.keyring

        // supports one contract account for restore
        if (initState.contracts && Object.keys(initState.contracts).length != 0) {            
            let contractAddress = Object.keys(initState.contracts)[0]
            let controllingAccount = initState.contracts[contractAddress].controllingAccount
            
            // set current contract address and instance
            this.importContractAddress('Contract', [contractAddress], controllingAccount)
        }
        else {
            // on fresh install of state
            this.currentContractInstance = null
        }
        this.contracts = initState.contracts || {}
        this.store = new ObservableStore(initState)
    }

    async importContractAddress (strategy, inputAddress, account) {
        let address
        if (inputAddress === 'remove' || inputAddress === 'clear') {
            this.clearAccounts()
            // reject with an error
            return 
        }
        else if (inputAddress === 'test') {
            // new rinkeby from gnosis react deployer
            address = '0xfd1144165c42089b6EB10aafF1988219Fd380186'
        }
        else if (inputAddress === 'local') {
            address = '0x1dbbcfd8f07252bc4a468473191a5773848f4da7'
        }
        else if (inputAddress === 'mainnet') {
            // need to checksum this
            address = '0x203FEF062aa5050a4EB50C93fcFA9809d8785dd3'
        }
        else {
            address = inputAddress
        }

        // currently gives rinkeby deployer instance
        let contract = new GnosisSafe({
            address: address,
            preferences: this.preferences,
            network: this.network,
            provider: this.provider,
            keyring: this.keyring,
            controllingAccount: account
        })

        // could set the state here instead of getContractData
        this.currentContractInstance = contract
        return contract
    }

    /**
     * calls contract instance's data collection method and sets the persistent state
     */
    async getContractData () {
        const contractData = await this.currentContractInstance.getContractData()
        this.contracts[this.currentContractInstance.address] = contractData
        this.store.updateState({ contracts: this.contracts })
        console.log('[accounts controller] this.store after getContractData', this.store)

        return this.contracts
    }

    getContracts () {
        return this.contracts
    }

    getContract (contractAddress) {
        return this.contracts[contractAddress]
    }


    // expose this to the UI
    // need to update the state here as well..
    // marry this with the removal from keyring
    clearAccounts () {
        console.log('[accounts controller] clear accounts')
        this.contracts = {}
        this.currentContractInstance = null
        this.preferences.clearSelectedContractAccount()
        
        // disable contract account in preferences

        // doesn't remove the accountscontroller from the metamask store
        // but does remove all contract data..
        this.store.updateState ({ contracts: this.contracts })
        console.log('[accounts controller] preferences store ', this.preferences.store)
        console.log('[accounts controller] observable store', this.store)
    }
}

module.exports = AccountsController

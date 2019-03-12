const GnosisSafe = require('../lib/contracts/rinkeby_safe')
const ObservableStore = require('obs-store')
const extend = require('xtend')

class AccountsController {
    constructor (opts = {}) {
        const initState = extend({
        }, opts.initState)

        // to do: workaround for network state 'loading'
        this.network = opts.network
        this.provider = opts.provider
        this.preferences = opts.preferences
        this.keyring = opts.keyring

        // supports one contract account for restore
        if (initState.contracts && Object.keys(initState.contracts).length != 0) {
            let contractAddress = Object.keys(initState.contracts)[0]
            let controllingAccount = initState.contracts[contractAddress].controllingAccount
            let type = initState.contracts[contractAddress].type

            // set current contract address and instance
            this.importContractAddress(type, contractAddress, controllingAccount)
        }
        else {
            // on fresh install of state
            this.currentContractInstance = null
        }
        this.contracts = initState.contracts || {}
        this.store = new ObservableStore(initState)
    }

    async importContractAddress (type, inputAddress, account) {
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
            address = '0x203fef062aa5050a4eb50c93fcfa9809d8785dd3'
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
            controllingAccount: account,
            type: type,
        })

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


    clearAccounts () {
        this.contracts = {}
        this.currentContractInstance = null

        // disable contract account in preferences
        this.preferences.clearSelectedContractAccount()


        // doesn't remove the accountscontroller from the metamask store
        // but does remove all contract data
        this.store.updateState ({ contracts: this.contracts })
    }
}

module.exports = AccountsController

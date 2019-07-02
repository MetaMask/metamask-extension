const Eth = require('ethjs-query')
const EthContract = require('ethjs-contract')
const BigNumber = require('bignumber.js')
const BN = require('bn.js')
const Web3 = require('web3')

const GnosisSafeAbi = require('./mainnet-abi')
const Operation = require('./gnosis-safe-operations')
const { hexToBn, bnToHex } = require('../../lib/util')

// to do : advanced user preferences for refunds to the tx submitter


class MainnetSafe {
    constructor ({ address, preferences, network, provider, keyring, controllingAccount, type }) {
        this.preferences = preferences
        
        // to do: add some network checks
        this.network = network

        this.provider = provider
        this.keyring = keyring
        this.address = address

        // if getOwners doesn't contain the controllingAccount
        // clear the current selected contract?
        // or store it like the preferences that have the tokens and networks..

        this.controllingAccount = controllingAccount
        this.type = type

        // right now using the version of the contract..
        // '0x2727d69c0bd14b1ddd28371b8d97e808adc1c2f7'
        // to do: use or remove...
        this.masterCopyAddress = 'test'
        this.isValidContract = false

        // this is undefined until the keyring is unlocked..
        // but i should be able to set it from contracts[contractAddress].owners[0]
        console.log('[mainnet safe] this.controllingAccount', this.controllingAccount)

        this.eth = new Eth(this.provider)
        const contract = new EthContract(this.eth)

        // can i wrap this in a try catch?
        // to test - restart ganache on local 
        // the contract won't be there and we'll get an eth query error
        // error message located in manage-contracts.container
        // what's the call to "getCode" at the address?
        this.instance = contract(GnosisSafeAbi).at(this.address)
        console.log('[mainnet safe] instance', this.instance)
    }


    /**
     * Extracts the data field from an ethjs-query error
     * @param {*} err 
     */
    parseDataFromError (err) {
        let ethjsQuerySlug = '[ethjs-query] while formatting inputs'
        const isError = err.message.includes(ethjsQuerySlug)
            if (isError) {
                err.message = err.message.slice(ethjsQuerySlug.length)
    
                let start = err.message.indexOf('[')
                let end = err.message.indexOf(']')
    
                let payload = err.message.slice(start + 1, end)
                console.log('[mainnet safe] parse data from error payload', payload)
    
                // to do: rename these vars
                let newData = JSON.parse(payload)
                console.log('[mainnet safe] parse data from error newData.data', newData.data)
    
                return newData.data
            }
        // return error
    }

    // with controlled keyring logic, need to make the tx from the controlling account
    /**
     * 
     * @param {*} originalTxParams 
     */
    async modifyTransactionOpts (originalTxParams) {
        console.log('[modify tx opts] original params' , originalTxParams)
        const zero = '0x0000000000000000000000000000000000000000'
        let nonce = await this.instance.nonce()

        console.log('[mainnet safe] nonce [0] ', nonce[0])

        let to = originalTxParams.to
        let value = originalTxParams.value

        // why was the original tx params data stripped?
        let data = originalTxParams.data || '0x'
        console.log('[mainnet safe] data', data)

        // if (data !== '0x')
        // {
            // need to branch
            // console.log('[gnosis safe] not a simple tx', data)
        // }

        // how to determine the operation based on the transaction opts?
        let operation = Operation.CALL

        /*
            In addition if also the `safeTxGas` is set to `0` all available gas will 
            be used for the execution of the Safe transaction. 
            With this it is also unnecessary to estimate the gas for the Safe transaction.
        */


        let safeTxGas = '0'

        /*
            when metamask's gas estimation is not working, the intrinsic gas too low error gets hit
            so should use below code to generate the safeTxGas..but don't have a good way of determining when 
            it will or will not work
        */
        // let safeDataEstimate = await this.generateSafeDataFromRevert(this.instance, this.address, value, data, operation)
        //  let safeTxGasEstimate = await this.generateSafeTxGasEstimate(this.address, safeDataEstimate)

        //  console.log('[mainnet safe] safeTxGasEstimate', safeTxGasEstimate)
        
        // // on rinkeby gas estimation works, but it doesn't work on localhost because of revert
        // // if the network is not localhost
        //  safeTxGas = safeTxGasEstimate.toString()

        // to do : estimate gas for complex transactions..
        let dataGas = '0'

        // if gasPrice is set to 0, no refund tx will be triggered

        // TODO: add an option in the ui for setting a refunder?
        // should refund the account that submits the tx - aka the owning metamask account..
        let gasPrice = '0'

        // token used for paying gas costs...
        // 0x0 for eth
        // TODO: add an option in the ui for paying gas with tokens
        let gasToken = zero
        let refundReceiver = zero

        // address to, uint256 value, bytes data, Enum.Operation operation, 
        // uint256 safeTxGas, uint256 dataGas, uint256 gasPrice, address gasToken,
        // address refundReceiver, uint256 _nonce
        let txHash = await this.instance.getTransactionHash(to, value, data, operation, safeTxGas, dataGas, gasPrice, gasToken, refundReceiver, nonce[0])

        console.log('[mainnet safe] tx hash', txHash)
        console.log('[mainnet safe] tx hash', txHash[0])

        console.log('[mainnet safe] this.keyring', this.keyring)
        console.log('[mainnet safe] controlling account', this.controllingAccount)
        
        // optional to do: prompt user to sign message
        let controllingKeyring = await this.keyring.getKeyringForAccount(this.controllingAccount)
        let signedMessage = await controllingKeyring.signMessage(this.controllingAccount, txHash[0])

        // set the original tx values
        originalTxParams.to = this.instance.address
        originalTxParams.from = this.controllingAccount
        originalTxParams.value = '0'

        try {
        console.log('[mainnet safe] exec transaction')
            await this.instance.execTransaction(
                to, 
                value, 
                data, 
                operation, 
                safeTxGas, 
                dataGas, 
                gasPrice, 
                gasToken, 
                refundReceiver,
                signedMessage)
        }
        catch (err) {
            let payload = this.parseDataFromError(err)
            originalTxParams.data = payload
        }
        return originalTxParams
    }

    /**
     * The user should set an appropriate `safeTxGas` to define the gas required by the Safe transaction, 
     * to make sure that enough gas is sent by the relayer with the transaction triggering `execTransaction`. 
     * For this it is necessary to estimate the gas costs of the Safe transaction. 
     */
    generateSafeDataFromRevert = async (safe, to, valueInWei, data, operation) => {
        try {
            /*
                The value returned by `requiredTxGas` is encoded in a revert error message
                (see [solidity docs](http://solidity.readthedocs.io/en/v0.4.24/control-structures.html) at the very bottom).
                For retrieving the hex encoded uint value the first 68 bytes of the error message need to be removed.
            */
            await safe.requiredTxGas(to, valueInWei, data, operation)
        }
        catch (err) {
            let payload = this.parseDataFromError(err)

            console.log('[mainnet safe] gen safe data from revert: payload', payload)
            return payload
        }
    }

    estimateDataGasCosts = (data) => {
        const reducer = (accumulator, currentValue) => {
          if (currentValue === '0x') {
            return accumulator + 0
          }
      
          if (currentValue === '00') {
            return accumulator + 4
          }
      
          return accumulator + 68
        }
      
        return data.match(/.{2}/g).reduce(reducer, 0)
      }
    
    estimateDataGas = (
        safe,
        to,
        valueInWei,
        data,
        operation,
        txGasEstimate,
        gasToken,
        nonce,
        signatureCount,
        sigs
      ) => {
        // numbers < 256 are 192 -> 31 * 4 + 68
        // numbers < 65k are 256 -> 30 * 4 + 2 * 68
        // For signature array length and dataGasEstimate we already calculated
        // the 0 bytes so we just add 64 for each non-zero byte
        const gasPrice = 0 // no need to get refund when we submit txs to metamask
        const signatureCost = signatureCount * (68 + 2176 + 2176) // array count (3 -> r, s, v) * signature count
    
        // const sigs = getSignaturesFrom(safe.address, nonce)
        // const sigs = get sigs from personal edition instead of team edition
        // where is my build signature code? 
        // what is the 0? could be a problem?

        // this is going to fail cause there's no method of this type?
        const payload = safe.execTransactionAndPaySubmitter
        .getData(to, valueInWei, data, operation, txGasEstimate, 0, gasPrice, gasToken, sigs)
    
        let dataGasEstimate = estimateDataGasCosts(payload) + signatureCost
        if (dataGasEstimate > 65536) {
            dataGasEstimate += 64
        } else {
            dataGasEstimate += 128
        }
        return dataGasEstimate + 34000 // Add additional gas costs (e.g. base tx costs, transfer costs)
    }

    async generateSafeTxGasEstimate (safeAddress, estimatedData) {
        let estimate
        await this.eth.call({
            to: safeAddress,
            from: safeAddress,
            data: estimatedData
        }).then(function(estimateResponse){
            console.log('[mainnet safe] generate safe tx gas estimate: estimate response', estimateResponse)

            // document why substring 138
            let txGasEstimate = estimateResponse.substring(138)

            txGasEstimate = '0x' + txGasEstimate
            console.log('[mainnet safe] generate safe tx gas estimate: txGasEstimate', txGasEstimate)

            let test = hexToBn(txGasEstimate)
            
            // is 8729 a valid estimated gas for this - for a simple eth transfer
            // Add 10k else we will fail in case of nested calls
            estimate = test.toNumber() + 10000

        }).catch(function(err){
            console.log(err)
        })
        return estimate
    }

    /**
     * returns an array of owners of the gnosis safe
     */
    async getOwners () {
        let owners
        await this.instance.getOwners().then(function(result){
            console.log('[mainnet safe] result of getOwners call' , result)
            owners = result[0]

        }).catch(function(err){
            console.log(err)
        })
        return owners
    }

    /**
     * returns threshold of the gnosis safe as number
     */
    async getThreshold () {
        let threshold
        await this.instance.getThreshold().then(function(result){
            console.log('[mainnet safe] result of getThreshold call' , result)
            threshold = result[0]

        }).catch(function(err){
            console.log(err)
        })

        // should probs do this using bn functionality
        return threshold.toNumber()
    }

    // i want to use the current version as a validity check somehow..
    /**
     * 
     */
    async validity () {
        let name, version
        
        await this.instance.NAME().then(function(result) {
            name = result
        })

        await this.instance.VERSION().then(function(result){
            version = result
        })


        return {name, version}
    }

    // if i want this to be a generic thing then i can't have helper modules?
    /**
     * 
     */
    async getContractData () {
        let owners = await this.getOwners()
        let threshold = await this.getThreshold()

        let valid = await this.validity()

        console.log('[mainnet safe]', valid)

        console.log('[mainnet safe] getContractData')

        return { controllingAccount: this.controllingAccount, type: this.type, owners: owners, threshold: threshold }
    }
}

module.exports = MainnetSafe
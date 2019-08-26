const Eth = require('ethjs-query')
const EthContract = require('ethjs-contract')

const GnosisSafeAbi = require('./gnosis-safe-abi')
const Operation = require('./gnosis-safe-operations')
const { hexToBn, bnToHex } = require('../util')

const hexZero = '0x0000000000000000000000000000000000000000'
const zero = '0'

class GnosisSafe {
    constructor ({ address, preferences, network, provider, keyring, controllingAccount, type }) {
        this.preferences = preferences
        this.network = network
        this.provider = provider
        this.keyring = keyring
        this.address = address
        this.controllingAccount = controllingAccount
        this.type = type
        this.eth = new Eth(this.provider)
        const contract = new EthContract(this.eth)

        this.instance = contract(GnosisSafeAbi).at(this.address)
    }


    /**
     * Extracts the data field from an ethjs-query error
     * @param {*} err
     */
    parseDataFromError (err) {
        console.log('error', err)
        let ethjsQuerySlug = '[ethjs-query] while formatting inputs'
        const isError = err.message.includes(ethjsQuerySlug)
            if (isError) {
                err.message = err.message.slice(ethjsQuerySlug.length)
                let start = err.message.indexOf('[')
                let end = err.message.indexOf(']')

                let payload = err.message.slice(start + 1, end)
                console.log('[gnosis safe v2] parse data from error payload', payload)

                let newData = JSON.parse(payload)
                return newData.data
            }
        return err
    }

    // with controlled keyring logic, need to make the tx from the controlling account
    // gnosis to do: hand make the data field - how though?
    /**
     *
     * @param {*} originalTxParams
     */
    async modifyTransactionOpts (originalTxParams) {
        let nonce = await this.instance.nonce()
        let to = originalTxParams.to
        let value = originalTxParams.value
        let data = originalTxParams.data || '0x'


        // for now, supports CALL
        let operation = Operation.CALL

        /*
            In addition if also the `safeTxGas` is set to `0` all available gas will
            be used for the execution of the Safe transaction.
            With this it is also unnecessary to estimate the gas for the Safe transaction.
        */

        // if gasPrice is set to 0, no refund tx will be triggered
        // TODO: add an option in the ui for setting the refunder or using default refunder (controlling account)
        let safeTxGas = zero
        let dataGas = zero
        let gasPrice = zero

        /*
            when metamask's gas estimation is not working, the intrinsic gas too low error gets hit
            so should use below code to generate the safeTxGas..but don't have a good way of determining when
            it will or will not work
        */
        let safeDataEstimate = await this.generateSafeDataFromRevert(this.instance, this.address, value, data, operation)
        let safeTxGasEstimate = await this.generateSafeTxGasEstimate(this.address, safeDataEstimate)
        // on mainnet and rinkeby gas estimation works, but it doesn't work on ganache because of revert (use '0')
        safeTxGas = safeTxGasEstimate.toString()

        // TODO: add an option in the ui for paying gas with tokens
        let gasToken = hexZero

        // to do : advanced user preferences for refunds to the tx submitter
        let refundReceiver = hexZero

        // address to, uint256 value, bytes data, Enum.Operation operation,
        // uint256 safeTxGas, uint256 dataGas, uint256 gasPrice, address gasToken,
        // address refundReceiver, uint256 _nonce
        let txHash = await this.instance.getTransactionHash(to, value, data, operation, safeTxGas, dataGas, gasPrice, gasToken, refundReceiver, nonce[0])

        let controllingKeyring = await this.keyring.getKeyringForAccount(this.controllingAccount)
        let signedMessage = await controllingKeyring.signMessage(this.controllingAccount, txHash[0])

        // set the original tx values
        originalTxParams.to = this.instance.address
        originalTxParams.from = this.controllingAccount
        originalTxParams.value = zero

        try {
        console.log('[gnosis safe v2] exec transaction')
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

            return payload
        }
    }


    // function requiredTxGas(address to, uint256 value, bytes calldata data, Enum.Operation operation)
    // external
    // authorized
    // returns (uint256)
    // {
    //   uint256 startGas = gasleft();
    //   // We don't provide an error message here, as we use it to return the estimate
    //   // solium-disable-next-line error-reason
    //   require(execute(to, value, data, operation, gasleft()));
    //   uint256 requiredGas = startGas - gasleft();
    //   // Convert response to string and return via error message
    //   revert(string(abi.encodePacked(requiredGas)));
    // }

    async generateSafeTxGasEstimate (safeAddress, estimatedData) {
        let estimate
        await this.eth.call({
            to: safeAddress,
            from: safeAddress,
            data: estimatedData
        }).then(function(estimateResponse){
            console.log('[gnosis safe v2] generate safe tx gas estimate: estimate response', estimateResponse)

            let txGasEstimate = estimateResponse.substring(138)

            txGasEstimate = '0x' + txGasEstimate
            console.log('[gnosis safe v2] generate safe tx gas estimate: txGasEstimate', txGasEstimate)

            let initialEstimate = hexToBn(txGasEstimate)
            // Add 10k else we will fail in case of nested calls
            estimate = initialEstimate.toNumber() + 10000

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
            console.log('[gnosis safe v2] result of getOwners call' , result)
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
            console.log('[gnosis safe v2] result of getThreshold call' , result)
            threshold = result[0]

        }).catch(function(err){
            console.log(err)
        })

        return threshold.toNumber()
    }

    /**
     * to do: use current deployed version as validity check
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

    /**
     * specific to gnosis safes
     */
    async getContractData () {
        let owners = await this.getOwners()
        let threshold = await this.getThreshold()
        let valid = await this.validity()

        return { controllingAccount: this.controllingAccount, type: this.type, owners: owners, threshold: threshold }
    }
}

module.exports = GnosisSafe


const { ethErrors } = require('eth-json-rpc-errors')

const pluginRestrictedMethodDescriptions = {
  onNewTx: 'Take action whenever a new transaction is created',
  fetch: 'Retrieve data from external sites',
  updatePluginState: 'Store data locally',
  getPluginState: 'Get data stored locally',
  Box: 'Backup your data to 3Box',
  subscribeToPreferencesControllerChanges: 'Access your preferences and take action when they change',
  updatePreferencesControllerState: 'Update/modify your preferences',
  generateSignature: 'Sign messages with your account',

  // MetaMaskController#getApi
  addAddressAudit: 'Check the recipients of your transaction and show you warnings if they are untrustworthy',
  addKnownMethodData: 'Update and store data about a known contract method',
  addNewAccount: 'Adds a new account to the default (first) HD seed phrase Keyring',
  addNewKeyring: 'Create a new keyring',
  addToken: 'Add a new token to be tracked',
  buyEth: 'Forwards the user to the easiest way to obtain ether for the currently-selected network',
  checkHardwareStatus: 'Check if the hardware device is unlocked',
  connectHardware: 'Fetch account list from a Trezor device',
  createShapeShiftTx: 'Triggers a ShapeShift currency transfer',
  delCustomRpc: 'Delete a selected custom URL',
  estimateGas: 'Estimate the gas required for a transaction',
  fetchInfoToSync: 'Collects all the information for mobile syncing',
  forgetDevice: 'Clear all connected devices',
  getApprovedAccounts: 'Get a list of all approved accounts',
  getFilteredTxList: 'Get a list of filtered transactions',
  getGasPrice: 'Estimates a good gas price at recent prices',
  getTxById: 'Get full data of a transaction with a given metamask tx id',
  getState: 'Get a JSON representation of MetaMask data, including sensitive data. This is only for testing purposes and will NOT be included in production.',
  importAccountWithStrategy: 'Imports an account with the specified import strategy',
  isNonceTaken: 'Check if a given nonce is available for use',
  removeAccount: 'Removes an account from state / storage',
  removeFromAddressBook: 'Remove an entry from the address book',
  removePermissionsFor: 'Remove account access for a given domain',
  removeSuggestedTokens: 'Remove a token  from the list of suggested tokens',
  removeToken: 'Remove a token from the list of tracked tokens',
  resetAccount: 'Clears the transaction history, to allow users to force-reset their nonces',
  setAccountLabel: 'Set the label for the currently-selected account',
  setAddressBook: 'Add or update an entry in the address book',
  setCurrentAccountTab: 'Set the active tab for the currently-selected account',
  setCurrentCurrency: 'Set the currently-selected currency',
  setCurrentLocale: 'Set the current locale, affecting the language rendered',
  setCustomRpc: 'Select a custom URL for an Ethereum RPC provider',
  setFeatureFlag: 'Enable or disable a given feature-flag',
  setParticipateInMetaMetrics: 'Toggle usage data tracking with MetaMetrics',
  setPreference: 'Update a given user preference',
  setProviderType: 'Update the current provider type',
  setSeedPhraseBackedUp: 'Mark a seed phrase as backed up',
  setSelectedAddress: 'Set the currently-selected address',
  setUseBlockie: 'Toggle the Blockie identicon format',
  submitPassword: 'Submits the user password and attempts to unlock the vault. This will not be included in production.',
  unMarkPasswordForgotten: 'Allows a user to end the seed phrase recovery process',
  unlockHardwareWalletAccount: 'Imports an account from a Trezor device',
  updateAndSetCustomRpc: 'Select a custom URL for an Ethereum RPC provider and updating it',
  verifySeedPhrase: 'Verifies the validity of the current vault seed phrase',
  whitelistPhishingDomain: 'Mark a malicious-looking domain as safe',

  // Listening to events from the block tracker, transaction controller and network controller
  'tx:status-update': 'Be notified when the status of your transactions changes',
  latest: 'Be notified when the new blocks are added to the blockchain',
  networkDidChange: 'Be notified when your selected network changes',
  newUnapprovedTx: 'Be notified with details of your new transactions',
}

function getExternalRestrictedMethods (permissionsController) {
  const { assetsController } = permissionsController

  return {
    'eth_accounts': {
      description: 'View Ethereum accounts',
      method: (_, res, __, end) => {
        permissionsController.keyringController.getAccounts()
          .then((accounts) => {
            res.result = accounts
            end()
          })
          .catch((reason) => {
            res.error = reason
            end(reason)
          })
      },
    },

    'wallet_manageAssets': {
      description: 'Display custom assets in your wallet.',
      method: (req, res, _next, end, engine) => {
        const [method, opts] = req.params
        const requestor = engine.domain
        try {
          switch (method) {
            case 'addAsset':
              res.result = assetsController.addAsset(requestor, opts)
              return end()
            case 'updateAsset':
              res.result = assetsController.updateAsset(requestor, opts)
              return end()
            case 'removeAsset':
              res.result = assetsController.removeAsset(requestor, opts)
              return end()
            default:
              res.error = ethErrors.rpc.methodNotFound({
                data: `${req.method}:${method}`,
              })
              end(res.error)
          }
        } catch (err) {
          res.error = err
          end(err)
        }
      },
    },

    'alert': {
      description: 'Show alerts over the current page.',
      method: (req, res, _next, end, engine) => {
        const requestor = engine.domain
        alert(`MetaMask Notice:\n${requestor} States:\n${req.params[0]}`)
        res.result = true // JsonRpcEngine throws if no result or error
        end()
      },
    },

    'confirm': {
      description: 'Display confirmations for user action.',
      method: (req, res, _next, end, engine) => {
        const requestor = engine.domain
        res.result = confirm(`MetaMask Confirmation\n${requestor} asks:\n${req.params[0]}`)
        end()
      },
    },

    'wallet_plugin_*': {
      description: 'Connect to plugin $1, and install it if not available yet.',
      method: async (req, res, _next, end, engine) => {
        try {
          const origin = req.method.substr(14)

          const prior = permissionsController.pluginsController.get(origin)
          if (!prior) {
            await permissionsController.pluginsController.add(origin)
          }

          // Here is where we would invoke the message on that plugin iff possible.
          const handler = permissionsController.pluginsController.rpcMessageHandlers.get(origin)
          if (!handler) {
            res.error = ethErrors.methodNotFound({
              message: `Plugin RPC message handler not found.`, data: req.method,
            })
            return end(res.error)
          }

          const requestor = engine.domain

          // Handler is an async function that takes an origin string and a request object.
          // It should return the result it would like returned to the requestor as part of response.result
          res.result = await handler(requestor, req.params[0])
          return end()

        } catch (err) {
          res.error = err
          return end(err)
        }
      },
    },

  }
}

module.exports = {
  getExternalRestrictedMethods,
  pluginRestrictedMethodDescriptions,
}

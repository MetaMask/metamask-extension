import abi from 'human-standard-token-abi'
import pify from 'pify'
import getBuyEthUrl from '../../../app/scripts/lib/buy-eth-url'
import { getTokenAddressFromTokenObject, checksumAddress } from '../helpers/utils/util'
import { calcTokenBalance, estimateGas } from '../pages/send/send.utils'
import ethUtil from 'ethereumjs-util'
import { fetchLocale } from '../helpers/utils/i18n-helper'
import { getMethodDataAsync } from '../helpers/utils/transactions.util'
import { fetchSymbolAndDecimals } from '../helpers/utils/token-util'
import switchDirection from '../helpers/utils/switch-direction'
import log from 'loglevel'
import { ENVIRONMENT_TYPE_NOTIFICATION } from '../../../app/scripts/lib/enums'
import { hasUnconfirmedTransactions } from '../helpers/utils/confirm-tx.util'
import { setCustomGasLimit } from '../ducks/gas/gas.duck'
import txHelper from '../../lib/tx-helper'
import { getEnvironmentType } from '../../../app/scripts/lib/util'

export const actionConstants = {
  GO_HOME: 'GO_HOME',
  // modal state
  MODAL_OPEN: 'UI_MODAL_OPEN',
  MODAL_CLOSE: 'UI_MODAL_CLOSE',
  // notification state
  CLOSE_NOTIFICATION_WINDOW: 'CLOSE_NOTIFICATION_WINDOW',
  // sidebar state
  SIDEBAR_OPEN: 'UI_SIDEBAR_OPEN',
  SIDEBAR_CLOSE: 'UI_SIDEBAR_CLOSE',
  // alert state
  ALERT_OPEN: 'UI_ALERT_OPEN',
  ALERT_CLOSE: 'UI_ALERT_CLOSE',
  QR_CODE_DETECTED: 'UI_QR_CODE_DETECTED',
  // network dropdown open
  NETWORK_DROPDOWN_OPEN: 'UI_NETWORK_DROPDOWN_OPEN',
  NETWORK_DROPDOWN_CLOSE: 'UI_NETWORK_DROPDOWN_CLOSE',
  // transition state
  TRANSITION_FORWARD: 'TRANSITION_FORWARD',
  // remote state
  UPDATE_METAMASK_STATE: 'UPDATE_METAMASK_STATE',
  FORGOT_PASSWORD: 'FORGOT_PASSWORD',
  CLOSE_WELCOME_SCREEN: 'CLOSE_WELCOME_SCREEN',
  // unlock screen
  UNLOCK_IN_PROGRESS: 'UNLOCK_IN_PROGRESS',
  UNLOCK_FAILED: 'UNLOCK_FAILED',
  UNLOCK_SUCCEEDED: 'UNLOCK_SUCCEEDED',
  UNLOCK_METAMASK: 'UNLOCK_METAMASK',
  LOCK_METAMASK: 'LOCK_METAMASK',
  // error handling
  DISPLAY_WARNING: 'DISPLAY_WARNING',
  HIDE_WARNING: 'HIDE_WARNING',
  // accounts screen
  SET_SELECTED_TOKEN: 'SET_SELECTED_TOKEN',
  SHOW_ACCOUNT_DETAIL: 'SHOW_ACCOUNT_DETAIL',
  SHOW_ACCOUNTS_PAGE: 'SHOW_ACCOUNTS_PAGE',
  SHOW_CONF_TX_PAGE: 'SHOW_CONF_TX_PAGE',
  SET_CURRENT_FIAT: 'SET_CURRENT_FIAT',
  // account detail screen
  SHOW_SEND_TOKEN_PAGE: 'SHOW_SEND_TOKEN_PAGE',
  SHOW_PRIVATE_KEY: 'SHOW_PRIVATE_KEY',
  SET_ACCOUNT_LABEL: 'SET_ACCOUNT_LABEL',
  SET_NETWORK_NONCE: 'SET_NETWORK_NONCE',
  // tx conf screen
  COMPLETED_TX: 'COMPLETED_TX',
  TRANSACTION_ERROR: 'TRANSACTION_ERROR',
  UPDATE_TRANSACTION_PARAMS: 'UPDATE_TRANSACTION_PARAMS',
  SET_NEXT_NONCE: 'SET_NEXT_NONCE',
  // send screen
  UPDATE_GAS_LIMIT: 'UPDATE_GAS_LIMIT',
  UPDATE_GAS_PRICE: 'UPDATE_GAS_PRICE',
  UPDATE_GAS_TOTAL: 'UPDATE_GAS_TOTAL',
  UPDATE_SEND_HEX_DATA: 'UPDATE_SEND_HEX_DATA',
  UPDATE_SEND_TOKEN_BALANCE: 'UPDATE_SEND_TOKEN_BALANCE',
  UPDATE_SEND_TO: 'UPDATE_SEND_TO',
  UPDATE_SEND_AMOUNT: 'UPDATE_SEND_AMOUNT',
  UPDATE_SEND_ERRORS: 'UPDATE_SEND_ERRORS',
  UPDATE_MAX_MODE: 'UPDATE_MAX_MODE',
  UPDATE_SEND: 'UPDATE_SEND',
  CLEAR_SEND: 'CLEAR_SEND',
  GAS_LOADING_STARTED: 'GAS_LOADING_STARTED',
  GAS_LOADING_FINISHED: 'GAS_LOADING_FINISHED',
  UPDATE_SEND_ENS_RESOLUTION: 'UPDATE_SEND_ENS_RESOLUTION',
  UPDATE_SEND_ENS_RESOLUTION_ERROR: 'UPDATE_SEND_ENS_RESOLUTION_ERROR',
  // config screen
  SET_RPC_TARGET: 'SET_RPC_TARGET',
  SET_PROVIDER_TYPE: 'SET_PROVIDER_TYPE',
  SET_PREVIOUS_PROVIDER: 'SET_PREVIOUS_PROVIDER',
  UPDATE_TOKENS: 'UPDATE_TOKENS',
  SET_HARDWARE_WALLET_DEFAULT_HD_PATH: 'SET_HARDWARE_WALLET_DEFAULT_HD_PATH',
  // loading overlay
  SHOW_LOADING: 'SHOW_LOADING_INDICATION',
  HIDE_LOADING: 'HIDE_LOADING_INDICATION',
  // buy Eth with coinbase
  BUY_ETH: 'BUY_ETH',

  TOGGLE_ACCOUNT_MENU: 'TOGGLE_ACCOUNT_MENU',

  SET_USE_BLOCKIE: 'SET_USE_BLOCKIE',
  SET_USE_NONCEFIELD: 'SET_USE_NONCEFIELD',
  UPDATE_CUSTOM_NONCE: 'UPDATE_CUSTOM_NONCE',
  SET_IPFS_GATEWAY: 'SET_IPFS_GATEWAY',

  SET_PARTICIPATE_IN_METAMETRICS: 'SET_PARTICIPATE_IN_METAMETRICS',
  SET_METAMETRICS_SEND_COUNT: 'SET_METAMETRICS_SEND_COUNT',

  // locale
  SET_CURRENT_LOCALE: 'SET_CURRENT_LOCALE',

  // Feature Flags
  UPDATE_FEATURE_FLAGS: 'UPDATE_FEATURE_FLAGS',

  // Preferences
  UPDATE_PREFERENCES: 'UPDATE_PREFERENCES',

  // Onboarding
  COMPLETE_ONBOARDING: 'COMPLETE_ONBOARDING',

  SET_MOUSE_USER_STATE: 'SET_MOUSE_USER_STATE',

  // Network
  SET_PENDING_TOKENS: 'SET_PENDING_TOKENS',
  CLEAR_PENDING_TOKENS: 'CLEAR_PENDING_TOKENS',

  SET_FIRST_TIME_FLOW_TYPE: 'SET_FIRST_TIME_FLOW_TYPE',

  SET_SELECTED_SETTINGS_RPC_URL: 'SET_SELECTED_SETTINGS_RPC_URL',
  SET_NETWORKS_TAB_ADD_MODE: 'SET_NETWORKS_TAB_ADD_MODE',

  LOADING_METHOD_DATA_STARTED: 'LOADING_METHOD_DATA_STARTED',
  LOADING_METHOD_DATA_FINISHED: 'LOADING_METHOD_DATA_FINISHED',

  LOADING_TOKEN_PARAMS_STARTED: 'LOADING_TOKEN_PARAMS_STARTED',
  LOADING_TOKEN_PARAMS_FINISHED: 'LOADING_TOKEN_PARAMS_FINISHED',

  SET_REQUEST_ACCOUNT_TABS: 'SET_REQUEST_ACCOUNT_TABS',
  SET_CURRENT_WINDOW_TAB: 'SET_CURRENT_WINDOW_TAB',
  SET_OPEN_METAMASK_TAB_IDS: 'SET_OPEN_METAMASK_TAB_IDS',
}

let background = null
export function _setBackgroundConnection (backgroundConnection) {
  background = backgroundConnection
}

export function goHome () {
  return {
    type: actionConstants.GO_HOME,
  }
}

// async actions

export function tryUnlockMetamask (password) {
  return (dispatch) => {
    dispatch(showLoadingIndication())
    dispatch(unlockInProgress())
    log.debug(`background.submitPassword`)

    return new Promise((resolve, reject) => {
      background.submitPassword(password, (error) => {
        if (error) {
          return reject(error)
        }

        resolve()
      })
    })
      .then(() => {
        dispatch(unlockSucceeded())
        return forceUpdateMetamaskState(dispatch)
      })
      .then(() => {
        return new Promise((resolve, reject) => {
          background.verifySeedPhrase((err) => {
            if (err) {
              dispatch(displayWarning(err.message))
              return reject(err)
            }

            resolve()
          })
        })
      })
      .then(() => {
        dispatch(transitionForward())
        dispatch(hideLoadingIndication())
      })
      .catch((err) => {
        dispatch(unlockFailed(err.message))
        dispatch(hideLoadingIndication())
        return Promise.reject(err)
      })
  }
}

export function transitionForward () {
  return {
    type: actionConstants.TRANSITION_FORWARD,
  }
}

export function createNewVaultAndRestore (password, seed) {
  return (dispatch) => {
    dispatch(showLoadingIndication())
    log.debug(`background.createNewVaultAndRestore`)
    let vault
    return new Promise((resolve, reject) => {
      background.createNewVaultAndRestore(password, seed, (err, _vault) => {
        if (err) {
          return reject(err)
        }
        vault = _vault
        resolve()
      })
    })
      .then(() => dispatch(unMarkPasswordForgotten()))
      .then(() => {
        dispatch(showAccountsPage())
        dispatch(hideLoadingIndication())
        return vault
      })
      .catch((err) => {
        dispatch(displayWarning(err.message))
        dispatch(hideLoadingIndication())
        return Promise.reject(err)
      })
  }
}

export function createNewVaultAndGetSeedPhrase (password) {
  return async (dispatch) => {
    dispatch(showLoadingIndication())

    try {
      await createNewVault(password)
      const seedWords = await verifySeedPhrase()
      dispatch(hideLoadingIndication())
      return seedWords
    } catch (error) {
      dispatch(hideLoadingIndication())
      dispatch(displayWarning(error.message))
      throw new Error(error.message)
    }
  }
}

export function unlockAndGetSeedPhrase (password) {
  return async (dispatch) => {
    dispatch(showLoadingIndication())

    try {
      await submitPassword(password)
      const seedWords = await verifySeedPhrase()
      await forceUpdateMetamaskState(dispatch)
      dispatch(hideLoadingIndication())
      return seedWords
    } catch (error) {
      dispatch(hideLoadingIndication())
      dispatch(displayWarning(error.message))
      throw new Error(error.message)
    }
  }
}

export function submitPassword (password) {
  return new Promise((resolve, reject) => {
    background.submitPassword(password, (error) => {
      if (error) {
        return reject(error)
      }

      resolve()
    })
  })
}

export function createNewVault (password) {
  return new Promise((resolve, reject) => {
    background.createNewVaultAndKeychain(password, (error) => {
      if (error) {
        return reject(error)
      }

      resolve(true)
    })
  })
}

export function verifyPassword (password) {
  return new Promise((resolve, reject) => {
    background.submitPassword(password, (error) => {
      if (error) {
        return reject(error)
      }

      resolve(true)
    })
  })
}

export function verifySeedPhrase () {
  return new Promise((resolve, reject) => {
    background.verifySeedPhrase((error, seedWords) => {
      if (error) {
        return reject(error)
      }

      resolve(seedWords)
    })
  })
}

export function requestRevealSeedWords (password) {
  return async (dispatch) => {
    dispatch(showLoadingIndication())
    log.debug(`background.submitPassword`)

    try {
      await verifyPassword(password)
      const seedWords = await verifySeedPhrase()
      dispatch(hideLoadingIndication())
      return seedWords
    } catch (error) {
      dispatch(hideLoadingIndication())
      dispatch(displayWarning(error.message))
      throw new Error(error.message)
    }
  }
}

export function tryReverseResolveAddress (address) {
  return () => {
    return new Promise((resolve) => {
      background.tryReverseResolveAddress(address, (err) => {
        if (err) {
          log.error(err)
        }
        resolve()
      })
    })
  }
}

export function fetchInfoToSync () {
  return (dispatch) => {
    log.debug(`background.fetchInfoToSync`)
    return new Promise((resolve, reject) => {
      background.fetchInfoToSync((err, result) => {
        if (err) {
          dispatch(displayWarning(err.message))
          return reject(err)
        }
        resolve(result)
      })
    })
  }
}

export function resetAccount () {
  return (dispatch) => {
    dispatch(showLoadingIndication())

    return new Promise((resolve, reject) => {
      background.resetAccount((err, account) => {
        dispatch(hideLoadingIndication())
        if (err) {
          dispatch(displayWarning(err.message))
          return reject(err)
        }

        log.info('Transaction history reset for ' + account)
        dispatch(showAccountsPage())
        resolve(account)
      })
    })
  }
}

export function removeAccount (address) {
  return async (dispatch) => {
    dispatch(showLoadingIndication())

    try {
      await new Promise((resolve, reject) => {
        background.removeAccount(address, (error, account) => {
          if (error) {
            return reject(error)
          }
          return resolve(account)
        })
      })
      await forceUpdateMetamaskState(dispatch)
    } catch (error) {
      dispatch(displayWarning(error.message))
      throw error
    } finally {
      dispatch(hideLoadingIndication())
    }

    log.info('Account removed: ' + address)
    dispatch(showAccountsPage())
  }
}

export function addNewKeyring (type, opts) {
  return (dispatch) => {
    dispatch(showLoadingIndication())
    log.debug(`background.addNewKeyring`)
    background.addNewKeyring(type, opts, (err) => {
      dispatch(hideLoadingIndication())
      if (err) {
        return dispatch(displayWarning(err.message))
      }
      dispatch(showAccountsPage())
    })
  }
}

export function importNewAccount (strategy, args) {
  return async (dispatch) => {
    let newState
    dispatch(showLoadingIndication('This may take a while, please be patient.'))
    try {
      log.debug(`background.importAccountWithStrategy`)
      await pify(background.importAccountWithStrategy).call(background, strategy, args)
      log.debug(`background.getState`)
      newState = await pify(background.getState).call(background)
    } catch (err) {
      dispatch(hideLoadingIndication())
      dispatch(displayWarning(err.message))
      throw err
    }
    dispatch(hideLoadingIndication())
    dispatch(updateMetamaskState(newState))
    if (newState.selectedAddress) {
      dispatch({
        type: actionConstants.SHOW_ACCOUNT_DETAIL,
        value: newState.selectedAddress,
      })
    }
    return newState
  }
}

export function addNewAccount () {
  log.debug(`background.addNewAccount`)
  return (dispatch, getState) => {
    const oldIdentities = getState().metamask.identities
    dispatch(showLoadingIndication())
    return new Promise((resolve, reject) => {
      background.addNewAccount((err, { identities: newIdentities }) => {
        if (err) {
          dispatch(displayWarning(err.message))
          return reject(err)
        }
        const newAccountAddress = Object.keys(newIdentities).find((address) => !oldIdentities[address])

        dispatch(hideLoadingIndication())

        forceUpdateMetamaskState(dispatch)
        return resolve(newAccountAddress)
      })
    })
  }
}

export function checkHardwareStatus (deviceName, hdPath) {
  log.debug(`background.checkHardwareStatus`, deviceName, hdPath)
  return (dispatch) => {
    dispatch(showLoadingIndication())
    return new Promise((resolve, reject) => {
      background.checkHardwareStatus(deviceName, hdPath, (err, unlocked) => {
        if (err) {
          log.error(err)
          dispatch(displayWarning(err.message))
          return reject(err)
        }

        dispatch(hideLoadingIndication())

        forceUpdateMetamaskState(dispatch)
        return resolve(unlocked)
      })
    })
  }
}

export function forgetDevice (deviceName) {
  log.debug(`background.forgetDevice`, deviceName)
  return (dispatch) => {
    dispatch(showLoadingIndication())
    return new Promise((resolve, reject) => {
      background.forgetDevice(deviceName, (err) => {
        if (err) {
          log.error(err)
          dispatch(displayWarning(err.message))
          return reject(err)
        }

        dispatch(hideLoadingIndication())

        forceUpdateMetamaskState(dispatch)
        return resolve()
      })
    })
  }
}

export function connectHardware (deviceName, page, hdPath) {
  log.debug(`background.connectHardware`, deviceName, page, hdPath)
  return (dispatch) => {
    dispatch(showLoadingIndication())
    return new Promise((resolve, reject) => {
      background.connectHardware(deviceName, page, hdPath, (err, accounts) => {
        if (err) {
          log.error(err)
          dispatch(displayWarning(err.message))
          return reject(err)
        }

        dispatch(hideLoadingIndication())

        forceUpdateMetamaskState(dispatch)
        return resolve(accounts)
      })
    })
  }
}

export function unlockHardwareWalletAccount (index, deviceName, hdPath) {
  log.debug(`background.unlockHardwareWalletAccount`, index, deviceName, hdPath)
  return (dispatch) => {
    dispatch(showLoadingIndication())
    return new Promise((resolve, reject) => {
      background.unlockHardwareWalletAccount(index, deviceName, hdPath, (err) => {
        if (err) {
          log.error(err)
          dispatch(displayWarning(err.message))
          return reject(err)
        }

        dispatch(hideLoadingIndication())
        return resolve()
      })
    })
  }
}

export function showQrScanner () {
  return (dispatch) => {
    dispatch(showModal({
      name: 'QR_SCANNER',
    }))
  }
}

export function setCurrentCurrency (currencyCode) {
  return (dispatch) => {
    dispatch(showLoadingIndication())
    log.debug(`background.setCurrentCurrency`)
    background.setCurrentCurrency(currencyCode, (err, data) => {
      dispatch(hideLoadingIndication())
      if (err) {
        log.error(err.stack)
        return dispatch(displayWarning(err.message))
      }
      dispatch({
        type: actionConstants.SET_CURRENT_FIAT,
        value: {
          currentCurrency: data.currentCurrency,
          conversionRate: data.conversionRate,
          conversionDate: data.conversionDate,
        },
      })
    })
  }
}

export function signMsg (msgData) {
  log.debug('action - signMsg')
  return (dispatch) => {
    dispatch(showLoadingIndication())
    return new Promise((resolve, reject) => {
      log.debug(`actions calling background.signMessage`)
      background.signMessage(msgData, (err, newState) => {
        log.debug('signMessage called back')
        dispatch(updateMetamaskState(newState))
        dispatch(hideLoadingIndication())

        if (err) {
          log.error(err)
          dispatch(displayWarning(err.message))
          return reject(err)
        }

        dispatch(completedTx(msgData.metamaskId))
        dispatch(closeCurrentNotificationWindow())

        return resolve(msgData)
      })
    })
  }
}

export function signPersonalMsg (msgData) {
  log.debug('action - signPersonalMsg')
  return (dispatch) => {
    dispatch(showLoadingIndication())
    return new Promise((resolve, reject) => {
      log.debug(`actions calling background.signPersonalMessage`)
      background.signPersonalMessage(msgData, (err, newState) => {
        log.debug('signPersonalMessage called back')
        dispatch(updateMetamaskState(newState))
        dispatch(hideLoadingIndication())

        if (err) {
          log.error(err)
          dispatch(displayWarning(err.message))
          return reject(err)
        }

        dispatch(completedTx(msgData.metamaskId))
        dispatch(closeCurrentNotificationWindow())

        return resolve(msgData)
      })
    })
  }
}

export function decryptMsgInline (decryptedMsgData) {
  log.debug('action - decryptMsgInline')
  return (dispatch) => {
    return new Promise((resolve, reject) => {
      log.debug(`actions calling background.decryptMessageInline`)
      background.decryptMessageInline(decryptedMsgData, (err, newState) => {
        log.debug('decryptMsgInline called back')
        dispatch(updateMetamaskState(newState))

        if (err) {
          log.error(err)
          dispatch(displayWarning(err.message))
          return reject(err)
        }

        decryptedMsgData = newState.unapprovedDecryptMsgs[decryptedMsgData.metamaskId]
        return resolve(decryptedMsgData)
      })
    })
  }
}

export function decryptMsg (decryptedMsgData) {
  log.debug('action - decryptMsg')
  return (dispatch) => {
    dispatch(showLoadingIndication())
    return new Promise((resolve, reject) => {
      log.debug(`actions calling background.decryptMessage`)
      background.decryptMessage(decryptedMsgData, (err, newState) => {
        log.debug('decryptMsg called back')
        dispatch(updateMetamaskState(newState))
        dispatch(hideLoadingIndication())

        if (err) {
          log.error(err)
          dispatch(displayWarning(err.message))
          return reject(err)
        }

        dispatch(completedTx(decryptedMsgData.metamaskId))
        dispatch(closeCurrentNotificationWindow())
        console.log(decryptedMsgData)
        return resolve(decryptedMsgData)
      })
    })
  }
}

export function encryptionPublicKeyMsg (msgData) {
  log.debug('action - encryptionPublicKeyMsg')
  return (dispatch) => {
    dispatch(showLoadingIndication())
    return new Promise((resolve, reject) => {
      log.debug(`actions calling background.encryptionPublicKey`)
      background.encryptionPublicKey(msgData, (err, newState) => {
        log.debug('encryptionPublicKeyMsg called back')
        dispatch(updateMetamaskState(newState))
        dispatch(hideLoadingIndication())

        if (err) {
          log.error(err)
          dispatch(displayWarning(err.message))
          return reject(err)
        }

        dispatch(completedTx(msgData.metamaskId))
        dispatch(closeCurrentNotificationWindow())

        return resolve(msgData)
      })
    })
  }
}

export function signTypedMsg (msgData) {
  log.debug('action - signTypedMsg')
  return (dispatch) => {
    dispatch(showLoadingIndication())
    return new Promise((resolve, reject) => {
      log.debug(`actions calling background.signTypedMessage`)
      background.signTypedMessage(msgData, (err, newState) => {
        log.debug('signTypedMessage called back')
        dispatch(updateMetamaskState(newState))
        dispatch(hideLoadingIndication())

        if (err) {
          log.error(err)
          dispatch(displayWarning(err.message))
          return reject(err)
        }

        dispatch(completedTx(msgData.metamaskId))
        dispatch(closeCurrentNotificationWindow())

        return resolve(msgData)
      })
    })
  }
}

export function signTx (txData) {
  return (dispatch) => {
    global.ethQuery.sendTransaction(txData, (err) => {
      if (err) {
        return dispatch(displayWarning(err.message))
      }
    })
    dispatch(showConfTxPage())
  }
}

export function setGasLimit (gasLimit) {
  return {
    type: actionConstants.UPDATE_GAS_LIMIT,
    value: gasLimit,
  }
}

export function setGasPrice (gasPrice) {
  return {
    type: actionConstants.UPDATE_GAS_PRICE,
    value: gasPrice,
  }
}

export function setGasTotal (gasTotal) {
  return {
    type: actionConstants.UPDATE_GAS_TOTAL,
    value: gasTotal,
  }
}

export function updateGasData ({
  gasPrice,
  blockGasLimit,
  selectedAddress,
  selectedToken,
  to,
  value,
  data,
}) {
  return (dispatch) => {
    dispatch(gasLoadingStarted())
    return estimateGas({
      estimateGasMethod: background.estimateGas,
      blockGasLimit,
      selectedAddress,
      selectedToken,
      to,
      value,
      estimateGasPrice: gasPrice,
      data,
    })
      .then((gas) => {
        dispatch(setGasLimit(gas))
        dispatch(setCustomGasLimit(gas))
        dispatch(updateSendErrors({ gasLoadingError: null }))
        dispatch(gasLoadingFinished())
      })
      .catch((err) => {
        log.error(err)
        dispatch(updateSendErrors({ gasLoadingError: 'gasLoadingError' }))
        dispatch(gasLoadingFinished())
      })
  }
}

export function gasLoadingStarted () {
  return {
    type: actionConstants.GAS_LOADING_STARTED,
  }
}

export function gasLoadingFinished () {
  return {
    type: actionConstants.GAS_LOADING_FINISHED,
  }
}

export function updateSendTokenBalance ({
  selectedToken,
  tokenContract,
  address,
}) {
  return (dispatch) => {
    const tokenBalancePromise = tokenContract
      ? tokenContract.balanceOf(address)
      : Promise.resolve()
    return tokenBalancePromise
      .then((usersToken) => {
        if (usersToken) {
          const newTokenBalance = calcTokenBalance({ selectedToken, usersToken })
          dispatch(setSendTokenBalance(newTokenBalance))
        }
      })
      .catch((err) => {
        log.error(err)
        updateSendErrors({ tokenBalance: 'tokenBalanceError' })
      })
  }
}

export function updateSendErrors (errorObject) {
  return {
    type: actionConstants.UPDATE_SEND_ERRORS,
    value: errorObject,
  }
}

export function setSendTokenBalance (tokenBalance) {
  return {
    type: actionConstants.UPDATE_SEND_TOKEN_BALANCE,
    value: tokenBalance,
  }
}

export function updateSendHexData (value) {
  return {
    type: actionConstants.UPDATE_SEND_HEX_DATA,
    value,
  }
}

export function updateSendTo (to, nickname = '') {
  return {
    type: actionConstants.UPDATE_SEND_TO,
    value: { to, nickname },
  }
}

export function updateSendAmount (amount) {
  return {
    type: actionConstants.UPDATE_SEND_AMOUNT,
    value: amount,
  }
}

export function updateCustomNonce (value) {
  return {
    type: actionConstants.UPDATE_CUSTOM_NONCE,
    value: value,
  }
}

export function setMaxModeTo (bool) {
  return {
    type: actionConstants.UPDATE_MAX_MODE,
    value: bool,
  }
}

export function updateSend (newSend) {
  return {
    type: actionConstants.UPDATE_SEND,
    value: newSend,
  }
}

export function clearSend () {
  return {
    type: actionConstants.CLEAR_SEND,
  }
}

export function updateSendEnsResolution (ensResolution) {
  return {
    type: actionConstants.UPDATE_SEND_ENS_RESOLUTION,
    payload: ensResolution,
  }
}

export function updateSendEnsResolutionError (errorMessage) {
  return {
    type: actionConstants.UPDATE_SEND_ENS_RESOLUTION_ERROR,
    payload: errorMessage,
  }
}

export function signTokenTx (tokenAddress, toAddress, amount, txData) {
  return (dispatch) => {
    dispatch(showLoadingIndication())
    const token = global.eth.contract(abi).at(tokenAddress)
    token.transfer(toAddress, ethUtil.addHexPrefix(amount), txData)
      .catch((err) => {
        dispatch(hideLoadingIndication())
        dispatch(displayWarning(err.message))
      })
    dispatch(showConfTxPage())
  }
}

const updateMetamaskStateFromBackground = () => {
  log.debug(`background.getState`)

  return new Promise((resolve, reject) => {
    background.getState((error, newState) => {
      if (error) {
        return reject(error)
      }

      resolve(newState)
    })
  })
}

export function updateTransaction (txData) {
  return (dispatch) => {
    dispatch(showLoadingIndication())

    return new Promise((resolve, reject) => {
      background.updateTransaction(txData, (err) => {
        dispatch(updateTransactionParams(txData.id, txData.txParams))
        if (err) {
          dispatch(txError(err))
          dispatch(goHome())
          log.error(err.message)
          return reject(err)
        }

        resolve(txData)
      })
    })
      .then(() => updateMetamaskStateFromBackground())
      .then((newState) => dispatch(updateMetamaskState(newState)))
      .then(() => {
        dispatch(showConfTxPage({ id: txData.id }))
        dispatch(hideLoadingIndication())
        return txData
      })
  }
}

export function updateAndApproveTx (txData) {
  return (dispatch) => {
    dispatch(showLoadingIndication())
    return new Promise((resolve, reject) => {
      background.updateAndApproveTransaction(txData, (err) => {
        dispatch(updateTransactionParams(txData.id, txData.txParams))
        dispatch(clearSend())

        if (err) {
          dispatch(txError(err))
          dispatch(goHome())
          log.error(err.message)
          return reject(err)
        }

        resolve(txData)
      })
    })
      .then(() => updateMetamaskStateFromBackground())
      .then((newState) => dispatch(updateMetamaskState(newState)))
      .then(() => {
        dispatch(clearSend())
        dispatch(completedTx(txData.id))
        dispatch(hideLoadingIndication())
        dispatch(updateCustomNonce(''))
        dispatch(closeCurrentNotificationWindow())

        return txData
      })
      .catch((err) => {
        dispatch(hideLoadingIndication())
        return Promise.reject(err)
      })
  }
}

export function completedTx (id) {
  return (dispatch, getState) => {
    const state = getState()
    const {
      unapprovedTxs,
      unapprovedMsgs,
      unapprovedPersonalMsgs,
      unapprovedTypedMessages,
      network,
    } = state.metamask
    const unconfirmedActions = txHelper(unapprovedTxs, unapprovedMsgs, unapprovedPersonalMsgs, unapprovedTypedMessages, network)
    const otherUnconfirmedActions = unconfirmedActions.filter((tx) => tx.id !== id)
    dispatch({
      type: actionConstants.COMPLETED_TX,
      value: {
        id,
        unconfirmedActionsCount: otherUnconfirmedActions.length,
      },
    })
  }
}

export function updateTransactionParams (id, txParams) {
  return {
    type: actionConstants.UPDATE_TRANSACTION_PARAMS,
    id,
    value: txParams,
  }
}

export function txError (err) {
  return {
    type: actionConstants.TRANSACTION_ERROR,
    message: err.message,
  }
}

export function cancelMsg (msgData) {
  return (dispatch) => {
    dispatch(showLoadingIndication())
    return new Promise((resolve, reject) => {
      background.cancelMessage(msgData.id, (err, newState) => {
        dispatch(updateMetamaskState(newState))
        dispatch(hideLoadingIndication())

        if (err) {
          return reject(err)
        }

        dispatch(completedTx(msgData.id))
        dispatch(closeCurrentNotificationWindow())

        return resolve(msgData)
      })
    })
  }
}

export function cancelPersonalMsg (msgData) {
  return (dispatch) => {
    dispatch(showLoadingIndication())
    return new Promise((resolve, reject) => {
      const id = msgData.id
      background.cancelPersonalMessage(id, (err, newState) => {
        dispatch(updateMetamaskState(newState))
        dispatch(hideLoadingIndication())

        if (err) {
          return reject(err)
        }

        dispatch(completedTx(id))
        dispatch(closeCurrentNotificationWindow())

        return resolve(msgData)
      })
    })
  }
}

export function cancelDecryptMsg (msgData) {
  return (dispatch) => {
    dispatch(showLoadingIndication())
    return new Promise((resolve, reject) => {
      const id = msgData.id
      background.cancelDecryptMessage(id, (err, newState) => {
        dispatch(updateMetamaskState(newState))
        dispatch(hideLoadingIndication())

        if (err) {
          return reject(err)
        }

        dispatch(completedTx(id))
        dispatch(closeCurrentNotificationWindow())

        return resolve(msgData)
      })
    })
  }
}

export function cancelEncryptionPublicKeyMsg (msgData) {
  return (dispatch) => {
    dispatch(showLoadingIndication())
    return new Promise((resolve, reject) => {
      const id = msgData.id
      background.cancelEncryptionPublicKey(id, (err, newState) => {
        dispatch(updateMetamaskState(newState))
        dispatch(hideLoadingIndication())

        if (err) {
          return reject(err)
        }

        dispatch(completedTx(id))
        dispatch(closeCurrentNotificationWindow())

        return resolve(msgData)
      })
    })
  }
}

export function cancelTypedMsg (msgData) {
  return (dispatch) => {
    dispatch(showLoadingIndication())
    return new Promise((resolve, reject) => {
      const id = msgData.id
      background.cancelTypedMessage(id, (err, newState) => {
        dispatch(updateMetamaskState(newState))
        dispatch(hideLoadingIndication())

        if (err) {
          return reject(err)
        }

        dispatch(completedTx(id))
        dispatch(closeCurrentNotificationWindow())

        return resolve(msgData)
      })
    })
  }
}

export function cancelTx (txData) {
  return (dispatch) => {
    dispatch(showLoadingIndication())
    return new Promise((resolve, reject) => {
      background.cancelTransaction(txData.id, (err) => {
        if (err) {
          return reject(err)
        }

        resolve()
      })
    })
      .then(() => updateMetamaskStateFromBackground())
      .then((newState) => dispatch(updateMetamaskState(newState)))
      .then(() => {
        dispatch(clearSend())
        dispatch(completedTx(txData.id))
        dispatch(hideLoadingIndication())
        dispatch(closeCurrentNotificationWindow())

        return txData
      })
  }
}

/**
 * Cancels all of the given transactions
 * @param {Array<object>} txDataList - a list of tx data objects
 * @returns {function(*): Promise<void>}
 */
export function cancelTxs (txDataList) {
  return async (dispatch) => {
    dispatch(showLoadingIndication())
    const txIds = txDataList.map(({ id }) => id)
    const cancellations = txIds.map((id) => new Promise((resolve, reject) => {
      background.cancelTransaction(id, (err) => {
        if (err) {
          return reject(err)
        }

        resolve()
      })
    }))

    await Promise.all(cancellations)
    const newState = await updateMetamaskStateFromBackground()
    dispatch(updateMetamaskState(newState))
    dispatch(clearSend())

    txIds.forEach((id) => {
      dispatch(completedTx(id))
    })

    dispatch(hideLoadingIndication())

    if (getEnvironmentType() === ENVIRONMENT_TYPE_NOTIFICATION) {
      return global.platform.closeCurrentWindow()
    }
  }
}

export function markPasswordForgotten () {
  return (dispatch) => {
    return background.markPasswordForgotten(() => {
      dispatch(hideLoadingIndication())
      dispatch(forgotPassword())
      forceUpdateMetamaskState(dispatch)
    })
  }
}

export function unMarkPasswordForgotten () {
  return (dispatch) => {
    return new Promise((resolve) => {
      background.unMarkPasswordForgotten(() => {
        dispatch(forgotPassword(false))
        resolve()
      })
    })
      .then(() => forceUpdateMetamaskState(dispatch))
  }
}

export function forgotPassword (forgotPasswordState = true) {
  return {
    type: actionConstants.FORGOT_PASSWORD,
    value: forgotPasswordState,
  }
}

export function closeWelcomeScreen () {
  return {
    type: actionConstants.CLOSE_WELCOME_SCREEN,
  }
}

//
// unlock screen
//

export function unlockInProgress () {
  return {
    type: actionConstants.UNLOCK_IN_PROGRESS,
  }
}

export function unlockFailed (message) {
  return {
    type: actionConstants.UNLOCK_FAILED,
    value: message,
  }
}

export function unlockSucceeded (message) {
  return {
    type: actionConstants.UNLOCK_SUCCEEDED,
    value: message,
  }
}

export function unlockMetamask (account) {
  return {
    type: actionConstants.UNLOCK_METAMASK,
    value: account,
  }
}

export function updateMetamaskState (newState) {
  return {
    type: actionConstants.UPDATE_METAMASK_STATE,
    value: newState,
  }
}

const backgroundSetLocked = () => {
  return new Promise((resolve, reject) => {
    background.setLocked((error) => {
      if (error) {
        return reject(error)
      }
      resolve()
    })
  })
}

export function lockMetamask () {
  log.debug(`background.setLocked`)

  return (dispatch) => {
    dispatch(showLoadingIndication())

    return backgroundSetLocked()
      .then(() => updateMetamaskStateFromBackground())
      .catch((error) => {
        dispatch(displayWarning(error.message))
        return Promise.reject(error)
      })
      .then((newState) => {
        dispatch(updateMetamaskState(newState))
        dispatch(hideLoadingIndication())
        dispatch({ type: actionConstants.LOCK_METAMASK })
      })
      .catch(() => {
        dispatch(hideLoadingIndication())
        dispatch({ type: actionConstants.LOCK_METAMASK })
      })
  }
}

export function setCurrentAccountTab (newTabName) {
  log.debug(`background.setCurrentAccountTab: ${newTabName}`)
  return callBackgroundThenUpdateNoSpinner(background.setCurrentAccountTab, newTabName)
}

export function setSelectedToken (tokenAddress) {
  return {
    type: actionConstants.SET_SELECTED_TOKEN,
    value: tokenAddress || null,
  }
}

export function setSelectedAddress (address) {
  return (dispatch) => {
    dispatch(showLoadingIndication())
    log.debug(`background.setSelectedAddress`)
    background.setSelectedAddress(address, (err) => {
      dispatch(hideLoadingIndication())
      if (err) {
        return dispatch(displayWarning(err.message))
      }
    })
  }
}

export function showAccountDetail (address) {
  return (dispatch) => {
    dispatch(showLoadingIndication())
    log.debug(`background.setSelectedAddress`)
    background.setSelectedAddress(address, (err, tokens) => {
      dispatch(hideLoadingIndication())
      if (err) {
        return dispatch(displayWarning(err.message))
      }
      background.handleNewAccountSelected(origin, address)
      dispatch(updateTokens(tokens))
      dispatch({
        type: actionConstants.SHOW_ACCOUNT_DETAIL,
        value: address,
      })
      dispatch(setSelectedToken())
    })
  }
}

export function showAccountsPage () {
  return {
    type: actionConstants.SHOW_ACCOUNTS_PAGE,
  }
}

export function showConfTxPage ({ transForward = true, id } = {}) {
  return {
    type: actionConstants.SHOW_CONF_TX_PAGE,
    transForward,
    id,
  }
}

export function addToken (address, symbol, decimals, image) {
  return (dispatch) => {
    dispatch(showLoadingIndication())
    return new Promise((resolve, reject) => {
      background.addToken(address, symbol, decimals, image, (err, tokens) => {
        dispatch(hideLoadingIndication())
        if (err) {
          dispatch(displayWarning(err.message))
          return reject(err)
        }
        dispatch(updateTokens(tokens))
        resolve(tokens)
      })
    })
  }
}

export function removeToken (address) {
  return (dispatch) => {
    dispatch(showLoadingIndication())
    return new Promise((resolve, reject) => {
      background.removeToken(address, (err, tokens) => {
        dispatch(hideLoadingIndication())
        if (err) {
          dispatch(displayWarning(err.message))
          return reject(err)
        }
        dispatch(updateTokens(tokens))
        resolve(tokens)
      })
    })
  }
}

export function addTokens (tokens) {
  return (dispatch) => {
    if (Array.isArray(tokens)) {
      dispatch(setSelectedToken(getTokenAddressFromTokenObject(tokens[0])))
      return Promise.all(tokens.map(({ address, symbol, decimals }) => (
        dispatch(addToken(address, symbol, decimals))
      )))
    } else {
      dispatch(setSelectedToken(getTokenAddressFromTokenObject(tokens)))
      return Promise.all(
        Object
          .entries(tokens)
          .map(([_, { address, symbol, decimals }]) => (
            dispatch(addToken(address, symbol, decimals))
          ))
      )
    }
  }
}

export function removeSuggestedTokens () {
  return (dispatch) => {
    dispatch(showLoadingIndication())
    return new Promise((resolve) => {
      background.removeSuggestedTokens((err, suggestedTokens) => {
        dispatch(hideLoadingIndication())
        if (err) {
          dispatch(displayWarning(err.message))
        }
        dispatch(clearPendingTokens())
        if (getEnvironmentType() === ENVIRONMENT_TYPE_NOTIFICATION) {
          return global.platform.closeCurrentWindow()
        }
        resolve(suggestedTokens)
      })
    })
      .then(() => updateMetamaskStateFromBackground())
      .then((suggestedTokens) => dispatch(updateMetamaskState({ ...suggestedTokens })))
  }
}

export function addKnownMethodData (fourBytePrefix, methodData) {
  return () => {
    background.addKnownMethodData(fourBytePrefix, methodData)
  }
}

export function updateTokens (newTokens) {
  return {
    type: actionConstants.UPDATE_TOKENS,
    newTokens,
  }
}

export function clearPendingTokens () {
  return {
    type: actionConstants.CLEAR_PENDING_TOKENS,
  }
}

export function retryTransaction (txId, gasPrice) {
  log.debug(`background.retryTransaction`)
  let newTxId

  return (dispatch) => {
    return new Promise((resolve, reject) => {
      background.retryTransaction(txId, gasPrice, (err, newState) => {
        if (err) {
          dispatch(displayWarning(err.message))
          return reject(err)
        }

        const { currentNetworkTxList } = newState
        const { id } = currentNetworkTxList[currentNetworkTxList.length - 1]
        newTxId = id
        resolve(newState)
      })
    })
      .then((newState) => dispatch(updateMetamaskState(newState)))
      .then(() => newTxId)
  }
}

export function createCancelTransaction (txId, customGasPrice) {
  log.debug('background.cancelTransaction')
  let newTxId

  return (dispatch) => {
    return new Promise((resolve, reject) => {
      background.createCancelTransaction(txId, customGasPrice, (err, newState) => {
        if (err) {
          dispatch(displayWarning(err.message))
          return reject(err)
        }

        const { currentNetworkTxList } = newState
        const { id } = currentNetworkTxList[currentNetworkTxList.length - 1]
        newTxId = id
        resolve(newState)
      })
    })
      .then((newState) => dispatch(updateMetamaskState(newState)))
      .then(() => newTxId)
  }
}

export function createSpeedUpTransaction (txId, customGasPrice, customGasLimit) {
  log.debug('background.createSpeedUpTransaction')
  let newTx

  return (dispatch) => {
    return new Promise((resolve, reject) => {
      background.createSpeedUpTransaction(txId, customGasPrice, customGasLimit, (err, newState) => {
        if (err) {
          dispatch(displayWarning(err.message))
          return reject(err)
        }

        const { currentNetworkTxList } = newState
        newTx = currentNetworkTxList[currentNetworkTxList.length - 1]
        resolve(newState)
      })
    })
      .then((newState) => dispatch(updateMetamaskState(newState)))
      .then(() => newTx)
  }
}

export function createRetryTransaction (txId, customGasPrice, customGasLimit) {
  log.debug('background.createRetryTransaction')
  let newTx

  return (dispatch) => {
    return new Promise((resolve, reject) => {
      background.createSpeedUpTransaction(txId, customGasPrice, customGasLimit, (err, newState) => {
        if (err) {
          dispatch(displayWarning(err.message))
          return reject(err)
        }

        const { currentNetworkTxList } = newState
        newTx = currentNetworkTxList[currentNetworkTxList.length - 1]
        resolve(newState)
      })
    })
      .then((newState) => dispatch(updateMetamaskState(newState)))
      .then(() => newTx)
  }
}

//
// config
//

export function setProviderType (type) {
  return (dispatch, getState) => {
    const { type: currentProviderType } = getState().metamask.provider
    log.debug(`background.setProviderType`, type)
    background.setProviderType(type, (err) => {
      if (err) {
        log.error(err)
        return dispatch(displayWarning('Had a problem changing networks!'))
      }
      dispatch(setPreviousProvider(currentProviderType))
      dispatch(updateProviderType(type))
      dispatch(setSelectedToken())
    })

  }
}

export function updateProviderType (type) {
  return {
    type: actionConstants.SET_PROVIDER_TYPE,
    value: type,
  }
}

export function setPreviousProvider (type) {
  return {
    type: actionConstants.SET_PREVIOUS_PROVIDER,
    value: type,
  }
}

export function updateAndSetCustomRpc (newRpc, chainId, ticker = 'ETH', nickname, rpcPrefs) {
  return (dispatch) => {
    log.debug(`background.updateAndSetCustomRpc: ${newRpc} ${chainId} ${ticker} ${nickname}`)
    background.updateAndSetCustomRpc(newRpc, chainId, ticker, nickname || newRpc, rpcPrefs, (err) => {
      if (err) {
        log.error(err)
        return dispatch(displayWarning('Had a problem changing networks!'))
      }
      dispatch({
        type: actionConstants.SET_RPC_TARGET,
        value: newRpc,
      })
    })
  }
}

export function editRpc (oldRpc, newRpc, chainId, ticker = 'ETH', nickname, rpcPrefs) {
  return (dispatch) => {
    log.debug(`background.delRpcTarget: ${oldRpc}`)
    background.delCustomRpc(oldRpc, (err) => {
      if (err) {
        log.error(err)
        return dispatch(displayWarning('Had a problem removing network!'))
      }
      dispatch(setSelectedToken())
      background.updateAndSetCustomRpc(newRpc, chainId, ticker, nickname || newRpc, rpcPrefs, (err) => {
        if (err) {
          log.error(err)
          return dispatch(displayWarning('Had a problem changing networks!'))
        }
        dispatch({
          type: actionConstants.SET_RPC_TARGET,
          value: newRpc,
        })
      })
    })
  }
}

export function setRpcTarget (newRpc, chainId, ticker = 'ETH', nickname) {
  return (dispatch) => {
    log.debug(`background.setRpcTarget: ${newRpc} ${chainId} ${ticker} ${nickname}`)
    background.setCustomRpc(newRpc, chainId, ticker, nickname || newRpc, (err) => {
      if (err) {
        log.error(err)
        return dispatch(displayWarning('Had a problem changing networks!'))
      }
      dispatch(setSelectedToken())
    })
  }
}

export function delRpcTarget (oldRpc) {
  return (dispatch) => {
    log.debug(`background.delRpcTarget: ${oldRpc}`)
    return new Promise((resolve, reject) => {
      background.delCustomRpc(oldRpc, (err) => {
        if (err) {
          log.error(err)
          dispatch(displayWarning('Had a problem removing network!'))
          return reject(err)
        }
        dispatch(setSelectedToken())
        resolve()
      })
    })
  }
}

// Calls the addressBookController to add a new address.
export function addToAddressBook (recipient, nickname = '', memo = '') {
  log.debug(`background.addToAddressBook`)

  return (dispatch, getState) => {
    const chainId = getState().metamask.network
    background.setAddressBook(checksumAddress(recipient), nickname, chainId, memo, (err, set) => {
      if (err) {
        log.error(err)
        dispatch(displayWarning('Address book failed to update'))
        throw err
      }
      if (!set) {
        return dispatch(displayWarning('Address book failed to update'))
      }
    })

  }
}

/**
 * @description Calls the addressBookController to remove an existing address.
 * @param {string} addressToRemove - Address of the entry to remove from the address book
 */
export function removeFromAddressBook (chainId, addressToRemove) {
  log.debug(`background.removeFromAddressBook`)

  return () => {
    background.removeFromAddressBook(chainId, checksumAddress(addressToRemove))
  }
}

export function useEtherscanProvider () {
  log.debug(`background.useEtherscanProvider`)
  background.useEtherscanProvider()
  return {
    type: actionConstants.USE_ETHERSCAN_PROVIDER,
  }
}

export function showNetworkDropdown () {
  return {
    type: actionConstants.NETWORK_DROPDOWN_OPEN,
  }
}

export function hideNetworkDropdown () {
  return {
    type: actionConstants.NETWORK_DROPDOWN_CLOSE,
  }
}


export function showModal (payload) {
  return {
    type: actionConstants.MODAL_OPEN,
    payload,
  }
}

export function hideModal (payload) {
  return {
    type: actionConstants.MODAL_CLOSE,
    payload,
  }
}

export function closeCurrentNotificationWindow () {
  return (dispatch, getState) => {
    if (getEnvironmentType() === ENVIRONMENT_TYPE_NOTIFICATION &&
      !hasUnconfirmedTransactions(getState())) {
      global.platform.closeCurrentWindow()

      dispatch(closeNotifacationWindow())
    }
  }
}

export function closeNotifacationWindow () {
  return {
    type: actionConstants.CLOSE_NOTIFICATION_WINDOW,
  }
}

export function showSidebar ({ transitionName, type, props }) {
  return {
    type: actionConstants.SIDEBAR_OPEN,
    value: {
      transitionName,
      type,
      props,
    },
  }
}

export function hideSidebar () {
  return {
    type: actionConstants.SIDEBAR_CLOSE,
  }
}

export function showAlert (msg) {
  return {
    type: actionConstants.ALERT_OPEN,
    value: msg,
  }
}

export function hideAlert () {
  return {
    type: actionConstants.ALERT_CLOSE,
  }
}

/**
 * This action will receive two types of values via qrCodeData
 * an object with the following structure {type, values}
 * or null (used to clear the previous value)
 */
export function qrCodeDetected (qrCodeData) {
  return {
    type: actionConstants.QR_CODE_DETECTED,
    value: qrCodeData,
  }
}

export function showLoadingIndication (message) {
  return {
    type: actionConstants.SHOW_LOADING,
    value: message,
  }
}

export function setHardwareWalletDefaultHdPath ({ device, path }) {
  return {
    type: actionConstants.SET_HARDWARE_WALLET_DEFAULT_HD_PATH,
    value: { device, path },
  }
}

export function hideLoadingIndication () {
  return {
    type: actionConstants.HIDE_LOADING,
  }
}

export function displayWarning (text) {
  return {
    type: actionConstants.DISPLAY_WARNING,
    value: text,
  }
}

export function hideWarning () {
  return {
    type: actionConstants.HIDE_WARNING,
  }
}

export function exportAccount (password, address) {
  return function (dispatch) {
    dispatch(showLoadingIndication())

    log.debug(`background.submitPassword`)
    return new Promise((resolve, reject) => {
      background.submitPassword(password, function (err) {
        if (err) {
          log.error('Error in submiting password.')
          dispatch(hideLoadingIndication())
          dispatch(displayWarning('Incorrect Password.'))
          return reject(err)
        }
        log.debug(`background.exportAccount`)
        return background.exportAccount(address, function (err, result) {
          dispatch(hideLoadingIndication())

          if (err) {
            log.error(err)
            dispatch(displayWarning('Had a problem exporting the account.'))
            return reject(err)
          }

          dispatch(showPrivateKey(result))

          return resolve(result)
        })
      })
    })
  }
}

export function showPrivateKey (key) {
  return {
    type: actionConstants.SHOW_PRIVATE_KEY,
    value: key,
  }
}

export function setAccountLabel (account, label) {
  return (dispatch) => {
    dispatch(showLoadingIndication())
    log.debug(`background.setAccountLabel`)

    return new Promise((resolve, reject) => {
      background.setAccountLabel(account, label, (err) => {
        dispatch(hideLoadingIndication())

        if (err) {
          dispatch(displayWarning(err.message))
          return reject(err)
        }

        dispatch({
          type: actionConstants.SET_ACCOUNT_LABEL,
          value: { account, label },
        })

        resolve(account)
      })
    })
  }
}

export function showSendTokenPage () {
  return {
    type: actionConstants.SHOW_SEND_TOKEN_PAGE,
  }
}

export function buyEth (opts) {
  return (dispatch) => {
    const url = getBuyEthUrl(opts)
    global.platform.openWindow({ url })
    dispatch({
      type: actionConstants.BUY_ETH,
    })
  }
}

export function setFeatureFlag (feature, activated, notificationType) {
  return (dispatch) => {
    dispatch(showLoadingIndication())
    return new Promise((resolve, reject) => {
      background.setFeatureFlag(feature, activated, (err, updatedFeatureFlags) => {
        dispatch(hideLoadingIndication())
        if (err) {
          dispatch(displayWarning(err.message))
          return reject(err)
        }
        dispatch(updateFeatureFlags(updatedFeatureFlags))
        notificationType && dispatch(showModal({ name: notificationType }))
        resolve(updatedFeatureFlags)
      })
    })
  }
}

export function updateFeatureFlags (updatedFeatureFlags) {
  return {
    type: actionConstants.UPDATE_FEATURE_FLAGS,
    value: updatedFeatureFlags,
  }
}

export function setPreference (preference, value) {
  return (dispatch) => {
    dispatch(showLoadingIndication())
    return new Promise((resolve, reject) => {
      background.setPreference(preference, value, (err, updatedPreferences) => {
        dispatch(hideLoadingIndication())

        if (err) {
          dispatch(displayWarning(err.message))
          return reject(err)
        }

        dispatch(updatePreferences(updatedPreferences))
        resolve(updatedPreferences)
      })
    })
  }
}

export function updatePreferences (value) {
  return {
    type: actionConstants.UPDATE_PREFERENCES,
    value,
  }
}

export function setUseNativeCurrencyAsPrimaryCurrencyPreference (value) {
  return setPreference('useNativeCurrencyAsPrimaryCurrency', value)
}

export function setShowFiatConversionOnTestnetsPreference (value) {
  return setPreference('showFiatInTestnets', value)
}

export function setAutoLockTimeLimit (value) {
  return setPreference('autoLockTimeLimit', value)
}

export function setCompletedOnboarding () {
  return async (dispatch) => {
    dispatch(showLoadingIndication())

    try {
      await pify(background.completeOnboarding).call(background)
    } catch (err) {
      dispatch(displayWarning(err.message))
      throw err
    }

    dispatch(completeOnboarding())
    dispatch(hideLoadingIndication())
  }
}

export function completeOnboarding () {
  return {
    type: actionConstants.COMPLETE_ONBOARDING,
  }
}

export function setNetworkNonce (networkNonce) {
  return {
    type: actionConstants.SET_NETWORK_NONCE,
    value: networkNonce,
  }
}

export function updateNetworkNonce (address) {
  return (dispatch) => {
    return new Promise((resolve, reject) => {
      global.ethQuery.getTransactionCount(address, (err, data) => {
        if (err) {
          dispatch(displayWarning(err.message))
          return reject(err)
        }
        dispatch(setNetworkNonce(data))
        resolve(data)
      })
    })
  }
}

export function setMouseUserState (isMouseUser) {
  return {
    type: actionConstants.SET_MOUSE_USER_STATE,
    value: isMouseUser,
  }
}

// Call Background Then Update
//
// A function generator for a common pattern wherein:
// We show loading indication.
// We call a background method.
// We hide loading indication.
// If it errored, we show a warning.
// If it didn't, we update the state.
export function callBackgroundThenUpdateNoSpinner (method, ...args) {
  return (dispatch) => {
    method.call(background, ...args, (err) => {
      if (err) {
        return dispatch(displayWarning(err.message))
      }
      forceUpdateMetamaskState(dispatch)
    })
  }
}

export function forceUpdateMetamaskState (dispatch) {
  log.debug(`background.getState`)
  return new Promise((resolve, reject) => {
    background.getState((err, newState) => {
      if (err) {
        dispatch(displayWarning(err.message))
        return reject(err)
      }

      dispatch(updateMetamaskState(newState))
      resolve(newState)
    })
  })
}

export function toggleAccountMenu () {
  return {
    type: actionConstants.TOGGLE_ACCOUNT_MENU,
  }
}

export function setParticipateInMetaMetrics (val) {
  return (dispatch) => {
    log.debug(`background.setParticipateInMetaMetrics`)
    return new Promise((resolve, reject) => {
      background.setParticipateInMetaMetrics(val, (err, metaMetricsId) => {
        log.debug(err)
        if (err) {
          dispatch(displayWarning(err.message))
          return reject(err)
        }

        dispatch({
          type: actionConstants.SET_PARTICIPATE_IN_METAMETRICS,
          value: val,
        })

        resolve([val, metaMetricsId])
      })
    })
  }
}

export function setMetaMetricsSendCount (val) {
  return (dispatch) => {
    log.debug(`background.setMetaMetricsSendCount`)
    return new Promise((resolve, reject) => {
      background.setMetaMetricsSendCount(val, (err) => {
        if (err) {
          dispatch(displayWarning(err.message))
          return reject(err)
        }

        dispatch({
          type: actionConstants.SET_METAMETRICS_SEND_COUNT,
          value: val,
        })

        resolve(val)
      })
    })
  }
}

export function setUseBlockie (val) {
  return (dispatch) => {
    dispatch(showLoadingIndication())
    log.debug(`background.setUseBlockie`)
    background.setUseBlockie(val, (err) => {
      dispatch(hideLoadingIndication())
      if (err) {
        return dispatch(displayWarning(err.message))
      }
    })
    dispatch({
      type: actionConstants.SET_USE_BLOCKIE,
      value: val,
    })
  }
}

export function setUseNonceField (val) {
  return (dispatch) => {
    dispatch(showLoadingIndication())
    log.debug(`background.setUseNonceField`)
    background.setUseNonceField(val, (err) => {
      dispatch(hideLoadingIndication())
      if (err) {
        return dispatch(displayWarning(err.message))
      }
    })
    dispatch({
      type: actionConstants.SET_USE_NONCEFIELD,
      value: val,
    })
  }
}

export function setUsePhishDetect (val) {
  return (dispatch) => {
    dispatch(showLoadingIndication())
    log.debug(`background.setUsePhishDetect`)
    background.setUsePhishDetect(val, (err) => {
      dispatch(hideLoadingIndication())
      if (err) {
        return dispatch(displayWarning(err.message))
      }
    })
  }
}

export function setIpfsGateway (val) {
  return (dispatch) => {
    dispatch(showLoadingIndication())
    log.debug(`background.setIpfsGateway`)
    background.setIpfsGateway(val, (err) => {
      dispatch(hideLoadingIndication())
      if (err) {
        return dispatch(displayWarning(err.message))
      } else {
        dispatch({
          type: actionConstants.SET_IPFS_GATEWAY,
          value: val,
        })
      }
    })
  }
}

export function updateCurrentLocale (key) {
  return (dispatch) => {
    dispatch(showLoadingIndication())
    return fetchLocale(key)
      .then((localeMessages) => {
        log.debug(`background.setCurrentLocale`)
        background.setCurrentLocale(key, (err, textDirection) => {
          if (err) {
            dispatch(hideLoadingIndication())
            return dispatch(displayWarning(err.message))
          }
          switchDirection(textDirection)
          dispatch(setCurrentLocale(key, localeMessages))
          dispatch(hideLoadingIndication())
        })
      })
  }
}

export function setCurrentLocale (locale, messages) {
  return {
    type: actionConstants.SET_CURRENT_LOCALE,
    value: {
      locale,
      messages,
    },
  }
}

export function setPendingTokens (pendingTokens) {
  const { customToken = {}, selectedTokens = {} } = pendingTokens
  const { address, symbol, decimals } = customToken
  const tokens = address && symbol && decimals
    ? { ...selectedTokens, [address]: { ...customToken, isCustom: true } }
    : selectedTokens

  return {
    type: actionConstants.SET_PENDING_TOKENS,
    payload: tokens,
  }
}

// Permissions

/**
 * Approves the permissions request.
 * @param {Object} request - The permissions request to approve
 * @param {string[]} accounts - The accounts to expose, if any.
 */
export function approvePermissionsRequest (request, accounts) {
  return () => {
    background.approvePermissionsRequest(request, accounts)
  }
}

/**
 * Rejects the permissions request with the given ID.
 * @param {string} requestId - The id of the request to be rejected
 */
export function rejectPermissionsRequest (requestId) {
  return (dispatch) => {
    return new Promise((resolve, reject) => {
      background.rejectPermissionsRequest(requestId, (err) => {
        if (err) {
          dispatch(displayWarning(err.message))
          reject()
        }
        resolve()
      })
    })
  }
}

/**
 * Exposes the given account(s) to the given origin.
 * Call ONLY as a result of direct user action.
 */
export function legacyExposeAccounts (origin, accounts) {
  return () => {
    return background.legacyExposeAccounts(origin, accounts)
  }
}

/**
 * Clears the given permissions for the given origin.
 */
export function removePermissionsFor (domains) {
  return () => {
    background.removePermissionsFor(domains)
  }
}

/**
 * Clears all permissions for all domains.
 */
export function clearPermissions () {
  return () => {
    background.clearPermissions()
  }
}

export function setFirstTimeFlowType (type) {
  return (dispatch) => {
    log.debug(`background.setFirstTimeFlowType`)
    background.setFirstTimeFlowType(type, (err) => {
      if (err) {
        return dispatch(displayWarning(err.message))
      }
    })
    dispatch({
      type: actionConstants.SET_FIRST_TIME_FLOW_TYPE,
      value: type,
    })
  }
}

export function setSelectedSettingsRpcUrl (newRpcUrl) {
  return {
    type: actionConstants.SET_SELECTED_SETTINGS_RPC_URL,
    value: newRpcUrl,
  }
}

export function setNetworksTabAddMode (isInAddMode) {
  return {
    type: actionConstants.SET_NETWORKS_TAB_ADD_MODE,
    value: isInAddMode,
  }
}

export function setLastActiveTime () {
  return (dispatch) => {
    background.setLastActiveTime((err) => {
      if (err) {
        return dispatch(displayWarning(err.message))
      }
    })
  }
}

export function setMkrMigrationReminderTimestamp (timestamp) {
  return (dispatch) => {
    background.setMkrMigrationReminderTimestamp(timestamp, (err) => {
      if (err) {
        return dispatch(displayWarning(err.message))
      }
    })
  }
}

export function loadingMethoDataStarted () {
  return {
    type: actionConstants.LOADING_METHOD_DATA_STARTED,
  }
}

export function loadingMethoDataFinished () {
  return {
    type: actionConstants.LOADING_METHOD_DATA_FINISHED,
  }
}

export function getContractMethodData (data = '') {
  return (dispatch, getState) => {
    const prefixedData = ethUtil.addHexPrefix(data)
    const fourBytePrefix = prefixedData.slice(0, 10)
    const { knownMethodData } = getState().metamask
    if (knownMethodData && knownMethodData[fourBytePrefix]) {
      return Promise.resolve(knownMethodData[fourBytePrefix])
    }

    dispatch(loadingMethoDataStarted())
    log.debug(`loadingMethodData`)

    return getMethodDataAsync(fourBytePrefix)
      .then(({ name, params }) => {
        dispatch(loadingMethoDataFinished())

        background.addKnownMethodData(fourBytePrefix, { name, params })

        return { name, params }
      })
  }
}

export function loadingTokenParamsStarted () {
  return {
    type: actionConstants.LOADING_TOKEN_PARAMS_STARTED,
  }
}

export function loadingTokenParamsFinished () {
  return {
    type: actionConstants.LOADING_TOKEN_PARAMS_FINISHED,
  }
}

export function getTokenParams (tokenAddress) {
  return (dispatch, getState) => {
    const existingTokens = getState().metamask.tokens
    const existingToken = existingTokens.find(({ address }) => tokenAddress === address)

    if (existingToken) {
      return Promise.resolve({
        symbol: existingToken.symbol,
        decimals: existingToken.decimals,
      })
    }

    dispatch(loadingTokenParamsStarted())
    log.debug(`loadingTokenParams`)


    return fetchSymbolAndDecimals(tokenAddress, existingTokens)
      .then(({ symbol, decimals }) => {
        dispatch(addToken(tokenAddress, symbol, decimals))
        dispatch(loadingTokenParamsFinished())
      })
  }
}

export function setSeedPhraseBackedUp (seedPhraseBackupState) {
  return (dispatch) => {
    log.debug(`background.setSeedPhraseBackedUp`)
    return new Promise((resolve, reject) => {
      background.setSeedPhraseBackedUp(seedPhraseBackupState, (err) => {
        if (err) {
          dispatch(displayWarning(err.message))
          return reject(err)
        }
        return forceUpdateMetamaskState(dispatch)
          .then(resolve)
          .catch(reject)
      })
    })
  }
}

export function hideSeedPhraseBackupAfterOnboarding () {
  return {
    type: actionConstants.HIDE_SEED_PHRASE_BACKUP_AFTER_ONBOARDING,
  }
}

export function initializeThreeBox () {
  return (dispatch) => {
    return new Promise((resolve, reject) => {
      background.initializeThreeBox((err) => {
        if (err) {
          dispatch(displayWarning(err.message))
          return reject(err)
        }
        resolve()
      })
    })
  }
}

export function setShowRestorePromptToFalse () {
  return (dispatch) => {
    return new Promise((resolve, reject) => {
      background.setShowRestorePromptToFalse((err) => {
        if (err) {
          dispatch(displayWarning(err.message))
          return reject(err)
        }
        resolve()
      })
    })
  }
}

export function turnThreeBoxSyncingOn () {
  return (dispatch) => {
    return new Promise((resolve, reject) => {
      background.turnThreeBoxSyncingOn((err) => {
        if (err) {
          dispatch(displayWarning(err.message))
          return reject(err)
        }
        resolve()
      })
    })
  }
}

export function restoreFromThreeBox (accountAddress) {
  return (dispatch) => {
    return new Promise((resolve, reject) => {
      background.restoreFromThreeBox(accountAddress, (err) => {
        if (err) {
          dispatch(displayWarning(err.message))
          return reject(err)
        }
        resolve()
      })
    })
  }
}

export function getThreeBoxLastUpdated () {
  return (dispatch) => {
    return new Promise((resolve, reject) => {
      background.getThreeBoxLastUpdated((err, lastUpdated) => {
        if (err) {
          dispatch(displayWarning(err.message))
          return reject(err)
        }
        resolve(lastUpdated)
      })
    })
  }
}

export function setThreeBoxSyncingPermission (threeBoxSyncingAllowed) {
  return (dispatch) => {
    return new Promise((resolve, reject) => {
      background.setThreeBoxSyncingPermission(threeBoxSyncingAllowed, (err) => {
        if (err) {
          dispatch(displayWarning(err.message))
          return reject(err)
        }
        resolve()
      })
    })
  }
}

export function turnThreeBoxSyncingOnAndInitialize () {
  return async (dispatch) => {
    await dispatch(setThreeBoxSyncingPermission(true))
    await dispatch(turnThreeBoxSyncingOn())
    await dispatch(initializeThreeBox(true))
  }
}

export function setNextNonce (nextNonce) {
  return {
    type: actionConstants.SET_NEXT_NONCE,
    value: nextNonce,
  }
}

export function getNextNonce () {
  return (dispatch, getState) => {
    const address = getState().metamask.selectedAddress
    return new Promise((resolve, reject) => {
      background.getNextNonce(address, (err, nextNonce) => {
        if (err) {
          dispatch(displayWarning(err.message))
          return reject(err)
        }
        dispatch(setNextNonce(nextNonce))
        resolve(nextNonce)
      })
    })
  }
}

export function setRequestAccountTabIds (requestAccountTabIds) {
  return {
    type: actionConstants.SET_REQUEST_ACCOUNT_TABS,
    value: requestAccountTabIds,
  }
}

export function getRequestAccountTabIds () {
  return async (dispatch) => {
    const requestAccountTabIds = await pify(background.getRequestAccountTabIds).call(background)
    dispatch(setRequestAccountTabIds(requestAccountTabIds))
  }
}

export function setOpenMetamaskTabsIDs (openMetaMaskTabIDs) {
  return {
    type: actionConstants.SET_OPEN_METAMASK_TAB_IDS,
    value: openMetaMaskTabIDs,
  }
}

export function getOpenMetamaskTabsIds () {
  return async (dispatch) => {
    const openMetaMaskTabIDs = await pify(background.getOpenMetamaskTabsIds).call(background)
    dispatch(setOpenMetamaskTabsIDs(openMetaMaskTabIDs))
  }
}

export function setCurrentWindowTab (currentWindowTab) {
  return {
    type: actionConstants.SET_CURRENT_WINDOW_TAB,
    value: currentWindowTab,
  }
}


export function getCurrentWindowTab () {
  return async (dispatch) => {
    const currentWindowTab = await global.platform.currentTab()
    dispatch(setCurrentWindowTab(currentWindowTab))
  }
}

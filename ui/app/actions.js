var actions = {
  GO_HOME: 'GO_HOME',
  goHome: goHome,
  // menu state
  TOGGLE_MENU: 'TOGGLE_MENU',
  toggleMenu: toggleMenu,
  SET_MENU_STATE: 'SET_MENU_STATE',
  closeMenu: closeMenu,
  // remote state
  UPDATE_METAMASK_STATE: 'UPDATE_METAMASK_STATE',
  updateMetamaskState: updateMetamaskState,
  // intialize screen
  CREATE_NEW_VAULT_IN_PROGRESS: 'CREATE_NEW_VAULT_IN_PROGRESS',
  SHOW_CREATE_VAULT: 'SHOW_CREATE_VAULT',
  SHOW_RESTORE_VAULT: 'SHOW_RESTORE_VAULT',
  SHOW_INIT_MENU: 'SHOW_INIT_MENU',
  SHOW_NEW_VAULT_SEED: 'SHOW_NEW_VAULT_SEED',
  SHOW_INFO_PAGE: 'SHOW_INFO_PAGE',
  RECOVER_FROM_SEED: 'RECOVER_FROM_SEED',
  CLEAR_SEED_WORD_CACHE: 'CLEAR_SEED_WORD_CACHE',
  clearSeedWordCache: clearSeedWordCache,
  recoverFromSeed: recoverFromSeed,
  unlockMetamask: unlockMetamask,
  unlockFailed: unlockFailed,
  showCreateVault: showCreateVault,
  showRestoreVault: showRestoreVault,
  showInitializeMenu: showInitializeMenu,
  createNewVault: createNewVault,
  createNewVaultInProgress: createNewVaultInProgress,
  showNewVaultSeed: showNewVaultSeed,
  showInfoPage: showInfoPage,
  // unlock screen
  UNLOCK_IN_PROGRESS: 'UNLOCK_IN_PROGRESS',
  UNLOCK_FAILED: 'UNLOCK_FAILED',
  UNLOCK_METAMASK: 'UNLOCK_METAMASK',
  LOCK_METAMASK: 'LOCK_METAMASK',
  tryUnlockMetamask: tryUnlockMetamask,
  lockMetamask: lockMetamask,
  unlockInProgress: unlockInProgress,
  // error handling
  displayWarning: displayWarning,
  DISPLAY_WARNING: 'DISPLAY_WARNING',
  HIDE_WARNING: 'HIDE_WARNING',
  hideWarning: hideWarning,
  // accounts screen
  SET_SELECTED_ACCOUNT: 'SET_SELECTED_ACCOUNT',
  SHOW_ACCOUNT_DETAIL: 'SHOW_ACCOUNT_DETAIL',
  SHOW_ACCOUNTS_PAGE: 'SHOW_ACCOUNTS_PAGE',
  SHOW_CONF_TX_PAGE: 'SHOW_CONF_TX_PAGE',
  SHOW_CONF_MSG_PAGE: 'SHOW_CONF_MSG_PAGE',
  REVEAL_ACCOUNT: 'REVEAL_ACCOUNT',
  revealAccount: revealAccount,
  // account detail screen
  SHOW_SEND_PAGE: 'SHOW_SEND_PAGE',
  showSendPage: showSendPage,
  REQUEST_ACCOUNT_EXPORT: 'REQUEST_ACCOUNT_EXPORT',
  requestExportAccount: requestExportAccount,
  EXPORT_ACCOUNT: 'EXPORT_ACCOUNT',
  exportAccount: exportAccount,
  SHOW_PRIVATE_KEY: 'SHOW_PRIVATE_KEY',
  showPrivateKey: showPrivateKey,
  // tx conf screen
  COMPLETED_TX: 'COMPLETED_TX',
  TRANSACTION_ERROR: 'TRANSACTION_ERROR',
  NEXT_TX: 'NEXT_TX',
  PREVIOUS_TX: 'PREV_TX',
  setSelectedAddress: setSelectedAddress,
  signMsg: signMsg,
  cancelMsg: cancelMsg,
  sendTx: sendTx,
  signTx: signTx,
  cancelTx: cancelTx,
  completedTx: completedTx,
  txError: txError,
  nextTx: nextTx,
  previousTx: previousTx,
  // app messages
  showAccountDetail: showAccountDetail,
  BACK_TO_ACCOUNT_DETAIL: 'BACK_TO_ACCOUNT_DETAIL',
  backToAccountDetail: backToAccountDetail,
  showAccountsPage: showAccountsPage,
  showConfTxPage: showConfTxPage,
  confirmSeedWords: confirmSeedWords,
  // config screen
  SHOW_CONFIG_PAGE: 'SHOW_CONFIG_PAGE',
  SET_RPC_TARGET: 'SET_RPC_TARGET',
  SET_PROVIDER_TYPE: 'SET_PROVIDER_TYPE',
  USE_ETHERSCAN_PROVIDER: 'USE_ETHERSCAN_PROVIDER',
  useEtherscanProvider: useEtherscanProvider,
  showConfigPage: showConfigPage,
  setRpcTarget: setRpcTarget,
  setProviderType: setProviderType,
  // hacky - need a way to get a reference to account manager
  _setAccountManager: _setAccountManager,
  // loading overlay
  SHOW_LOADING: 'SHOW_LOADING_INDICATION',
  HIDE_LOADING: 'HIDE_LOADING_INDICATION',
  showLoadingIndication: showLoadingIndication,
  hideLoadingIndication: hideLoadingIndication,
}

module.exports = actions

var _accountManager = null
function _setAccountManager(accountManager){
  _accountManager = accountManager
}

function goHome() {
  return {
    type: this.GO_HOME,
  }
}

// menu state

function toggleMenu() {
  return {
    type: this.TOGGLE_MENU,
  }
}

function closeMenu() {
  return {
    type: this.SET_MENU_STATE,
    value: false,
  }
}

// async actions

function tryUnlockMetamask(password) {
  return (dispatch) => {
    dispatch(this.unlockInProgress())
    _accountManager.submitPassword(password, (err, selectedAccount) => {
      if (err) {
        dispatch(this.unlockFailed())
      } else {
        dispatch(this.unlockMetamask(selectedAccount))
      }
    })
  }
}

function createNewVault(password, entropy) {
  return (dispatch) => {
    dispatch(this.createNewVaultInProgress())
    _accountManager.createNewVault(password, entropy, (err, result) => {
      dispatch(this.showNewVaultSeed(result))
    })
  }
}

function recoverFromSeed(password, seed) {
  return (dispatch) => {
    // dispatch(this.createNewVaultInProgress())
    dispatch(this.showLoadingIndication())
    _accountManager.recoverFromSeed(password, seed, (err, metamaskState) => {
      dispatch(this.hideLoadingIndication())
      if (err) return dispatch(this.displayWarning(err.message))

      var account = Object.keys(metamaskState.identities)[0]
      dispatch(this.unlockMetamask(account))
   })
  }
}

function showInfoPage() {
  return {
    type: this.SHOW_INFO_PAGE,
  }
}

function setSelectedAddress(address) {
  return (dispatch) => {
    _accountManager.setSelectedAddress(address)
  }
}

function revealAccount() {
  return (dispatch) => {
    dispatch(this.showLoadingIndication())
    _accountManager.revealAccount((err) => {
      dispatch(this.hideLoadingIndication())
      if (err) return dispatch(this.displayWarning(err.message))
      dispatch({
        type: this.REVEAL_ACCOUNT,
      })
    })
  }
}

function signMsg(msgData) {
  return (dispatch) => {
    dispatch(this.showLoadingIndication())

    _accountManager.signMessage(msgData, (err) => {
      dispatch(this.hideLoadingIndication())

      if (err) return dispatch(this.displayWarning(err.message))
      dispatch(this.completedTx(msgData.metamaskId))
    })
  }
}

function signTx(txData) {
  return (dispatch) => {
    dispatch(this.showLoadingIndication())

    web3.eth.sendTransaction(txData, (err, data) => {
      dispatch(this.hideLoadingIndication())

      if (err) return dispatch(this.displayWarning(err.message))
      dispatch(this.hideWarning())
      dispatch(this.goHome())
    })
  }
}

function sendTx(txData) {
  return (dispatch) => {
    _accountManager.approveTransaction(txData.id, (err) => {
      if (err) {
        alert(err.message)
        dispatch(this.txError(err))
        return console.error(err.message)
      }
      dispatch(this.completedTx(txData.id))
    })
  }
}

function completedTx(id) {
  return {
    type: this.COMPLETED_TX,
    id,
  }
}

function txError(err) {
  return {
    type: this.TRANSACTION_ERROR,
    message: err.message,
  }
}

function cancelMsg(msgData){
  _accountManager.cancelMessage(msgData.id)
  return this.completedTx(msgData.id)
}

function cancelTx(txData){
  _accountManager.cancelTransaction(txData.id)
  return this.completedTx(txData.id)
}

//
// initialize screen
//


function showCreateVault() {
  return {
    type: this.SHOW_CREATE_VAULT,
  }
}

function showRestoreVault() {
  return {
    type: this.SHOW_RESTORE_VAULT,
  }
}

function showInitializeMenu() {
  return {
    type: this.SHOW_INIT_MENU,
  }
}

function createNewVaultInProgress() {
  return {
    type: this.CREATE_NEW_VAULT_IN_PROGRESS,
  }
}

function showNewVaultSeed(seed) {
  return {
    type: this.SHOW_NEW_VAULT_SEED,
    value: seed,
  }
}

//
// unlock screen
//

function unlockInProgress() {
  return {
    type: this.UNLOCK_IN_PROGRESS,
  }
}

function unlockFailed() {
  return {
    type: this.UNLOCK_FAILED,
  }
}

function unlockMetamask(account) {
  return {
    type: this.UNLOCK_METAMASK,
    value: account,
  }
}

function updateMetamaskState(newState) {
  return {
    type: this.UPDATE_METAMASK_STATE,
    value: newState,
  }
}

function lockMetamask() {
  return (dispatch) => {
    _accountManager.setLocked((err) => {
      dispatch({
        type: this.LOCK_METAMASK,
      })
      dispatch(this.hideLoadingIndication())
    })
  }
}

function showAccountDetail(address) {
  return (dispatch) => {
    dispatch(this.showLoadingIndication())
    _accountManager.setSelectedAddress(address, (err, address) => {
      dispatch(this.hideLoadingIndication())
      dispatch({
        type: this.SHOW_ACCOUNT_DETAIL,
        value: address,
      })
    })
  }
}

function backToAccountDetail(address) {
  return {
    type: this.BACK_TO_ACCOUNT_DETAIL,
    value: address,
  }
}
function clearSeedWordCache(account) {
  return {
    type: this.CLEAR_SEED_WORD_CACHE,
    value: account,
  }
}

function confirmSeedWords() {
  return (dispatch) => {
    dispatch(this.showLoadingIndication())
    _accountManager.clearSeedWordCache((err, account) => {
      console.log('Seed word cache cleared. ' + account)
      dispatch(this.showAccountDetail(account))
    })
  }
}

function showAccountsPage() {
  return {
    type: this.SHOW_ACCOUNTS_PAGE,
  }
}

function showConfTxPage() {
  return {
    type: this.SHOW_CONF_TX_PAGE,
  }
}

function nextTx() {
  return {
    type: this.NEXT_TX,
  }
}

function previousTx() {
  return {
    type: this.PREVIOUS_TX,
  }
}

function showConfigPage() {
  return {
    type: this.SHOW_CONFIG_PAGE,
  }
}

//
// config
//

function setRpcTarget(newRpc) {
  _accountManager.setRpcTarget(newRpc)
  return {
    type: this.SET_RPC_TARGET,
    value: newRpc,
  }
}

function setProviderType(type) {
  _accountManager.setProviderType(type)
  return {
    type: this.SET_PROVIDER_TYPE,
    value: type,
  }
}

function useEtherscanProvider() {
  _accountManager.useEtherscanProvider()
  return {
    type: this.USE_ETHERSCAN_PROVIDER,
  }
}

function showLoadingIndication() {
  return {
    type: this.SHOW_LOADING,
  }
}

function hideLoadingIndication() {
  return {
    type: this.HIDE_LOADING,
  }
}

function displayWarning(text) {
  return {
    type: this.DISPLAY_WARNING,
    value: text,
  }
}

function hideWarning() {
  return {
    type: this.HIDE_WARNING,
  }
}

function requestExportAccount() {
  return {
    type: this.REQUEST_ACCOUNT_EXPORT,
  }
}

function exportAccount(address) {
  var self = this

  return function(dispatch) {
    dispatch(self.showLoadingIndication())

    _accountManager.exportAccount(address, function(err, result) {
      dispatch(self.hideLoadingIndication())

      if (err) {
        console.error(err)
        return dispatch(self.displayWarning('Had a problem exporting the account.'))
      }

      dispatch(self.showPrivateKey(result))
    })
  }
}

function showPrivateKey(key) {
  return {
    type: this.SHOW_PRIVATE_KEY,
    value: key,
  }
}

function showSendPage() {
  return {
    type: this.SHOW_SEND_PAGE,
  }
}

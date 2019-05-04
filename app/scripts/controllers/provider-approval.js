const ObservableStore = require('obs-store')

/**
 * A controller that services user-approved requests for a full Ethereum provider API
 */
class ProviderApprovalController {
  /**
   * Determines if caching is enabled
   */
  caching = true

  /**
   * Creates a ProviderApprovalController
   *
   * @param {Object} [config] - Options to configure controller
   */
  constructor ({ closePopup, keyringController, openPopup, platform, preferencesController, publicConfigStore } = {}) {
    this.approvedOrigins = {}
    this.closePopup = closePopup
    this.keyringController = keyringController
    this.openPopup = openPopup
    this.platform = platform
    this.preferencesController = preferencesController
    this.publicConfigStore = publicConfigStore
    this.store = new ObservableStore({
      providerRequests: [],
    })

    if (platform && platform.addMessageListener) {
      platform.addMessageListener(({ action = '', force, origin, siteTitle, siteImage }, { tab }) => {
        if (tab && tab.id) {
          switch (action) {
            case 'init-provider-request':
              this._handleProviderRequest(origin, siteTitle, siteImage, force, tab.id)
              break
            case 'init-is-approved':
              this._handleIsApproved(origin, tab.id)
              break
            case 'init-is-unlocked':
              this._handleIsUnlocked(tab.id)
              break
            case 'init-privacy-request':
              this._handlePrivacyRequest(tab.id)
              break
          }
        }
      })
    }
  }

  /**
   * Called when a tab requests access to a full Ethereum provider API
   *
   * @param {string} origin - Origin of the window requesting full provider access
   * @param {string} siteTitle - The title of the document requesting full provider access
   * @param {string} siteImage - The icon of the window requesting full provider access
   */
  _handleProviderRequest (origin, siteTitle, siteImage, force, tabID) {
    this.store.updateState({ providerRequests: [{ origin, siteTitle, siteImage, tabID }] })
    const isUnlocked = this.keyringController.memStore.getState().isUnlocked
    if (!force && this.approvedOrigins[origin] && this.caching && isUnlocked) {
      this.approveProviderRequest(tabID)
      return
    }
    this.openPopup && this.openPopup()
  }

  /**
   * Called by a tab to determine if an origin has been approved in the past
   *
   * @param {string} origin - Origin of the window
   */
  _handleIsApproved (origin, tabID) {
    this.platform && this.platform.sendMessage({
      action: 'answer-is-approved',
      isApproved: this.approvedOrigins[origin] && this.caching,
      caching: this.caching,
    }, { id: tabID })
  }

  /**
   * Called by a tab to determine if MetaMask is currently locked or unlocked
   */
  _handleIsUnlocked (tabID) {
    const isUnlocked = this.keyringController.memStore.getState().isUnlocked
    this.platform && this.platform.sendMessage({ action: 'answer-is-unlocked', isUnlocked }, { id: tabID })
  }

  /**
   * Called to check privacy mode; if privacy mode is off, this will automatically enable the provider (legacy behavior)
   */
  _handlePrivacyRequest (tabID) {
    const privacyMode = this.preferencesController.getFeatureFlags().privacyMode
    if (!privacyMode) {
      this.platform && this.platform.sendMessage({
        action: 'approve-legacy-provider-request',
        selectedAddress: this.publicConfigStore.getState().selectedAddress,
      }, { id: tabID })
      this.publicConfigStore.emit('update', this.publicConfigStore.getState())
    }
  }

  /**
   * Called when a user approves access to a full Ethereum provider API
   *
   * @param {string} tabID - ID of the target window that approved provider access
   */
  approveProviderRequest (tabID) {
    this.closePopup && this.closePopup()
    const requests = this.store.getState().providerRequests
    const origin = requests.find(request => request.tabID === tabID).origin
    this.platform && this.platform.sendMessage({
      action: 'approve-provider-request',
      selectedAddress: this.publicConfigStore.getState().selectedAddress,
    }, { id: tabID })
    this.publicConfigStore.emit('update', this.publicConfigStore.getState())
    const providerRequests = requests.filter(request => request.tabID !== tabID)
    this.store.updateState({ providerRequests })
    this.approvedOrigins[origin] = true
  }

  /**
   * Called when a tab rejects access to a full Ethereum provider API
   *
   * @param {string} tabID - ID of the target window that rejected provider access
   */
  rejectProviderRequest (tabID) {
    this.closePopup && this.closePopup()
    const requests = this.store.getState().providerRequests
    const origin = requests.find(request => request.tabID === tabID).origin
    this.platform && this.platform.sendMessage({ action: 'reject-provider-request' }, { id: tabID })
    const providerRequests = requests.filter(request => request.tabID !== tabID)
    this.store.updateState({ providerRequests })
    delete this.approvedOrigins[origin]
  }

  /**
   * Clears any cached approvals for user-approved origins
   */
  clearApprovedOrigins () {
    this.approvedOrigins = {}
  }

  /**
   * Determines if a given origin should have accounts exposed
   *
   * @param {string} origin - Domain origin to check for approval status
   * @returns {boolean} - True if the origin has been approved
   */
  shouldExposeAccounts (origin) {
    const privacyMode = this.preferencesController.getFeatureFlags().privacyMode
    return !privacyMode || this.approvedOrigins[origin]
  }

  /**
   * Tells all tabs that MetaMask is now locked. This is primarily used to set
   * internal flags in the contentscript and inpage script.
   */
  setLocked () {
    this.platform.sendMessage({ action: 'metamask-set-locked' })
  }
}

module.exports = ProviderApprovalController

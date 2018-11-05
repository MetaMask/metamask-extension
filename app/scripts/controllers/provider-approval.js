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
    this.store = new ObservableStore()

    if (platform && platform.addMessageListener) {
      platform.addMessageListener(({ action = '', origin, siteTitle, siteImage }) => {
        switch (action) {
          case 'init-provider-request':
            this._handleProviderRequest(origin, siteTitle, siteImage)
            break
          case 'init-is-approved':
            this._handleIsApproved(origin)
            break
          case 'init-is-unlocked':
            this._handleIsUnlocked()
            break
          case 'init-privacy-request':
            this._handlePrivacyRequest()
            break
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
  _handleProviderRequest (origin, siteTitle, siteImage) {
    this.store.updateState({ providerRequests: [{ origin, siteTitle, siteImage }] })
    const isUnlocked = this.keyringController.memStore.getState().isUnlocked
    if (this.isApproved(origin) && this.caching && isUnlocked) {
      this.approveProviderRequest(origin)
      return
    }
    this.openPopup && this.openPopup()
  }

  /**
   * Called by a tab to determine if an origin has been approved in the past
   *
   * @param {string} origin - Origin of the window
   */
  _handleIsApproved (origin) {
    const isApproved = this.isApproved(origin) && this.caching
    const caching = this.caching
    this.platform && this.platform.sendMessage({ action: 'answer-is-approved', isApproved, caching }, { active: true })
  }

  /**
   * Called by a tab to determine if MetaMask is currently locked or unlocked
   */
  _handleIsUnlocked () {
    const isUnlocked = this.keyringController.memStore.getState().isUnlocked
    this.platform && this.platform.sendMessage({ action: 'answer-is-unlocked', isUnlocked }, { active: true })
  }

  /**
   * Called to check privacy mode; if privacy mode is off, this will automatically enable the provider (legacy behavior)
   */
  _handlePrivacyRequest () {
    const privacyMode = this.preferencesController.getFeatureFlags().privacyMode
    if (!privacyMode) {
      this.platform && this.platform.sendMessage({ action: 'approve-provider-request' }, { active: true })
      this.publicConfigStore.emit('update', this.publicConfigStore.getState())
    }
  }

  /**
   * Called when a user approves access to a full Ethereum provider API
   *
   * @param {string} origin - Origin of the target window to approve provider access
   */
  approveProviderRequest (origin) {
    this.closePopup && this.closePopup()
    const requests = this.store.getState().providerRequests || []
    this.platform && this.platform.sendMessage({ action: 'approve-provider-request' }, { active: true })
    this.publicConfigStore.emit('update', this.publicConfigStore.getState())
    const providerRequests = requests.filter(request => request.origin !== origin)
    this.store.updateState({ providerRequests })
    this.approvedOrigins[origin] = true
  }

  /**
   * Called when a tab rejects access to a full Ethereum provider API
   *
   * @param {string} origin - Origin of the target window to reject provider access
   */
  rejectProviderRequest (origin) {
    this.closePopup && this.closePopup()
    const requests = this.store.getState().providerRequests || []
    this.platform && this.platform.sendMessage({ action: 'reject-provider-request' }, { active: true })
    const providerRequests = requests.filter(request => request.origin !== origin)
    this.store.updateState({ providerRequests })
  }

  /**
   * Clears any cached approvals for user-approved origins
   */
  clearApprovedOrigins () {
    this.approvedOrigins = {}
  }

  /**
   * Determines if a given origin has been approved
   *
   * @param {string} origin - Domain origin to check for approval status
   * @returns {boolean} - True if the origin has been approved
   */
  isApproved (origin) {
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

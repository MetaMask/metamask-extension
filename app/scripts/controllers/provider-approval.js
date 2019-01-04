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

    const internalListener = ({ action = '', force, origin, siteTitle, siteImage, target, name }) => {
      switch (action) {
        case 'init-provider-request':
          this._handleProviderRequest(origin, siteTitle, siteImage, force)
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
    }

    const externalListener = (opts, sender, cb) => {
      console.log('external listener called', {opts, sender})
      const { action, force, origin, siteTitle, siteImage, target, name } = opts
      const title = origin || siteTitle || 'Extension'
      switch (action) {
        case 'init-provider-request':
          this._handleProviderRequest(sender.id, title, siteImage, force)
          break
        case 'init-is-approved':
          this._handleIsApproved(sender.id)
          break
        case 'init-is-unlocked':
          this._handleIsUnlocked(sender.id)
          break
        case 'init-privacy-request':
          this._handlePrivacyRequest(sender.id)
          break
      }
    }

    if (platform && platform.addMessageListener) {
      platform.addMessageListener(internalListener)
    }

    // Allow cross-extension provider requests:
    if (platform && platform.addExternalMessageListener) {
      platform.addExternalMessageListener(externalListener)
    }
  }

  /**
   * Called when a tab requests access to a full Ethereum provider API
   *
   * @param {string} origin - Origin of the window requesting full provider access
   * @param {string} siteTitle - The title of the document requesting full provider access
   * @param {string} siteImage - The icon of the window requesting full provider access
   */
  _handleProviderRequest (origin, siteTitle, siteImage, force) {
    this.store.updateState({ providerRequests: [{ origin, siteTitle, siteImage }] })
    const isUnlocked = this.keyringController.memStore.getState().isUnlocked
    if (!force && this.approvedOrigins[origin] && this.caching && isUnlocked) {
      console.log('approve provider request')
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
    this._sendMessage(origin, {
      action: 'answer-is-approved',
      isApproved: this.approvedOrigins[origin] && this.caching,
      caching: this.caching,
    }, { active: true })
 }

  /**
   * Called by a tab to determine if MetaMask is currently locked or unlocked
   */
  _handleIsUnlocked (origin) {
    const isUnlocked = this.keyringController.memStore.getState().isUnlocked
    this._sendMessage(origin, { action: 'answer-is-unlocked', isUnlocked }, { active: true })
  }

  /**
   * Called to check privacy mode; if privacy mode is off, this will automatically enable the provider (legacy behavior)
   */
  _handlePrivacyRequest (origin) {
    const privacyMode = this.preferencesController.getFeatureFlags().privacyMode
    if (!privacyMode) {
      this._sendMessage(origin, {
        action: 'approve-legacy-provider-request',
        selectedAddress: this.publicConfigStore.getState().selectedAddress,
      }, { active: true })

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
    const requests = this.store.getState().providerRequests
    console.log('sending approve-provider-request')

    this._sendMessage(origin, {
      action: 'approve-provider-request',
      selectedAddress: this.publicConfigStore.getState().selectedAddress,
    }, { active: true })

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
    const requests = this.store.getState().providerRequests
    this._sendMessage(origin, { action: 'reject-provider-request' }, { active: true })
    const providerRequests = requests.filter(request => request.origin !== origin)
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
    this._broadcastMessage({ action: 'metamask-set-locked' })
  }

  /*
   * Sends the desired message to all tabs and connected extensions.
   */
  _broadcastMessage(message, opts) {
    this.platform && this.platform.sendMessage(message, opts)
    for (const origin in this.approvedOrigins) {
      this.platform && this.platform.sendExternalMessage(origin, message, opts)
    }
  }

  /*
   * Sends the desired message to the specified extension or tab.
   */
  _sendMessage(origin, message, opts) {
    this.platform && this.platform.sendMessage(message, opts)
    this.platform && this.platform.sendExternalMessage(origin, message, opts)
  }
}

module.exports = ProviderApprovalController

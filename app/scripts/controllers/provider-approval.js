const ObservableStore = require('obs-store')

/**
 * A controller that services user-approved requests for a full Ethereum provider API
 */
class ProviderApprovalController {
  /**
   * Creates a ProviderApprovalController
   *
   * @param {Object} [config] - Options to configure controller
   */
  constructor ({ closePopup, openPopup, platform, preferencesController, publicConfigStore } = {}) {
    this.store = new ObservableStore()
    this.closePopup = closePopup
    this.openPopup = openPopup
    this.platform = platform
    this.publicConfigStore = publicConfigStore
    this.approvedOrigins = {}
    this.preferencesController = preferencesController
    platform && platform.addMessageListener && platform.addMessageListener(({ action, origin }) => {
      if (!action) { return }
      switch (action) {
        case 'init-provider-request':
          this.handleProviderRequest(origin)
          break
        case 'init-status-request':
          this.handleProviderStatusRequest(origin)
          break
        case 'init-privacy-request':
          this.handlePrivacyStatusRequest()
      }
    })
  }

  /**
   * Called when a tab requests access to a full Ethereum provider API
   *
   * @param {string} origin - Origin of the window requesting full provider access
   */
  handleProviderRequest (origin) {
    this.store.updateState({ providerRequests: [{ origin }] })
    if (this.isApproved(origin)) {
      this.approveProviderRequest(origin)
      return
    }
    this.openPopup && this.openPopup()
  }

  /**
   * Called by a tab to determine if a full Ethereum provider API is exposed
   *
   * @param {string} origin - Origin of the window requesting provider status
   */
  async handleProviderStatusRequest (origin) {
    const isEnabled = this.isApproved(origin)
    this.platform && this.platform.sendMessage({ action: 'answer-status-request', isEnabled }, { active: true })
  }

  handlePrivacyStatusRequest () {
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
}

module.exports = ProviderApprovalController

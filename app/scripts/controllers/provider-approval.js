const ObservableStore = require('obs-store')
const SafeEventEmitter = require('safe-event-emitter')
const createAsyncMiddleware = require('json-rpc-engine/src/createAsyncMiddleware')

/**
 * A controller that services user-approved requests for a full Ethereum provider API
 */
class ProviderApprovalController extends SafeEventEmitter {
  /**
   * Determines if caching is enabled
   */
  caching = true

  /**
   * Creates a ProviderApprovalController
   *
   * @param {Object} [config] - Options to configure controller
   */
  constructor ({ closePopup, keyringController, openPopup, preferencesController } = {}) {
    super()
    this.approvedOrigins = {}
    this.closePopup = closePopup
    this.keyringController = keyringController
    this.openPopup = openPopup
    this.preferencesController = preferencesController
    this.store = new ObservableStore({
      providerRequests: [],
    })
  }

  /**
   * Called when a user approves access to a full Ethereum provider API
   *
   * @param {object} opts - opts for the middleware contains the origin for the middleware
   */
  createMiddleware ({ origin, getSiteMetadata }) {
    return createAsyncMiddleware(async (req, res, next) => {
      // only handle requestAccounts
      if (req.method !== 'eth_requestAccounts') return next()
      // if already approved or privacy mode disabled, return early
      const isUnlocked = this.keyringController.memStore.getState().isUnlocked
      if (this.shouldExposeAccounts(origin) && isUnlocked) {
        res.result = [this.preferencesController.getSelectedAddress()]
        return
      }
      // register the provider request
      const metadata = await getSiteMetadata(origin)
      this._handleProviderRequest(origin, metadata.name, metadata.icon, false, null)
      // wait for resolution of request
      const approved = await new Promise(resolve => this.once(`resolvedRequest:${origin}`, ({ approved }) => resolve(approved)))
      if (approved) {
        res.result = [this.preferencesController.getSelectedAddress()]
      } else {
        throw new Error('User denied account authorization')
      }
    })
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
      return
    }
    this.openPopup && this.openPopup()
  }

  /**
   * Called when a user approves access to a full Ethereum provider API
   *
   * @param {string} origin - origin of the domain that had provider access approved
   */
  approveProviderRequestByOrigin (origin) {
    this.closePopup && this.closePopup()
    const requests = this.store.getState().providerRequests
    const providerRequests = requests.filter(request => request.origin !== origin)
    this.store.updateState({ providerRequests })
    this.approvedOrigins[origin] = true
    this.emit(`resolvedRequest:${origin}`, { approved: true })
  }

  /**
   * Called when a tab rejects access to a full Ethereum provider API
   *
   * @param {string} origin - origin of the domain that had provider access approved
   */
  rejectProviderRequestByOrigin (origin) {
    this.closePopup && this.closePopup()
    const requests = this.store.getState().providerRequests
    const providerRequests = requests.filter(request => request.origin !== origin)
    this.store.updateState({ providerRequests })
    delete this.approvedOrigins[origin]
    this.emit(`resolvedRequest:${origin}`, { approved: false })
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
    const result = !privacyMode || Boolean(this.approvedOrigins[origin])
    return result
  }

}

module.exports = ProviderApprovalController

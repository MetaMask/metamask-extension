const ObservableStore = require('obs-store')
const EventEmitter = require('safe-event-emitter')
const { ethErrors } = require('eth-json-rpc-errors')

/**
 * Resource Controller
 *
 * An abstract class intended to describe a particular resource that is managed by plugins.
 * Example resources are accounts and assets.
 *
 * These are things that MetaMask treats as first-class objects with distinct properties within its own UI.
 */

class ResourceController extends EventEmitter {

  constructor (opts = {}) {
    super()
    const { requiredFields, storageKey } = opts
    if (!storageKey) {
      throw new Error('Must provide unique storageKey string.')
    }
    this.requiredFields = requiredFields
    this.storageKey = storageKey

    const initState = { [this.storageKey]: [], ...opts.initState }
    this.store = new ObservableStore(initState)
  }

  // Resource management
  get resources () {
    return this.store.getState()[this.storageKey]
  }

  set resources (resources) {
    this.store.updateState({
      [this.storageKey]: resources,
    })
  }

  add (fromDomain, opts) {
    const resources = this.resources
    this.validateResource(fromDomain, opts)
    const priors = this.getPriorResources(fromDomain, opts)
    if (priors.length > 0) {
      return this.update(fromDomain, opts)
    }

    const resource = {
      ...opts,
    }
    resource.fromDomain = fromDomain
    resources.push(resource)
    this.resources = resources
    return resource
  }

  getPriorResources (fromDomain, resource) {
    return this.resources.filter((resource2) => {
      return resource2.fromDomain === fromDomain && resource.identifier && resource.identifier === resource2.identifier
    })
  }

  validateResource (fromDomain, opts) {
    this.requiredFields.forEach((requiredField) => {
      if (!(requiredField in opts)) {
        throw new Error(`Resource from ${fromDomain} missing required field: ${requiredField}`)
      }
    })
  }

  update (fromDomain, resource) {
    this.validateResource(fromDomain, resource)
    this.resources = this.resources.map((resource2) => {
      if (resource2.fromDomain === fromDomain && resource.identifier === resource2.identifier) {
        return resource
      } else {
        return resource2
      }
    })
    return resource
  }

  remove (fromDomain, resource) {
    let deleted
    this.resources = this.resources.filter((resource2) => {
      const requested = resource2.fromDomain === fromDomain && resource.identifier === resource2.identifier
      deleted = requested
      return !requested
    })
    return deleted
  }

  handleRpcRequest (req, res, _next, end, engine) {
    const [ method, opts ] = req.params
    const requestor = engine.domain
    try {
      switch (method) {
        case 'add':
          res.result = this.add(requestor, opts)
          return end()
        case 'update':
          res.result = this.update(requestor, opts)
          return end()
        case 'remove':
          res.result = this.remove(requestor, opts)
          return end()
        default:
          res.error = ethErrors.rpc.methodNotFound({ data: req })
          end(res.error)
      }
    } catch (err) {
      res.error = err
      end(err)
    }
  }

}

module.exports = ResourceController

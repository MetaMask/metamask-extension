const assert = require('assert')
const sinon = require('sinon')
const ProviderApprovalController = require('../../../../app/scripts/controllers/provider-approval')

const mockLockedKeyringController = {
  memStore: {
    getState: () => ({
      isUnlocked: false,
    }),
  },
}

const mockUnlockedKeyringController = {
  memStore: {
    getState: () => ({
      isUnlocked: true,
    }),
  },
}

describe('ProviderApprovalController', () => {
  describe('#_handleProviderRequest', () => {
    it('should add a pending provider request when unlocked', () => {
      const controller = new ProviderApprovalController({
        keyringController: mockUnlockedKeyringController,
      })

      const metadata = {
        hostname: 'https://example.com',
        origin: 'example.com',
        siteTitle: 'Example',
        siteImage: 'https://example.com/logo.svg',
      }

      controller._handleProviderRequest(metadata)
      assert.deepEqual(controller._getMergedState(), {
        approvedOrigins: {},
        providerRequests: [metadata],
      })
    })

    it('should add a pending provider request when locked', () => {
      const controller = new ProviderApprovalController({
        keyringController: mockLockedKeyringController,
      })

      const metadata = {
        hostname: 'https://example.com',
        origin: 'example.com',
        siteTitle: 'Example',
        siteImage: 'https://example.com/logo.svg',
      }
      controller._handleProviderRequest(metadata)
      assert.deepEqual(controller._getMergedState(), {
        approvedOrigins: {},
        providerRequests: [metadata],
      })
    })

    it('should add a 2nd pending provider request when unlocked', () => {
      const controller = new ProviderApprovalController({
        keyringController: mockUnlockedKeyringController,
      })

      const metadata = [{
        hostname: 'https://example1.com',
        origin: 'example1.com',
        siteTitle: 'Example 1',
        siteImage: 'https://example1.com/logo.svg',
      }, {
        hostname: 'https://example2.com',
        origin: 'example2.com',
        siteTitle: 'Example 2',
        siteImage: 'https://example2.com/logo.svg',
      }]

      controller._handleProviderRequest(metadata[0])
      controller._handleProviderRequest(metadata[1])
      assert.deepEqual(controller._getMergedState(), {
        approvedOrigins: {},
        providerRequests: metadata,
      })
    })

    it('should add a 2nd pending provider request when locked', () => {
      const controller = new ProviderApprovalController({
        keyringController: mockLockedKeyringController,
      })

      const metadata = [{
        hostname: 'https://example1.com',
        origin: 'example1.com',
        siteTitle: 'Example 1',
        siteImage: 'https://example1.com/logo.svg',
      }, {
        hostname: 'https://example2.com',
        origin: 'example2.com',
        siteTitle: 'Example 2',
        siteImage: 'https://example2.com/logo.svg',
      }]

      controller._handleProviderRequest(metadata[0])
      controller._handleProviderRequest(metadata[1])
      assert.deepEqual(controller._getMergedState(), {
        approvedOrigins: {},
        providerRequests: metadata,
      })
    })

    it('should call openPopup when unlocked and when given', () => {
      const openPopup = sinon.spy()
      const controller = new ProviderApprovalController({
        openPopup,
        keyringController: mockUnlockedKeyringController,
      })

      const metadata = {
        hostname: 'https://example.com',
        origin: 'example.com',
        siteTitle: 'Example',
        siteImage: 'https://example.com/logo.svg',
      }
      controller._handleProviderRequest(metadata)
      assert.ok(openPopup.calledOnce)
    })

    it('should call openPopup when locked and when given', () => {
      const openPopup = sinon.spy()
      const controller = new ProviderApprovalController({
        openPopup,
        keyringController: mockLockedKeyringController,
      })

      const metadata = {
        hostname: 'https://example.com',
        origin: 'example.com',
        siteTitle: 'Example',
        siteImage: 'https://example.com/logo.svg',
      }
      controller._handleProviderRequest(metadata)
      assert.ok(openPopup.calledOnce)
    })

    it('should NOT call openPopup when unlocked and when the domain has already been approved', () => {
      const openPopup = sinon.spy()
      const controller = new ProviderApprovalController({
        openPopup,
        keyringController: mockUnlockedKeyringController,
      })

      controller.store.updateState({
        approvedOrigins: {
          'example.com': {
            siteTitle: 'Example',
            siteImage: 'https://example.com/logo.svg',
          },
        },
      })
      const metadata = {
        hostname: 'https://example.com',
        origin: 'example.com',
        siteTitle: 'Example',
        siteImage: 'https://example.com/logo.svg',
      }
      controller._handleProviderRequest(metadata)
      assert.ok(openPopup.notCalled)
    })
  })

  describe('#approveProviderRequestByOrigin', () => {
    it('should mark the origin as approved and remove the provider request', () => {
      const controller = new ProviderApprovalController({
        keyringController: mockUnlockedKeyringController,
      })

      const metadata = {
        hostname: 'https://example.com',
        origin: 'example.com',
        siteTitle: 'Example',
        siteImage: 'https://example.com/logo.svg',
      }
      controller._handleProviderRequest(metadata)
      controller.approveProviderRequestByOrigin('example.com')
      assert.deepEqual(controller._getMergedState(), {
        providerRequests: [],
        approvedOrigins: {
          'example.com': {
            hostname: 'https://example.com',
            siteTitle: 'Example',
            siteImage: 'https://example.com/logo.svg',
          },
        },
      })
    })

    it('should mark the origin as approved and multiple requests for the same domain', () => {
      const controller = new ProviderApprovalController({
        keyringController: mockUnlockedKeyringController,
      })

      const metadata = {
        hostname: 'https://example.com',
        origin: 'example.com',
        siteTitle: 'Example',
        siteImage: 'https://example.com/logo.svg',
      }
      controller._handleProviderRequest(metadata)
      controller._handleProviderRequest(metadata)
      controller.approveProviderRequestByOrigin('example.com')
      assert.deepEqual(controller._getMergedState(), {
        providerRequests: [],
        approvedOrigins: {
          'example.com': {
            hostname: 'https://example.com',
            siteTitle: 'Example',
            siteImage: 'https://example.com/logo.svg',
          },
        },
      })
    })

    it('should mark the origin as approved without a provider request', () => {
      const controller = new ProviderApprovalController({
        keyringController: mockUnlockedKeyringController,
      })

      controller.approveProviderRequestByOrigin('example.com')
      assert.deepEqual(controller._getMergedState(), {
        providerRequests: [],
        approvedOrigins: {
          'example.com': {
            hostname: null,
            siteTitle: null,
            siteImage: null,
          },
        },
      })
    })
  })

  describe('#rejectProviderRequestByOrigin', () => {
    it('should remove the origin from approved', () => {
      const controller = new ProviderApprovalController({
        keyringController: mockUnlockedKeyringController,
      })

      const metadata = {
        hostname: 'https://example.com',
        origin: 'example.com',
        siteTitle: 'Example',
        siteImage: 'https://example.com/logo.svg',
      }
      controller._handleProviderRequest(metadata)
      controller.approveProviderRequestByOrigin('example.com')
      controller.rejectProviderRequestByOrigin('example.com')
      assert.deepEqual(controller._getMergedState(), {
        providerRequests: [],
        approvedOrigins: {},
      })
    })

    it('should reject the origin even without a pending request', () => {
      const controller = new ProviderApprovalController({
        keyringController: mockUnlockedKeyringController,
      })

      controller.rejectProviderRequestByOrigin('example.com')
      assert.deepEqual(controller._getMergedState(), {
        providerRequests: [],
        approvedOrigins: {},
      })
    })
  })

  describe('#clearApprovedOrigins', () => {
    it('should clear the approved origins', () => {
      const controller = new ProviderApprovalController({
        keyringController: mockUnlockedKeyringController,
      })

      const metadata = {
        hostname: 'https://example.com',
        origin: 'example.com',
        siteTitle: 'Example',
        siteImage: 'https://example.com/logo.svg',
      }
      controller._handleProviderRequest(metadata)
      controller.approveProviderRequestByOrigin('example.com')
      controller.clearApprovedOrigins()
      assert.deepEqual(controller._getMergedState(), {
        providerRequests: [],
        approvedOrigins: {},
      })
    })
  })

  describe('#shouldExposeAccounts', () => {
    it('should return true for an approved origin', () => {
      const controller = new ProviderApprovalController({
        keyringController: mockUnlockedKeyringController,
      })

      const metadata = {
        hostname: 'https://example.com',
        origin: 'example.com',
        siteTitle: 'Example',
        siteImage: 'https://example.com/logo.svg',
      }
      controller._handleProviderRequest(metadata)
      controller.approveProviderRequestByOrigin('example.com')
      assert.ok(controller.shouldExposeAccounts('example.com'))
    })

    it('should return false for an origin not yet approved', () => {
      const controller = new ProviderApprovalController({
        keyringController: mockUnlockedKeyringController,
      })

      const metadata = {
        hostname: 'https://example.com',
        origin: 'example.com',
        siteTitle: 'Example',
        siteImage: 'https://example.com/logo.svg',
      }
      controller._handleProviderRequest(metadata)
      controller.approveProviderRequestByOrigin('example.com')
      assert.ok(!controller.shouldExposeAccounts('bad.website'))
    })
  })
})

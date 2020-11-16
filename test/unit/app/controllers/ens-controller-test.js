import assert from 'assert'
import sinon from 'sinon'
import ObservableStore from 'obs-store'
import EnsController from '../../../../app/scripts/controllers/ens'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
const ZERO_X_ERROR_ADDRESS = '0x'

describe('EnsController', function () {
  describe('#constructor', function () {
    it('should construct the controller given a provider and a network', async function () {
      const currentNetworkId = '3'
      const networkStore = new ObservableStore(currentNetworkId)
      const ens = new EnsController({
        provider: {},
        networkStore,
      })

      assert.ok(ens._ens)
    })

    it('should construct the controller given an existing ENS instance', async function () {
      const networkStore = {
        subscribe: sinon.spy(),
      }
      const ens = new EnsController({
        ens: {},
        networkStore,
      })

      assert.ok(ens._ens)
    })
  })

  describe('#reverseResolveName', function () {
    it('should resolve to an ENS name', async function () {
      const address = '0x8e5d75d60224ea0c33d0041e75de68b1c3cb6dd5'
      const networkStore = {
        subscribe: sinon.spy(),
      }
      const ens = new EnsController({
        ens: {
          reverse: sinon.stub().withArgs(address).returns('peaksignal.eth'),
          lookup: sinon.stub().withArgs('peaksignal.eth').returns(address),
        },
        networkStore,
      })

      const name = await ens.reverseResolveAddress(address)
      assert.equal(name, 'peaksignal.eth')
    })

    it('should only resolve an ENS name once', async function () {
      const address = '0x8e5d75d60224ea0c33d0041e75de68b1c3cb6dd5'
      const reverse = sinon.stub().withArgs(address).returns('peaksignal.eth')
      const lookup = sinon.stub().withArgs('peaksignal.eth').returns(address)
      const networkStore = {
        subscribe: sinon.spy(),
      }
      const ens = new EnsController({
        ens: {
          reverse,
          lookup,
        },
        networkStore,
      })

      assert.equal(await ens.reverseResolveAddress(address), 'peaksignal.eth')
      assert.equal(await ens.reverseResolveAddress(address), 'peaksignal.eth')
      assert.ok(lookup.calledOnce)
      assert.ok(reverse.calledOnce)
    })

    it('should fail if the name is registered to a different address than the reverse-resolved', async function () {
      const address = '0x8e5d75d60224ea0c33d0041e75de68b1c3cb6dd5'
      const networkStore = {
        subscribe: sinon.spy(),
      }
      const ens = new EnsController({
        ens: {
          reverse: sinon.stub().withArgs(address).returns('peaksignal.eth'),
          lookup: sinon.stub().withArgs('peaksignal.eth').returns('0xfoo'),
        },
        networkStore,
      })

      const name = await ens.reverseResolveAddress(address)
      assert.strictEqual(name, undefined)
    })

    it('should throw an error when the lookup resolves to the zero address', async function () {
      const address = '0x8e5d75d60224ea0c33d0041e75de68b1c3cb6dd5'
      const networkStore = {
        subscribe: sinon.spy(),
      }
      const ens = new EnsController({
        ens: {
          reverse: sinon.stub().withArgs(address).returns('peaksignal.eth'),
          lookup: sinon.stub().withArgs('peaksignal.eth').returns(ZERO_ADDRESS),
        },
        networkStore,
      })

      try {
        await ens.reverseResolveAddress(address)
        assert.fail('#reverseResolveAddress did not throw')
      } catch (e) {
        assert.ok(e)
      }
    })

    it('should throw an error the lookup resolves to the zero x address', async function () {
      const address = '0x8e5d75d60224ea0c33d0041e75de68b1c3cb6dd5'
      const networkStore = {
        subscribe: sinon.spy(),
      }
      const ens = new EnsController({
        ens: {
          reverse: sinon.stub().withArgs(address).returns('peaksignal.eth'),
          lookup: sinon
            .stub()
            .withArgs('peaksignal.eth')
            .returns(ZERO_X_ERROR_ADDRESS),
        },
        networkStore,
      })

      try {
        await ens.reverseResolveAddress(address)
        assert.fail('#reverseResolveAddress did not throw')
      } catch (e) {
        assert.ok(e)
      }
    })
  })
})

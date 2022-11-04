import { strict as assert } from 'assert';
import sinon from 'sinon';
import EnsController from '.';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const ZERO_X_ERROR_ADDRESS = '0x';

describe('EnsController', function () {
  let currentChainId;
  let getCurrentChainId;
  let onNetworkDidChange;
  beforeEach(function () {
    currentChainId = '0x5';
    getCurrentChainId = () => currentChainId;
    onNetworkDidChange = sinon.spy();
  });
  afterEach(function () {
    sinon.restore();
  });
  describe('#constructor', function () {
    it('should construct the controller given a provider and a network', async function () {
      const ens = new EnsController({
        provider: sinon.fake(),
        getCurrentChainId,
        onNetworkDidChange,
      });

      assert.ok(ens._ens);
    });

    it('should construct the controller given an existing ENS instance', async function () {
      const ens = new EnsController({
        ens: {},
        getCurrentChainId,
        onNetworkDidChange,
      });

      assert.ok(ens._ens);
    });
  });

  describe('#reverseResolveName', function () {
    it('should resolve to an ENS name', async function () {
      const address = '0x8e5d75d60224ea0c33d0041e75de68b1c3cb6dd5';
      const ens = new EnsController({
        ens: {
          reverse: sinon.stub().withArgs(address).returns('peaksignal.eth'),
          lookup: sinon.stub().withArgs('peaksignal.eth').returns(address),
        },
        onNetworkDidChange,
        getCurrentChainId,
      });

      const name = await ens.reverseResolveAddress(address);
      assert.equal(name, 'peaksignal.eth');
    });

    it('should only resolve an ENS name once', async function () {
      const address = '0x8e5d75d60224ea0c33d0041e75de68b1c3cb6dd5';
      const reverse = sinon.stub().withArgs(address).returns('peaksignal.eth');
      const lookup = sinon.stub().withArgs('peaksignal.eth').returns(address);
      const ens = new EnsController({
        ens: {
          reverse,
          lookup,
        },
        getCurrentChainId,
        onNetworkDidChange,
      });

      assert.equal(await ens.reverseResolveAddress(address), 'peaksignal.eth');
      assert.equal(await ens.reverseResolveAddress(address), 'peaksignal.eth');
      assert.ok(lookup.calledOnce);
      assert.ok(reverse.calledOnce);
    });

    it('should fail if the name is registered to a different address than the reverse-resolved', async function () {
      const address = '0x8e5d75d60224ea0c33d0041e75de68b1c3cb6dd5';
      const ens = new EnsController({
        ens: {
          reverse: sinon.stub().withArgs(address).returns('peaksignal.eth'),
          lookup: sinon.stub().withArgs('peaksignal.eth').returns('0x00'),
        },
        onNetworkDidChange,
        getCurrentChainId,
      });

      const name = await ens.reverseResolveAddress(address);
      assert.strictEqual(name, undefined);
    });

    it('should throw an error when the lookup resolves to the zero address', async function () {
      const address = '0x8e5d75d60224ea0c33d0041e75de68b1c3cb6dd5';
      const ens = new EnsController({
        ens: {
          reverse: sinon.stub().withArgs(address).returns('peaksignal.eth'),
          lookup: sinon.stub().withArgs('peaksignal.eth').returns(ZERO_ADDRESS),
        },
        getCurrentChainId,
        onNetworkDidChange,
      });

      try {
        await ens.reverseResolveAddress(address);
        assert.fail('#reverseResolveAddress did not throw');
      } catch (e) {
        assert.ok(e);
      }
    });

    it('should throw an error the lookup resolves to the zero x address', async function () {
      const address = '0x8e5d75d60224ea0c33d0041e75de68b1c3cb6dd5';
      const ens = new EnsController({
        ens: {
          reverse: sinon.stub().withArgs(address).returns('peaksignal.eth'),
          lookup: sinon
            .stub()
            .withArgs('peaksignal.eth')
            .returns(ZERO_X_ERROR_ADDRESS),
        },
        onNetworkDidChange,
        getCurrentChainId,
      });

      try {
        await ens.reverseResolveAddress(address);
        assert.fail('#reverseResolveAddress did not throw');
      } catch (e) {
        assert.ok(e);
      }
    });
  });
});

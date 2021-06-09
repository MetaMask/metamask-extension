import { strict as assert } from 'assert';
import sinon from 'sinon';
import BlocksController from './blocks';

function getMockBlockTracker() {
  return {
    addListener: sinon.stub().callsArgWithAsync(1, '0xa'),
    removeListener: sinon.spy(),
    testProperty: 'fakeBlockTracker',
    getCurrentBlock: () => '0xa',
  };
}

describe('BlocksController', function () {
  describe('constructor', function () {
    let blockTracker;
    it('should properly initialize', function () {
      blockTracker = getMockBlockTracker();
      const blocksController = new BlocksController({
        blockTracker,
      });
      assert.deepEqual(blocksController.store.getState().blocks, []);
    });
  });

  afterEach(function () {
    sinon.restore();
  });
});

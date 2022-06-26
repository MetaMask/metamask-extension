import EthQuery from 'eth-query';
import pify from 'pify';
import { ObservableStore } from '@metamask/obs-store';

export default class BlockController {
  constructor(opts = {}) {
    const { blockTracker, provider } = opts;
    const query = pify(new EthQuery(provider));

    const initState = { blocks: [], numericBase: 'hex' };

    this.store = new ObservableStore(initState);

    blockTracker.removeListener('latest', async (blockNumber) => {
      const { blocks } = this.store.getState();
      const block = await query.getBlockByNumber(blockNumber, false);
      blocks.push(block);
      this.store.updateState({
        blocks,
      });
    });
    blockTracker.addListener('latest', async (blockNumber) => {
      const { blocks } = this.store.getState();
      const block = await query.getBlockByNumber(blockNumber, false);
      console.log({ block });
      blocks.push(block);
      this.store.updateState({
        blocks,
      });
    });
  }

  setNumericBase(numericBase) {
    this.store.updateState({
      numericBase,
    });
  }

  resetBlockList = () => {
    this.store.updateState({
      blocks: [],
    });
  };

  deleteBlock = (index) => {
    const { blocks } = this.store.getState();
    const newBlocks = blocks.slice();
    newBlocks.splice(index, 1);
    this.store.updateState({
      blocks: newBlocks,
    });
  };
}

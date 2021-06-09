import EthQuery from 'eth-query';
import pify from 'pify';
import { ObservableStore } from '@metamask/obs-store';

export default class BlockController {
  constructor(opts = {}) {
    const { blockTracker, provider } = opts;
    const query = pify(new EthQuery(provider));

    this.store = new ObservableStore({ blocks: [] });

    blockTracker.removeListener('latest', async (blockNumber) => {
      const { blocks } = this.store.getState();
      const block = await query.getBlockByNumber(blockNumber, false);
      blocks.push(block);
      this.store.updateState({ blocks });
    });
    blockTracker.addListener('latest', async (blockNumber) => {
      const { blocks } = this.store.getState();
      const block = await query.getBlockByNumber(blockNumber, false);

      blocks.push(block);
      this.store.updateState({ blocks });
    });
  }

  resetBlockList = () => {
    this.store.updateState({ blocks: {} });
  };
}

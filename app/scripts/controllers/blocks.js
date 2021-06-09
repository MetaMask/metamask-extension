import { ObservableStore } from '@metamask/obs-store';

export default class BlockController {
  constructor(opts = {}) {
    const { blockTracker, provider } = opts;

    const initState = { blocks: [] };
    this.store = new ObservableStore(initState);

    blockTracker.removeListener('latest', async (blockNumber) => {
      const { blocks } = this.store.getState();
      const res = await provider.sendAsync({
        jsonrpc: '2.0',
        method: 'eth_getBlockByNumber',
        params: [blockNumber, false],
        id: 1,
      });
      blocks.push(res.result);
      this.store.updateState({
        blocks,
      });
    });
    blockTracker.addListener('latest', async (blockNumber) => {
      const { blocks } = this.store.getState();
      const res = await provider.sendAsync({
        jsonrpc: '2.0',
        method: 'eth_getBlockByNumber',
        params: [blockNumber, false],
        id: 1,
      });
      blocks.push(res.result);
      this.store.updateState({
        blocks,
      });
    });
  }

  resetBlockList = () => {
    this.store.updateState({
      blocks: {},
    });
  };
}

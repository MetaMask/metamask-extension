import { ObservableStore } from '@metamask/obs-store';

export default class BlockController {
  constructor(opts = {}) {
    const { blockTracker, provider } = opts;

    this.blockTracker = blockTracker;
    this.provider = provider;

    const initState = {
      blocks: [],
      formatBlockNumericInfoAsHex: true,
      blockListSortProperty: 'number',
    };
    this.store = new ObservableStore(initState);

    this._setupBlockTrackerListener();
  }

  _setupBlockTrackerListener() {
    this.blockTracker.removeListener('latest', this._onLatestBlock);
    this.blockTracker.addListener('latest', this._onLatestBlock);
  }

  _onLatestBlock = async (blockNumber) => {
    const { blocks } = this.store.getState();
    const res = await this.provider.sendAsync({
      jsonrpc: '2.0',
      method: 'eth_getBlockByNumber',
      params: [blockNumber, false],
      id: 1,
    });
    blocks.push(res.result);
    this.store.updateState({
      blocks,
    });
  };

  resetBlockList = () => {
    this.store.updateState({
      blocks: {},
    });
  };
}

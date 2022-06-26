import EthQuery from 'eth-query';
import pify from 'pify';
import { ObservableStore } from '@metamask/obs-store';

export default class BlockController {
  constructor(opts = {}) {
    // const { initState = {}, preferencesStore } = opts;
    // const state = {
    //   ...defaultState,
    //   alertEnabledness: {
    //     ...defaultState.alertEnabledness,
    //     ...initState.alertEnabledness,
    //   },
    // };

    // this.store = new ObservableStore(state);

    const { blockTracker, provider, preferencesStore } = opts;
    const query = pify(new EthQuery(provider));

    const initState = { blocks: [], base: 'hex' };
    // this.hexButtonState = preferencesStore.getState().hexButtonState;

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

  setHexButtonState = (records) => {
    console.log('blockcontroller setting hex button state', { records });
    this.store.updateState({ records });
  };

  setNumericBase(base) {
    this.store.updateState({
      base,
    });
  }

  resetBlockList = () => {
    console.log('blockcontroller resetting block list');
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

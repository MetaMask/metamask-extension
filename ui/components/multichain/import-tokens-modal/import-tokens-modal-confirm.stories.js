import React from 'react';
import { Provider } from 'react-redux';
import configureStore from '../../../store/store';
import testData from '../../../../.storybook/test-data';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { mockNetworkState } from '../../../../test/stub/networks';
import { ImportTokensModalConfirm } from './import-tokens-modal-confirm';

const createStore = (
  chainId = CHAIN_IDS.MAINNET,
  useTokenDetection = true,
  tokenRepetition = 1,
) => {
  return configureStore({
    ...testData,
    metamask: {
      ...testData.metamask,
      useTokenDetection,
      ...mockNetworkState({ chainId }),
      pendingTokens: {
        '0x0000000de40dfa9b17854cbc7869d80f9f98d823': {
          address: '0x0000000de40dfa9b17854cbc7869d80f9f98d823',
          aggregators: ['CoinGecko', 'Sonarwatch', 'Coinmarketcap'],
          decimals: 18,
          fees: {},
          iconUrl:
            'https://static.cx.metamask.io/api/v1/tokenIcons/1/0x0000000de40dfa9b17854cbc7869d80f9f98d823.png',
          name: 'delta theta'.repeat(tokenRepetition),
          occurrences: 3,
          symbol: 'DLTA',
          type: 'erc20',
          unlisted: false,
        },
        '0x00d8318e44780edeefcf3020a5448f636788883c': {
          address: '0x00d8318e44780edeefcf3020a5448f636788883c',
          aggregators: ['CoinGecko', 'Sonarwatch', 'Coinmarketcap'],
          decimals: 18,
          fees: {},
          iconUrl:
            'https://static.cx.metamask.io/api/v1/tokenIcons/1/0x00d8318e44780edeefcf3020a5448f636788883c.png',
          name: 'dAppstore'.repeat(tokenRepetition),
          occurrences: 3,
          symbol: 'DAPPX',
          type: 'erc20',
          unlisted: false,
        },
        '0x00e679ba63b509182c349f5614f0a07cdd0ce0c5': {
          address: '0x00e679ba63b509182c349f5614f0a07cdd0ce0c5',
          aggregators: ['CoinGecko', 'Sonarwatch', 'Coinmarketcap'],
          decimals: 18,
          iconUrl:
            'https://static.cx.metamask.io/api/v1/tokenIcons/1/0x00e679ba63b509182c349f5614f0a07cdd0ce0c5.png',
          name: 'Damex Token'.repeat(tokenRepetition),
          occurrences: 3,
          symbol: 'DAMEX',
          type: 'erc20',
          unlisted: false,
        },
      },
    },
  });
};

export default {
  title: 'Components/Multichain/ImportTokensModal/ImportTokensModalConfirm',
  component: ImportTokensModalConfirm,
  argTypes: {
    onBackClick: {
      action: 'onClose',
    },
    onImportClick: {
      action: 'onClose',
    },
  },
};

export const DefaultStory = (args) => <ImportTokensModalConfirm {...args} />;
DefaultStory.decorators = [
  (Story) => (
    <Provider store={createStore()}>
      <Story />
    </Provider>
  ),
];

DefaultStory.storyName = 'Default';

export const LongValueStory = (args) => (
  <div style={{ width: '300px' }}>
    <ImportTokensModalConfirm {...args} />
  </div>
);
LongValueStory.decorators = [
  (Story) => (
    <Provider store={createStore(CHAIN_IDS.MAINNET, true, 5)}>
      <Story />
    </Provider>
  ),
];

LongValueStory.storyName = 'LongValueStory';

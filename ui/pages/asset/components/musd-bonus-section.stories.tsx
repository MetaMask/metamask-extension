import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createSwapsMockStore } from '../../../../test/jest/mock-store';
import { MUSD_TOKEN_ADDRESS } from '../../../components/app/musd/constants';
import { MusdBonusSection } from './musd-bonus-section';

const CHAIN_ID = '0x1' as const;

const baseState = createSwapsMockStore();

const store = configureMockStore()({
  ...baseState,
  metamask: {
    ...baseState.metamask,
    remoteFeatureFlags: {
      ...baseState.metamask.remoteFeatureFlags,
      earnMusdConversionFlowEnabled: true,
      earnMerklCampaignClaiming: true,
    },
    networkConfigurationsByChainId: {
      '0x1': {
        chainId: '0x1' as const,
        name: 'Ethereum Mainnet',
        nativeCurrency: 'ETH',
        blockExplorerUrl: 'https://etherscan.io',
        defaultRpcEndpointIndex: 0,
        rpcEndpoints: [
          { url: 'https://mainnet.infura.io/v3/', type: 'custom' },
        ],
      },
    },
    marketData: {
      ...baseState.metamask.marketData,
      '0x1': {
        [MUSD_TOKEN_ADDRESS]: { price: 0.000256 },
      },
    },
  },
});

const meta: Meta<typeof MusdBonusSection> = {
  title: 'Pages/Asset/MusdBonusSection',
  component: MusdBonusSection,
  decorators: [
    (Story) => (
      <Provider store={store}>
        <QueryClientProvider
          client={
            new QueryClient({
              defaultOptions: {
                queries: { retry: false, staleTime: Infinity },
              },
            })
          }
        >
          <div
            style={{
              width: 360,
              backgroundColor: 'var(--color-background-default)',
            }}
          >
            <Story />
          </div>
        </QueryClientProvider>
      </Provider>
    ),
  ],
  args: {
    chainId: CHAIN_ID,
    tokenAddress: MUSD_TOKEN_ADDRESS,
    positionFiatValue: 1000,
    showFiat: true,
    hasPositiveBalance: true,
  },
};

export default meta;
type Story = StoryObj<typeof MusdBonusSection>;

export const DefaultStory: Story = {};
DefaultStory.storyName = 'Default';

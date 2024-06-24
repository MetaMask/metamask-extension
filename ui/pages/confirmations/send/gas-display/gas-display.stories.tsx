import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import GasDisplay from './gas-display';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import { I18nContext } from '../../../../contexts/i18n';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import { useGasFeeContext } from '../../../../contexts/gasFee';
import useRamps from '../../../../hooks/experiences/useRamps';
import getProviderConfig from '../../../../ducks/metamask/metamask';
import getIsTestnet from '../../../../ducks/metamask/metamask';
import getIsBuyableChain from '../../../../ducks/metamask/metamask';
import getCurrentDraftTransaction from '../../../../ducks/metamask/metamask';
import getUseCurrencyRateCheck from '../../../../ducks/metamask/metamask';
import getPreferences from '../../../../ducks/metamask/metamask';
import getUnapprovedTransactions from '../../../../ducks/metamask/metamask';
import getNativeCurrency from '../../../../ducks/metamask/metamask';
import { transactionFeeSelector } from '../../../../selectors';
import { showModal } from '../../../../store/actions';
import { addHexes, hexWEIToDecETH } from '../../../../../shared/modules/conversion.utils';
import { INSUFFICIENT_TOKENS_ERROR } from '../send.constants';
import { NETWORK_TO_NAME_MAP } from '../../../../../shared/constants/network';

const storeMock = createStore(() => ({
  metamask: {
    providerConfig: { chainId: '1', nickname: 'Mainnet' },
    isTestnet: false,
    isBuyableChain: true,
    draftTransaction: {
      gas: { gasPrice: '0x1', gasLimit: '0x5208', maxFeePerGas: '0x1', maxPriorityFeePerGas: '0x1' },
      amount: { value: '0x1', error: null },
      transactionType: '0x0',
      sendAsset: { type: 'NATIVE', details: { standard: 'ERC20', name: 'Ether', symbol: 'ETH' } },
    },
    useCurrencyRateCheck: true,
    preferences: { showFiatInTestnets: true, useNativeCurrencyAsPrimaryCurrency: true },
    unapprovedTxs: {},
    nativeCurrency: 'ETH',
  },
}));

const meta: Meta<typeof GasDisplay> = {
  title: 'Components/ComponentLibrary/GasDisplay',
  component: GasDisplay,
  decorators: [
    (Story) => (
      <Provider store={storeMock}>
        <I18nContext.Provider value={(key) => key}>
          <MetaMetricsContext.Provider value={(payload, options) => Promise.resolve()}>
            <Story />
          </MetaMetricsContext.Provider>
        </I18nContext.Provider>
      </Provider>
    ),
  ],
  argTypes: {
    gasError: {
      control: 'text',
    },
  },
  args: {
    gasError: '',
  },
};

export default meta;
type Story = StoryObj<typeof GasDisplay>;

export const DefaultStory: Story = {};

DefaultStory.storyName = 'Default';

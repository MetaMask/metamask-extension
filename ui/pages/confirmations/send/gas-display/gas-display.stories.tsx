import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import GasDisplay from './gas-display';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import { I18nContext } from '../../../../contexts/i18n';
import { MetaMetricsContext } from '../../../../contexts/metametrics';

const storeMock = createStore(() => ({
  metamask: {
    providerConfig: { chainId: '1', nickname: 'Mainnet', ticker: 'ETH' },
    isTestnet: false,
    isBuyableChain: true,
    currentTransactionUUID: 'test-uuid',
    draftTransactions: {
      'test-uuid': {
        id: 'test-uuid',
        gas: { gasPrice: '0x3B9ACA00', gasLimit: '0x5208', maxFeePerGas: '0x3B9ACA00', maxPriorityFeePerGas: '0x3B9ACA00' },
        amount: { value: '0xDE0B6B3A7640000', error: null },
        transactionType: '0x0',
        sendAsset: { type: 'NATIVE', details: { standard: 'ERC20', name: 'Ether', symbol: 'ETH' } },
      },
    },
    useCurrencyRateCheck: true,
    preferences: { showFiatInTestnets: true, useNativeCurrencyAsPrimaryCurrency: true },
    unapprovedTxs: {
      'test-uuid': {
        id: 'test-uuid',
        userEditedGasLimit: false,
        txParams: {
          gas: '0x5208',
          gasPrice: '0x3B9ACA00',
          maxFeePerGas: '0x3B9ACA00',
          maxPriorityFeePerGas: '0x3B9ACA00',
          value: '0xDE0B6B3A7640000',
        },
        userFeeLevel: 'medium',
      },
    },
    nativeCurrency: 'ETH',
    conversionRate: 1,
    currencyRates: {
      ETH: {
        conversionRate: 1,
      },
    },
    gasFeeEstimates: {
      gasPrice: '0x3B9ACA00',
      estimatedBaseFee: '0x3B9ACA00',
      medium: {
        suggestedMaxPriorityFeePerGas: '0x3B9ACA00',
        suggestedMaxFeePerGas: '0x3B9ACA00',
      },
    },
    gasEstimateType: 'feeMarket',
    networkAndAccountSupportsEIP1559: true,
    transactionFee: {
      hexMinimumTransactionFee: '0x3B9ACA00',
      hexMaximumTransactionFee: '0x3B9ACA00',
      hexTransactionTotal: '0x3B9ACA00',
    },
  },
}));

const meta: Meta<typeof GasDisplay> = {
  title: 'Components/ui/GasDisplay',
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

export const DefaultStory: Story = {
  render: (args) => {
    const state = storeMock.getState();
    console.log('State:', state);
    console.log('currentTransactionUUID:', state.metamask.currentTransactionUUID);
    console.log('draftTransactions:', state.metamask.draftTransactions);
    return <GasDisplay {...args} />;
  },
};

DefaultStory.storyName = 'Default';

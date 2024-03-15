import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Provider } from 'react-redux';
import configureStore from '../../../store/store';
import { SimulationPreview } from './simulation-preview';
import mockState from '../../../../test/data/mock-state.json';
import { SimulationTokenStandard } from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';

const DUMMY_BALANCE_CHANGE = {
  previousBalance: '0xIGNORED' as Hex,
  newBalance: '0xIGNORED' as Hex,
}

const ERC20_TOKEN_MOCK = '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599'; // WETH

const storeMock = configureStore({
  metamask: {
    ...mockState.metamask,
    preferences: {
      ...mockState.metamask.preferences,
      useNativeCurrencyAsPrimaryCurrency: false,
    },
  },
});

const meta: Meta<typeof SimulationPreview> = {
  title: 'Components/App/SimulationPreview',
  component: SimulationPreview,
  decorators: [(story) => <Provider store={storeMock}>{story()}</Provider>],
};

export default meta;
type Story = StoryObj<typeof SimulationPreview>;

export const BuyErc20: Story = {
  args: {
    simulationData: {
      nativeBalanceChange: {
        ...DUMMY_BALANCE_CHANGE,
        difference: '0x12345678912345678',
        isDecrease: true,
      },
      tokenBalanceChanges: [{
        ...DUMMY_BALANCE_CHANGE,
        address: ERC20_TOKEN_MOCK,
        difference: '0x123456',
        isDecrease: false,
        standard: SimulationTokenStandard.erc20,
      }],
    },
  },
};


export const PositiveNativeChange: Story = {
  args: {
    simulationData: {
      nativeBalanceChange: {
        previousBalance: '0x2',
        newBalance: '0x1',
        difference: '0x12345678912345678',
        isDecrease: false,
      },
      tokenBalanceChanges: [],
    },
  },
};

export const NegativeNativeChange: Story = {
  args: {
    simulationData: {
      nativeBalanceChange: {
        previousBalance: '0x1',
        newBalance: '0x2',
        difference: '0x12345678912345678',
        isDecrease: true,
      },
      tokenBalanceChanges: [],
    },
  },
};

export const NoBalanceChanges: Story = {
  args: {
    simulationData: {
      nativeBalanceChange: undefined,
      tokenBalanceChanges: [],
    },
  },
};

export const SimulationFailed: Story = {
  args: {},
}

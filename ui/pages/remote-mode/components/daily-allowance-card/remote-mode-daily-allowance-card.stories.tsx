import React from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import configureStore from '../../../../store/store';
import RemoteModeDailyAllowanceCard from './remote-mode-daily-allowance-card.component';
import testData from '../../../../../.storybook/test-data';
import {
  TOKEN_DETAILS,
  TokenSymbol,
} from '../../../../../shared/lib/remote-mode';
import { AssetType } from '@metamask/bridge-controller';

const store = configureStore(testData);

const mockDailyAllowance = {
  symbol: TokenSymbol.ETH,
  amount: 1000,
  image: TOKEN_DETAILS[TokenSymbol.ETH].image,
  name: TOKEN_DETAILS[TokenSymbol.ETH].name,
  type: AssetType.native,
  address: '',
  decimals: 18,
};

export default {
  title: 'Components/Vault/RemoteMode/RemoteModeDailyAllowanceCard',
  component: RemoteModeDailyAllowanceCard,
  decorators: [
    (story) => (
      <Provider store={store}>
        <MemoryRouter>{story()}</MemoryRouter>
      </Provider>
    ),
  ],
};

export const Default = () => (
  <RemoteModeDailyAllowanceCard
    dailyAllowance={mockDailyAllowance}
    onRemove={() => {}}
  />
);

export const DifferentTokens = () => (
  <RemoteModeDailyAllowanceCard
    dailyAllowance={{
      symbol: TokenSymbol.ETH,
      image: TOKEN_DETAILS[TokenSymbol.ETH].image,
      name: TOKEN_DETAILS[TokenSymbol.ETH].name,
      type: AssetType.native,
      address: '',
      amount: 5,
      decimals: 18,
    }}
    onRemove={() => {}}
  />
);

export const LargeAmount = () => (
  <RemoteModeDailyAllowanceCard
    dailyAllowance={{
      symbol: TokenSymbol.ETH,
      image: TOKEN_DETAILS[TokenSymbol.ETH].image,
      name: TOKEN_DETAILS[TokenSymbol.ETH].name,
      type: AssetType.native,
      address: '',
      amount: 1000000,
      decimals: 18,
    }}
    onRemove={() => {}}
  />
);

export const WithRemoveHandler = () => (
  <RemoteModeDailyAllowanceCard
    dailyAllowance={mockDailyAllowance}
    onRemove={() => alert('Remove clicked!')}
  />
);

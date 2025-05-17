import React from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import configureStore from '../../../../store/store';
import RemoteModeDailyAllowanceCard from './remote-mode-daily-allowance-card.component';
import testData from '../../../../../.storybook/test-data';
import { DailyAllowanceTokenTypes } from '../../remote.types';

const store = configureStore(testData);

const mockDailyAllowance = {
  tokenType: DailyAllowanceTokenTypes.ETH,
  amount: 1000,
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
      tokenType: DailyAllowanceTokenTypes.ETH,
      amount: 5,
    }}
    onRemove={() => {}}
  />
);

export const LargeAmount = () => (
  <RemoteModeDailyAllowanceCard
    dailyAllowance={{
      tokenType: DailyAllowanceTokenTypes.ETH,
      amount: 1000000,
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

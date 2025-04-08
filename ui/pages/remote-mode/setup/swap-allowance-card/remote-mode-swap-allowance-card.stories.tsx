import React from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import configureStore from '../../../../store/store';
import RemoteModeSwapAllowanceCard from './remote-mode-swap-allowance-card.component';
import testData from '../../../../../.storybook/test-data';
import { TokenSymbol } from '../../remote.types';
const store = configureStore(testData);

const mockSwapAllowance = {
  from: TokenSymbol.USDC,
  to: 'High liquidity token',
  amount: 1000,
};

export default {
  title: 'Components/Vault/RemoteMode/RemoteModeSwapAllowanceCard',
  component: RemoteModeSwapAllowanceCard,
  decorators: [
    (story) => (
      <Provider store={store}>
        <MemoryRouter>{story()}</MemoryRouter>
      </Provider>
    ),
  ],
};

export const Default = () => (
  <RemoteModeSwapAllowanceCard
    swapAllowance={mockSwapAllowance}
    onRemove={() => {}}
  />
);

export const DifferentTokens = () => (
  <RemoteModeSwapAllowanceCard
    swapAllowance={{
      from: TokenSymbol.WETH,
      to: 'Low liquidity token',
      amount: 5,
    }}
    onRemove={() => {}}
  />
);

export const LargeAmount = () => (
  <RemoteModeSwapAllowanceCard
    swapAllowance={{
      from: TokenSymbol.USDC,
      to: 'Medium liquidity token',
      amount: 1000000,
    }}
    onRemove={() => {}}
  />
);

export const WithRemoveHandler = () => (
  <RemoteModeSwapAllowanceCard
    swapAllowance={mockSwapAllowance}
    onRemove={() => alert('Remove clicked!')}
  />
);

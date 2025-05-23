import React from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import configureStore from '../../../../store/store';
import RemoteModeSwapAllowanceCard from './remote-mode-swap-allowance-card.component';
import testData from '../../../../../.storybook/test-data';
import { TokenInfo, TokenSymbol } from '../../../../../shared/lib/remote-mode';
import { AssetType } from '@metamask/bridge-controller';
const store = configureStore(testData);

const mockSwapAllowance = {
  from: TokenSymbol.USDC,
  to: TokenSymbol.ETH,
  amount: 1000,
  decimals: 6,
  type: AssetType.token,
  address: '',
  name: '',
  image: '',
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
      to: TokenSymbol.ETH,
      amount: 5,
    }}
    onRemove={() => {}}
  />
);

export const LargeAmount = () => (
  <RemoteModeSwapAllowanceCard
    swapAllowance={{
      from: TokenSymbol.USDC,
      to: TokenSymbol.ETH,
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

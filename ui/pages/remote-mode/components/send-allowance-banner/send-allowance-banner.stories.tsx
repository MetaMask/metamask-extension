import React from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import configureStore from '../../../../store/store';
import SendAllowanceBanner from './send-allowance-banner.component';
import testData from '../../../../../.storybook/test-data';
import {
  DailyAllowance,
  TOKEN_DETAILS,
  TokenSymbol,
} from '../../../../../shared/lib/remote-mode';
import { AssetType } from '@metamask/bridge-controller';

const store = configureStore(testData);

const mockAllowance: DailyAllowance = {
  name: TOKEN_DETAILS[TokenSymbol.ETH].name,
  type: AssetType.native,
  address: '',
  image: TOKEN_DETAILS[TokenSymbol.ETH].image,
  symbol: TokenSymbol.ETH,
  amount: 100,
};

export default {
  title: 'Components/Vault/RemoteMode/SendAllowanceBanner',
  component: SendAllowanceBanner,
  decorators: [
    (story) => (
      <Provider store={store}>
        <MemoryRouter>{story()}</MemoryRouter>
      </Provider>
    ),
  ],
};

export const Default = () => <SendAllowanceBanner allowance={mockAllowance} />;

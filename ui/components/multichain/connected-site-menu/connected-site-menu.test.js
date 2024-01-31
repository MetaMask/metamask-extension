import React from 'react';
import configureMockStore from 'redux-mock-store';
import { EthAccountType, EthMethod } from '@metamask/keyring-api';
import { renderWithProvider } from '../../../../test/jest';
import {
  STATUS_CONNECTED,
  STATUS_CONNECTED_TO_ANOTHER_ACCOUNT,
  STATUS_NOT_CONNECTED,
} from '../../../helpers/constants/connected-sites';
import {
  BackgroundColor,
  Color,
} from '../../../helpers/constants/design-system';
import { ConnectedSiteMenu } from '.';

describe('Connected Site Menu', () => {
  const internalAccounts = {
    accounts: {
      'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3': {
        address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
        id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
        metadata: {
          name: 'Account 1',
          keyring: {
            type: 'HD Key Tree',
          },
        },
        options: {},
        methods: [...Object.values(EthMethod)],
        type: EthAccountType.Eoa,
      },
      '07c2cfec-36c9-46c4-8115-3836d3ac9047': {
        address: '0xec1adf982415d2ef5ec55899b9bfb8bc0f29251b',
        id: '07c2cfec-36c9-46c4-8115-3836d3ac9047',
        metadata: {
          name: 'Account 2',
          keyring: {
            type: 'HD Key Tree',
          },
        },
        options: {},
        methods: [...Object.values(EthMethod)],
        type: EthAccountType.Eoa,
      },
    },
    selectedAccount: '07c2cfec-36c9-46c4-8115-3836d3ac9047',
  };

  const accounts = {
    '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': {
      address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
      balance: '0x0',
    },
    '0xec1adf982415d2ef5ec55899b9bfb8bc0f29251b': {
      address: '0xec1adf982415d2ef5ec55899b9bfb8bc0f29251b',
      balance: '0x0',
    },
  };
  const mockStore = {
    metamask: {
      internalAccounts,
      accounts,
      subjectMetadata: {
        'https://uniswap.org/': {
          iconUrl: 'https://uniswap.org/favicon.ico',
          name: 'Uniswap',
        },
      },
    },
    activeTab: {
      origin: 'https://uniswap.org/',
    },
  };
  it('should render the site menu in connected state', () => {
    const props = {
      globalMenuColor: Color.successDefault,
      text: 'connected',
      status: STATUS_CONNECTED,
    };
    const store = configureMockStore()(mockStore);
    const { getByTestId, container } = renderWithProvider(
      <ConnectedSiteMenu {...props} />,
      store,
    );
    expect(getByTestId('connection-menu')).toBeDefined();
    expect(container).toMatchSnapshot();
  });
  it('should render the site menu in not connected state', () => {
    const props = {
      globalMenuColor: Color.iconAlternative,
      status: STATUS_NOT_CONNECTED,
    };
    const store = configureMockStore()(mockStore);
    const { getByTestId, container } = renderWithProvider(
      <ConnectedSiteMenu {...props} />,
      store,
    );
    expect(getByTestId('connection-menu')).toBeDefined();
    expect(container).toMatchSnapshot();
  });
  it('should render the site menu in not connected to current account state', () => {
    const props = {
      globalMenuColor: BackgroundColor.backgroundDefault,
      text: 'not connected',
      status: STATUS_CONNECTED_TO_ANOTHER_ACCOUNT,
    };
    const store = configureMockStore()(mockStore);
    const { getByTestId, container } = renderWithProvider(
      <ConnectedSiteMenu {...props} />,
      store,
    );
    expect(getByTestId('connection-menu')).toBeDefined();
    expect(container).toMatchSnapshot();
  });
});

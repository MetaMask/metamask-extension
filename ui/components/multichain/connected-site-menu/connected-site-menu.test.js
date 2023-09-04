import React from 'react';
import configureMockStore from 'redux-mock-store';
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
  const selectedAddress = '0xec1adf982415d2ef5ec55899b9bfb8bc0f29251b';

  const identities = {
    '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': {
      address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
      name: 'Account 1',
    },
    '0xec1adf982415d2ef5ec55899b9bfb8bc0f29251b': {
      address: '0xec1adf982415d2ef5ec55899b9bfb8bc0f29251b',
      name: 'Account 2',
    },
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
      selectedAddress,
      identities,
      accounts,
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

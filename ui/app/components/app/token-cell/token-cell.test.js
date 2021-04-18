import React from 'react';
import thunk from 'redux-thunk';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import { mount } from 'enzyme';
import sinon from 'sinon';
import { MemoryRouter } from 'react-router-dom';

import Identicon from '../../ui/identicon';
import TokenCell from '.';

describe('Token Cell', () => {
  let wrapper;

  const state = {
    metamask: {
      currentCurrency: 'usd',
      selectedAddress: '0xAddress',
      contractExchangeRates: {
        '0xAnotherToken': 0.015,
      },
      conversionRate: 7.0,
      preferences: {},
      provider: {
        chainId: '0x1',
        ticker: 'ETH',
        type: 'mainnet',
      },
    },
    appState: {
      sidebar: {
        isOpen: true,
      },
    },
  };

  const middlewares = [thunk];
  const mockStore = configureMockStore(middlewares);
  const store = mockStore(state);

  let onClick;

  beforeEach(() => {
    onClick = sinon.stub();
    wrapper = mount(
      <Provider store={store}>
        <MemoryRouter>
          <TokenCell
            address="0xAnotherToken"
            symbol="TEST"
            string="5.000"
            currentCurrency="usd"
            image="./test-image"
            onClick={onClick}
          />
        </MemoryRouter>
      </Provider>,
    );
  });

  afterEach(() => {
    sinon.restore();
  });

  it('renders Identicon with props from token cell', () => {
    expect(wrapper.find(Identicon).prop('address')).toStrictEqual(
      '0xAnotherToken',
    );
    expect(wrapper.find(Identicon).prop('image')).toStrictEqual('./test-image');
  });

  it('renders token balance', () => {
    expect(wrapper.find('.asset-list-item__token-value').text()).toStrictEqual(
      '5.000',
    );
  });

  it('renders token symbol', () => {
    expect(wrapper.find('.asset-list-item__token-symbol').text()).toStrictEqual(
      'TEST',
    );
  });

  it('renders converted fiat amount', () => {
    expect(wrapper.find('.list-item__subheading').text()).toStrictEqual(
      '$0.52 USD',
    );
  });

  it('calls onClick when clicked', () => {
    expect(!onClick.called).toStrictEqual(true);
    wrapper.simulate('click');
    expect(onClick.called).toStrictEqual(true);
  });
});

import React from 'react';
import sinon from 'sinon';
import { mount } from 'enzyme';
import SettingsTab from './settings-tab.container';
import 'jest-canvas-mock';

describe('Settings Tab', () => {
  let wrapper;

  const props = {
    setCurrentCurrency: sinon.spy(),
    displayWarning: sinon.spy(),
    setUseBlockie: sinon.spy(),
    updateCurrentLocale: sinon.spy(),
    setUseNativeCurrencyAsPrimaryCurrencyPreference: sinon.spy(),
    setHideZeroBalanceTokens: sinon.spy(),
    warning: '',
    currentLocale: 'en',
    useBlockie: false,
    currentCurrency: 'usd',
    conversionDate: 1,
    nativeCurrency: 'eth',
    useNativeCurrencyAsPrimaryCurrency: true,
    selectedAddress: '0x5CfE73b6021E818B776b421B1c4Db2474086a7e1',
    tokenList: {
      '0x6b175474e89094c44da98b954eedeac495271d0f': {
        address: '0x6b175474e89094c44da98b954eedeac495271d0f',
        symbol: 'META',
        decimals: 18,
        image: 'metamark.svg',
        unlisted: false,
      },
      '0xB8c77482e45F1F44dE1745F52C74426C631bDD52': {
        address: '0xB8c77482e45F1F44dE1745F52C74426C631bDD52',
        symbol: '0X',
        decimals: 18,
        image: '0x.svg',
        unlisted: false,
      },
      '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984': {
        address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
        symbol: 'AST',
        decimals: 18,
        image: 'ast.png',
        unlisted: false,
      },
      '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2': {
        address: '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2',
        symbol: 'BAT',
        decimals: 18,
        image: 'BAT_icon.svg',
        unlisted: false,
      },
      '0xe83cccfabd4ed148903bf36d4283ee7c8b3494d1': {
        address: '0xe83cccfabd4ed148903bf36d4283ee7c8b3494d1',
        symbol: 'CVL',
        decimals: 18,
        image: 'CVL_token.svg',
        unlisted: false,
      },
      '0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e': {
        address: '0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e',
        symbol: 'GLA',
        decimals: 18,
        image: 'gladius.svg',
        unlisted: false,
      },
      '0x467Bccd9d29f223BcE8043b84E8C8B282827790F': {
        address: '0x467Bccd9d29f223BcE8043b84E8C8B282827790F',
        symbol: 'GNO',
        decimals: 18,
        image: 'gnosis.svg',
        unlisted: false,
      },
      '0xff20817765cb7f73d4bde2e66e067e58d11095c2': {
        address: '0xff20817765cb7f73d4bde2e66e067e58d11095c2',
        symbol: 'OMG',
        decimals: 18,
        image: 'omg.jpg',
        unlisted: false,
      },
      '0x8e870d67f660d95d5be530380d0ec0bd388289e1': {
        address: '0x8e870d67f660d95d5be530380d0ec0bd388289e1',
        symbol: 'WED',
        decimals: 18,
        image: 'wed.png',
        unlisted: false,
      },
    },
  };
  beforeEach(() => {
    wrapper = mount(<SettingsTab.WrappedComponent {...props} />, {
      context: {
        t: (str) => str,
      },
    });
  });

  it('selects currency', async () => {
    const selectCurrency = wrapper.find('#select-currency');

    selectCurrency.props().onChange('eur');
    expect(props.setCurrentCurrency.calledOnce).toStrictEqual(true);
  });

  it('selects locale', async () => {
    const selectLocale = wrapper.find('#select-locale');

    await selectLocale.props().onChange('ja');
    expect(props.updateCurrentLocale.calledOnce).toStrictEqual(true);
  });

  it('sets fiat primary currency', () => {
    const selectFiat = wrapper.find('#fiat-primary-currency');

    selectFiat.simulate('change');
    expect(
      props.setUseNativeCurrencyAsPrimaryCurrencyPreference.calledOnce,
    ).toStrictEqual(true);
  });

  it('clicks jazzicon', () => {
    const toggleBlockies = wrapper.find('#jazzicon');

    toggleBlockies.simulate('click');
    expect(props.setUseBlockie.calledOnce).toStrictEqual(true);
  });

  it('clicks blockies icon', () => {
    const toggleBlockies = wrapper.find('#blockies');

    toggleBlockies.simulate('click');
    expect(props.setUseBlockie.calledOnce).toStrictEqual(false);
  });

  it('toggles hiding zero balance', () => {
    const toggleBlockies = wrapper.find('#toggle-zero-balance input');

    toggleBlockies.simulate('click');
    expect(props.setHideZeroBalanceTokens.calledOnce).toStrictEqual(true);
  });
});

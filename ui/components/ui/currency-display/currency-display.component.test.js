import React from 'react';
import { shallow } from 'enzyme';
import sinon from 'sinon';
import * as reactRedux from 'react-redux';
import CurrencyDisplay from './currency-display.component';

describe('CurrencyDisplay Component', () => {
  beforeEach(() => {
    const stub = sinon.stub(reactRedux, 'useSelector');
    stub.callsFake(() => ({
      currentCurrency: 'usd',
      nativeCurrency: 'ETH',
      conversionRate: 280.45,
    }));
  });
  afterEach(() => {
    sinon.restore();
  });
  it('should render text with a className', () => {
    const wrapper = shallow(
      <CurrencyDisplay
        displayValue="$123.45"
        className="currency-display"
        hideLabel
      />,
    );

    expect(wrapper.hasClass('currency-display')).toStrictEqual(true);
    expect(wrapper.text()).toStrictEqual('$123.45');
  });

  it('should render text with a prefix', () => {
    const wrapper = shallow(
      <CurrencyDisplay
        displayValue="$123.45"
        className="currency-display"
        prefix="-"
        hideLabel
      />,
    );

    expect(wrapper.hasClass('currency-display')).toStrictEqual(true);
    expect(wrapper.text()).toStrictEqual('-$123.45');
  });
});

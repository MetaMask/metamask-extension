import React from 'react';
import { shallow } from 'enzyme';
import HexToDecimal from './hex-to-decimal.component';

describe('HexToDecimal Component', () => {
  it('should render a prefixed hex as a decimal with a className', () => {
    const wrapper = shallow(
      <HexToDecimal value="0x3039" className="hex-to-decimal" />,
    );

    expect(wrapper.hasClass('hex-to-decimal')).toStrictEqual(true);
    expect(wrapper.text()).toStrictEqual('12345');
  });

  it('should render an unprefixed hex as a decimal with a className', () => {
    const wrapper = shallow(
      <HexToDecimal value="1A85" className="hex-to-decimal" />,
    );

    expect(wrapper.hasClass('hex-to-decimal')).toStrictEqual(true);
    expect(wrapper.text()).toStrictEqual('6789');
  });
});

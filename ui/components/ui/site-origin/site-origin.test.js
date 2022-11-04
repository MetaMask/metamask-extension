import React from 'react';
import { shallow } from 'enzyme';
import SiteOrigin from './site-origin';

describe('SiteOrigin', () => {
  const defaultProps = {
    siteOrigin: 'https://example.com',
    iconSrc: 'https://example.com/icon.png',
    iconName: 'icon',
    chip: false,
    className: '',
    rightIcon: false,
  };

  it('renders number and hyphen prefixed domains correctly', () => {
    const numberHyphenPrefixOrigin = '0-example.com';
    const wrapper = shallow(
      <SiteOrigin {...defaultProps} siteOrigin={numberHyphenPrefixOrigin} />,
    );
    const bdiElement = wrapper.find('bdi');

    expect(bdiElement.text()).toBe('0-example.com');
  });
});

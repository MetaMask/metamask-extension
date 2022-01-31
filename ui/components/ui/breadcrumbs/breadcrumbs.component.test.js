import React from 'react';
import { shallow } from 'enzyme';
import Breadcrumbs from './breadcrumbs.component';

describe('Breadcrumbs Component', () => {
  it('should render with the correct colors', () => {
    const wrapper = shallow(<Breadcrumbs currentIndex={1} total={3} />);

    expect(wrapper).toHaveLength(1);
    expect(wrapper.find('.breadcrumbs')).toHaveLength(1);
    expect(wrapper.find('.breadcrumb')).toHaveLength(3);
    expect(
      wrapper.find('.breadcrumb').at(0).props().style.backgroundColor,
    ).toStrictEqual('#FFFFFF');
    expect(
      wrapper.find('.breadcrumb').at(1).props().style.backgroundColor,
    ).toStrictEqual('#D8D8D8');
    expect(
      wrapper.find('.breadcrumb').at(2).props().style.backgroundColor,
    ).toStrictEqual('#FFFFFF');
  });
});

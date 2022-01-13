import React from 'react';
import { shallow } from 'enzyme';
import Confusable from './confusable.component';

describe('Confusable component', () => {
  it('should detect zero-width unicode', () => {
    const wrapper = shallow(<Confusable input="vita‍lik.eth" />);
    expect(wrapper.find('.confusable__point')).toHaveLength(1);
  });

  it('should detect homoglyphic unicode points', () => {
    const wrapper = shallow(<Confusable input="faceboоk.eth" />);
    expect(wrapper.find('.confusable__point')).toHaveLength(1);
  });

  it('should detect multiple homoglyphic unicode points', () => {
    const wrapper = shallow(<Confusable input="ѕсоре.eth" />);
    expect(wrapper.find('.confusable__point')).toHaveLength(5);
  });

  it('should not detect emoji', () => {
    const wrapper = shallow(<Confusable input="👻.eth" />);
    expect(wrapper.find('.confusable__point')).toHaveLength(0);
  });
});

import assert from 'assert';
import React from 'react';
import { shallow } from 'enzyme';
import Confusable from './confusable.component';

describe('Confusable component', function () {
  it('should detect zero-width unicode', function () {
    const wrapper = shallow(<Confusable input="vita‍lik.eth" />);
    assert.ok(wrapper.find('.confusable__point').length === 1);
  });

  it('should detect homoglyphic unicode points', function () {
    const wrapper = shallow(<Confusable input="faceboоk.eth" />);
    assert.ok(wrapper.find('.confusable__point').length === 1);
  });

  it('should detect multiple homoglyphic unicode points', function () {
    const wrapper = shallow(<Confusable input="ѕсоре.eth" />);
    assert.ok(wrapper.find('.confusable__point').length === 5);
  });

  it('should not detect emoji', function () {
    const wrapper = shallow(<Confusable input="👻.eth" />);
    assert.ok(wrapper.find('.confusable__point').length === 0);
  });
});

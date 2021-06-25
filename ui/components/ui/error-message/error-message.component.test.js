import React from 'react';
import { shallow } from 'enzyme';
import ErrorMessage from './error-message.component';

describe('ErrorMessage Component', () => {
  const t = (key) => `translate ${key}`;

  it('should render a message from props.errorMessage', () => {
    const wrapper = shallow(<ErrorMessage errorMessage="This is an error." />, {
      context: { t },
    });

    expect(wrapper).toHaveLength(1);
    expect(wrapper.find('.error-message')).toHaveLength(1);
    expect(wrapper.find('.error-message__icon')).toHaveLength(1);
    expect(wrapper.find('.error-message__text')).toHaveLength(1);
    expect(wrapper.find('.error-message__text').text()).toStrictEqual(
      'This is an error.',
    );
  });

  it('should render a message translated from props.errorKey', () => {
    const wrapper = shallow(<ErrorMessage errorKey="testKey" />, {
      context: { t },
    });

    expect(wrapper).toHaveLength(1);
    expect(wrapper.find('.error-message')).toHaveLength(1);
    expect(wrapper.find('.error-message__icon')).toHaveLength(1);
    expect(wrapper.find('.error-message__text')).toHaveLength(1);
    expect(wrapper.find('.error-message__text').text()).toStrictEqual(
      'translate testKey',
    );
  });
});

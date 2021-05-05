import React from 'react';
import { shallow } from 'enzyme';
import SendRowErrorMessage from './send-row-error-message.component';

describe('SendRowErrorMessage Component', () => {
  let wrapper;

  describe('render', () => {
    beforeEach(() => {
      wrapper = shallow(
        <SendRowErrorMessage
          errors={{ error1: 'abc', error2: 'def' }}
          errorType="error3"
        />,
        { context: { t: (str) => `${str}_t` } },
      );
    });

    it('should render null if the passed errors do not contain an error of errorType', () => {
      expect(wrapper.find('.send-v2__error')).toHaveLength(0);
      expect(wrapper.html()).toBeNull();
    });

    it('should render an error message if the passed errors contain an error of errorType', () => {
      wrapper.setProps({
        errors: { error1: 'abc', error2: 'def', error3: 'xyz' },
      });
      expect(wrapper.find('.send-v2__error')).toHaveLength(1);
      expect(wrapper.find('.send-v2__error').text()).toStrictEqual('xyz_t');
    });
  });
});

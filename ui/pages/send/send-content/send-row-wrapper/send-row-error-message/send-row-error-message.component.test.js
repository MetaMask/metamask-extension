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
        errors: { error1: 'abc', error2: 'def', negativeETH: 'negativeETH' },
        errorType: 'negativeETH',
      });
      expect(wrapper.find('.send-v2__error')).toHaveLength(1);
      expect(wrapper.find('.send-v2__error').text()).toStrictEqual(
        'negativeETH_t',
      );

      wrapper.setProps({
        errors: {
          error1: 'abc',
          error2: 'def',
          invalidHexString: 'invalidHexString',
        },
        errorType: 'invalidHexString',
      });
      expect(wrapper.find('.send-v2__error')).toHaveLength(1);
      expect(wrapper.find('.send-v2__error').text()).toStrictEqual(
        'invalidHexString_t',
      );
    });
  });
});

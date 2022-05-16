import sinon from 'sinon';
import React from 'react';
import { shallow } from 'enzyme';
import SendRowWrapper from '../send-row-wrapper/send-row-wrapper.component';
import SendHexDataRow from './send-hex-data-row.component';

require('./send-hex-data-row.container.js');

const updateSendHexData = sinon.spy();

function shallowRenderSendHexDataRow() {
  const wrapper = shallow(
    <SendHexDataRow updateSendHexData={updateSendHexData} />,
    {
      context: { t: (str) => `${str}_t` },
    },
  );
  const instance = wrapper.instance();

  return {
    instance,
    wrapper,
    propsMethodSpies: {
      updateSendHexData,
    },
  };
}

describe('send-hex-data-row container', () => {
  describe('render', () => {
    it('should render a SendHexData component', () => {
      const { wrapper } = shallowRenderSendHexDataRow();

      expect(wrapper.find(SendRowWrapper)).toHaveLength(1);
    });

    it('should pass the correct props to SendRowWrapper', () => {
      const { wrapper } = shallowRenderSendHexDataRow();
      const { errorType, label, showError } = wrapper
        .find(SendRowWrapper)
        .props();

      expect(errorType).toStrictEqual('amount');
      expect(label).toStrictEqual('hexData_t:');
      expect(showError).toBeUndefined();
    });

    it('should render a textarea', () => {
      const { wrapper } = shallowRenderSendHexDataRow();

      expect(wrapper.find('textarea').exists()).toStrictEqual(true);
    });
  });
});

import React from 'react';
import sinon from 'sinon';
import { mount } from 'enzyme';
import ExperimentalTab from './experimental-tab.container';

describe('Experimental Tab', () => {
  let wrapper;

  const props = {
    useTokenDetection: true,
    setUseTokenDetection: sinon.spy(),
  };

  beforeEach(() => {
    wrapper = mount(<ExperimentalTab.WrappedComponent {...props} />, {
      context: {
        t: (str) => str,
        metricsEvent: () => undefined,
      },
    });
  });

  it('toggles Use Token detection', () => {
    const useTokenDetection = wrapper.find({ type: 'checkbox' }).at(0);
    useTokenDetection.simulate('click');
    expect(props.setUseTokenDetection.calledOnce).toStrictEqual(true);
  });
});

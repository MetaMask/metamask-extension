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

  it('toggles Use Token detection', () => {
    wrapper = mount(<ExperimentalTab.WrappedComponent {...props} />, {
      context: {
        t: (str) => str,
        trackEvent: () => undefined,
      },
    });
    const useTokenDetection = wrapper.find({ type: 'checkbox' }).at(0);
    useTokenDetection.simulate('click');
    expect(props.setUseTokenDetection.calledOnce).toStrictEqual(true);
  });

  /** TODO: Remove during TOKEN_DETECTION_V2 feature flag clean up */
  it('should not show use token detection toggle', () => {
    process.env.TOKEN_DETECTION_V2 = true;
    wrapper = mount(<ExperimentalTab.WrappedComponent {...props} />, {
      context: {
        t: (str) => str,
        trackEvent: () => undefined,
      },
    });
    const useTokenDetectionText = wrapper.find({ text: 'Use Token Detection' });
    expect(useTokenDetectionText).toHaveLength(0);
  });
});

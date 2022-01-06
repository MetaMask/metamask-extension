import React from 'react';
import sinon from 'sinon';
import { shallow } from 'enzyme';
import Alert from '.';

describe('Alert', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallow(<Alert visible={false} />);
  });

  it('renders nothing with no visible boolean in state', () => {
    const alert = wrapper.find('.global-alert');
    expect(alert).toHaveLength(0);
  });

  it('renders when visible in state is true, and message', () => {
    const errorMessage = 'Error Message';

    wrapper.setState({ visible: true, msg: errorMessage });

    const alert = wrapper.find('.global-alert');
    expect(alert).toHaveLength(1);

    const errorText = wrapper.find('.msg');
    expect(errorText.text()).toStrictEqual(errorMessage);
  });

  it('calls component method when componentWillReceiveProps is called', () => {
    const animateInSpy = sinon.stub(wrapper.instance(), 'animateIn');
    const animateOutSpy = sinon.stub(wrapper.instance(), 'animateOut');

    wrapper.setProps({ visible: true });
    expect(animateInSpy.calledOnce).toStrictEqual(true);

    wrapper.setProps({ visible: false });
    expect(animateOutSpy.calledOnce).toStrictEqual(true);
  });
});

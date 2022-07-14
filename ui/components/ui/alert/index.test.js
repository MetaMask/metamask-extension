import React from 'react';
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
});

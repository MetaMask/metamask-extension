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
});

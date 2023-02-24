import React from 'react';
import { mount } from 'enzyme';
import CustodyIcon from '../custody-icon.component';

describe('Custody Icon Component', function () {
  let wrapper;

  beforeEach(() => {
    wrapper = mount(
      <CustodyIcon
        className="test-class"
        color="#3098DC"
        width={10}
        height={10}
      />,
    );
  });

  it('displays icon with proper class', () => {
    expect(wrapper.hasClass('test-class')).toBe(true);
  });
});

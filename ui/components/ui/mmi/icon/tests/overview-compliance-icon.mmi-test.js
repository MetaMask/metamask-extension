import React from 'react';
import { mount } from 'enzyme';
import ComplianceIcon from '../overview-compliance-icon.component';

describe('Compliance Icon Component', function () {
  let wrapper;

  beforeEach(() => {
    wrapper = mount(
      <ComplianceIcon className="test-class" color="#3098DC" size={10} />,
    );
  });

  it('displays icon with proper class', () => {
    expect(wrapper.hasClass('test-class')).toBe(true);
  });
});

import React from 'react';
import { mount } from 'enzyme';
import ComplianceFeatureIcon from '../compliance-feature-icon.component';

describe('Compliance feature icon component', function () {
  let wrapper;

  beforeEach(() => {
    wrapper = mount(
      <ComplianceFeatureIcon
        className="test-class"
        color="#3098DC"
        size={10}
      />,
    );
  });

  it('displays icon with proper class', () => {
    expect(wrapper.hasClass('test-class')).toBe(true);
  });
});

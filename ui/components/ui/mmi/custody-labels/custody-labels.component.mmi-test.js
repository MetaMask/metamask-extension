import React from 'react';
import { shallow } from 'enzyme';
import CustodyLabels from './custody-labels.component';

describe('CustodyLabels Component', () => {
  it('should render text with a className', () => {
    const wrapper = shallow(
      <CustodyLabels
        labels={[{ key: 'testKey', value: 'value' }]}
        index="index"
        hideNetwork="true"
      />,
    );

    expect(wrapper.hasClass('custody-labels-container allcaps')).toBe(true);
    expect(wrapper.html()).toContain('custody-label');
  });
});

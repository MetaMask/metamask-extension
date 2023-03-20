import React from 'react';
import { render } from '@testing-library/react';
import CustodyLabels from './custody-labels';

describe('CustodyLabels Component', () => {
  it('should render correctly', () => {
    const props = {
      labels: [{ key: 'testKey', value: 'value' }],
      index: 'index',
      hideNetwork: 'true',
    };

    const { container } = render(<CustodyLabels {...props} />);

    expect(container).toMatchSnapshot();
  });
});

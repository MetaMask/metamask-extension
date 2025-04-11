import { render } from '@testing-library/react';
import React from 'react';

import { CopyIcon } from './copy-icon';

describe('CopyIcon', () => {
  it('should match snapshot', () => {
    const { container } = render(<CopyIcon copyText="dummy text" />);
    expect(container).toMatchSnapshot();
  });
});

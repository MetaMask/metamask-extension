import { render } from '@testing-library/react';
import React from 'react';

import { ConfirmInfoRowDivider } from './divider';

describe('ConfirmInfoRowDivider', () => {
  it('should match snapshot', () => {
    const { container } = render(<ConfirmInfoRowDivider />);
    expect(container).toMatchSnapshot();
  });
});

import React from 'react';
import { render } from '@testing-library/react';

import { SelectActionModalItem } from '.';

describe('SelectActionModalItem', () => {
  it('should render correctly', () => {
    const { container, getByTestId } = render(<SelectActionModalItem />);
    expect(container).toMatchSnapshot();
    expect(getByTestId('select-action-modal-item')).toBeDefined();
  });
});

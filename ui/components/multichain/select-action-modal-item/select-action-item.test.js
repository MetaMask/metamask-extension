import React from 'react';
import { render } from '@testing-library/react';

import { IconName } from '../../component-library';
import { SelectActionModalItem } from '.';

describe('SelectActionModalItem', () => {
  it('should render correctly', () => {
    const props = {
      showIcon: true,
      primaryText: 'Buy',
      secondaryText: 'Buy crypto with MetaMask',
      actionIcon: IconName.Add,
    };
    const { container, getByTestId } = render(
      <SelectActionModalItem {...props} />,
    );
    expect(container).toMatchSnapshot();
    expect(getByTestId('select-action-modal-item')).toBeDefined();
  });
});

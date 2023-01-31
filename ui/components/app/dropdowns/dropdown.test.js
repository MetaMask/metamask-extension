import React from 'react';
import { fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import { DropdownMenuItem } from './dropdown';

describe('Dropdown', () => {
  const props = {
    onClick: jest.fn(),
    closeMenu: jest.fn(),
    style: { test: 'style' },
  };

  it('should matchsnapshot', () => {
    const { container } = renderWithProvider(<DropdownMenuItem {...props} />);

    expect(container).toMatchSnapshot();
  });

  it('simulates click event and calls onClick and closeMenu', () => {
    const { queryByTestId } = renderWithProvider(
      <DropdownMenuItem {...props} />,
    );

    const dropdownItem = queryByTestId('dropdown-menu-item');

    fireEvent.click(dropdownItem);

    expect(props.onClick).toHaveBeenCalledTimes(1);
    expect(props.closeMenu).toHaveBeenCalledTimes(1);
  });
});

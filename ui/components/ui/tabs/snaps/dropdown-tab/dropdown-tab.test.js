import * as React from 'react';
import { render, fireEvent } from '@testing-library/react';
import DropdownTab from '.';

describe('DropdownTab', () => {
  const onChange = jest.fn();
  const onClick = jest.fn();
  let args;
  beforeEach(() => {
    args = {
      activeClassName: 'active',
      tabIndex: 1,
      options: [
        { name: 'foo', value: 'foo' },
        { name: 'bar', value: 'bar' },
      ],
      selectedOption: 'foo',
      onChange,
      onClick,
      isActive: true,
    };
  });
  it('should render the DropdownTab component without crashing', () => {
    const { getByText } = render(<DropdownTab {...args} />);

    expect(getByText(args.options[0].name)).toBeDefined();
  });

  it('registers click', () => {
    const { container } = render(<DropdownTab {...args} />);

    fireEvent.click(container.firstChild);

    expect(onClick).toHaveBeenCalledWith(args.tabIndex);
  });

  it('registers selection', () => {
    const { container } = render(<DropdownTab {...args} />);

    // Find the clickable combobox element nested inside the rendered component
    const combobox = container.firstChild.firstChild.firstChild;
    fireEvent.click(combobox);

    fireEvent.change(combobox, { target: { value: args.options[1].value } });

    expect(onClick).toHaveBeenCalledWith(args.tabIndex);
    expect(onChange).toHaveBeenCalledWith(args.options[1].value);
  });
});

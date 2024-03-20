import * as React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { BorderColor } from '../../../helpers/constants/design-system';
import { IconName } from '..';
import { Checkbox } from '.';

describe('Checkbox', () => {
  it('should render the Checkbox without crashing', () => {
    const { getByRole, container } = render(<Checkbox />);
    expect(getByRole('checkbox')).toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });

  it('should render the Checkbox with additional className', () => {
    const { getByTestId } = render(
      <Checkbox data-testid="classname" className="mm-test" />,
    );
    expect(getByTestId('classname')).toHaveClass('mm-checkbox mm-test');
  });

  it('should render the Checkbox with additional className on the input', () => {
    const { getByRole } = render(
      <Checkbox
        data-testid="classname"
        inputProps={{ className: 'mm-test' }}
      />,
    );
    expect(getByRole('checkbox')).toHaveClass('mm-checkbox__input mm-test');
  });

  it('should render the Checkbox with border color changed from inputProps', () => {
    const { getByRole } = render(
      <Checkbox
        data-testid="classname"
        inputProps={{ borderColor: BorderColor.errorDefault }}
      />,
    );
    expect(getByRole('checkbox')).toHaveClass(
      'mm-box--border-color-error-default',
    );
  });

  it('should render isChecked', () => {
    const { getByRole, getByTestId } = render(
      <Checkbox
        isChecked={true}
        iconProps={{ 'data-testid': 'check-bold', name: IconName.CheckBold }}
      />,
    );
    expect(getByRole('checkbox')).toBeChecked();
    expect(window.getComputedStyle(getByTestId('check-bold')).maskImage).toBe(
      `url('./images/icons/check-bold.svg')`,
    );
  });

  it('should render isIndeterminate', () => {
    const { getByRole, getByTestId } = render(
      <Checkbox
        isIndeterminate={true}
        iconProps={{ 'data-testid': 'minus-bold', name: IconName.MinusBold }}
      />,
    );
    expect(getByRole('checkbox').getAttribute('data-indeterminate')).toBe(
      'true',
    );
    expect(window.getComputedStyle(getByTestId('minus-bold')).maskImage).toBe(
      `url('./images/icons/minus-bold.svg')`,
    );
  });

  it('should render checkbox with label', () => {
    const { getByText } = render(<Checkbox label="Option 1" />);
    expect(getByText('Option 1')).toBeDefined();
  });

  it('should render checkbox with id and label has matching htmlfor', () => {
    const { getByTestId, getByRole } = render(
      <Checkbox label="Option 1" id="option-1" data-testid="label" />,
    );
    const checkbox = getByRole('checkbox');

    expect(checkbox).toHaveAttribute('id', 'option-1');
    expect(getByTestId('label')).toHaveAttribute('for', 'option-1');
  });

  test('Checkbox component is disabled when isDisabled is true', () => {
    const { getByRole, getByTestId } = render(
      <Checkbox
        label="Option 1"
        id="option-1"
        data-testid="option-disabled"
        isDisabled={true}
      />,
    );

    const checkbox = getByRole('checkbox');

    expect(checkbox).toBeDisabled();
    expect(getByTestId('option-disabled')).toHaveClass('mm-checkbox--disabled');
  });

  test('Checkbox component is readOnly when isReadOnly is true', () => {
    const { getByLabelText } = render(
      <Checkbox label="Option 1" id="option-1" isReadOnly={true} />,
    );

    const checkbox = getByLabelText('Option 1');

    expect(checkbox).toHaveAttribute('readonly');
    expect(checkbox).toHaveClass('mm-checkbox__input--readonly');
  });

  it('Checkbox component fires onChange function when clicked', () => {
    const onChange = jest.fn();

    const { getByTestId } = render(
      <Checkbox data-testid="checkbox" onChange={onChange} />,
    );

    const checkbox = getByTestId('checkbox');

    fireEvent.click(checkbox);

    expect(onChange).toHaveBeenCalled();
  });

  it('Checkbox component fires onChange function label clicked', () => {
    const onChange = jest.fn();

    const { getByText } = render(
      <Checkbox label="Click label" onChange={onChange} />,
    );

    const label = getByText('Click label');

    fireEvent.click(label);

    expect(onChange).toHaveBeenCalled();
  });

  test('Checkbox component is required when isRequired is true', () => {
    const { getByLabelText } = render(
      <Checkbox label="Option 1" id="option-1" isRequired={true} />,
    );

    const checkbox = getByLabelText('Option 1');

    expect(checkbox).toHaveAttribute('required');
  });

  test('Checkbox component renders with the correct title attribute', () => {
    const { getByLabelText } = render(
      <Checkbox label="Option 1" id="option-1" title="pineapple" />,
    );

    const checkbox = getByLabelText('Option 1');

    expect(checkbox).toHaveAttribute('title', 'pineapple');
  });

  test('Checkbox component renders with the correct title attribute used from the label', () => {
    const { getByLabelText } = render(
      <Checkbox label="Option 1" id="option-1" />,
    );

    const checkbox = getByLabelText('Option 1');

    expect(checkbox).toHaveAttribute('title', 'Option 1');
  });

  test('Checkbox component renders with the correct title attribute used from the id', () => {
    const { getByRole } = render(<Checkbox id="option-1" />);

    const checkbox = getByRole('checkbox');

    expect(checkbox).toHaveAttribute('title', 'option-1');
  });

  test('Checkbox component renders with the correct name attribute', () => {
    const { getByRole } = render(<Checkbox name="option-1" />);

    const checkbox = getByRole('checkbox');

    expect(checkbox).toHaveAttribute('name', 'option-1');
  });
});

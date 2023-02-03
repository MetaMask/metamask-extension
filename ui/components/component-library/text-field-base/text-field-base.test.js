/* eslint-disable jest/require-top-level-describe */
import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import { renderWithUserEvent } from '../../../../test/lib/render-helpers';

import { Size } from '../../../helpers/constants/design-system';

import Box from '../../ui/box';

import { TextFieldBase } from './text-field-base';

describe('TextFieldBase', () => {
  it('should render correctly', () => {
    const { getByRole, container } = render(<TextFieldBase />);
    expect(getByRole('textbox')).toBeDefined();
    expect(container).toMatchSnapshot();
  });
  it('should render and be able to input text', () => {
    const { getByTestId } = render(
      <TextFieldBase inputProps={{ 'data-testid': 'text-field-base' }} />,
    );
    const textFieldBase = getByTestId('text-field-base');

    expect(textFieldBase.value).toBe(''); // initial value is empty string
    fireEvent.change(textFieldBase, { target: { value: 'text value' } });
    expect(textFieldBase.value).toBe('text value');
    fireEvent.change(textFieldBase, { target: { value: '' } }); // reset value
    expect(textFieldBase.value).toBe(''); // value is empty string after reset
  });
  it('should render with focused state when clicked', async () => {
    const { getByTestId, user } = renderWithUserEvent(
      <TextFieldBase
        data-testid="text-field-base"
        inputProps={{ 'data-testid': 'input' }}
      />,
    );
    const textFieldBase = getByTestId('input');

    await user.click(textFieldBase);
    expect(getByTestId('input')).toHaveFocus();
    expect(getByTestId('text-field-base')).toHaveClass(
      'mm-text-field-base--focused ',
    );
  });
  it('should render and fire onFocus and onBlur events', async () => {
    const onFocus = jest.fn();
    const onBlur = jest.fn();
    const { getByTestId, user } = renderWithUserEvent(
      <TextFieldBase
        inputProps={{ 'data-testid': 'text-field-base' }}
        onFocus={onFocus}
        onBlur={onBlur}
      />,
    );

    const textFieldBase = getByTestId('text-field-base');
    await user.click(textFieldBase);
    expect(onFocus).toHaveBeenCalledTimes(1);
    fireEvent.blur(textFieldBase);
    expect(onBlur).toHaveBeenCalledTimes(1);
  });
  it('should render and fire onChange event', async () => {
    const onChange = jest.fn();
    const { getByTestId, user } = renderWithUserEvent(
      <TextFieldBase
        inputProps={{ 'data-testid': 'text-field-base' }}
        onChange={onChange}
      />,
    );
    const textFieldBase = getByTestId('text-field-base');
    await user.type(textFieldBase, '123');
    expect(textFieldBase).toHaveValue('123');
    expect(onChange).toHaveBeenCalledTimes(3);
  });
  it('should render and fire onClick event', async () => {
    const onClick = jest.fn();
    const { getByTestId, user } = renderWithUserEvent(
      <TextFieldBase
        inputProps={{ 'data-testid': 'text-field-base' }}
        onClick={onClick}
      />,
    );
    const textFieldBase = getByTestId('text-field-base');

    await user.click(textFieldBase);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
  it('should render with different size classes', () => {
    const { getByTestId } = render(
      <>
        <TextFieldBase size={Size.SM} data-testid="sm" />
        <TextFieldBase size={Size.MD} data-testid="md" />
        <TextFieldBase size={Size.LG} data-testid="lg" />
      </>,
    );
    expect(getByTestId('sm')).toHaveClass('mm-text-field-base--size-sm');
    expect(getByTestId('md')).toHaveClass('mm-text-field-base--size-md');
    expect(getByTestId('lg')).toHaveClass('mm-text-field-base--size-lg');
  });
  it('should render with different types', () => {
    const { getByTestId } = render(
      <>
        <TextFieldBase inputProps={{ 'data-testid': 'text-field-base-text' }} />
        <TextFieldBase
          type="number"
          inputProps={{ 'data-testid': 'text-field-base-number' }}
        />
        <TextFieldBase
          type="password"
          inputProps={{ 'data-testid': 'text-field-base-password' }}
        />
      </>,
    );
    expect(getByTestId('text-field-base-text')).toHaveAttribute('type', 'text');
    expect(getByTestId('text-field-base-number')).toHaveAttribute(
      'type',
      'number',
    );
    expect(getByTestId('text-field-base-password')).toHaveAttribute(
      'type',
      'password',
    );
  });
  it('should render with truncate class as true by default and remove it when truncate is false', () => {
    const { getByTestId } = render(
      <>
        <TextFieldBase data-testid="truncate" />
        <TextFieldBase truncate={false} data-testid="no-truncate" />
      </>,
    );
    expect(getByTestId('truncate')).toHaveClass('mm-text-field-base--truncate');
    expect(getByTestId('no-truncate')).not.toHaveClass(
      'mm-text-field-base--truncate',
    );
  });
  it('should render with right and left accessories', () => {
    const { getByRole, getByText } = render(
      <TextFieldBase
        leftAccessory={<div>left accessory</div>}
        rightAccessory={<div>right accessory</div>}
      />,
    );
    expect(getByRole('textbox')).toBeDefined();
    expect(getByText('left accessory')).toBeDefined();
    expect(getByText('right accessory')).toBeDefined();
  });
  it('should render with working ref using inputRef prop', () => {
    // Because the 'ref' attribute wont flow down to the DOM
    // I'm not exactly sure how to test this?
    const mockRef = jest.fn();
    const { getByRole } = render(<TextFieldBase inputRef={mockRef} />);
    expect(getByRole('textbox')).toBeDefined();
    expect(mockRef).toHaveBeenCalledTimes(1);
  });
  it('should render with autoComplete', () => {
    const { getByTestId } = render(
      <TextFieldBase
        autoComplete
        inputProps={{ 'data-testid': 'text-field-base-auto-complete' }}
      />,
    );
    expect(getByTestId('text-field-base-auto-complete')).toHaveAttribute(
      'autocomplete',
      'on',
    );
  });
  it('should render with autoFocus', () => {
    const { getByRole } = render(<TextFieldBase autoFocus />);
    expect(getByRole('textbox')).toHaveFocus();
  });
  it('should render with a defaultValue', () => {
    const { getByRole } = render(
      <TextFieldBase
        defaultValue="default value"
        inputProps={{ 'data-testid': 'text-field-base-default-value' }}
      />,
    );
    expect(getByRole('textbox').value).toBe('default value');
  });
  it('should render in disabled state and not focus or be clickable', async () => {
    const mockOnClick = jest.fn();
    const mockOnFocus = jest.fn();
    const { getByRole, getByTestId, user } = renderWithUserEvent(
      <TextFieldBase
        disabled
        onFocus={mockOnFocus}
        onClick={mockOnClick}
        data-testid="text-field-base"
      />,
    );

    const textFieldBase = getByTestId('text-field-base');

    await user.click(textFieldBase);
    expect(getByRole('textbox')).toBeDisabled();
    expect(mockOnClick).toHaveBeenCalledTimes(0);
    expect(mockOnFocus).toHaveBeenCalledTimes(0);
  });
  it('should render with error className when error is true', () => {
    const { getByTestId } = render(
      <TextFieldBase error data-testid="text-field-base-error" />,
    );
    expect(getByTestId('text-field-base-error')).toHaveClass(
      'mm-text-field-base--error',
    );
  });
  it('should render with maxLength and not allow more than the set characters', async () => {
    const { getByRole, user } = renderWithUserEvent(
      <TextFieldBase maxLength={5} />,
    );
    const textFieldBase = getByRole('textbox');
    await user.type(textFieldBase, '1234567890');
    expect(getByRole('textbox')).toBeDefined();
    expect(textFieldBase.maxLength).toBe(5);
    expect(textFieldBase.value).toBe('12345');
    expect(textFieldBase.value).toHaveLength(5);
  });
  it('should render with readOnly attr when readOnly is true', async () => {
    const { getByTestId, getByRole, user } = renderWithUserEvent(
      <TextFieldBase readOnly data-testid="read-only" />,
    );
    const textFieldBase = getByTestId('read-only');
    await user.type(textFieldBase, '1234567890');
    expect(getByRole('textbox').value).toBe('');
    expect(getByRole('textbox')).toHaveAttribute('readonly', '');
  });
  it('should render with required attr when required is true', () => {
    const { getByTestId } = render(
      <TextFieldBase
        required
        inputProps={{ 'data-testid': 'text-field-base-required' }}
      />,
    );
    expect(getByTestId('text-field-base-required')).toHaveAttribute(
      'required',
      '',
    );
  });
  it('should render with a custom input and still work', async () => {
    const CustomInputComponent = React.forwardRef((props, ref) => (
      <Box ref={ref} as="input" {...props} />
    ));
    CustomInputComponent.displayName = 'CustomInputComponent'; // fixes eslint error
    const { getByTestId, user } = renderWithUserEvent(
      <TextFieldBase
        InputComponent={CustomInputComponent}
        inputProps={{ 'data-testid': 'text-field-base', className: 'test' }}
      />,
    );
    const textFieldBase = getByTestId('text-field-base');

    expect(textFieldBase.value).toBe(''); // initial value is empty string
    await user.type(textFieldBase, 'text value');
    expect(textFieldBase.value).toBe('text value');
    fireEvent.change(textFieldBase, { target: { value: '' } }); // reset value
    expect(textFieldBase.value).toBe(''); // value is empty string after reset
  });
});

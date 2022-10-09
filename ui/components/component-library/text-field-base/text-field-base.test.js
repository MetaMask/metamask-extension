/* eslint-disable jest/require-top-level-describe */
import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SIZES } from '../../../helpers/constants/design-system';

import { TextFieldBase } from './text-field-base';

describe('TextFieldBase', () => {
  it('should render correctly', () => {
    const { getByRole } = render(<TextFieldBase />);
    expect(getByRole('textbox')).toBeDefined();
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
  it('should render and fire onFocus and onBlur events', () => {
    const onFocus = jest.fn();
    const onBlur = jest.fn();
    const { getByTestId } = render(
      <TextFieldBase
        inputProps={{ 'data-testid': 'text-field-base' }}
        onFocus={onFocus}
        onBlur={onBlur}
      />,
    );
    const textFieldBase = getByTestId('text-field-base');

    fireEvent.focus(textFieldBase);
    expect(onFocus).toHaveBeenCalledTimes(1);
    fireEvent.blur(textFieldBase);
    expect(onBlur).toHaveBeenCalledTimes(1);
  });
  it('should render and fire onChange event', () => {
    const onChange = jest.fn();
    const { getByTestId } = render(
      <TextFieldBase
        inputProps={{ 'data-testid': 'text-field-base' }}
        onChange={onChange}
      />,
    );
    const textFieldBase = getByTestId('text-field-base');

    fireEvent.change(textFieldBase, { target: { value: 'text value' } });
    expect(onChange).toHaveBeenCalledTimes(1);
  });
  it('should render and fire onClick event', () => {
    const onClick = jest.fn();
    const { getByTestId } = render(
      <TextFieldBase
        inputProps={{ 'data-testid': 'text-field-base' }}
        onClick={onClick}
      />,
    );
    const textFieldBase = getByTestId('text-field-base');

    fireEvent.click(textFieldBase);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
  it('should render with different size classes', () => {
    const { getByTestId } = render(
      <>
        <TextFieldBase size={SIZES.SM} data-testid="sm" />
        <TextFieldBase size={SIZES.MD} data-testid="md" />
        <TextFieldBase size={SIZES.LG} data-testid="lg" />
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
  it('should render with truncate class', () => {
    const { getByTestId } = render(
      <TextFieldBase truncate data-testid="truncate" />,
    );
    expect(getByTestId('truncate')).toHaveClass('mm-text-field-base--truncate');
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
  it('should render in disabled state and not focus or be clickable', () => {
    const mockOnClick = jest.fn();
    const mockOnFocus = jest.fn();
    const { getByRole } = render(
      <TextFieldBase disabled onFocus={mockOnFocus} onClick={mockOnClick} />,
    );

    getByRole('textbox').focus();
    expect(getByRole('textbox')).toBeDisabled();
    expect(mockOnClick).toHaveBeenCalledTimes(0);
    expect(mockOnFocus).toHaveBeenCalledTimes(0);
  });
  it('should render with error className when error is true', () => {
    const { getByTestId } = render(
      <TextFieldBase
        error
        value="error value"
        data-testid="text-field-base-error"
      />,
    );
    expect(getByTestId('text-field-base-error')).toHaveClass(
      'mm-text-field-base--error',
    );
  });
  it('should render with maxLength and not allow more than the set characters', async () => {
    const { getByRole } = render(<TextFieldBase maxLength={5} />);
    const textFieldBase = getByRole('textbox');
    await userEvent.type(textFieldBase, '1234567890');
    expect(getByRole('textbox')).toBeDefined();
    expect(textFieldBase.maxLength).toBe(5);
    expect(textFieldBase.value).toBe('12345');
    expect(textFieldBase.value).toHaveLength(5);
  });
  it('should render with readOnly attr when readOnly is true', () => {
    const { getByTestId } = render(
      <TextFieldBase
        readOnly
        inputProps={{ 'data-testid': 'text-field-base-readonly' }}
      />,
    );
    expect(getByTestId('text-field-base-readonly')).toHaveAttribute(
      'readonly',
      '',
    );
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
});

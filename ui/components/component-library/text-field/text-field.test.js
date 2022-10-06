/* eslint-disable jest/require-top-level-describe */
import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import { TextField } from './text-field';

describe('TextField', () => {
  it('should render correctly', () => {
    const { getByRole } = render(<TextField />);
    expect(getByRole('textbox')).toBeDefined();
  });
  it('should render and be able to input text', () => {
    const { getByTestId } = render(
      <TextField inputProps={{ 'data-testid': 'text-field' }} />,
    );
    const textField = getByTestId('text-field');

    expect(textField.value).toBe(''); // initial value is empty string
    fireEvent.change(textField, { target: { value: 'text value' } });
    expect(textField.value).toBe('text value');
    fireEvent.change(textField, { target: { value: '' } }); // reset value
    expect(textField.value).toBe(''); // value is empty string after reset
  });
  it('should render and fire onFocus and onBlur events', () => {
    const onFocus = jest.fn();
    const onBlur = jest.fn();
    const { getByTestId } = render(
      <TextField
        inputProps={{ 'data-testid': 'text-field' }}
        onFocus={onFocus}
        onBlur={onBlur}
      />,
    );
    const textField = getByTestId('text-field');

    fireEvent.focus(textField);
    expect(onFocus).toHaveBeenCalledTimes(1);
    fireEvent.blur(textField);
    expect(onBlur).toHaveBeenCalledTimes(1);
  });
  it('should render and fire onChange event', () => {
    const onChange = jest.fn();
    const { getByTestId } = render(
      <TextField
        inputProps={{ 'data-testid': 'text-field' }}
        onChange={onChange}
      />,
    );
    const textField = getByTestId('text-field');

    fireEvent.change(textField, { target: { value: 'text value' } });
    expect(onChange).toHaveBeenCalledTimes(1);
  });
  it('should render and fire onClick event', () => {
    const onClick = jest.fn();
    const { getByTestId } = render(
      <TextField
        inputProps={{ 'data-testid': 'text-field' }}
        onClick={onClick}
      />,
    );
    const textField = getByTestId('text-field');

    fireEvent.click(textField);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
  /**
   * TODO: add tests for the following:
   * showClear,
   * clearIconProps,
   * clearButtonProps,
   * rightAccessory,
   * onClear,
   * inputProps,
   */
});

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
  it('should render showClear button when showClear is true and value exists', () => {
    const { getByRole, getByTestId } = render(
      <TextField
        clearButtonProps={{ 'data-testid': 'clear-button' }}
        clearButtonIconProps={{ 'data-testid': 'clear-button-icon' }}
        showClear
      />,
    );
    const textField = getByRole('textbox');
    expect(textField.value).toBe(''); // initial value is empty string
    fireEvent.change(textField, { target: { value: 'text value' } });
    expect(textField.value).toBe('text value');
    expect(getByTestId('clear-button')).toBeDefined();
    expect(getByTestId('clear-button-icon')).toBeDefined();
  });
  it('should render with the rightAccessory', () => {
    const { getByText } = render(
      <TextField rightAccessory={<div>right-accessory</div>} />,
    );
    expect(getByText('right-accessory')).toBeDefined();
  });
  it('should still render with the rightAccessory when showClear is true', () => {
    const { getByRole, getByTestId, getByText } = render(
      <TextField
        clearButtonProps={{ 'data-testid': 'clear-button' }}
        clearButtonIconProps={{ 'data-testid': 'clear-button-icon' }}
        rightAccessory={<div>right-accessory</div>}
        showClear
      />,
    );
    const textField = getByRole('textbox');
    expect(textField.value).toBe(''); // initial value is empty string
    fireEvent.change(textField, { target: { value: 'text value' } });
    expect(textField.value).toBe('text value');
    expect(getByTestId('clear-button')).toBeDefined();
    expect(getByTestId('clear-button-icon')).toBeDefined();
    expect(getByText('right-accessory')).toBeDefined();
  });
  it('should clear text when clear button is clicked', () => {
    const { getByRole, getByTestId } = render(
      <TextField
        clearButtonProps={{ 'data-testid': 'clear-button' }}
        clearButtonIconProps={{ 'data-testid': 'clear-button-icon' }}
        rightAccessory={<div>right-accessory</div>}
        showClear
      />,
    );
    const textField = getByRole('textbox');
    fireEvent.change(textField, { target: { value: 'text value' } });
    expect(textField.value).toBe('text value');
    fireEvent.click(getByTestId('clear-button'));
    expect(textField.value).toBe('');
  });
  it('should fire onClear event when passed to onClear prop', () => {
    const onClear = jest.fn();
    const { getByRole, getByTestId } = render(
      <TextField
        onClear={onClear}
        clearButtonProps={{ 'data-testid': 'clear-button' }}
        clearButtonIconProps={{ 'data-testid': 'clear-button-icon' }}
        showClear
      />,
    );
    const textField = getByRole('textbox');
    fireEvent.change(textField, { target: { value: 'text value' } });
    expect(textField.value).toBe('text value');
    fireEvent.click(getByTestId('clear-button'));
    expect(onClear).toHaveBeenCalledTimes(1);
  });
  it('should fire clearButtonProps.onClick event when passed to clearButtonProps.onClick prop', () => {
    const onClear = jest.fn();
    const onClick = jest.fn();
    const { getByRole, getByTestId } = render(
      <TextField
        onClear={onClear}
        clearButtonProps={{ 'data-testid': 'clear-button', onClick }}
        clearButtonIconProps={{ 'data-testid': 'clear-button-icon' }}
        showClear
      />,
    );
    const textField = getByRole('textbox');
    fireEvent.change(textField, { target: { value: 'text value' } });
    expect(textField.value).toBe('text value');
    fireEvent.click(getByTestId('clear-button'));
    expect(onClear).toHaveBeenCalledTimes(1);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
  it('should be able to accept inputProps', () => {
    const { getByRole } = render(
      <TextField inputProps={{ 'data-testid': 'text-field' }} />,
    );
    const textField = getByRole('textbox');
    expect(textField).toBeDefined();
  });
});

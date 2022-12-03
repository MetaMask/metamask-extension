/* eslint-disable jest/require-top-level-describe */
import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import {
  renderControlledInput,
  renderWithUserEvent,
} from '../../../../test/lib/render-helpers';

import { TextField } from './text-field';

describe('TextField', () => {
  it('should render correctly', () => {
    const { getByRole } = render(<TextField />);
    expect(getByRole('textbox')).toBeDefined();
  });
  it('should render and be able to input text', async () => {
    const { user, getByRole } = renderWithUserEvent(<TextField />);
    const textField = getByRole('textbox');
    await user.type(textField, 'text value');
    expect(textField).toHaveValue('text value');
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
  it('should render and fire onChange event', async () => {
    const onChange = jest.fn();
    const { user, getByRole } = renderWithUserEvent(
      <TextField
        inputProps={{ 'data-testid': 'text-field' }}
        onChange={onChange}
      />,
    );
    const textField = getByRole('textbox');

    await user.type(textField, '123');
    expect(textField).toHaveValue('123');
    expect(onChange).toHaveBeenCalledTimes(3);
  });
  it('should render and fire onClick event', async () => {
    const onClick = jest.fn();
    const { user, getByTestId } = renderWithUserEvent(
      <TextField data-testid="text-field" onClick={onClick} />,
    );
    await user.click(getByTestId('text-field'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
  it('should render with the rightAccessory', () => {
    const { getByText } = render(
      <TextField rightAccessory={<div>right-accessory</div>} />,
    );
    expect(getByText('right-accessory')).toBeDefined();
  });
  it('should render showClearButton button when showClearButton is true and value exists', async () => {
    // As showClearButton is intended to be used with a controlled input we need to use renderControlledInput
    const { user, getByRole } = renderControlledInput(TextField, {
      showClearButton: true,
    });
    await user.type(getByRole('textbox'), 'test value');
    expect(getByRole('textbox')).toHaveValue('test value');
    expect(getByRole('button', { name: /Clear/u })).toBeDefined();
  });
  it('should still render with the rightAccessory when showClearButton is true', async () => {
    // As showClearButton is intended to be used with a controlled input we need to use renderControlledInput
    const { user, getByRole, getByText } = renderControlledInput(TextField, {
      showClearButton: true,
      rightAccessory: <div>right-accessory</div>,
    });
    await user.type(getByRole('textbox'), 'test value');
    expect(getByRole('textbox')).toHaveValue('test value');
    expect(getByRole('button', { name: /Clear/u })).toBeDefined();
    expect(getByText('right-accessory')).toBeDefined();
  });
  it('should fire onClick event when passed to clearButtonOnClick when clear button is clicked', async () => {
    // As showClearButton is intended to be used with a controlled input we need to use renderControlledInput
    const fn = jest.fn();
    const { user, getByRole } = renderControlledInput(TextField, {
      showClearButton: true,
      clearButtonOnClick: fn,
    });
    await user.type(getByRole('textbox'), 'test value');
    await user.click(getByRole('button', { name: /Clear/u }));
    expect(fn).toHaveBeenCalledTimes(1);
  });
  it('should fire onClick event when passed to clearButtonProps.onClick prop', async () => {
    // As showClearButton is intended to be used with a controlled input we need to use renderControlledInput
    const fn = jest.fn();
    const { user, getByRole } = renderControlledInput(TextField, {
      showClearButton: true,
      clearButtonProps: { onClick: fn },
    });
    await user.type(getByRole('textbox'), 'test value');
    await user.click(getByRole('button', { name: /Clear/u }));
    expect(fn).toHaveBeenCalledTimes(1);
  });
  it('should be able to accept inputProps', () => {
    const { getByTestId } = render(
      <TextField inputProps={{ 'data-testid': 'text-field' }} />,
    );
    expect(getByTestId('text-field')).toBeDefined();
  });
});

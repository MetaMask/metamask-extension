/* eslint-disable jest/require-top-level-describe */
import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { TextField } from './text-field';

// setup function as per testing-library docs
// https://testing-library.com/docs/user-event/intro
function setup(jsx) {
  return {
    user: userEvent.setup(),
    ...render(jsx),
  };
}

describe('TextField', () => {
  it('should render correctly', () => {
    const { getByRole } = render(<TextField />);
    expect(getByRole('textbox')).toBeDefined();
  });
  it('should render and be able to input text', async () => {
    const { user, getByRole } = setup(<TextField />);

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
    const { user, getByRole } = setup(
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
    const { user, getByTestId } = setup(
      <TextField data-testid="text-field" onClick={onClick} />,
    );
    await user.click(getByTestId('text-field'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
  it('should render showClearButton button when showClearButton is true and value exists', () => {
    // As TextField is a controlled input we need to pass in a value for the clear button to appear
    const { getByRole } = render(<TextField value="text" showClearButton />);
    expect(getByRole('button', { name: /clear/u })).toBeDefined();
    expect(getByRole('textbox')).toBeDefined();
  });
  it('should render with the rightAccessory', () => {
    const { getByText } = render(
      <TextField rightAccessory={<div>right-accessory</div>} />,
    );
    expect(getByText('right-accessory')).toBeDefined();
  });
  it('should still render with the rightAccessory when showClearButton is true', () => {
    const { getByRole, getByTestId, getByText } = render(
      // As TextField is a controlled input we need to pass in a value for the clear button to appear
      <TextField
        value="text"
        clearButtonProps={{ 'data-testid': 'clear-button' }}
        rightAccessory={<div>right-accessory</div>}
        showClearButton
      />,
    );
    expect(getByTestId('clear-button')).toBeDefined();
    expect(getByText('right-accessory')).toBeDefined();
    expect(getByRole('textbox')).toBeDefined();
  });
  it('should fire onClick event when passed to clearButtonProps when clear button is clicked', async () => {
    // As TextField is a controlled input we need to pass in a value for the clear button to appear
    const fn = jest.fn();
    const { user, getByRole } = setup(
      <TextField value="text" clearButtonOnClick={fn} showClearButton />,
    );
    await user.click(getByRole('button', { name: /clear/u }));
    expect(fn).toHaveBeenCalledTimes(1); // clear button onClick is fired
  });
  it('should fire clearButtonProps.onClick event when passed to clearButtonProps.onClick prop', async () => {
    // As TextField is a controlled input we need to pass in a value for the clear button to appear
    const fn = jest.fn();
    const { user, getByRole } = setup(
      <TextField
        value="text"
        clearButtonProps={{ onClick: fn }}
        showClearButton
      />,
    );
    await user.click(getByRole('button', { name: /clear/u }));
    expect(fn).toHaveBeenCalledTimes(1);
  });
  it('should be able to accept inputProps', () => {
    const { getByRole } = render(
      <TextField inputProps={{ 'data-testid': 'text-field' }} />,
    );
    const textField = getByRole('textbox');
    expect(textField).toBeDefined();
  });
});

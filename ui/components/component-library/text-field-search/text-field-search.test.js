/* eslint-disable jest/require-top-level-describe */
import React from 'react';
import { render } from '@testing-library/react';
import { renderControlledInput } from '../../../../test/lib/render-helpers';
import { TextFieldSearch } from './text-field-search';

describe('TextFieldSearch', () => {
  it('should render correctly', () => {
    const { getByRole } = render(<TextFieldSearch />);
    expect(getByRole('searchbox')).toBeDefined();
  });
  it('should render showClearButton button when showClearButton is true and value exists', async () => {
    // As showClearButton is intended to be used with a controlled input we need to use renderControlledInput
    const { user, getByRole } = renderControlledInput(TextFieldSearch, {
      showClearButton: true,
    });
    await user.type(getByRole('searchbox'), 'test value');
    expect(getByRole('searchbox')).toHaveValue('test value');
    expect(getByRole('button', { name: /Clear/u })).toBeDefined();
  });
  it('should still render with the rightAccessory when showClearButton is true', async () => {
    // As showClearButton is intended to be used with a controlled input we need to use renderControlledInput
    const { user, getByRole, getByText } = renderControlledInput(
      TextFieldSearch,
      {
        showClearButton: true,
        rightAccessory: <div>right-accessory</div>,
      },
    );
    await user.type(getByRole('searchbox'), 'test value');
    expect(getByRole('searchbox')).toHaveValue('test value');
    expect(getByRole('button', { name: /Clear/u })).toBeDefined();
    expect(getByText('right-accessory')).toBeDefined();
  });
  it('should fire onClick event when passed to clearButtonOnClick when clear button is clicked', async () => {
    // As showClearButton is intended to be used with a controlled input we need to use renderControlledInput
    const fn = jest.fn();
    const { user, getByRole } = renderControlledInput(TextFieldSearch, {
      showClearButton: true,
      clearButtonOnClick: fn,
    });
    await user.type(getByRole('searchbox'), 'test value');
    await user.click(getByRole('button', { name: /Clear/u }));
    expect(fn).toHaveBeenCalledTimes(1);
  });
  it('should fire onClick event when passed to clearButtonProps.onClick prop', async () => {
    // As showClearButton is intended to be used with a controlled input we need to use renderControlledInput
    const fn = jest.fn();
    const { user, getByRole } = renderControlledInput(TextFieldSearch, {
      showClearButton: true,
      clearButtonProps: { onClick: fn },
    });
    await user.type(getByRole('searchbox'), 'test value');
    await user.click(getByRole('button', { name: /Clear/u }));
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

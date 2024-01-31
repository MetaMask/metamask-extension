/* eslint-disable jest/require-top-level-describe */
import React from 'react';
import { render } from '@testing-library/react';
import { renderControlledInput } from '../../../../test/lib/render-helpers';
import { TextFieldSearch } from './text-field-search';

describe('TextFieldSearch', () => {
  it('should render correctly', () => {
    const { getByRole, container } = render(<TextFieldSearch />);
    expect(getByRole('searchbox')).toBeDefined();
    expect(container).toMatchSnapshot();
  });
  it('should render with a custom className', () => {
    const fn = jest.fn();
    const { getByTestId } = render(
      <TextFieldSearch
        data-testid="test-search"
        className="test-search"
        clearButtonOnClick={fn}
      />,
    );
    expect(getByTestId('test-search')).toHaveClass('test-search');
  });
  it('should render showClearButton button when value exists', async () => {
    const fn = jest.fn();
    // As showClearButton is intended to be used with a controlled input we need to use renderControlledInput
    const { user, getByRole } = renderControlledInput(TextFieldSearch, {
      clearButtonOnClick: fn,
    });
    await user.type(getByRole('searchbox'), 'test value');
    expect(getByRole('searchbox')).toHaveValue('test value');
    expect(getByRole('button', { name: /clear/u })).toBeDefined();
  });
  it('should still render with the endAccessory if it exists', async () => {
    const fn = jest.fn();
    // As showClearButton is intended to be used with a controlled input we need to use renderControlledInput
    const { user, getByRole, getByText } = renderControlledInput(
      TextFieldSearch,
      {
        clearButtonOnClick: fn,
        endAccessory: <div>end-accessory</div>,
      },
    );
    await user.type(getByRole('searchbox'), 'test value');
    expect(getByRole('searchbox')).toHaveValue('test value');
    expect(getByRole('button', { name: /clear/u })).toBeDefined();
    expect(getByText('end-accessory')).toBeDefined();
  });
  it('should fire onClick event when passed to clearButtonOnClick when clear button is clicked', async () => {
    // As showClearButton is intended to be used with a controlled input we need to use renderControlledInput
    const fn = jest.fn();
    const { user, getByRole } = renderControlledInput(TextFieldSearch, {
      clearButtonOnClick: fn,
    });
    await user.type(getByRole('searchbox'), 'test value');
    await user.click(getByRole('button', { name: /clear/u }));
    expect(fn).toHaveBeenCalledTimes(1);
  });
  it('should fire onClick event when passed to clearButtonProps.onClick prop', async () => {
    // As showClearButton is intended to be used with a controlled input we need to use renderControlledInput
    const fn = jest.fn();
    const { user, getByRole } = renderControlledInput(TextFieldSearch, {
      clearButtonProps: { onClick: fn },
      clearButtonOnClick: fn,
    });
    await user.type(getByRole('searchbox'), 'test value');
    await user.click(getByRole('button', { name: /clear/u }));
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

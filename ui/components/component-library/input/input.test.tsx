/* eslint-disable jest/require-top-level-describe */
import React from 'react';
import { fireEvent, render, act } from '@testing-library/react';
import { renderWithUserEvent } from '../../../../test/lib/render-helpers';

import { TextVariant } from '../../../helpers/constants/design-system';
import { Input } from './input';
import { InputType } from './input.types';

describe('Input', () => {
  it('should render correctly', () => {
    const { getByRole, container } = render(<Input />);
    expect(getByRole('textbox')).toBeDefined();
    expect(container).toMatchSnapshot();
  });
  it('should render correctly with custom className', () => {
    const { getByRole } = render(<Input className="test" />);
    expect(getByRole('textbox')).toHaveClass('test');
  });
  it('should render and be able to input text', () => {
    const { getByTestId } = render(<Input data-testid="input" />);
    const InputComponent = getByTestId('input');

    expect(InputComponent.value).toBe(''); // initial value is empty string
    fireEvent.change(InputComponent, { target: { value: 'text value' } });
    expect(InputComponent.value).toBe('text value');
    fireEvent.change(InputComponent, { target: { value: '' } }); // reset value
    expect(InputComponent.value).toBe(''); // value is empty string after reset
  });
  it('should render without state styles when disableStateStyles is true', async () => {
    const { getByTestId, user } = renderWithUserEvent(
      <Input data-testid="input" disableStateStyles />,
    );
    const InputComponent = getByTestId('input');

    await user.click(InputComponent);
    expect(getByTestId('input')).toHaveFocus();
    expect(getByTestId('input')).toHaveClass('mm-input--disable-state-styles');
    expect(getByTestId('input')).not.toHaveClass('mm-input--disabled');
  });
  it('should render and fire onFocus and onBlur events', async () => {
    const onFocus = jest.fn();
    const onBlur = jest.fn();
    const { getByTestId, user } = renderWithUserEvent(
      <Input data-testid="input" onFocus={onFocus} onBlur={onBlur} />,
    );

    const InputComponent = getByTestId('input');
    await user.click(InputComponent);
    expect(onFocus).toHaveBeenCalledTimes(1);
    fireEvent.blur(InputComponent);
    expect(onBlur).toHaveBeenCalledTimes(1);
  });
  it('should pass ref to allow input to focus through another element', () => {
    const ref = React.createRef();
    const { getByRole } = renderWithUserEvent(<Input ref={ref} />);

    act(() => ref.current.focus());
    expect(getByRole('textbox')).toHaveFocus();
  });
  it('should render and fire onChange event', async () => {
    const onChange = jest.fn();
    const { getByTestId, user } = renderWithUserEvent(
      <Input data-testid="input" onChange={onChange} />,
    );
    const InputComponent = getByTestId('input');
    await user.type(InputComponent, '123');
    expect(InputComponent).toHaveValue('123');
    expect(onChange).toHaveBeenCalledTimes(3);
  });
  it('should render with different types', () => {
    const { getByTestId } = render(
      <>
        <Input data-testid="input-text-default" />
        <Input type={InputType.Text} data-testid="input-text" />
        <Input type={InputType.Number} data-testid="input-number" />
        <Input type={InputType.Password} data-testid="input-password" />
      </>,
    );
    expect(getByTestId('input-text-default')).toHaveAttribute('type', 'text');
    expect(getByTestId('input-text')).toHaveAttribute('type', 'text');
    expect(getByTestId('input-number')).toHaveAttribute('type', 'number');
    expect(getByTestId('input-password')).toHaveAttribute('type', 'password');
  });
  it('should render with autoComplete', () => {
    const { getByTestId } = render(
      <Input autoComplete data-testid="input-auto-complete" />,
    );
    expect(getByTestId('input-auto-complete')).toHaveAttribute(
      'autocomplete',
      'on',
    );
  });
  it('should render with autoFocus', () => {
    const { getByRole } = render(<Input autoFocus />);
    expect(getByRole('textbox')).toHaveFocus();
  });
  it('should render with a defaultValue', () => {
    const { getByRole } = render(<Input defaultValue="default value" />);
    expect(getByRole('textbox').value).toBe('default value');
  });
  it('should render in disabled state and not focus or be clickable', async () => {
    const mockOnFocus = jest.fn();
    const { getByRole, getByTestId, user } = renderWithUserEvent(
      <Input disabled onFocus={mockOnFocus} data-testid="input" />,
    );
    const InputComponent = getByTestId('input');
    await user.click(InputComponent);
    expect(getByRole('textbox')).toBeDisabled();
    expect(mockOnFocus).toHaveBeenCalledTimes(0);
  });
  it('should render with maxLength and not allow more than the set characters', async () => {
    const { getByRole, user } = renderWithUserEvent(<Input maxLength={5} />);
    const InputComponent = getByRole('textbox');
    await user.type(InputComponent, '1234567890');
    expect(getByRole('textbox')).toBeDefined();
    expect(InputComponent.maxLength).toBe(5);
    expect(InputComponent.value).toBe('12345');
    expect(InputComponent.value).toHaveLength(5);
  });
  it('should render with readOnly attr when readOnly is true', async () => {
    const { getByTestId, getByRole, user } = renderWithUserEvent(
      <Input readOnly data-testid="read-only" />,
    );
    const InputComponent = getByTestId('read-only');
    await user.type(InputComponent, '1234567890');
    expect(getByRole('textbox').value).toBe('');
    expect(getByRole('textbox')).toHaveAttribute('readonly', '');
  });
  it('should render with required attr when required is true', () => {
    const { getByTestId } = render(
      <Input required data-testid="input-required" />,
    );
    expect(getByTestId('input-required')).toHaveAttribute('required', '');
  });
  it('should render with a different Text variant', () => {
    const { getByTestId } = render(
      <Input
        data-testid="input-required"
        textVariant={TextVariant.headingSm}
      />,
    );
    expect(getByTestId('input-required')).toHaveClass('mm-text--heading-sm');
  });
});

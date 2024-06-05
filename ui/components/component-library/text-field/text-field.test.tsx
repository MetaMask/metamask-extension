/* eslint-disable jest/require-top-level-describe */
import React from 'react';
import PropTypes, { Validator } from 'prop-types';
import { fireEvent, render } from '@testing-library/react';
import { renderWithUserEvent } from '../../../../test/lib/render-helpers';

import { Box } from '../box';
import { InputComponent } from '../input';
import { TextField } from './text-field';
import { TextFieldSize, TextFieldType } from './text-field.types';

describe('TextField', () => {
  it('should render correctly', () => {
    const { getByRole, container } = render(<TextField />);
    expect(getByRole('textbox')).toBeDefined();
    expect(container).toMatchSnapshot();
  });
  it('should render and be able to input text', () => {
    const { getByTestId } = render(
      <TextField inputProps={{ 'data-testid': 'text-field' }} />,
    );
    const textField = getByTestId('text-field') as HTMLInputElement;

    expect(textField.value).toBe(''); // initial value is empty string
    fireEvent.change(textField, { target: { value: 'text value' } });
    expect(textField.value).toBe('text value');
    fireEvent.change(textField, { target: { value: '' } }); // reset value
    expect(textField.value).toBe(''); // value is empty string after reset
  });
  it('should render with focused state when clicked', async () => {
    const { getByTestId, user } = renderWithUserEvent(
      <TextField
        data-testid="text-field"
        inputProps={{ 'data-testid': 'input' }}
      />,
    );
    const textField = getByTestId('input');

    await user.click(textField);
    expect(getByTestId('input')).toHaveFocus();
    expect(getByTestId('text-field')).toHaveClass('mm-text-field--focused ');
  });
  it('should render and fire onFocus and onBlur events', async () => {
    const onFocus = jest.fn();
    const onBlur = jest.fn();
    const { getByTestId, user } = renderWithUserEvent(
      <TextField
        inputProps={{ 'data-testid': 'text-field' }}
        onFocus={onFocus}
        onBlur={onBlur}
      />,
    );

    const textField = getByTestId('text-field');
    await user.click(textField);
    expect(onFocus).toHaveBeenCalledTimes(1);
    fireEvent.blur(textField);
    expect(onBlur).toHaveBeenCalledTimes(1);
  });
  it('should render and fire onChange event', async () => {
    const onChange = jest.fn();
    const { getByTestId, user } = renderWithUserEvent(
      <TextField
        inputProps={{ 'data-testid': 'text-field' }}
        onChange={onChange}
      />,
    );
    const textField = getByTestId('text-field');
    await user.type(textField, '123');
    expect(textField).toHaveValue('123');
    expect(onChange).toHaveBeenCalledTimes(3);
  });
  it('should render and fire onClick event', async () => {
    const onClick = jest.fn();
    const { getByTestId, user } = renderWithUserEvent(
      <TextField
        inputProps={{ 'data-testid': 'text-field' }}
        onClick={onClick}
      />,
    );
    const textField = getByTestId('text-field');

    await user.click(textField);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
  it('should render with different size classes', () => {
    const { getByTestId } = render(
      <>
        <TextField size={TextFieldSize.Sm} data-testid="sm" />
        <TextField size={TextFieldSize.Md} data-testid="md" />
        <TextField size={TextFieldSize.Lg} data-testid="lg" />
      </>,
    );
    expect(getByTestId('sm')).toHaveClass('mm-text-field--size-sm');
    expect(getByTestId('md')).toHaveClass('mm-text-field--size-md');
    expect(getByTestId('lg')).toHaveClass('mm-text-field--size-lg');
  });
  it('should render with different types', () => {
    const { getByTestId } = render(
      <>
        <TextField inputProps={{ 'data-testid': 'text-field-text' }} />
        <TextField
          type={TextFieldType.Number}
          inputProps={{ 'data-testid': 'text-field-number' }}
        />
        <TextField
          type={TextFieldType.Password}
          inputProps={{ 'data-testid': 'text-field-password' }}
        />
      </>,
    );
    expect(getByTestId('text-field-text')).toHaveAttribute('type', 'text');
    expect(getByTestId('text-field-number')).toHaveAttribute('type', 'number');
    expect(getByTestId('text-field-password')).toHaveAttribute(
      'type',
      'password',
    );
  });
  it('should render with truncate class as true by default and remove it when truncate is false', () => {
    const { getByTestId } = render(
      <>
        <TextField data-testid="truncate" />
        <TextField truncate={false} data-testid="no-truncate" />
      </>,
    );
    expect(getByTestId('truncate')).toHaveClass('mm-text-field--truncate');
    expect(getByTestId('no-truncate')).not.toHaveClass(
      'mm-text-field--truncate',
    );
  });
  it('should render with right and left accessories', () => {
    const { getByRole, getByText } = render(
      <TextField
        startAccessory={<div>start accessory</div>}
        endAccessory={<div>end accessory</div>}
      />,
    );
    expect(getByRole('textbox')).toBeDefined();
    expect(getByText('start accessory')).toBeDefined();
    expect(getByText('end accessory')).toBeDefined();
  });
  it('should render with working ref using inputRef prop', () => {
    // Because the 'ref' attribute wont flow down to the DOM
    // I'm not exactly sure how to test this?
    const mockRef = jest.fn();
    const { getByRole } = render(<TextField inputRef={mockRef} />);
    expect(getByRole('textbox')).toBeDefined();
    expect(mockRef).toHaveBeenCalledTimes(1);
  });
  it('should render with autoComplete', () => {
    const { getByTestId } = render(
      <TextField
        autoComplete
        inputProps={{ 'data-testid': 'text-field-auto-complete' }}
      />,
    );
    expect(getByTestId('text-field-auto-complete')).toHaveAttribute(
      'autocomplete',
      'on',
    );
  });
  it('should render with autoFocus', () => {
    const { getByRole } = render(<TextField autoFocus />);
    expect(getByRole('textbox')).toHaveFocus();
  });
  it('should render with a defaultValue', () => {
    const { getByRole } = render(
      <TextField
        defaultValue="default value"
        inputProps={{ 'data-testid': 'text-field-default-value' }}
      />,
    );
    expect((getByRole('textbox') as HTMLInputElement).value).toBe(
      'default value',
    );
  });
  it('should render in disabled state and not focus or be clickable', async () => {
    const mockOnClick = jest.fn();
    const mockOnFocus = jest.fn();
    const { getByRole, getByTestId, user } = renderWithUserEvent(
      <TextField
        disabled
        onFocus={mockOnFocus}
        onClick={mockOnClick}
        data-testid="text-field"
      />,
    );

    const textField = getByTestId('text-field');

    await user.click(textField);
    expect(getByRole('textbox')).toBeDisabled();
    expect(mockOnClick).toHaveBeenCalledTimes(0);
    expect(mockOnFocus).toHaveBeenCalledTimes(0);
  });
  it('should render with error className when error is true', () => {
    const { getByTestId } = render(
      <TextField error data-testid="text-field-error" />,
    );
    expect(getByTestId('text-field-error')).toHaveClass('mm-text-field--error');
  });
  it('should render with maxLength and not allow more than the set characters', async () => {
    const { getByRole, user } = renderWithUserEvent(
      <TextField maxLength={5} />,
    );
    const textField = getByRole('textbox') as HTMLInputElement;
    await user.type(textField, '1234567890');
    expect(getByRole('textbox')).toBeDefined();
    expect(textField.maxLength).toBe(5);
    expect(textField.value).toBe('12345');
    expect(textField.value).toHaveLength(5);
  });
  it('should render with readOnly attr when readOnly is true', async () => {
    const { getByTestId, getByRole, user } = renderWithUserEvent(
      <TextField readOnly data-testid="read-only" />,
    );
    const textField = getByTestId('read-only') as HTMLInputElement;
    await user.type(textField, '1234567890');
    expect((getByRole('textbox') as HTMLInputElement).value).toBe('');
    expect(getByRole('textbox')).toHaveAttribute('readonly', '');
  });
  it('should render with required attr when required is true', () => {
    const { getByTestId } = render(
      <TextField
        required
        inputProps={{ 'data-testid': 'text-field-required' }}
      />,
    );
    expect(getByTestId('text-field-required')).toHaveAttribute('required', '');
  });
  it('should render with a custom input and still work', async () => {
    const CustomInputComponent = React.forwardRef<
      InputComponent & HTMLInputElement,
      { disableStateStyles: boolean }
    >(({ disableStateStyles, ...props }, ref) => (
      <Box
        ref={ref}
        as="input"
        {...props}
        placeholder={`Removing ${disableStateStyles} from ...props spread to prevent error in test`}
      />
    ));
    CustomInputComponent.propTypes = {
      disableStateStyles: PropTypes.bool as Validator<boolean>,
    };
    CustomInputComponent.displayName = 'CustomInputComponent'; // fixes eslint error
    const { getByTestId, user } = renderWithUserEvent(
      <TextField
        InputComponent={CustomInputComponent as InputComponent}
        inputProps={{ 'data-testid': 'text-field', className: 'test' }}
      />,
    );
    const textField = getByTestId('text-field') as HTMLInputElement;

    expect(textField.value).toBe(''); // initial value is empty string
    await user.type(textField, 'text value');
    expect(textField.value).toBe('text value');
    fireEvent.change(textField, { target: { value: '' } }); // reset value
    expect(textField.value).toBe(''); // value is empty string after reset
  });
  it('should render the child Input with disableStateStyles to prevent multiple focus outlines', async () => {
    const { getByTestId, user } = renderWithUserEvent(
      <TextField inputProps={{ 'data-testid': 'input' }} />,
    );
    const inputComponent = getByTestId('input');

    await user.click(inputComponent);
    expect(getByTestId('input')).toHaveFocus();
    expect(getByTestId('input')).toHaveClass('mm-input--disable-state-styles');
  });
});

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck types are very broken
/* eslint-disable jest/require-top-level-describe */
import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import { renderWithUserEvent } from '../../../../test/lib/render-helpers';
import { FormTextField, FormTextFieldSize } from '.';

describe('FormTextField', () => {
  it('should render correctly', () => {
    const { getByRole, container } = render(<FormTextField />);
    expect(getByRole('textbox')).toBeDefined();
    expect(container).toMatchSnapshot();
  });
  // autoComplete
  it('should render with autoComplete', () => {
    const { getByTestId } = render(
      <FormTextField
        autoComplete
        inputProps={{ 'data-testid': 'form-text-field-auto-complete' }}
      />,
    );
    expect(getByTestId('form-text-field-auto-complete')).toHaveAttribute(
      'autocomplete',
      'on',
    );
  });
  // autoFocus
  it('should render with autoFocus', () => {
    const { getByRole } = render(<FormTextField autoFocus />);
    expect(getByRole('textbox')).toHaveFocus();
  });
  // className
  it('should render with custom className', () => {
    const { getByTestId } = render(
      <FormTextField data-testid="form-text-field" className="test-class" />,
    );
    expect(getByTestId('form-text-field')).toHaveClass('test-class');
  });
  // defaultValue
  it('should render with a defaultValue', () => {
    const { getByRole } = render(
      <FormTextField defaultValue="default value" />,
    );
    expect(getByRole('textbox').value).toBe('default value');
  });
  // disabled
  it('should render in disabled state and not focus or be clickable', async () => {
    const mockOnClick = jest.fn();
    const mockOnFocus = jest.fn();
    const { getByRole, user, getByLabelText } = renderWithUserEvent(
      <FormTextField
        label="test label"
        id="test-id"
        disabled
        onFocus={mockOnFocus}
        onClick={mockOnClick}
      />,
    );

    await user.click(getByLabelText('test label'));
    expect(mockOnFocus).toHaveBeenCalledTimes(0);
    await user.type(getByRole('textbox'), 'test value');
    expect(getByRole('textbox')).not.toHaveValue('test value');

    expect(getByRole('textbox')).toBeDisabled();
    expect(mockOnClick).toHaveBeenCalledTimes(0);
    expect(mockOnFocus).toHaveBeenCalledTimes(0);
  });
  // error
  it('should render with error classNames on TextField and HelpText components when error is true', () => {
    const { getByTestId, getByText } = render(
      <FormTextField
        error
        textFieldProps={{ 'data-testid': 'text-field' }}
        helpText="test help text"
      />,
    );
    expect(getByTestId('text-field')).toHaveClass('mm-text-field--error');
    expect(getByText('test help text')).toHaveClass(
      'mm-box--color-error-default',
    );
  });
  // helpText
  it('should render with helpText', () => {
    const { getByText } = render(<FormTextField helpText="test help text" />);
    expect(getByText('test help text')).toBeDefined();
  });
  // helpTextProps
  it('should render with helpText and helpTextProps', () => {
    const { getByText, getByTestId } = render(
      <FormTextField
        helpText="test help text"
        helpTextProps={{ 'data-testid': 'help-text-test', className: 'test' }}
      />,
    );
    expect(getByText('test help text')).toBeDefined();
    expect(getByTestId('help-text-test')).toBeDefined();
    expect(getByTestId('help-text-test')).toHaveClass(
      'mm-form-text-field__help-text test',
    );
  });
  // id
  it('should render the FormTextField with an id and pass it to input and Label as htmlFor. When clicking on Label the input should have focus', async () => {
    const onFocus = jest.fn();
    const { getByRole, getByLabelText, user } = renderWithUserEvent(
      <FormTextField label="test label" id="test-id" onFocus={onFocus} />,
    );
    expect(getByRole('textbox')).toHaveAttribute('id', 'test-id');
    await user.click(getByLabelText('test label'));
    expect(onFocus).toHaveBeenCalledTimes(1);
    expect(getByRole('textbox')).toHaveFocus();
  });
  // inputProps
  it('should render with inputProps', () => {
    const { getByTestId } = render(
      <FormTextField inputProps={{ 'data-testid': 'test-id' }} />,
    );
    expect(getByTestId('test-id')).toBeDefined();
  });
  // inputRef
  it('should render with working ref using inputRef prop', () => {
    // Because the 'ref' attribute wont flow down to the DOM
    // I'm not exactly sure how to test this?
    const mockRef = jest.fn();
    const { getByRole } = render(<FormTextField inputRef={mockRef} />);
    expect(getByRole('textbox')).toBeDefined();
    expect(mockRef).toHaveBeenCalledTimes(1);
  });
  // label
  it('should render with a label', () => {
    const { getByLabelText } = render(
      <FormTextField id="test-id" label="test label" />,
    );
    expect(getByLabelText('test label')).toBeDefined();
  });
  // labelProps
  it('should render with a labelProps', () => {
    const { getByTestId, getByLabelText } = render(
      <FormTextField
        label="test label"
        labelProps={{ 'data-testid': 'label-test-id', className: 'test' }}
        id="test-id"
      />,
    );
    expect(getByLabelText('test label')).toBeDefined();
    expect(getByTestId('label-test-id')).toBeDefined();
    expect(getByTestId('label-test-id')).toHaveClass(
      'mm-form-text-field__label test',
    );
  });
  // startAccessory, // endAccessory
  it('should render with right and left accessories', () => {
    const { getByRole, getByText } = render(
      <FormTextField
        startAccessory={<div>start accessory</div>}
        endAccessory={<div>end accessory</div>}
      />,
    );
    expect(getByRole('textbox')).toBeDefined();
    expect(getByText('start accessory')).toBeDefined();
    expect(getByText('end accessory')).toBeDefined();
  });
  // maxLength;
  it('should render with maxLength and not allow more than the set characters', async () => {
    const { getByRole, user } = renderWithUserEvent(
      <FormTextField maxLength={5} />,
    );
    const formTextField = getByRole('textbox');
    await user.type(formTextField, '1234567890');
    expect(getByRole('textbox')).toBeDefined();
    expect(formTextField.maxLength).toBe(5);
    expect(formTextField.value).toBe('12345');
    expect(formTextField.value).toHaveLength(5);
  });
  // name
  it('should render with name prop', () => {
    const { getByRole } = render(<FormTextField name="test-name" />);
    expect(getByRole('textbox')).toHaveAttribute('name', 'test-name');
  });
  // onBlur, // onFocus
  it('should render and fire onFocus and onBlur events', async () => {
    const onFocus = jest.fn();
    const onBlur = jest.fn();
    const { getByTestId, user } = renderWithUserEvent(
      <FormTextField
        inputProps={{ 'data-testid': 'form-text-field' }}
        onFocus={onFocus}
        onBlur={onBlur}
      />,
    );
    const formTextField = getByTestId('form-text-field');

    await user.click(formTextField);
    expect(onFocus).toHaveBeenCalledTimes(1);
    fireEvent.blur(formTextField);
    expect(onBlur).toHaveBeenCalledTimes(1);
  });
  // onChange
  it('should render and fire onChange event', async () => {
    const onChange = jest.fn();
    const { user, getByRole } = renderWithUserEvent(
      <FormTextField onChange={onChange} />,
    );
    await user.type(getByRole('textbox'), 'test');
    expect(onChange).toHaveBeenCalledTimes(4);
  });
  // placeholder
  it('should render with placeholder', () => {
    const { getByTestId } = render(
      <FormTextField
        placeholder="test placeholder"
        inputProps={{ 'data-testid': 'form-text-field-auto-complete' }}
      />,
    );
    expect(getByTestId('form-text-field-auto-complete')).toHaveAttribute(
      'placeholder',
      'test placeholder',
    );
  });
  // readOnly
  it('should render with readOnly attr when readOnly is true', async () => {
    const { getByRole, user } = renderWithUserEvent(
      <FormTextField
        readOnly
        value="test value"
        data-testid="read-only"
        inputProps={{ 'data-testid': 'text-field-readonly' }}
      />,
    );
    await user.type(getByRole('textbox'), 'test');
    expect(getByRole('textbox')).toHaveValue('test value');
    expect(getByRole('textbox')).toHaveAttribute('readonly', '');
  });
  // size = SIZES.MD
  it('should render with different size classes', () => {
    const { getByTestId } = render(
      <>
        <FormTextField
          size={FormTextFieldSize.Sm}
          textFieldProps={{ 'data-testid': 'sm' }}
        />
        <FormTextField
          size={FormTextFieldSize.Md}
          textFieldProps={{ 'data-testid': 'md' }}
        />
        <FormTextField
          size={FormTextFieldSize.Lg}
          textFieldProps={{ 'data-testid': 'lg' }}
        />
      </>,
    );
    expect(getByTestId('sm')).toHaveClass('mm-text-field--size-sm');
    expect(getByTestId('md')).toHaveClass('mm-text-field--size-md');
    expect(getByTestId('lg')).toHaveClass('mm-text-field--size-lg');
  });
  // textFieldProps
  it('should render with textFieldProps', () => {
    const { getByTestId } = render(
      <FormTextField textFieldProps={{ 'data-testid': 'test-text-field' }} />,
    );
    expect(getByTestId('test-text-field')).toBeDefined();
  });
  // truncate
  it('should render with truncate class as true by default and remove it when truncate is false', () => {
    const { getByTestId } = render(
      <>
        <FormTextField textFieldProps={{ 'data-testid': 'truncate' }} />
        <FormTextField
          truncate={false}
          textFieldProps={{ 'data-testid': 'no-truncate' }}
        />
      </>,
    );
    expect(getByTestId('truncate')).toHaveClass('mm-text-field--truncate');
    expect(getByTestId('no-truncate')).not.toHaveClass(
      'mm-text-field--truncate',
    );
  });
  // type,
  it('should render with different types', () => {
    const { getByTestId } = render(
      <>
        <FormTextField inputProps={{ 'data-testid': 'form-text-field-text' }} />
        <FormTextField
          type="number"
          inputProps={{ 'data-testid': 'form-text-field-number' }}
        />
        <FormTextField
          type="password"
          inputProps={{ 'data-testid': 'form-text-field-password' }}
        />
      </>,
    );
    expect(getByTestId('form-text-field-text')).toHaveAttribute('type', 'text');
    expect(getByTestId('form-text-field-number')).toHaveAttribute(
      'type',
      'number',
    );
    expect(getByTestId('form-text-field-password')).toHaveAttribute(
      'type',
      'password',
    );
  });
});

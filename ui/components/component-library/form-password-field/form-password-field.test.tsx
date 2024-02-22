/* eslint-disable jest/require-top-level-describe */
import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import { renderWithUserEvent } from '../../../../test/lib/render-helpers';
import { FormPasswordField } from '.';
import { FormTextFieldSize } from '../form-text-field';

describe('FormPasswordField', () => {
  it('should render correctly', () => {
    const { getByRole, container } = render(<FormPasswordField />);
    expect(getByRole('textbox')).toBeDefined();
    expect(container).toMatchSnapshot();
  });
  // autoComplete
  it('should render with autoComplete', () => {
    const { getByTestId } = render(
      <FormPasswordField
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
    const { getByRole } = render(<FormPasswordField autoFocus />);
    expect(getByRole('textbox')).toHaveFocus();
  });
  // className
  it('should render with custom className', () => {
    const { getByTestId } = render(
      <FormPasswordField data-testid="form-text-field" className="test-class" />,
    );
    expect(getByTestId('form-text-field')).toHaveClass('test-class');
  });
  // defaultValue
  it('should render with a defaultValue', () => {
    const { getByRole } = render(
      <FormPasswordField defaultValue="default value" />,
    );
    expect(getByRole('textbox').value).toBe('default value');
  });
  // disabled
  it('should render in disabled state and not focus or be clickable', async () => {
    const mockOnClick = jest.fn();
    const mockOnFocus = jest.fn();
    const { getByRole, user, getByLabelText } = renderWithUserEvent(
      <FormPasswordField
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
      <FormPasswordField
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
    const { getByText } = render(<FormPasswordField helpText="test help text" />);
    expect(getByText('test help text')).toBeDefined();
  });
  // helpTextProps
  it('should render with helpText and helpTextProps', () => {
    const { getByText, getByTestId } = render(
      <FormPasswordField
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
      <FormPasswordField label="test label" id="test-id" onFocus={onFocus} />,
    );
    expect(getByRole('textbox')).toHaveAttribute('id', 'test-id');
    await user.click(getByLabelText('test label'));
    expect(onFocus).toHaveBeenCalledTimes(1);
    expect(getByRole('textbox')).toHaveFocus();
  });
  // inputProps
  it('should render with inputProps', () => {
    const { getByTestId } = render(
      <FormPasswordField inputProps={{ 'data-testid': 'test-id' }} />,
    );
    expect(getByTestId('test-id')).toBeDefined();
  });
  // inputRef
  it('should render with working ref using inputRef prop', () => {
    // Because the 'ref' attribute wont flow down to the DOM
    // I'm not exactly sure how to test this?
    const mockRef = jest.fn();
    const { getByRole } = render(<FormPasswordField inputRef={mockRef} />);
    expect(getByRole('textbox')).toBeDefined();
    expect(mockRef).toHaveBeenCalledTimes(1);
  });
  // label
  it('should render with a label', () => {
    const { getByLabelText } = render(
      <FormPasswordField id="test-id" label="test label" />,
    );
    expect(getByLabelText('test label')).toBeDefined();
  });
  // labelProps
  it('should render with a labelProps', () => {
    const { getByTestId, getByLabelText } = render(
      <FormPasswordField
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
      <FormPasswordField
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
      <FormPasswordField maxLength={5} />,
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
    const { getByRole } = render(<FormPasswordField name="test-name" />);
    expect(getByRole('textbox')).toHaveAttribute('name', 'test-name');
  });
  // onBlur, // onFocus
  it('should render and fire onFocus and onBlur events', async () => {
    const onFocus = jest.fn();
    const onBlur = jest.fn();
    const { getByTestId, user } = renderWithUserEvent(
      <FormPasswordField
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
      <FormPasswordField onChange={onChange} />,
    );
    await user.type(getByRole('textbox'), 'test');
    expect(onChange).toHaveBeenCalledTimes(4);
  });
  // placeholder
  it('should render with placeholder', () => {
    const { getByTestId } = render(
      <FormPasswordField
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
      <FormPasswordField
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
        <FormPasswordField
          size={FormTextFieldSize.Sm}
          textFieldProps={{ 'data-testid': 'sm' }}
        />
        <FormPasswordField
          size={FormTextFieldSize.Md}
          textFieldProps={{ 'data-testid': 'md' }}
        />
        <FormPasswordField
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
      <FormPasswordField textFieldProps={{ 'data-testid': 'test-text-field' }} />,
    );
    expect(getByTestId('test-text-field')).toBeDefined();
  });
  // truncate
  it('should render with truncate class as true by default and remove it when truncate is false', () => {
    const { getByTestId } = render(
      <>
        <FormPasswordField textFieldProps={{ 'data-testid': 'truncate' }} />
        <FormPasswordField
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
});

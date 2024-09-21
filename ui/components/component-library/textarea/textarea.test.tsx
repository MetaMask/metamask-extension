/* eslint-disable jest/require-top-level-describe */
import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import { renderWithUserEvent } from '../../../../test/lib/render-helpers';

import { TextareaResize } from './textarea.types';
import { Textarea } from './textarea';

describe('Textarea', () => {
  it('should render correctly', () => {
    const { getByRole, container } = render(<Textarea />);
    expect(getByRole('textbox')).toBeDefined();
    expect(container).toMatchSnapshot();
  });
  it('should render and be able to input text', () => {
    const { getByTestId } = render(<Textarea data-testid="textarea" />);
    const textarea = getByTestId('textarea') as HTMLTextAreaElement;
    expect(textarea.value).toBe(''); // initial value is empty string
    fireEvent.change(textarea, { target: { value: 'text value' } });
    expect(textarea.value).toBe('text value');
    fireEvent.change(textarea, { target: { value: '' } }); // reset value
    expect(textarea.value).toBe(''); // value is empty string after reset
  });
  it('should render with focused state when clicked', async () => {
    const { getByTestId, user } = renderWithUserEvent(
      <Textarea data-testid="textarea" />,
    );
    const textarea = getByTestId('textarea');
    await user.click(textarea);
    expect(textarea).toHaveFocus();
  });
  it('should render and fire onFocus and onBlur events', async () => {
    const onFocus = jest.fn();
    const onBlur = jest.fn();
    const { getByTestId, user } = renderWithUserEvent(
      <Textarea onFocus={onFocus} onBlur={onBlur} data-testid="textarea" />,
    );

    const textarea = getByTestId('textarea');
    await user.click(textarea);
    expect(onFocus).toHaveBeenCalledTimes(1);
    fireEvent.blur(textarea);
    expect(onBlur).toHaveBeenCalledTimes(1);
  });
  it('should render and fire onChange event', async () => {
    const onChange = jest.fn();
    const { getByTestId, user } = renderWithUserEvent(
      <Textarea onChange={onChange} data-testid="textarea" />,
    );
    const textarea = getByTestId('textarea');
    await user.type(textarea, '123');
    expect(textarea).toHaveValue('123');
    expect(onChange).toHaveBeenCalledTimes(3);
  });
  it('should render and fire onClick event', async () => {
    const onClick = jest.fn();
    const { getByTestId, user } = renderWithUserEvent(
      <Textarea data-testid="textarea" onClick={onClick} />,
    );
    const textarea = getByTestId('textarea');

    await user.click(textarea);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
  it('should render with rows and cols', () => {
    const { getByRole } = render(<Textarea rows={4} cols={50} />);
    const textarea = getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea.rows).toBe(4);
    expect(textarea.cols).toBe(50);
  });
  it('should render with autoFocus', () => {
    const { getByRole } = render(<Textarea autoFocus />);
    expect(getByRole('textbox')).toHaveFocus();
  });
  it('should render with a defaultValue', () => {
    const { getByRole } = render(
      <Textarea
        defaultValue="default value"
        data-testid="textarea-default-value"
      />,
    );
    const textarea = getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea.value).toBe('default value');
  });
  it('should render in disabled state using isDisabled prop and not focus or be clickable', async () => {
    const mockOnClick = jest.fn();
    const mockOnFocus = jest.fn();
    const { getByRole, getByTestId, user } = renderWithUserEvent(
      <>
        <Textarea
          isDisabled
          onFocus={mockOnFocus}
          onClick={mockOnClick}
          data-testid="textarea"
        />
      </>,
    );

    const textarea = getByRole('textbox');

    await user.click(textarea);
    expect(getByTestId('textarea')).toBeDisabled();
    expect(mockOnClick).toHaveBeenCalledTimes(0);
    expect(mockOnFocus).toHaveBeenCalledTimes(0);
  });

  it('should render in disabled state using disabled prop and not focus or be clickable', async () => {
    const mockOnClick = jest.fn();
    const mockOnFocus = jest.fn();
    const { getByRole, getByTestId, user } = renderWithUserEvent(
      <>
        <Textarea
          disabled
          onFocus={mockOnFocus}
          onClick={mockOnClick}
          data-testid="textarea"
        />
      </>,
    );

    const textarea = getByRole('textbox');

    await user.click(textarea);
    expect(getByTestId('textarea')).toBeDisabled();
    expect(mockOnClick).toHaveBeenCalledTimes(0);
    expect(mockOnFocus).toHaveBeenCalledTimes(0);
  });

  it('should render with error state when error is true', () => {
    const { getByTestId } = render(
      <Textarea error data-testid="textarea-error" />,
    );
    const textarea = getByTestId('textarea-error');
    expect(textarea).toHaveAttribute('aria-invalid', 'true');
    expect(textarea).toHaveClass('mm-box--border-color-error-default');
  });

  it('should render with readOnly attr when readOnly is true', async () => {
    const { getByTestId, getByRole, user } = renderWithUserEvent(
      <Textarea readOnly data-testid="read-only" />,
    );
    const textarea = getByTestId('read-only') as HTMLTextAreaElement;
    await user.type(textarea, '1234567890');
    expect(textarea.value).toBe('');
    expect(getByRole('textbox')).toHaveAttribute('readonly', '');
  });

  it('should render with required attr when required is true', () => {
    const { getByTestId } = render(
      <Textarea required data-testid="textarea-required" />,
    );
    expect(getByTestId('textarea-required')).toHaveAttribute('required', '');
  });

  it('renders a textarea with resize behavior', () => {
    const { getByTestId } = render(
      <>
        <Textarea
          resize={TextareaResize.Horizontal}
          data-testid="resize-horizontal"
        />
        <Textarea
          resize={TextareaResize.Vertical}
          data-testid="resize-vertical"
        />
        <Textarea resize={TextareaResize.None} data-testid="resize-none" />
        <Textarea resize={TextareaResize.Both} data-testid="resize-both" />
        <Textarea
          resize={TextareaResize.Inherit}
          data-testid="resize-inherit"
        />
        <Textarea
          resize={TextareaResize.Initial}
          data-testid="resize-initial"
        />
      </>,
    );
    expect(getByTestId('resize-horizontal')).toHaveClass(
      'mm-textarea--resize-horizontal',
    );
    expect(getByTestId('resize-vertical')).toHaveClass(
      'mm-textarea--resize-vertical',
    );
    expect(getByTestId('resize-none')).toHaveClass('mm-textarea--resize-none');
    expect(getByTestId('resize-both')).toHaveClass('mm-textarea--resize-both');
    expect(getByTestId('resize-inherit')).toHaveClass(
      'mm-textarea--resize-inherit',
    );
    expect(getByTestId('resize-initial')).toHaveClass(
      'mm-textarea--resize-initial',
    );
  });
});

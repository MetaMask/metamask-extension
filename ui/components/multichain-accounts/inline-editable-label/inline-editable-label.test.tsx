import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { InlineEditableLabel } from './inline-editable-label';

describe('InlineEditableLabel', () => {
  const defaultProps = {
    value: 'Account 1',
    onSave: jest.fn(),
    ariaLabel: 'Edit account name',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders read-only text initially', () => {
    renderWithProvider(<InlineEditableLabel {...defaultProps} />);
    expect(screen.getByText('Account 1')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('enters edit mode on click and shows input and checkmark button', () => {
    renderWithProvider(<InlineEditableLabel {...defaultProps} />);
    fireEvent.click(screen.getByText('Account 1'));

    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue('Account 1');
    expect(screen.getByTestId('inline-editable-label-save')).toBeInTheDocument();
  });

  it('saves new value on checkmark button click', async () => {
    renderWithProvider(<InlineEditableLabel {...defaultProps} />);
    fireEvent.click(screen.getByText('Account 1'));

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'New Account Name' } });
    fireEvent.click(screen.getByTestId('inline-editable-label-save'));

    await waitFor(() => {
      expect(defaultProps.onSave).toHaveBeenCalledWith('New Account Name');
    });
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('saves new value on Enter key press', async () => {
    renderWithProvider(<InlineEditableLabel {...defaultProps} />);
    fireEvent.click(screen.getByText('Account 1'));

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'New Account Name' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(defaultProps.onSave).toHaveBeenCalledWith('New Account Name');
    });
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('cancels edit mode on Escape key press without saving', () => {
    renderWithProvider(<InlineEditableLabel {...defaultProps} />);
    fireEvent.click(screen.getByText('Account 1'));

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Changed Name' } });
    fireEvent.keyDown(input, { key: 'Escape', code: 'Escape' });

    expect(defaultProps.onSave).not.toHaveBeenCalled();
    expect(screen.getByText('Account 1')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('cancels edit mode on blur without saving', () => {
    renderWithProvider(<InlineEditableLabel {...defaultProps} />);
    fireEvent.click(screen.getByText('Account 1'));

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Changed Name' } });
    fireEvent.blur(input);

    expect(defaultProps.onSave).not.toHaveBeenCalled();
    expect(screen.getByText('Account 1')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('does not enter edit mode when disabled is true', () => {
    renderWithProvider(<InlineEditableLabel {...defaultProps} disabled />);
    fireEvent.click(screen.getByText('Account 1'));
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('does not trigger onSave when value is unchanged or empty', () => {
    renderWithProvider(<InlineEditableLabel {...defaultProps} />);
    fireEvent.click(screen.getByText('Account 1'));

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(defaultProps.onSave).not.toHaveBeenCalled();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('does not trigger onSave when value is identical to original', () => {
    renderWithProvider(<InlineEditableLabel {...defaultProps} />);
    fireEvent.click(screen.getByText('Account 1'));

    const input = screen.getByRole('textbox');
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(defaultProps.onSave).not.toHaveBeenCalled();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('stops propagation when clicked to start editing or when editing container is clicked', () => {
    const parentClick = jest.fn();
    renderWithProvider(
      <div onClick={parentClick}>
        <InlineEditableLabel {...defaultProps} />
      </div>,
    );

    fireEvent.click(screen.getByText('Account 1'));
    expect(parentClick).not.toHaveBeenCalled();

    const editingContainer = screen.getByTestId(
      'inline-editable-label-editing',
    );
    fireEvent.click(editingContainer);
    expect(parentClick).not.toHaveBeenCalled();
  });

  it('supports custom testId, placeholder, maxLength, and ariaLabel', () => {
    renderWithProvider(
      <InlineEditableLabel
        {...defaultProps}
        testId="custom-label"
        placeholder="Enter name"
        maxLength={30}
        ariaLabel="Custom aria label"
      />,
    );

    expect(screen.getByTestId('custom-label')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('custom-label'));

    const input = screen.getByTestId('custom-label-input');
    expect(input).toHaveAttribute('placeholder', 'Enter name');
    expect(input).toHaveAttribute('maxLength', '30');
    expect(input).toHaveAttribute('aria-label', 'Custom aria label');
    expect(screen.getByTestId('custom-label-save')).toBeInTheDocument();
  });

  it('updates input value when value prop changes', () => {
    const { rerender } = renderWithProvider(
      <InlineEditableLabel {...defaultProps} value="Old Name" />,
    );

    expect(screen.getByText('Old Name')).toBeInTheDocument();

    rerender(<InlineEditableLabel {...defaultProps} value="Updated Name" />);
    expect(screen.getByText('Updated Name')).toBeInTheDocument();
  });
});

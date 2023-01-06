/* eslint-disable jest/require-top-level-describe */
import { fireEvent, render } from '@testing-library/react';
import React from 'react';
import { Icon, ICON_NAMES } from '../icon';
import { TextFieldBase } from '../text-field-base';

import { Label } from './label';

describe('label', () => {
  it('should render text inside the label', () => {
    const { getByText, container } = render(<Label>label</Label>);
    expect(getByText('label')).toHaveClass('mm-label');
    expect(getByText('label')).toBeDefined();
    expect(container).toMatchSnapshot();
  });
  it('should render with additional className', () => {
    const { getByText } = render(<Label className="test-class">label</Label>);
    expect(getByText('label')).toHaveClass('mm-label test-class');
  });
  it('should render text and react nodes as children', () => {
    const { getByText, getByTestId } = render(
      <Label>
        label
        <Icon name={ICON_NAMES.INFO} data-testid="icon" />
      </Label>,
    );
    expect(getByText('label')).toBeDefined();
    expect(getByTestId('icon')).toBeDefined();
  });
  it('should be able to accept an htmlFor prop and focus an input of a given id', () => {
    const { getByText, getByRole } = render(
      <>
        <Label htmlFor="input">label</Label>
        <TextFieldBase id="input" />
      </>,
    );
    const input = getByRole('textbox');
    const label = getByText('label');
    expect(label).toBeDefined();
    expect(input).not.toHaveFocus();
    fireEvent.click(label);
    expect(input).toHaveFocus();
  });
  it('should render when wrapping an input and focus input when clicked without htmlFor', () => {
    const { getByText, getByRole } = render(
      <>
        <Label>
          Label text
          <TextFieldBase />
        </Label>
      </>,
    );
    const input = getByRole('textbox');
    const label = getByText('Label text');
    expect(label).toBeDefined();
    expect(input).not.toHaveFocus();
    fireEvent.click(label);
    expect(input).toHaveFocus();
  });
  it('should render with required asterisk', () => {
    const { getByText } = render(<Label required>label</Label>);
    expect(getByText('label')).toBeDefined();
    expect(getByText('*')).toBeDefined();
  });
  it('should render with disabled state and have disabled class', () => {
    const { getByText } = render(<Label disabled>label</Label>);
    expect(getByText('label')).toHaveClass('mm-label--disabled');
  });
});

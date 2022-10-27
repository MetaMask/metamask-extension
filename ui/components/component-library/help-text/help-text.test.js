/* eslint-disable jest/require-top-level-describe */
import { fireEvent, render } from '@testing-library/react';
import React from 'react';
import { SEVERITIES } from '../../../helpers/constants/design-system';
import { Icon, ICON_NAMES } from '../icon';
import { TextFieldBase } from '../text-field-base';

import { HelpText } from './help-text';

describe('HelpText', () => {
  it('should render with text inside the HelpText', () => {
    const { getByText } = render(<HelpText>help text</HelpText>);
    expect(getByText('help text')).toBeDefined();
  });
  it('should render with react nodes inside the HelpText', () => {
    const { getByText, getByTestId } = render(
      <HelpText>
        help text <Icon name={ICON_NAMES.WARNING_FILLED} data-testid="icon" />
      </HelpText>,
    );
    expect(getByText('help text')).toBeDefined();
    expect(getByTestId('icon')).toBeDefined();
  });
  it('should render with and additional className', () => {
    const { getByText } = render(
      <HelpText className="test-class">help text</HelpText>,
    );
    expect(getByText('help text')).toBeDefined();
    expect(getByText('help text')).toHaveClass('test-class');
  });
  it('should render with different severities', () => {
    const { getByText } = render(
      <>
        <HelpText severity={SEVERITIES.DANGER}>danger</HelpText>
        <HelpText severity={SEVERITIES.WARNING}>warning</HelpText>
        <HelpText severity={SEVERITIES.SUCCESS}>success</HelpText>
        <HelpText severity={SEVERITIES.INFO}>info</HelpText>
      </>,
    );
    expect(getByText('danger')).toHaveClass('text--color-error-default');
    expect(getByText('warning')).toHaveClass('text--color-warning-default');
    expect(getByText('success')).toHaveClass('text--color-success-default');
    expect(getByText('info')).toHaveClass('text--color-info-default');
  });
});

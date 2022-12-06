/* eslint-disable jest/require-top-level-describe */
import { render } from '@testing-library/react';
import React from 'react';
import { COLORS } from '../../../helpers/constants/design-system';
import { Icon, ICON_NAMES } from '../icon';

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
  it('should render with error state', () => {
    const { getByText } = render(
      <>
        <HelpText error>error</HelpText>
      </>,
    );
    expect(getByText('error')).toHaveClass('text--color-error-default');
  });
  it('should render with different colors', () => {
    const { getByText } = render(
      <>
        <HelpText>default</HelpText>
        <HelpText color={COLORS.WARNING_DEFAULT}>warning</HelpText>
        <HelpText color={COLORS.SUCCESS_DEFAULT}>success</HelpText>
        <HelpText color={COLORS.INFO_DEFAULT}>info</HelpText>
      </>,
    );
    expect(getByText('default')).toHaveClass('text--color-text-default');
    expect(getByText('warning')).toHaveClass('text--color-warning-default');
    expect(getByText('success')).toHaveClass('text--color-success-default');
    expect(getByText('info')).toHaveClass('text--color-info-default');
  });
});

/* eslint-disable jest/require-top-level-describe */
import { render } from '@testing-library/react';
import React from 'react';
import { Color } from '../../../helpers/constants/design-system';
import { Icon, ICON_NAMES } from '../icon';

import { HelpText } from './help-text';

describe('HelpText', () => {
  it('should render with text inside the HelpText', () => {
    const { getByText, container } = render(<HelpText>help text</HelpText>);
    expect(getByText('help text')).toBeDefined();
    expect(getByText('help text')).toHaveClass('mm-help-text');
    expect(container).toMatchSnapshot();
  });
  it('should render with and additional className', () => {
    const { getByText } = render(
      <HelpText className="test-class">help text</HelpText>,
    );
    expect(getByText('help text')).toHaveClass('mm-help-text test-class');
  });
  it('should render with react nodes inside the HelpText', () => {
    const { getByText, getByTestId } = render(
      <HelpText>
        help text <Icon name={ICON_NAMES.WARNING} data-testid="icon" />
      </HelpText>,
    );
    expect(getByText('help text')).toBeDefined();
    expect(getByTestId('icon')).toBeDefined();
  });
  it('should render with error state', () => {
    const { getByText } = render(<HelpText error>error</HelpText>);
    expect(getByText('error')).toHaveClass('mm-text--color-error-default');
  });
  it('should render with different colors', () => {
    const { getByText } = render(
      <>
        <HelpText>default</HelpText>
        <HelpText color={Color.warningDefault}>warning</HelpText>
        <HelpText color={Color.successDefault}>success</HelpText>
        <HelpText color={Color.infoDefault}>info</HelpText>
      </>,
    );
    expect(getByText('default')).toHaveClass('mm-text--color-text-default');
    expect(getByText('warning')).toHaveClass('mm-text--color-warning-default');
    expect(getByText('success')).toHaveClass('mm-text--color-success-default');
    expect(getByText('info')).toHaveClass('mm-text--color-info-default');
  });
});

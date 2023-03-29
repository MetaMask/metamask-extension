/* eslint-disable jest/require-top-level-describe */
import { render } from '@testing-library/react';
import React from 'react';
import { Color, SEVERITIES } from '../../../helpers/constants/design-system';
import { Icon, ICON_NAMES } from '../icon';

import { HelpText } from './help-text';

describe('HelpText', () => {
  it('should render with text inside the HelpText', () => {
    const { getByText } = render(<HelpText>help text</HelpText>);
    expect(getByText('help text')).toBeDefined();
    expect(getByText('help text')).toHaveClass('mm-help-text');
  });
  it('should match snapshot', () => {
    const { container } = render(<HelpText>help text</HelpText>);
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
        help text{' '}
        <Icon name={ICON_NAMES.WARNING} data-testid="icon" as="span" />
      </HelpText>,
    );
    expect(getByText('help text')).toBeDefined();
    expect(getByTestId('icon')).toBeDefined();
  });
  it('should render with severities', () => {
    const { getByText } = render(
      <>
        <HelpText severity={SEVERITIES.DANGER}>error</HelpText>
        <HelpText severity={SEVERITIES.SUCCESS}>success</HelpText>
        <HelpText severity={SEVERITIES.WARNING}>warning</HelpText>
        <HelpText severity={SEVERITIES.INFO}>info</HelpText>
      </>,
    );
    expect(getByText('error')).toHaveClass('box--color-error-default');
    expect(getByText('success')).toHaveClass('box--color-success-default');
    expect(getByText('warning')).toHaveClass('box--color-warning-default');
    expect(getByText('info')).toHaveClass('box--color-info-default');
  });
  it('should render with different colors', () => {
    const { getByText } = render(
      <>
        <HelpText>default</HelpText>
        <HelpText color={Color.textDefault}>text default</HelpText>
        <HelpText color={Color.textAlternative}>text alternative</HelpText>
        <HelpText color={Color.textMuted}>text muted</HelpText>
      </>,
    );
    expect(getByText('default')).toHaveClass('box--color-text-default');
    expect(getByText('text default')).toHaveClass('box--color-text-default');
    expect(getByText('text alternative')).toHaveClass(
      'box--color-text-alternative',
    );
    expect(getByText('text muted')).toHaveClass('box--color-text-muted');
  });
  it('should render with a different html element if children is an object', () => {
    const { getByText, getByTestId } = render(
      <>
        <HelpText>help text as p</HelpText>
        <HelpText data-testid="help-text-div">
          <span>help text as div</span> <Icon name={ICON_NAMES.WARNING} />
        </HelpText>
      </>,
    );
    expect(getByText('help text as p')).toBeDefined();
    expect(getByText('help text as p').tagName).toBe('P');
    expect(getByText('help text as div')).toBeDefined();
    expect(getByTestId('help-text-div').tagName).toBe('DIV');
  });
});

import * as React from 'react';
import { render } from '@testing-library/react';
import {
  COLORS,
  FONT_STYLE,
  FONT_WEIGHT,
  OVERFLOW_WRAP,
  TEXT,
  TEXT_ALIGN,
  TEXT_TRANSFORM,
} from '../../../helpers/constants/design-system';
import { Text } from '.';

describe('Text', () => {
  it('should render the Text without crashing', () => {
    const { getByText } = render(<Text>Test type</Text>);
    expect(getByText('Test type')).toBeDefined();
  });
  it('should render the Text with correct html elements', () => {
    const { getByText, container } = render(
      <>
        <Text as="p">p</Text>
        <Text as="h1">h1</Text>
        <Text as="h2">h2</Text>
        <Text as="h3">h3</Text>
        <Text as="h4">h4</Text>
        <Text as="h5">h5</Text>
        <Text as="h6">h6</Text>
        <Text as="span">span</Text>
        <Text as="strong">strong</Text>
        <Text as="em">em</Text>
        <Text as="li">li</Text>
        <Text as="div">div</Text>
        <Text as="dt">dt</Text>
        <Text as="dd">dd</Text>
      </>,
    );
    expect(container.querySelector('p')).toBeDefined();
    expect(getByText('p')).toBeDefined();
    expect(container.querySelector('h1')).toBeDefined();
    expect(getByText('h1')).toBeDefined();
    expect(container.querySelector('h2')).toBeDefined();
    expect(getByText('h2')).toBeDefined();
    expect(container.querySelector('h3')).toBeDefined();
    expect(getByText('h3')).toBeDefined();
    expect(container.querySelector('h4')).toBeDefined();
    expect(getByText('h4')).toBeDefined();
    expect(container.querySelector('h5')).toBeDefined();
    expect(getByText('h5')).toBeDefined();
    expect(container.querySelector('h6')).toBeDefined();
    expect(getByText('h6')).toBeDefined();
    expect(container.querySelector('span')).toBeDefined();
    expect(getByText('span')).toBeDefined();
    expect(container.querySelector('strong')).toBeDefined();
    expect(getByText('strong')).toBeDefined();
    expect(container.querySelector('em')).toBeDefined();
    expect(getByText('em')).toBeDefined();
    expect(container.querySelector('li')).toBeDefined();
    expect(getByText('li')).toBeDefined();
    expect(container.querySelector('div')).toBeDefined();
    expect(getByText('div')).toBeDefined();
    expect(container.querySelector('dt')).toBeDefined();
    expect(getByText('dt')).toBeDefined();
    expect(container.querySelector('dd')).toBeDefined();
    expect(getByText('dd')).toBeDefined();
  });

  it('should render the Text with proper variant class name', () => {
    const { getByText } = render(
      <>
        <Text variant={TEXT.DISPLAY_MD}>display-md</Text>
        <Text variant={TEXT.HEADING_LG}>heading-lg</Text>
        <Text variant={TEXT.HEADING_MD}>heading-md</Text>
        <Text variant={TEXT.HEADING_SM}>heading-sm</Text>
        <Text variant={TEXT.BODY_LG}>body-lg-medium</Text>
        <Text variant={TEXT.BODY_MD}>body-md</Text>
        <Text variant={TEXT.BODY_SM}>body-sm</Text>
        <Text variant={TEXT.BODY_XS}>body-xs</Text>
      </>,
    );

    expect(getByText('display-md')).toHaveClass('text--display-md');
    expect(getByText('heading-lg')).toHaveClass('text--heading-lg');
    expect(getByText('heading-md')).toHaveClass('text--heading-md');
    expect(getByText('heading-sm')).toHaveClass('text--heading-sm');
    expect(getByText('body-lg-medium')).toHaveClass('text--body-lg-medium');
    expect(getByText('body-md')).toHaveClass('text--body-md');
    expect(getByText('body-sm')).toHaveClass('text--body-sm');
    expect(getByText('body-xs')).toHaveClass('text--body-xs');
  });

  it('should render the Text with proper font weight class name', () => {
    const { getByText } = render(
      <>
        <Text fontWeight={FONT_WEIGHT.BOLD}>bold</Text>
        <Text fontWeight={FONT_WEIGHT.MEDIUM}>medium</Text>
        <Text fontWeight={FONT_WEIGHT.NORMAL}>normal</Text>
      </>,
    );
    expect(getByText('bold')).toHaveClass('text--font-weight-bold');
    expect(getByText('medium')).toHaveClass('text--font-weight-medium');
    expect(getByText('normal')).toHaveClass('text--font-weight-normal');
  });

  it('should render the Text with proper text color class name', () => {
    const { getByText } = render(
      <>
        <Text color={COLORS.TEXT_DEFAULT}>text-default</Text>
        <Text color={COLORS.TEXT_ALTERNATIVE}>text-alternative</Text>
        <Text color={COLORS.TEXT_MUTED}>text-muted</Text>
        <Text color={COLORS.OVERLAY_INVERSE}>overlay-inverse</Text>
        <Text color={COLORS.PRIMARY_DEFAULT}>primary-default</Text>
        <Text color={COLORS.PRIMARY_INVERSE}>primary-inverse</Text>
        <Text color={COLORS.ERROR_DEFAULT}>error-default</Text>
        <Text color={COLORS.ERROR_INVERSE}>error-inverse</Text>
        <Text color={COLORS.SUCCESS_DEFAULT}>success-default</Text>
        <Text color={COLORS.SUCCESS_INVERSE}>success-inverse</Text>
        <Text color={COLORS.WARNING_INVERSE}>warning-inverse</Text>
        <Text color={COLORS.INFO_DEFAULT}>info-default</Text>
        <Text color={COLORS.INFO_INVERSE}>info-inverse</Text>
      </>,
    );
    expect(getByText('text-default')).toHaveClass('text--color-text-default');
    expect(getByText('text-alternative')).toHaveClass(
      'text--color-text-alternative',
    );
    expect(getByText('text-muted')).toHaveClass('text--color-text-muted');
    expect(getByText('overlay-inverse')).toHaveClass(
      'text--color-overlay-inverse',
    );
    expect(getByText('primary-default')).toHaveClass(
      'text--color-primary-default',
    );
    expect(getByText('primary-inverse')).toHaveClass(
      'text--color-primary-inverse',
    );
    expect(getByText('error-default')).toHaveClass('text--color-error-default');
    expect(getByText('error-inverse')).toHaveClass('text--color-error-inverse');
    expect(getByText('success-default')).toHaveClass(
      'text--color-success-default',
    );
    expect(getByText('success-inverse')).toHaveClass(
      'text--color-success-inverse',
    );
    expect(getByText('warning-inverse')).toHaveClass(
      'text--color-warning-inverse',
    );
    expect(getByText('info-default')).toHaveClass('text--color-info-default');
    expect(getByText('info-inverse')).toHaveClass('text--color-info-inverse');
  });

  it('should render the Text with proper font style class name', () => {
    const { getByText } = render(
      <>
        <Text fontStyle={FONT_STYLE.ITALIC}>italic</Text>
        <Text fontStyle={FONT_STYLE.NORMAL}>normal</Text>
      </>,
    );
    expect(getByText('italic')).toHaveClass('text--font-style-italic');
    expect(getByText('normal')).toHaveClass('text--font-style-normal');
  });

  it('should render the Text with proper text align class name', () => {
    const { getByText } = render(
      <>
        <Text textAlign={TEXT_ALIGN.LEFT}>left</Text>
        <Text textAlign={TEXT_ALIGN.CENTER}>center</Text>
        <Text textAlign={TEXT_ALIGN.RIGHT}>right</Text>
        <Text textAlign={TEXT_ALIGN.JUSTIFY}>justify</Text>
        <Text textAlign={TEXT_ALIGN.END}>end</Text>
      </>,
    );

    expect(getByText('left')).toHaveClass('text--text-align-left');
    expect(getByText('center')).toHaveClass('text--text-align-center');
    expect(getByText('right')).toHaveClass('text--text-align-right');
    expect(getByText('justify')).toHaveClass('text--text-align-justify');
    expect(getByText('end')).toHaveClass('text--text-align-end');
  });

  it('should render the Text with proper overflow wrap class name', () => {
    const { getByText } = render(
      <>
        <Text overflowWrap={OVERFLOW_WRAP.BREAK_WORD}>break-word</Text>
        <Text overflowWrap={OVERFLOW_WRAP.NORMAL}>normal</Text>
      </>,
    );
    expect(getByText('break-word')).toHaveClass(
      'text--overflow-wrap-break-word',
    );
    expect(getByText('normal')).toHaveClass('text--overflow-wrap-normal');
  });

  it('should render the Text with proper ellipsis class name', () => {
    const { getByText } = render(
      <>
        <Text ellipsis>ellipsis</Text>
      </>,
    );
    expect(getByText('ellipsis')).toHaveClass('text--ellipsis');
  });

  it('should render the Text with proper text transform class name', () => {
    const { getByText } = render(
      <>
        <Text textTransform={TEXT_TRANSFORM.UPPERCASE}>uppercase</Text>
        <Text textTransform={TEXT_TRANSFORM.LOWERCASE}>lowercase</Text>
        <Text textTransform={TEXT_TRANSFORM.CAPITALIZE}>capitalize</Text>
      </>,
    );
    expect(getByText('uppercase')).toHaveClass(
      'text--text-transform-uppercase',
    );
    expect(getByText('lowercase')).toHaveClass(
      'text--text-transform-lowercase',
    );
    expect(getByText('capitalize')).toHaveClass(
      'text--text-transform-capitalize',
    );
  });
});

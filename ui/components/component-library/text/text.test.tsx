import * as React from 'react';
import { render } from '@testing-library/react';
import {
  FontStyle,
  FontWeight,
  OverflowWrap,
  TextAlign,
  TextColor,
  TextTransform,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { TextDirection } from './text.types';
import { Text } from './text';

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
    const { getByText, container } = render(
      <>
        <Text variant={TextVariant.displayMd}>display-md</Text>
        <Text variant={TextVariant.headingLg}>heading-lg</Text>
        <Text variant={TextVariant.headingMd}>heading-md</Text>
        <Text variant={TextVariant.headingSm}>heading-sm</Text>
        <Text variant={TextVariant.bodyLgMedium}>body-lg-medium</Text>
        <Text variant={TextVariant.bodyMd}>body-md</Text>
        <Text variant={TextVariant.bodyMdMedium}>body-md-medium</Text>
        <Text variant={TextVariant.bodyMdBold}>body-md-bold</Text>
        <Text variant={TextVariant.bodySm}>body-sm</Text>
        <Text variant={TextVariant.bodySmMedium}>body-sm-medium</Text>
        <Text variant={TextVariant.bodySmBold}>body-sm-bold</Text>
        <Text variant={TextVariant.bodyXs}>body-xs</Text>
        <Text variant={TextVariant.bodyXsMedium}>body-xs-medium</Text>
      </>,
    );

    expect(getByText('display-md')).toHaveClass('mm-text--display-md');
    expect(getByText('heading-lg')).toHaveClass('mm-text--heading-lg');
    expect(getByText('heading-md')).toHaveClass('mm-text--heading-md');
    expect(getByText('heading-sm')).toHaveClass('mm-text--heading-sm');
    expect(getByText('body-lg-medium')).toHaveClass('mm-text--body-lg-medium');
    expect(getByText('body-md')).toHaveClass('mm-text--body-md');
    expect(getByText('body-md-medium')).toHaveClass('mm-text--body-md-medium');
    expect(getByText('body-md-bold')).toHaveClass('mm-text--body-md-bold');
    expect(getByText('body-sm')).toHaveClass('mm-text--body-sm');
    expect(getByText('body-sm-medium')).toHaveClass('mm-text--body-sm-medium');
    expect(getByText('body-sm-bold')).toHaveClass('mm-text--body-sm-bold');
    expect(getByText('body-xs')).toHaveClass('mm-text--body-xs');
    expect(getByText('body-xs-medium')).toHaveClass('mm-text--body-xs-medium');
    expect(container).toMatchSnapshot();
  });

  it('should render the Text with proper font weight class name', () => {
    const { getByText } = render(
      <>
        <Text fontWeight={FontWeight.Bold}>bold</Text>
        <Text fontWeight={FontWeight.Medium}>medium</Text>
        <Text fontWeight={FontWeight.Normal}>normal</Text>
      </>,
    );
    expect(getByText('bold')).toHaveClass('mm-text--font-weight-bold');
    expect(getByText('medium')).toHaveClass('mm-text--font-weight-medium');
    expect(getByText('normal')).toHaveClass('mm-text--font-weight-normal');
  });

  it('should render the Text with proper text color class name', () => {
    const { getByText } = render(
      <>
        <Text color={TextColor.textDefault}>text-default</Text>
        <Text color={TextColor.textAlternative}>text-alternative</Text>
        <Text color={TextColor.textMuted}>text-muted</Text>
        <Text color={TextColor.overlayInverse}>overlay-inverse</Text>
        <Text color={TextColor.primaryDefault}>primary-default</Text>
        <Text color={TextColor.primaryInverse}>primary-inverse</Text>
        <Text color={TextColor.errorDefault}>error-default</Text>
        <Text color={TextColor.errorInverse}>error-inverse</Text>
        <Text color={TextColor.successDefault}>success-default</Text>
        <Text color={TextColor.successInverse}>success-inverse</Text>
        <Text color={TextColor.warningInverse}>warning-inverse</Text>
        <Text color={TextColor.infoDefault}>info-default</Text>
        <Text color={TextColor.infoInverse}>info-inverse</Text>
      </>,
    );
    expect(getByText('text-default')).toHaveClass('mm-box--color-text-default');
    expect(getByText('text-alternative')).toHaveClass(
      'mm-box--color-text-alternative',
    );
    expect(getByText('text-muted')).toHaveClass('mm-box--color-text-muted');
    expect(getByText('primary-default')).toHaveClass(
      'mm-box--color-primary-default',
    );
    expect(getByText('primary-inverse')).toHaveClass(
      'mm-box--color-primary-inverse',
    );
    expect(getByText('error-default')).toHaveClass(
      'mm-box--color-error-default',
    );
    expect(getByText('error-inverse')).toHaveClass(
      'mm-box--color-error-inverse',
    );
    expect(getByText('success-default')).toHaveClass(
      'mm-box--color-success-default',
    );
    expect(getByText('success-inverse')).toHaveClass(
      'mm-box--color-success-inverse',
    );
    expect(getByText('warning-inverse')).toHaveClass(
      'mm-box--color-warning-inverse',
    );
    expect(getByText('info-default')).toHaveClass('mm-box--color-info-default');
    expect(getByText('info-inverse')).toHaveClass('mm-box--color-info-inverse');
  });

  it('should render the Text with proper font style class name', () => {
    const { getByText } = render(
      <>
        <Text fontStyle={FontStyle.Italic}>italic</Text>
        <Text fontStyle={FontStyle.Normal}>normal</Text>
      </>,
    );
    expect(getByText('italic')).toHaveClass('mm-text--font-style-italic');
    expect(getByText('normal')).toHaveClass('mm-text--font-style-normal');
  });

  it('should render the Text with proper text align class name', () => {
    const { getByText } = render(
      <>
        <Text textAlign={TextAlign.Left}>left</Text>
        <Text textAlign={TextAlign.Center}>center</Text>
        <Text textAlign={TextAlign.Right}>right</Text>
        <Text textAlign={TextAlign.Justify}>justify</Text>
        <Text textAlign={TextAlign.End}>end</Text>
      </>,
    );

    expect(getByText('left')).toHaveClass('mm-text--text-align-left');
    expect(getByText('center')).toHaveClass('mm-text--text-align-center');
    expect(getByText('right')).toHaveClass('mm-text--text-align-right');
    expect(getByText('justify')).toHaveClass('mm-text--text-align-justify');
    expect(getByText('end')).toHaveClass('mm-text--text-align-end');
  });

  it('should render the Text with proper overflow wrap class name', () => {
    const { getByText } = render(
      <>
        <Text overflowWrap={OverflowWrap.BreakWord}>break-word</Text>
        <Text overflowWrap={OverflowWrap.Normal}>normal</Text>
      </>,
    );
    expect(getByText('break-word')).toHaveClass(
      'mm-text--overflow-wrap-break-word',
    );
    expect(getByText('normal')).toHaveClass('mm-text--overflow-wrap-normal');
  });

  it('should render the Text with proper ellipsis class name', () => {
    const { getByText } = render(
      <>
        <Text ellipsis>ellipsis</Text>
      </>,
    );
    expect(getByText('ellipsis')).toHaveClass('mm-text--ellipsis');
  });

  it('should render the Text with proper text transform class name', () => {
    const { getByText } = render(
      <>
        <Text textTransform={TextTransform.Uppercase}>uppercase</Text>
        <Text textTransform={TextTransform.Lowercase}>lowercase</Text>
        <Text textTransform={TextTransform.Capitalize}>capitalize</Text>
      </>,
    );
    expect(getByText('uppercase')).toHaveClass(
      'mm-text--text-transform-uppercase',
    );
    expect(getByText('lowercase')).toHaveClass(
      'mm-text--text-transform-lowercase',
    );
    expect(getByText('capitalize')).toHaveClass(
      'mm-text--text-transform-capitalize',
    );
  });
  it('should accept a ref prop that is passed down to the html element', () => {
    const mockRef = jest.fn();
    render(<Text ref={mockRef} />);
    expect(mockRef).toHaveBeenCalledTimes(1);
  });

  it('should render the Text with proper direction', () => {
    const { getByText } = render(
      <>
        <Text textDirection={TextDirection.Auto}>auto</Text>
        <Text textDirection={TextDirection.LeftToRight}>ltr</Text>
        <Text textDirection={TextDirection.RightToLeft}>rtl</Text>
      </>,
    );
    expect(getByText('auto')).toHaveAttribute('dir', 'auto');
    expect(getByText('ltr')).toHaveAttribute('dir', 'ltr');
    expect(getByText('rtl')).toHaveAttribute('dir', 'rtl');
  });
});

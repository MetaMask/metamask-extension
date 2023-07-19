/* eslint-disable jest/require-top-level-describe */
import { render } from '@testing-library/react';
import React from 'react';
import { IconName } from '..';
import { ButtonBaseSize } from './button-base.types';
import { ButtonBase } from './button-base';

describe('ButtonBase', () => {
  it('should render button element correctly and match snapshot', () => {
    const { getByTestId, getByText, container } = render(
      <ButtonBase data-testid="button-base">Button base</ButtonBase>,
    );
    expect(getByText('Button base')).toBeDefined();
    expect(container.querySelector('button')).toBeDefined();
    expect(getByTestId('button-base')).toHaveClass('mm-button-base');
    expect(container).toMatchSnapshot();
  });

  it('should render anchor element correctly', () => {
    const { getByTestId, container } = render(
      <ButtonBase as="a" data-testid="button-base" />,
    );
    expect(getByTestId('button-base')).toHaveClass('mm-button-base');
    const anchor = container.getElementsByTagName('a').length;
    expect(anchor).toBe(1);
  });

  it('should render anchor element correctly by href only being passed and href exists', () => {
    const { getByTestId, container } = render(
      <ButtonBase href="/metamask" data-testid="button-base">
        Button Base
      </ButtonBase>,
    );
    expect(getByTestId('button-base')).toHaveClass('mm-button-base');
    expect(getByTestId('button-base')).toHaveAttribute('href', '/metamask');
    const anchor = container.getElementsByTagName('a').length;
    expect(anchor).toBe(1);
  });

  it('should render anchor element correctly by href and externalLink, href target and rel exist', () => {
    const { getByTestId, container } = render(
      <ButtonBase
        href="https://www.test.com/"
        externalLink
        data-testid="button-base"
      >
        Button Base
      </ButtonBase>,
    );
    expect(getByTestId('button-base')).toHaveClass('mm-button-base');
    expect(getByTestId('button-base')).toHaveAttribute(
      'href',
      'https://www.test.com/',
    );
    expect(getByTestId('button-base')).toHaveAttribute('target', '_blank');
    expect(getByTestId('button-base')).toHaveAttribute(
      'rel',
      'noopener noreferrer',
    );
    const anchor = container.getElementsByTagName('a').length;
    expect(anchor).toBe(1);
    expect(container).toMatchSnapshot();
  });

  it('should render button as block', () => {
    const { getByTestId } = render(<ButtonBase block data-testid="block" />);
    expect(getByTestId('block')).toHaveClass(`mm-button-base--block`);
  });

  it('should render with different size classes', () => {
    const { getByTestId } = render(
      <>
        <ButtonBase size={ButtonBaseSize.Sm} data-testid={ButtonBaseSize.Sm} />
        <ButtonBase size={ButtonBaseSize.Md} data-testid={ButtonBaseSize.Md} />
        <ButtonBase size={ButtonBaseSize.Lg} data-testid={ButtonBaseSize.Lg} />
      </>,
    );
    expect(getByTestId(ButtonBaseSize.Sm)).toHaveClass(
      `mm-button-base--size-${ButtonBaseSize.Sm}`,
    );
    expect(getByTestId(ButtonBaseSize.Md)).toHaveClass(
      `mm-button-base--size-${ButtonBaseSize.Md}`,
    );
    expect(getByTestId(ButtonBaseSize.Lg)).toHaveClass(
      `mm-button-base--size-${ButtonBaseSize.Lg}`,
    );
  });

  it('should render with added classname', () => {
    const { getByTestId } = render(
      <ButtonBase data-testid="classname" className="mm-button-base--test" />,
    );
    expect(getByTestId('classname')).toHaveClass('mm-button-base--test');
  });

  it('should render with different button states', () => {
    const { getByTestId } = render(
      <>
        <ButtonBase loading data-testid="loading" />
        <ButtonBase disabled data-testid="disabled" />
      </>,
    );
    expect(getByTestId('loading')).toHaveClass(`mm-button-base--loading`);
    expect(getByTestId('disabled')).toHaveClass(`mm-button-base--disabled`);
  });
  it('should render with icon', () => {
    const { getByTestId } = render(
      <ButtonBase
        data-testid="icon"
        startIconName={IconName.AddSquare}
        startIconProps={{ 'data-testid': 'start-button-icon' }}
        endIconName={IconName.AddSquare}
        endIconProps={{ 'data-testid': 'end-button-icon' }}
      />,
    );

    expect(getByTestId('start-button-icon')).toBeDefined();
    expect(getByTestId('end-button-icon')).toBeDefined();
  });
});

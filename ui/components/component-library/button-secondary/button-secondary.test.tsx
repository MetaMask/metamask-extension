/* eslint-disable jest/require-top-level-describe */
import { render } from '@testing-library/react';
import React from 'react';
import { IconName } from '../icon';
import { ButtonSecondary } from './button-secondary';
import { ButtonSecondarySize } from './button-secondary.types';

describe('ButtonSecondary', () => {
  it('should render button element correctly', () => {
    const { getByText, getByTestId, container } = render(
      <ButtonSecondary data-testid="button-secondary">
        Button Secondary
      </ButtonSecondary>,
    );
    expect(getByText('Button Secondary')).toBeDefined();
    expect(container.querySelector('button')).toBeDefined();
    expect(getByTestId('button-secondary')).toHaveClass('mm-button-base');
    expect(container).toMatchSnapshot();
  });

  it('should render anchor element correctly', () => {
    const { getByTestId, container } = render(
      <ButtonSecondary as="a" data-testid="button-secondary" />,
    );
    expect(getByTestId('button-secondary')).toHaveClass('mm-button-base');
    const anchor = container.getElementsByTagName('a').length;
    expect(anchor).toBe(1);
  });

  it('should render button as block', () => {
    const { getByTestId } = render(
      <ButtonSecondary block data-testid="block" />,
    );
    expect(getByTestId('block')).toHaveClass(`mm-button-base--block`);
  });

  it('should render with added classname', () => {
    const { getByTestId } = render(
      <ButtonSecondary data-testid="classname" className="mm-button--test" />,
    );
    expect(getByTestId('classname')).toHaveClass('mm-button--test');
  });

  it('should render with different size classes', () => {
    const { getByTestId } = render(
      <>
        <ButtonSecondary
          size={ButtonSecondarySize.Sm}
          data-testid={ButtonSecondarySize.Sm}
        />
        <ButtonSecondary
          size={ButtonSecondarySize.Md}
          data-testid={ButtonSecondarySize.Md}
        />
        <ButtonSecondary
          size={ButtonSecondarySize.Lg}
          data-testid={ButtonSecondarySize.Lg}
        />
      </>,
    );

    expect(getByTestId(ButtonSecondarySize.Sm)).toHaveClass(
      `mm-button-base--size-${ButtonSecondarySize.Sm}`,
    );
    expect(getByTestId(ButtonSecondarySize.Md)).toHaveClass(
      `mm-button-base--size-${ButtonSecondarySize.Md}`,
    );
    expect(getByTestId(ButtonSecondarySize.Lg)).toHaveClass(
      `mm-button-base--size-${ButtonSecondarySize.Lg}`,
    );
  });

  it('should render as danger', () => {
    const { getByTestId } = render(
      <>
        <ButtonSecondary danger data-testid="danger" />
      </>,
    );

    expect(getByTestId('danger')).toHaveClass(
      'mm-button-secondary--type-danger',
    );
  });

  it('should render with different button states', () => {
    const { getByTestId } = render(
      <>
        <ButtonSecondary loading data-testid="loading" />
        <ButtonSecondary disabled data-testid="disabled" />
      </>,
    );
    expect(getByTestId('loading')).toHaveClass(`mm-button-base--loading`);
    expect(getByTestId('disabled')).toHaveClass(`mm-button-base--disabled`);
  });
  it('should render with icon', () => {
    const { container } = render(
      <ButtonSecondary data-testid="icon" startIconName={IconName.AddSquare} />,
    );

    const icons = container.getElementsByClassName('mm-icon').length;
    expect(icons).toBe(1);
  });
});

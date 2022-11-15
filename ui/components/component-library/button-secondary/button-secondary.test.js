/* eslint-disable jest/require-top-level-describe */
import { render } from '@testing-library/react';
import React from 'react';
import { ButtonSecondary } from './button-secondary';
import { BUTTON_SECONDARY_SIZES } from './button-secondary.constants';

describe('ButtonSecondary', () => {
  it('should render button element correctly', () => {
    const { getByText, getByTestId, container } = render(
      <ButtonSecondary data-testid="button-secondary">
        Button Secondary
      </ButtonSecondary>,
    );
    expect(getByText('Button Secondary')).toBeDefined();
    expect(container.querySelector('button')).toBeDefined();
    expect(getByTestId('button-secondary')).toHaveClass('mm-button');
  });

  it('should render anchor element correctly', () => {
    const { getByTestId, container } = render(
      <ButtonSecondary as="a" data-testid="button-secondary" />,
    );
    expect(getByTestId('button-secondary')).toHaveClass('mm-button');
    const anchor = container.getElementsByTagName('a').length;
    expect(anchor).toBe(1);
  });

  it('should render button as block', () => {
    const { getByTestId } = render(
      <ButtonSecondary block data-testid="block" />,
    );
    expect(getByTestId('block')).toHaveClass(`mm-button--block`);
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
          size={BUTTON_SECONDARY_SIZES.SM}
          data-testid={BUTTON_SECONDARY_SIZES.SM}
        />
        <ButtonSecondary
          size={BUTTON_SECONDARY_SIZES.MD}
          data-testid={BUTTON_SECONDARY_SIZES.MD}
        />
        <ButtonSecondary
          size={BUTTON_SECONDARY_SIZES.LG}
          data-testid={BUTTON_SECONDARY_SIZES.LG}
        />
      </>,
    );

    expect(getByTestId(BUTTON_SECONDARY_SIZES.SM)).toHaveClass(
      `mm-button--size-${BUTTON_SECONDARY_SIZES.SM}`,
    );
    expect(getByTestId(BUTTON_SECONDARY_SIZES.MD)).toHaveClass(
      `mm-button--size-${BUTTON_SECONDARY_SIZES.MD}`,
    );
    expect(getByTestId(BUTTON_SECONDARY_SIZES.LG)).toHaveClass(
      `mm-button--size-${BUTTON_SECONDARY_SIZES.LG}`,
    );
  });

  it('should render with different types', () => {
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
    expect(getByTestId('loading')).toHaveClass(`mm-button--loading`);
    expect(getByTestId('disabled')).toHaveClass(`mm-button--disabled`);
  });
  it('should render with icon', () => {
    const { container } = render(
      <ButtonSecondary data-testid="icon" icon="add-square-filled" />,
    );

    const icons = container.getElementsByClassName('icon').length;
    expect(icons).toBe(1);
  });
});

/* eslint-disable jest/require-top-level-describe */
import { render } from '@testing-library/react';
import React from 'react';
import { BUTTON_TYPES } from '../../../helpers/constants/design-system';
import { ButtonSecondary, BUTTON_SECONDARY_SIZES } from './button-secondary';

describe('ButtonSecondary', () => {
  it('should render button element correctly', () => {
    const { getByTestId, container } = render(
      <ButtonSecondary data-testid="button-secondary" />,
    );
    expect(getByTestId('button-secondary')).toBeDefined();
    expect(container.querySelector('button')).toBeDefined();
    expect(getByTestId('button-secondary')).toHaveClass('mm-button');
  });

  it('should render anchor element correctly', () => {
    const { getByTestId, container } = render(
      <ButtonSecondary as="a" data-testid="button-secondary" />,
    );
    expect(getByTestId('button-secondary')).toBeDefined();
    expect(container.querySelector('button')).toBeDefined();
    expect(getByTestId('button-secondary')).toHaveClass('mm-button');
  });

  it('should render button as block', () => {
    const { getByTestId } = render(
      <ButtonSecondary block data-testid="block" />,
    );
    expect(getByTestId('block')).toHaveClass(`box--display-block`);
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
      `mm-button-size--${BUTTON_SECONDARY_SIZES.SM}`,
    );
    expect(getByTestId(BUTTON_SECONDARY_SIZES.MD)).toHaveClass(
      `mm-button-size--${BUTTON_SECONDARY_SIZES.MD}`,
    );
    expect(getByTestId(BUTTON_SECONDARY_SIZES.LG)).toHaveClass(
      `mm-button-size--${BUTTON_SECONDARY_SIZES.LG}`,
    );
  });

  it('should render with different types', () => {
    const { getByTestId } = render(
      <>
        <ButtonSecondary
          type={BUTTON_TYPES.NORMAL}
          data-testid={BUTTON_TYPES.NORMAL}
        />
        <ButtonSecondary
          type={BUTTON_TYPES.DANGER}
          data-testid={BUTTON_TYPES.DANGER}
        />
      </>,
    );

    expect(getByTestId(BUTTON_TYPES.NORMAL)).toHaveClass(
      `mm-button-secondary--type-${BUTTON_TYPES.NORMAL}`,
    );
    expect(getByTestId(BUTTON_TYPES.DANGER)).toHaveClass(
      `mm-button-secondary--type-${BUTTON_TYPES.DANGER}`,
    );
  });

  it('should render with different button states', () => {
    const { getByTestId } = render(
      <>
        {/* <ButtonSecondary loading data-testid="loading" /> */}
        <ButtonSecondary disabled data-testid="disabled" />
      </>,
    );
    // expect(getByTestId('loading')).toHaveClass(`mm-button--loading`);
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

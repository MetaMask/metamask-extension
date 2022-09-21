/* eslint-disable jest/require-top-level-describe */
import { render } from '@testing-library/react';
import React from 'react';
import { BUTTON_TYPES } from '../../../helpers/constants/design-system';
import { ButtonPrimary, BUTTON_PRIMARY_SIZES } from './button-primary';

describe('ButtonPrimary', () => {
  it('should render button element correctly', () => {
    const { getByTestId, container } = render(
      <ButtonPrimary data-testid="button-primary" />,
    );
    expect(getByTestId('button-primary')).toBeDefined();
    expect(container.querySelector('button')).toBeDefined();
    expect(getByTestId('button-primary')).toHaveClass('mm-button');
  });

  it('should render anchor element correctly', () => {
    const { getByTestId, container } = render(
      <ButtonPrimary as="a" data-testid="button-primary" />,
    );
    expect(getByTestId('button-primary')).toBeDefined();
    expect(container.querySelector('button')).toBeDefined();
    expect(getByTestId('button-primary')).toHaveClass('mm-button');
  });

  it('should render button as block', () => {
    const { getByTestId } = render(<ButtonPrimary block data-testid="block" />);
    expect(getByTestId('block')).toHaveClass(`box--display-block`);
  });

  it('should render with different size classes', () => {
    const { getByTestId } = render(
      <>
        <ButtonPrimary
          size={BUTTON_PRIMARY_SIZES.SM}
          data-testid={BUTTON_PRIMARY_SIZES.SM}
        />
        <ButtonPrimary
          size={BUTTON_PRIMARY_SIZES.MD}
          data-testid={BUTTON_PRIMARY_SIZES.MD}
        />
        <ButtonPrimary
          size={BUTTON_PRIMARY_SIZES.LG}
          data-testid={BUTTON_PRIMARY_SIZES.LG}
        />
      </>,
    );

    expect(getByTestId(BUTTON_PRIMARY_SIZES.SM)).toHaveClass(
      `mm-button-size--${BUTTON_PRIMARY_SIZES.SM}`,
    );
    expect(getByTestId(BUTTON_PRIMARY_SIZES.MD)).toHaveClass(
      `mm-button-size--${BUTTON_PRIMARY_SIZES.MD}`,
    );
    expect(getByTestId(BUTTON_PRIMARY_SIZES.LG)).toHaveClass(
      `mm-button-size--${BUTTON_PRIMARY_SIZES.LG}`,
    );
  });

  it('should render with different types', () => {
    const { getByTestId } = render(
      <>
        <ButtonPrimary
          type={BUTTON_TYPES.NORMAL}
          data-testid={BUTTON_TYPES.NORMAL}
        />
        <ButtonPrimary
          type={BUTTON_TYPES.DANGER}
          data-testid={BUTTON_TYPES.DANGER}
        />
      </>,
    );

    expect(getByTestId(BUTTON_TYPES.NORMAL)).toHaveClass(
      `mm-button-primary--type-${BUTTON_TYPES.NORMAL}`,
    );
    expect(getByTestId(BUTTON_TYPES.DANGER)).toHaveClass(
      `mm-button-primary--type-${BUTTON_TYPES.DANGER}`,
    );
  });

  it('should render with different button states', () => {
    const { getByTestId } = render(
      <>
        {/* <ButtonPrimary loading data-testid="loading" /> */}
        <ButtonPrimary disabled data-testid="disabled" />
      </>,
    );
    // expect(getByTestId('loading')).toHaveClass(`mm-button--loading`);
    expect(getByTestId('disabled')).toHaveClass(`mm-button--disabled`);
  });
  it('should render with icon', () => {
    const { container } = render(
      <ButtonPrimary data-testid="icon" icon="add-square-filled" />,
    );

    const icons = container.getElementsByClassName('icon').length;
    expect(icons).toBe(1);
  });
});

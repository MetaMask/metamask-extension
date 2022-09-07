/* eslint-disable jest/require-top-level-describe */
import { render } from '@testing-library/react';
import React from 'react';
import { SIZES, COLORS } from '../../../../helpers/constants/design-system';
import { BaseButton } from './base-button';

describe('BaseButton', () => {
  it('should render correctly', () => {
    const { getByTestId, container } = render(
      <BaseButton data-testid="base-button" />,
    );
    expect(getByTestId('base-button')).toBeDefined();
    expect(container.querySelector('svg')).toBeDefined();
  });
  it('should render with different size classes', () => {
    const { getByTestId } = render(
      <>
        <BaseButton size={SIZES.XXS} data-testid="base-button-xxs" />
        <BaseButton size={SIZES.XS} data-testid="base-button-xs" />
        <BaseButton size={SIZES.SM} data-testid="base-button-sm" />
        <BaseButton size={SIZES.MD} data-testid="base-button-md" />
        <BaseButton size={SIZES.LG} data-testid="base-button-lg" />
        <BaseButton size={SIZES.XL} data-testid="base-button-xl" />
      </>,
    );
    expect(getByTestId('base-button-xxs')).toHaveClass('base-button--size-xxs');
    expect(getByTestId('base-button-xs')).toHaveClass('base-button--size-xs');
    expect(getByTestId('base-button-sm')).toHaveClass('base-button--size-sm');
    expect(getByTestId('base-button-md')).toHaveClass('base-button--size-md');
    expect(getByTestId('base-button-lg')).toHaveClass('base-button--size-lg');
    expect(getByTestId('base-button-xl')).toHaveClass('base-button--size-xl');
  });
  it('should render with icon colors', () => {
    const { getByTestId } = render(
      <>
        <BaseButton data-testid="base-button-color-inherit" />
        <BaseButton
          color={COLORS.ICON_DEFAULT}
          data-testid="base-button-color-default"
        />
        <BaseButton
          color={COLORS.ICON_ALTERNATIVE}
          data-testid="base-button-color-alternative"
        />
        <BaseButton
          color={COLORS.ICON_MUTED}
          data-testid="base-button-color-muted"
        />
      </>,
    );
    expect(getByTestId('base-button-color-inherit')).toHaveClass(
      'box--color-inherit',
    );
    expect(getByTestId('base-button-color-default')).toHaveClass(
      'box--color-icon-default',
    );
    expect(getByTestId('base-button-color-alternative')).toHaveClass(
      'box--color-icon-alternative',
    );
    expect(getByTestId('base-button-color-muted')).toHaveClass(
      'box--color-icon-muted',
    );
  });
});

/* eslint-disable jest/require-top-level-describe */
import { render } from '@testing-library/react';
import React from 'react';
import { SIZES, COLORS } from '../../../helpers/constants/design-system';
import { BaseIcon } from './base-icon';

describe('BaseIcon', () => {
  it('should render correctly', () => {
    const { getByTestId, container } = render(
      <BaseIcon data-testid="base-icon" />,
    );
    expect(getByTestId('base-icon')).toBeDefined();
    expect(container.querySelector('svg')).toBeDefined();
  });
  it('should render with different size classes', () => {
    const { getByTestId } = render(
      <>
        <BaseIcon size={SIZES.XXS} data-testid="base-icon-xxs" />
        <BaseIcon size={SIZES.XS} data-testid="base-icon-xs" />
        <BaseIcon size={SIZES.SM} data-testid="base-icon-sm" />
        <BaseIcon size={SIZES.MD} data-testid="base-icon-md" />
        <BaseIcon size={SIZES.LG} data-testid="base-icon-lg" />
        <BaseIcon size={SIZES.XL} data-testid="base-icon-xl" />
      </>,
    );
    expect(getByTestId('base-icon-xxs')).toHaveClass('base-icon--size-xxs');
    expect(getByTestId('base-icon-xs')).toHaveClass('base-icon--size-xs');
    expect(getByTestId('base-icon-sm')).toHaveClass('base-icon--size-sm');
    expect(getByTestId('base-icon-md')).toHaveClass('base-icon--size-md');
    expect(getByTestId('base-icon-lg')).toHaveClass('base-icon--size-lg');
    expect(getByTestId('base-icon-xl')).toHaveClass('base-icon--size-xl');
  });
  it('should render with icon colors', () => {
    const { getByTestId } = render(
      <>
        <BaseIcon data-testid="base-icon-color-inherit" />
        <BaseIcon
          color={COLORS.ICON_DEFAULT}
          data-testid="base-icon-color-default"
        />
        <BaseIcon
          color={COLORS.ICON_ALTERNATIVE}
          data-testid="base-icon-color-alternative"
        />
        <BaseIcon
          color={COLORS.ICON_MUTED}
          data-testid="base-icon-color-muted"
        />
      </>,
    );
    expect(getByTestId('base-icon-color-inherit')).toHaveClass(
      'box--color-inherit',
    );
    expect(getByTestId('base-icon-color-default')).toHaveClass(
      'box--color-icon-default',
    );
    expect(getByTestId('base-icon-color-alternative')).toHaveClass(
      'box--color-icon-alternative',
    );
    expect(getByTestId('base-icon-color-muted')).toHaveClass(
      'box--color-icon-muted',
    );
  });
});

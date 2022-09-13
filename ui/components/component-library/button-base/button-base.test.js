/* eslint-disable jest/require-top-level-describe */
import { render } from '@testing-library/react';
import React from 'react';
import { SIZES, COLORS } from '../../../helpers/constants/design-system';
import { ButtonBase } from './button-base';

describe('ButtonBase', () => {
  it('should render correctly', () => {
    const { getByTestId, container } = render(
      <ButtonBase data-testid="button-base" />,
    );
    expect(getByTestId('button-base')).toBeDefined();
    expect(container.querySelector('svg')).toBeDefined();
  });
  it('should render with different size classes', () => {
    const { getByTestId } = render(
      <>
        <ButtonBase size={SIZES.XXS} data-testid="button-base-xxs" />
        <ButtonBase size={SIZES.XS} data-testid="button-base-xs" />
        <ButtonBase size={SIZES.SM} data-testid="button-base-sm" />
        <ButtonBase size={SIZES.MD} data-testid="button-base-md" />
        <ButtonBase size={SIZES.LG} data-testid="button-base-lg" />
        <ButtonBase size={SIZES.XL} data-testid="button-base-xl" />
      </>,
    );
    expect(getByTestId('button-base-xxs')).toHaveClass('button-base--size-xxs');
    expect(getByTestId('button-base-xs')).toHaveClass('button-base--size-xs');
    expect(getByTestId('button-base-sm')).toHaveClass('button-base--size-sm');
    expect(getByTestId('button-base-md')).toHaveClass('button-base--size-md');
    expect(getByTestId('button-base-lg')).toHaveClass('button-base--size-lg');
    expect(getByTestId('button-base-xl')).toHaveClass('button-base--size-xl');
  });
  it('should render with icon colors', () => {
    const { getByTestId } = render(
      <>
        <ButtonBase data-testid="button-base-color-inherit" />
        <ButtonBase
          color={COLORS.ICON_DEFAULT}
          data-testid="button-base-color-default"
        />
        <ButtonBase
          color={COLORS.ICON_ALTERNATIVE}
          data-testid="button-base-color-alternative"
        />
        <ButtonBase
          color={COLORS.ICON_MUTED}
          data-testid="button-base-color-muted"
        />
      </>,
    );
    expect(getByTestId('button-base-color-inherit')).toHaveClass(
      'box--color-inherit',
    );
    expect(getByTestId('button-base-color-default')).toHaveClass(
      'box--color-icon-default',
    );
    expect(getByTestId('button-base-color-alternative')).toHaveClass(
      'box--color-icon-alternative',
    );
    expect(getByTestId('button-base-color-muted')).toHaveClass(
      'box--color-icon-muted',
    );
  });
});

/* eslint-disable jest/require-top-level-describe */
import { render } from '@testing-library/react';
import React from 'react';
import { SIZES, COLORS } from '../../../helpers/constants/design-system';
import { Icon } from './icon';
import { ICON_NAMES } from './iconNames';

describe('Icon', () => {
  it('should render correctly', () => {
    const { getByTestId, container } = render(<Icon data-testid="icon" />);
    expect(getByTestId('icon')).toBeDefined();
    expect(container.querySelector('svg')).toBeDefined();
  });
  it('should render with different icon name classes', () => {
    const { getByTestId } = render(
      <>
        <Icon
          name={ICON_NAMES.ADD_SQUARE_FILLED}
          data-testid="icon-add-square-filled"
        />
        <Icon name={ICON_NAMES.BANK_FILLED} data-testid="icon-bank-filled" />
        <Icon
          name={ICON_NAMES.BOOKMARK_FILLED}
          data-testid="icon-bookmark-filled"
        />
        <Icon
          name={ICON_NAMES.CALCULATOR_FILLED}
          data-testid="icon-calculator-filled"
        />
      </>,
    );
    expect(getByTestId('icon-add-square-filled')).toHaveClass(
      'icon--add-square-filled',
    );
    expect(getByTestId('icon-bank-filled')).toHaveClass('icon--bank-filled');
    expect(getByTestId('icon-bookmark-filled')).toHaveClass(
      'icon--bookmark-filled',
    );
    expect(getByTestId('icon-calculator-filled')).toHaveClass(
      'icon--calculator-filled',
    );
  });
  it('should render with different size classes', () => {
    const { getByTestId } = render(
      <>
        <Icon size={SIZES.XXS} data-testid="icon-xxs" />
        <Icon size={SIZES.XS} data-testid="icon-xs" />
        <Icon size={SIZES.SM} data-testid="icon-sm" />
        <Icon size={SIZES.MD} data-testid="icon-md" />
        <Icon size={SIZES.LG} data-testid="icon-lg" />
        <Icon size={SIZES.XL} data-testid="icon-xl" />
      </>,
    );
    expect(getByTestId('icon-xxs')).toHaveClass('icon--size-xxs');
    expect(getByTestId('icon-xs')).toHaveClass('icon--size-xs');
    expect(getByTestId('icon-sm')).toHaveClass('icon--size-sm');
    expect(getByTestId('icon-md')).toHaveClass('icon--size-md');
    expect(getByTestId('icon-lg')).toHaveClass('icon--size-lg');
    expect(getByTestId('icon-xl')).toHaveClass('icon--size-xl');
  });
  it('should render with icon colors', () => {
    const { getByTestId } = render(
      <>
        <Icon color={COLORS.ICON_DEFAULT} data-testid="icon-color-default" />
        <Icon
          color={COLORS.ICON_ALTERNATIVE}
          data-testid="icon-color-alternative"
        />
        <Icon color={COLORS.ICON_MUTED} data-testid="icon-color-muted" />
      </>,
    );
    expect(getByTestId('icon-color-default')).toHaveClass(
      'box--color-icon-default',
    );
    expect(getByTestId('icon-color-alternative')).toHaveClass(
      'box--color-icon-alternative',
    );
    expect(getByTestId('icon-color-muted')).toHaveClass(
      'box--color-icon-muted',
    );
  });
});

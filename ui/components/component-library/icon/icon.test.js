/* eslint-disable jest/require-top-level-describe */
import { render } from '@testing-library/react';
import React from 'react';
import { SIZES, COLORS } from '../../../helpers/constants/design-system';
import { Icon } from './icon';

// Icon names are stored in the ICON_NAMES environment variable
// mocking the environment variable here
const MOCK_ICON_NAMES = {
  ADD_SQUARE_FILLED: 'add-square-filled',
  BANK_FILLED: 'bank-filled',
  BOOKMARK_FILLED: 'bookmark-filled',
  CALCULATOR_FILLED: 'calculator-filled',
};

describe('Icon', () => {
  it('should render correctly', () => {
    const { getByTestId, container } = render(
      <Icon name={MOCK_ICON_NAMES.ADD_SQUARE_FILLED} data-testid="icon" />,
    );
    expect(getByTestId('icon')).toBeDefined();
    expect(container.querySelector('svg')).toBeDefined();
  });
  it('should render with different icons using mask-image and image urls', () => {
    const { getByTestId } = render(
      <>
        <Icon
          name={MOCK_ICON_NAMES.ADD_SQUARE_FILLED}
          data-testid="icon-add-square-filled"
        />
        <Icon
          name={MOCK_ICON_NAMES.BANK_FILLED}
          data-testid="icon-bank-filled"
        />
        <Icon
          name={MOCK_ICON_NAMES.BOOKMARK_FILLED}
          data-testid="icon-bookmark-filled"
        />
        <Icon
          name={MOCK_ICON_NAMES.CALCULATOR_FILLED}
          data-testid="icon-calculator-filled"
        />
      </>,
    );
    expect(
      window.getComputedStyle(getByTestId('icon-add-square-filled')).maskImage,
    ).toBe(`url('./images/icons/icon-add-square-filled.svg`);
    expect(
      window.getComputedStyle(getByTestId('icon-bank-filled')).maskImage,
    ).toBe(`url('./images/icons/icon-bank-filled.svg`);
    expect(
      window.getComputedStyle(getByTestId('icon-bookmark-filled')).maskImage,
    ).toBe(`url('./images/icons/icon-bookmark-filled.svg`);
    expect(
      window.getComputedStyle(getByTestId('icon-calculator-filled')).maskImage,
    ).toBe(`url('./images/icons/icon-calculator-filled.svg`);
  });
  it('should render with different size classes', () => {
    const { getByTestId } = render(
      <>
        <Icon
          name={MOCK_ICON_NAMES.ADD_SQUARE_FILLED}
          size={SIZES.XXS}
          data-testid="icon-xxs"
        />
        <Icon
          name={MOCK_ICON_NAMES.ADD_SQUARE_FILLED}
          size={SIZES.XS}
          data-testid="icon-xs"
        />
        <Icon
          name={MOCK_ICON_NAMES.ADD_SQUARE_FILLED}
          size={SIZES.SM}
          data-testid="icon-sm"
        />
        <Icon
          name={MOCK_ICON_NAMES.ADD_SQUARE_FILLED}
          size={SIZES.MD}
          data-testid="icon-md"
        />
        <Icon
          name={MOCK_ICON_NAMES.ADD_SQUARE_FILLED}
          size={SIZES.LG}
          data-testid="icon-lg"
        />
        <Icon
          name={MOCK_ICON_NAMES.ADD_SQUARE_FILLED}
          size={SIZES.XL}
          data-testid="icon-xl"
        />
        <Icon
          name={MOCK_ICON_NAMES.ADD_SQUARE_FILLED}
          size={SIZES.AUTO}
          data-testid="icon-auto"
        />
      </>,
    );
    expect(getByTestId('icon-xxs')).toHaveClass('icon--size-xxs');
    expect(getByTestId('icon-xs')).toHaveClass('icon--size-xs');
    expect(getByTestId('icon-sm')).toHaveClass('icon--size-sm');
    expect(getByTestId('icon-md')).toHaveClass('icon--size-md');
    expect(getByTestId('icon-lg')).toHaveClass('icon--size-lg');
    expect(getByTestId('icon-xl')).toHaveClass('icon--size-xl');
    expect(getByTestId('icon-auto')).toHaveClass('icon--size-auto');
  });
  it('should render with icon colors', () => {
    const { getByTestId } = render(
      <>
        <Icon
          name={MOCK_ICON_NAMES.ADD_SQUARE_FILLED}
          color={COLORS.ICON_DEFAULT}
          data-testid="icon-color-default"
        />
        <Icon
          name={MOCK_ICON_NAMES.ADD_SQUARE_FILLED}
          color={COLORS.ICON_ALTERNATIVE}
          data-testid="icon-color-alternative"
        />
        <Icon
          name={MOCK_ICON_NAMES.ADD_SQUARE_FILLED}
          color={COLORS.ICON_MUTED}
          data-testid="icon-color-muted"
        />
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

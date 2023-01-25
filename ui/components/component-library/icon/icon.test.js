/* eslint-disable jest/require-top-level-describe */
import { render } from '@testing-library/react';
import React from 'react';
import { SIZES, COLORS } from '../../../helpers/constants/design-system';
import { ICON_NAMES } from './icon.constants';
import { Icon } from './icon';

describe('Icon', () => {
  it('should render correctly', () => {
    const { getByTestId, container } = render(
      <Icon name={ICON_NAMES.ADD_SQUARE} data-testid="icon" />,
    );
    expect(getByTestId('icon')).toBeDefined();
    expect(container.querySelector('svg')).toBeDefined();
    expect(container).toMatchSnapshot();
  });
  it('should render with a custom class', () => {
    const { getByTestId } = render(
      <Icon
        name={ICON_NAMES.ADD_SQUARE}
        data-testid="icon"
        className="test-class"
      />,
    );
    expect(getByTestId('icon')).toHaveClass('test-class');
  });
  it('should render with an aria-label attribute', () => {
    /**
     * We aren't specifically adding an ariaLabel prop because in most cases
     * the icon should be decorative or be accompanied by text. Also if the icon
     * is to be used as a button in most cases ButtonIcon should be used. However
     * we should test if it's possible to pass an aria-label attribute to the
     * root html element.
     */
    const { getByTestId } = render(
      <Icon
        name={ICON_NAMES.ADD_SQUARE}
        data-testid="icon"
        aria-label="test aria label"
      />,
    );
    expect(getByTestId('icon')).toHaveAttribute(
      'aria-label',
      'test aria label',
    );
  });
  it('should render with different icons using mask-image and image urls', () => {
    const { getByTestId } = render(
      <>
        <Icon name={ICON_NAMES.ADD_SQUARE} data-testid="add-square" />
        <Icon name={ICON_NAMES.BANK} data-testid="bank" />
        <Icon name={ICON_NAMES.BOOKMARK} data-testid="bookmark" />
        <Icon name={ICON_NAMES.CALCULATOR} data-testid="calculator" />
      </>,
    );
    expect(window.getComputedStyle(getByTestId('add-square')).maskImage).toBe(
      `url('./images/icons/add-square.svg')`,
    );
    expect(window.getComputedStyle(getByTestId('bank')).maskImage).toBe(
      `url('./images/icons/bank.svg')`,
    );
    expect(window.getComputedStyle(getByTestId('bookmark')).maskImage).toBe(
      `url('./images/icons/bookmark.svg')`,
    );
    expect(window.getComputedStyle(getByTestId('calculator')).maskImage).toBe(
      `url('./images/icons/calculator.svg')`,
    );
  });
  it('should render with different size classes', () => {
    const { getByTestId } = render(
      <>
        <Icon
          name={ICON_NAMES.ADD_SQUARE}
          size={SIZES.XS}
          data-testid="icon-xs"
        />
        <Icon
          name={ICON_NAMES.ADD_SQUARE}
          size={SIZES.SM}
          data-testid="icon-sm"
        />
        <Icon
          name={ICON_NAMES.ADD_SQUARE}
          size={SIZES.MD}
          data-testid="icon-md"
        />
        <Icon
          name={ICON_NAMES.ADD_SQUARE}
          size={SIZES.LG}
          data-testid="icon-lg"
        />
        <Icon
          name={ICON_NAMES.ADD_SQUARE}
          size={SIZES.XL}
          data-testid="icon-xl"
        />
        <Icon
          name={ICON_NAMES.ADD_SQUARE}
          size={SIZES.AUTO}
          data-testid="icon-auto"
        />
      </>,
    );
    expect(getByTestId('icon-xs')).toHaveClass('mm-icon--size-xs');
    expect(getByTestId('icon-sm')).toHaveClass('mm-icon--size-sm');
    expect(getByTestId('icon-md')).toHaveClass('mm-icon--size-md');
    expect(getByTestId('icon-lg')).toHaveClass('mm-icon--size-lg');
    expect(getByTestId('icon-xl')).toHaveClass('mm-icon--size-xl');
    expect(getByTestId('icon-auto')).toHaveClass('mm-icon--size-auto');
  });
  it('should render with icon colors', () => {
    const { getByTestId } = render(
      <>
        <Icon
          name={ICON_NAMES.ADD_SQUARE}
          color={COLORS.ICON_DEFAULT}
          data-testid="icon-color-default"
        />
        <Icon
          name={ICON_NAMES.ADD_SQUARE}
          color={COLORS.ICON_ALTERNATIVE}
          data-testid="icon-color-alternative"
        />
        <Icon
          name={ICON_NAMES.ADD_SQUARE}
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
